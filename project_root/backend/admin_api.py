from flask import Flask, request, jsonify, send_from_directory, Response, g
from flask_cors import CORS
import os
import time
from mysql_connection import execute_query
from utils import (
    fetch_students, fetch_staff, fetch_unknowns, fetch_all_logs,
    save_uploaded_image, get_db_connection
)
from face_recognition import load_known_faces, recognize_faces
from face_box import generate_frames
from mysql_connection import log_chat, fetch_college_info, log_unknown_face, fetch_college_info_db, add_college_info, update_college_info, delete_college_info, log_recognition
from ollama_client import ask_ollama
from shared_state import set_last_recognized_faces, get_last_recognized_faces
from threading import Lock

# Global state for recognized name and interruption handling
current_convo = {
    "active": False,
    "lock": Lock(),
    "last_name": "",
    "last_response": ""
}

app = Flask(__name__)
CORS(app)
from routes.live_chat import chat_bp
app.register_blueprint(chat_bp)

# ------------------ API ROUTES ------------------ #

@app.route("/")
def home():
    return "Backend is running!"

@app.route("/api/students", methods=["GET"])
def get_students():
    return jsonify(fetch_students())

@app.route("/api/staff", methods=["GET"])
def get_staff():
    return jsonify(fetch_staff())

@app.route("/api/unknown_faces", methods=["GET"])
def get_unknown_faces():
    return jsonify(fetch_unknowns())


@app.route('/unknown_faces/<filename>')
def get_unknown_face(filename):
    return send_from_directory('unknown_faces', filename)

@app.route("/api/logs")
def get_logs():
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM RECOGNITION_LOGS ORDER BY timestamp DESC")
    logs = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(logs)

@app.route('/api/logs')
def get_recognition_logs():
    connection = get_db_connection()
    if not connection:
        return jsonify([])
    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT * FROM RECOGNITION_LOGS ORDER BY timestamp DESC LIMIT 1000")
    logs = cursor.fetchall()
    cursor.close()
    connection.close()
    return jsonify(logs)

@app.route("/api/upload", methods=["POST"])
def upload_face():
    try:
        file = request.files.get("image")
        person_type = request.form.get("type")
        name = request.form.get("name")
        age_or_role = request.form.get("age_or_role")
        department = request.form.get("department")

        if person_type not in ["student", "staff"]:
            return jsonify({"error": "Invalid type"}), 400

        if not all([file, name, department, age_or_role]):
            return jsonify({"error": "Missing fields"}), 400

        folder = "static/images/students" if person_type == "student" else "static/images/staff"
        os.makedirs(folder, exist_ok=True)
        save_path = save_uploaded_image(file, folder)

        conn = get_db_connection()
        cur = conn.cursor()

        if person_type == "student":
            try:
                age = int(age_or_role)
            except ValueError:
                return jsonify({"error": "Age must be a valid number"}), 400
            cur.execute(
                "INSERT INTO STUDENT (name, age, department, image_path) VALUES (%s, %s, %s, %s)",
                (name, age, department, save_path)
            )
        else:
            role = age_or_role
            cur.execute(
                "INSERT INTO STAFF (name, role, department, image_path) VALUES (%s, %s, %s, %s)",
                (name, role, department, save_path)
            )

        conn.commit()
        cur.close()
        conn.close()

        load_known_faces()
        return jsonify({"message": "Upload successful", "path": save_path})

    except Exception as e:
        print(f"Upload error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/enroll/<filename>", methods=["POST"])
def enroll_unknown(filename):
    new_name = request.form.get("name")
    person_type = request.form.get("type")
    age_or_role = request.form.get("age") or request.form.get("role")
    department = request.form.get("department")

    if person_type not in ["student", "staff"]:
        return jsonify({"error": "Invalid type"}), 400

    src_path = os.path.join("unknown_faces", filename)
    if not os.path.exists(src_path):
        return jsonify({"error": "Image not found"}), 404

    dest_dir = "static/images/students" if person_type == "student" else "static/images/staff"
    os.makedirs(dest_dir, exist_ok=True)
    new_path = os.path.join(dest_dir, filename)
    os.rename(src_path, new_path)

    conn = get_db_connection()
    cur = conn.cursor()
    if person_type == "student":
        cur.execute("INSERT INTO STUDENT (name, age, department, image_path) VALUES (%s, %s, %s, %s)",
                    (new_name, age_or_role, department, new_path))
    else:
        cur.execute("INSERT INTO STAFF (name, role, department, image_path) VALUES (%s, %s, %s, %s)",
                    (new_name, age_or_role, department, new_path))
    conn.commit()
    cur.close()
    conn.close()

    load_known_faces()
    return jsonify({"message": "Enrolled successfully"})

