from flask import Flask, Response
import cv2
import time
from face_recognition import recognize_faces
from shared_state import set_last_recognized_faces

app = Flask(__name__)

# Store last greeted time per person to avoid repetitive greeting
last_greeted = {}

# Only greet once every X seconds per person
GREET_INTERVAL = 30

def generate_frames():
    camera = cv2.VideoCapture(0)
    try:
        while True:
            success, frame = camera.read()
            if not success:
                break

            try:
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = recognize_faces(rgb_frame)

                # Update shared state for frontend access
                set_last_recognized_faces([
                    {"name": face["name"], "timestamp": time.time()}
                    for face in results if face["name"] != "Unknown"
                ])

                for face in results:
                    bbox = face["bbox"]
                    name = face["name"]
                    now = time.time()

                    # Greet if it's a known person and not recently greeted
                    if name != "Unknown":
                        if name not in last_greeted or now - last_greeted[name] > GREET_INTERVAL:
                            print(f"🎉 Greeting: Hello {name}!")
                            last_greeted[name] = now

                    # Draw rectangle and label
                    color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)
                    cv2.rectangle(frame, (bbox[0], bbox[1]), (bbox[2], bbox[3]), color, 2)
                    cv2.putText(frame, name, (bbox[0], bbox[1] - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

            except Exception as e:
                print("[ERROR] Face recognition failed:", e)

            # Encode frame to JPEG
            ret, buffer = cv2.imencode('.jpg', frame)
            if not ret:
                continue

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
    finally:
        camera.release()

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == "__main__":
    app.run(debug=False)
