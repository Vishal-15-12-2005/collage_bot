import os
import shutil
import mysql.connector
from datetime import datetime
import numpy as np
import hashlib
import cv2
from mysql_connection import get_db_connection
# Path Constants
STUDENT_DIR = "static/images/students"
STAFF_DIR = "static/images/staff"
UNKNOWN_DIR = "unknown_faces"

# Save uploaded image and return the stored path
def save_uploaded_image(file, target_dir):
    filename = datetime.now().strftime('%Y%m%d_%H%M%S_') + file.filename
    save_path = os.path.join(target_dir, filename)
    os.makedirs(target_dir, exist_ok=True)
    file.save(save_path)
    return save_path.replace("\\", "/")

# Fetch all students
def fetch_students():
    conn = get_db_connection()
    if conn is None:
        print("Database connection failed in fetch_students!")
        return []
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM STUDENT")
    data = cur.fetchall()
    cur.close(); conn.close()
    return data

# Fetch all staff
def fetch_staff():
    conn = get_db_connection()
    if conn is None:
        print("Database connection failed in fetch_staff!")
        return []
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM STAFF")
    data = cur.fetchall()
    cur.close(); conn.close()
    return data

# Fetch all unknown face logs
def fetch_unknowns():
    conn = get_db_connection()
    if conn is None:
        print("Database connection failed in fetch_unknowns!")
        return []
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM RECOGNITION_LOGS WHERE type = 'unknown'")
    data = cur.fetchall()
    cur.close(); conn.close()
    return data

# Fetch full recognition log
def fetch_all_logs():
    conn = get_db_connection()
    if conn is None:
        print("Database connection failed in fetch_all_logs!")
        return []
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM RECOGNITION_LOGS ORDER BY timestamp DESC")
    data = cur.fetchall()
    cur.close(); conn.close()
    return data

# Log face detection
def log_recognition(name, entity_type, confidence, image_path=None):
    conn = get_db_connection()
    if conn is None:
        print("Database connection failed in log_recognition!")
        return None
    cur = conn.cursor()
    query = """
        INSERT INTO RECOGNITION_LOGS (name, type, confidence, image_path)
        VALUES (%s, %s, %s, %s)
    """
    cur.execute(query, (name, entity_type, float(confidence), image_path))
    conn.commit(); cur.close(); conn.close()

# Save unknown face image and return path
def log_unknown_face(face_img, score):
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{ts}_{round(score, 2)}.jpg"
    path = os.path.join(UNKNOWN_DIR, filename)
    os.makedirs(UNKNOWN_DIR, exist_ok=True)
    cv2.imwrite(path, face_img)
    log_recognition("Unknown", "unknown", score, path)
    return path

# Duplicate cache to avoid re-logging
last_embeddings = {}
def is_duplicate_embedding(embedding, threshold=1.0):
    global last_embeddings
    now = datetime.now().strftime("%Y%m%d%H%M%S")
    emb_hash = hashlib.sha1(embedding.tobytes()).hexdigest()
    key = f"{emb_hash}_{now}"
    if key in last_embeddings:
        return True
    last_embeddings[key] = True
    return False

# Fetch all unknown persons
def fetch_all_unknown_persons():
    conn = get_db_connection()
    if conn is None:
        print("Database connection failed in fetch_all_unknown_persons!")
        return []
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM UNKNOWN_FACES")
    data = cur.fetchall()
    cur.close(); conn.close()
    return data

# Create a new unknown person entry
def create_unknown_person(embedding, image_path):
    conn = get_db_connection()
    if conn is None:
        print("Database connection failed in create_unknown_person!")
        return None
    cur = conn.cursor()
    # Store the embedding as bytes
    emb_bytes = embedding.astype('float32').tobytes()
    cur.execute("""
        INSERT INTO UNKNOWN_FACES (representative_embedding, image_path)
        VALUES (%s, %s)
    """, (emb_bytes, image_path))
    conn.commit()
    new_id = cur.lastrowid
    cur.close(); conn.close()
    return new_id

# Update the last_seen timestamp for a given unknown_id
def update_unknown_last_seen(unknown_id):
    conn = get_db_connection()
    if conn is None:
        print("Database connection failed in update_unknown_last_seen!")
        return None
    cur = conn.cursor()
    cur.execute("""
        UPDATE UNKNOWN_FACES SET last_seen = NOW() WHERE id = %s
    """, (unknown_id,))
    conn.commit()
    cur.close(); conn.close()