@app.route("/images/<path:filename>")
def serve_image(filename):
    base_dirs = ["static/images/students", "static/images/staff", "unknown_faces"]
    for dir in base_dirs:
        full_path = os.path.join(dir, filename)
        if os.path.exists(full_path):
            return send_from_directory(dir, filename)
    return "Image not found", 404

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route("/live_feed")
def live_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route("/api/reload_faces", methods=["POST"])
def reload_faces():
    load_known_faces()
    return jsonify({"message": "Reloaded successfully"})

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

@app.route('/api/recognized_face', methods=['GET'])
def get_recognized_face():
    recognized = get_last_recognized_faces()
    if not recognized:
        return jsonify({"name": "unknown", "timestamp": time.time()})  # ✅ changed

    last = recognized[-1]
    name = last.get("name", "").strip()

    if not name:
        name = "unknown"  # ✅ fallback for empty

    return jsonify({"name": name.lower(), "timestamp": last['timestamp']})

@app.route('/api/chat_log', methods=['POST'])
def api_log_chat():
    data = request.json
    log_chat(data['sender'], data['receiver'], data['message'])
    return jsonify({"status": "logged"})

@app.route('/api/college_info', methods=['GET'])
def get_college_info():
    return jsonify(fetch_college_info_db())

@app.route('/api/college_info', methods=['POST'])
def add_college_info_api():
    data = request.get_json()
    category = data.get('category')
    content = data.get('content')
    if not all([category, content]):
        return jsonify({'error': 'Missing fields'}), 400
    add_college_info(category, content)
    return jsonify({'status': 'added'})

@app.route('/api/college_info/<int:info_id>', methods=['PUT'])
def update_college_info_api(info_id):
    data = request.get_json()
    category = data.get('category')
    content = data.get('content')
    if not all([category, content]):
        return jsonify({'error': 'Missing fields'}), 400
    update_college_info(info_id, category, content)
    return jsonify({'status': 'updated'})

@app.route('/api/college_info/<int:info_id>', methods=['DELETE'])
def delete_college_info_api(info_id):
    delete_college_info(info_id)
    return jsonify({'status': 'deleted'})

@app.route('/api/info')
def query_college_info():
    question = request.args.get('question')
    # Use both DB and Ollama for answer
    db_result = fetch_college_info(question)
    ollama_result = ask_ollama(question)
    return jsonify({"response": ollama_result, "db_answer": db_result})

@app.route("/api/students", methods=["POST"])
def add_student():
    data = request.get_json()
    name = data.get("name")
    age = data.get("age")
    department = data.get("department")
    if not all([name, age, department]):
        return jsonify({"error": "Missing fields"}), 400
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("INSERT INTO STUDENT (name, age, department, image_path) VALUES (%s, %s, %s, %s)",
                (name, age, department, ""))
    conn.commit()
    cur.execute("SELECT * FROM STUDENT WHERE id = %s", (cur.lastrowid,))
    student = cur.fetchone()
    cur.close(); conn.close()
    return jsonify(student), 201

@app.route("/api/students/<int:student_id>", methods=["PUT"])
def update_student(student_id):
    data = request.get_json()
    name = data.get("name")
    age = data.get("age")
    department = data.get("department")
    if not all([name, age, department]):
        return jsonify({"error": "Missing fields"}), 400
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("UPDATE STUDENT SET name=%s, age=%s, department=%s WHERE id=%s",
                (name, age, department, student_id))
    conn.commit()
    cur.execute("SELECT * FROM STUDENT WHERE id = %s", (student_id,))
    student = cur.fetchone()
    cur.close(); conn.close()
    return jsonify(student)

@app.route("/api/students/<int:student_id>", methods=["DELETE"])
def delete_student(student_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM STUDENT WHERE id=%s", (student_id,))
    conn.commit()
    cur.close(); conn.close()
    return jsonify({"status": "deleted"})

@app.route('/api/robot_ask', methods=['POST'])
def robot_ask():
    user_query = request.json.get('query', '').strip()
    if not user_query:
        return jsonify({'error': 'Missing query'}), 400

    # Lock to prevent overlapping responses
    with current_convo['lock']:
        current_convo['active'] = True
        current_convo['last_response'] = ""
        print(f"🧠 Processing new voice query: {user_query}")

    response = ask_ollama(user_query)

    with current_convo['lock']:
        current_convo['active'] = False
        current_convo['last_response'] = response

    return jsonify({'response': response})


@app.route('/api/robot_cancel', methods=['POST'])
def cancel_robot_response():
    with current_convo['lock']:
        current_convo['active'] = False
        current_convo['last_response'] = ""
    return jsonify({'status': 'cancelled'})


@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    # Example: count students, staff, recognitions, and calculate accuracy
    cur.execute('SELECT COUNT(*) as total_students FROM STUDENT')
    total_students = cur.fetchone()['total_students']
    cur.execute('SELECT COUNT(*) as total_staff FROM STAFF')
    total_staff = cur.fetchone()['total_staff']
    cur.execute('SELECT COUNT(*) as total_recognitions FROM RECOGNITION_LOGS')
    total_recognitions = cur.fetchone()['total_recognitions']
    # For accuracy, you may need a field in RECOGNITION_LOGS, here is a placeholder
    cur.execute('SELECT COUNT(*) as correct FROM RECOGNITION_LOGS WHERE status = "correct"')
    correct = cur.fetchone()['correct']
    accuracy_rate = 0
    if total_recognitions > 0:
        accuracy_rate = round(100 * correct / total_recognitions, 2)
    cur.close(); conn.close()
    return jsonify({
        'total_students': total_students,
        'total_staff': total_staff,
        'total_recognitions': total_recognitions,
        'accuracy_rate': accuracy_rate
    })

@app.route('/api/recognized_faces', methods=['GET'])
def api_recognized_faces():
    return jsonify(get_last_recognized_faces())

@app.route('/api/chat_logs', methods=['GET'])
def get_chat_logs():
    connection = get_db_connection()
    if not connection:
        return jsonify([])
    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT * FROM CHAT_LOGS ORDER BY timestamp DESC LIMIT 1000")
    logs = cursor.fetchall()
    cursor.close()
    connection.close()
    return jsonify(logs)

@app.route('/api/chat_logs/<int:log_id>', methods=['DELETE'])
def delete_chat_log(log_id):
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'DB connection failed'}), 500
    cursor = connection.cursor()
    cursor.execute("DELETE FROM CHAT_LOGS WHERE id=%s", (log_id,))
    connection.commit()
    cursor.close()
    connection.close()
    return jsonify({'status': 'deleted'})

@app.route('/api/college_name', methods=['GET'])
def get_college_name():
    info = fetch_college_info_db()
    if info and len(info) > 0:
        # Assuming the name is in the first row, in the 'content' field
        return jsonify({'name': info[0]['content']})
    return jsonify({'error': 'No college info found'}), 404

@app.route('/api/chat_logs/clear', methods=['POST'])
def clear_chat_logs():
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'DB connection failed'}), 500
    cursor = connection.cursor()
    cursor.execute("TRUNCATE TABLE CHAT_LOGS")
    connection.commit()
    cursor.close()
    connection.close()
    return jsonify({'status': 'cleared'})

@app.route('/api/recognition_logs/clear', methods=['POST'])
def clear_recognition_logs():
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'DB connection failed'}), 500
    cursor = connection.cursor()
    cursor.execute("TRUNCATE TABLE RECOGNITION_LOGS")
    connection.commit()
    cursor.close()
    connection.close()
    return jsonify({'status': 'cleared'})

@app.route('/<path:filepath>')
def serve_any_image(filepath):
    # Serve images from unknown_faces/ or static/images/ at root URL
    base_dirs = ["unknown_faces", "static/images/students", "static/images/staff"]
    for base in base_dirs:
        full_path = os.path.join(base, os.path.relpath(filepath, start=base)) if filepath.startswith(base) else os.path.join(base, filepath)
        if os.path.exists(full_path):
            return send_from_directory(base, os.path.relpath(full_path, start=base))
    return "Image not found", 404

# Voice assistant always-on endpoint (for polling or websocket in frontend)
# (For a true always-on, use a websocket or polling from frontend)


@app.route('/api/log_chat', methods=['POST'])
def log_chat_api():
    data = request.json
    sender = data.get("sender", "Unknown")
    receiver = data.get("receiver", "Unknown")
    message = data.get("message", "")

    if not message:
        return jsonify({"error": "Message cannot be empty"}), 400

    log_chat(sender, receiver, message)
    return jsonify({"status": "success"})

@app.route("/api/live_chat", methods=["GET"])
def get_live_chat():
    logs = execute_query("SELECT * FROM CHAT_LOGS ORDER BY timestamp DESC")
    return jsonify(logs or [])

@app.route("/api/live_chat/clear", methods=["POST"])
def clear_live_chat():
    execute_query("DELETE FROM CHAT_LOGS")
    return jsonify({"status": "cleared"})

@app.route("/api/live_chat/<int:log_id>", methods=["DELETE"])
def delete_live_chat_entry(log_id):
    execute_query("DELETE FROM CHAT_LOGS WHERE id = %s", (log_id,))
    return jsonify({"status": "deleted", "id": log_id})

@app.route("/api/staff/<int:staff_id>", methods=["DELETE"])
def delete_staff(staff_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM STAFF WHERE id=%s", (staff_id,))
    conn.commit()
    cur.close(); conn.close()
    return jsonify({"status": "deleted"})

# ------------------ START SERVER ------------------ #
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8081, debug=True)
