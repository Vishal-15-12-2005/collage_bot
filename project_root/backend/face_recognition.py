import os
import time
import cv2
import numpy as np
from insightface.app import FaceAnalysis
from utils import (
    fetch_students, fetch_staff, log_recognition, UNKNOWN_DIR,
    log_unknown_face, is_duplicate_embedding
)
from shared_state import set_last_recognized_faces

# --- Configuration ---
KNOWN_THRESHOLD = 0.5
ACTIVE_TRACK_TIMEOUT = 60  # seconds

# Initialize InsightFace
app = FaceAnalysis(name="antelopev2")
app.prepare(ctx_id=0, det_size=(640, 640))

# Store known face embeddings
known_embeddings_dict = {}
known_labels_dict = {}

students = fetch_students()
staff = fetch_staff()

def normalize(embedding):
    return embedding / np.linalg.norm(embedding)

def load_known_faces():
    global known_embeddings_dict, known_labels_dict
    known_embeddings_dict = {}
    known_labels_dict = {}

    for student in fetch_students():
        img_path = student.get("image_path")
        if not img_path or not os.path.exists(img_path):
            continue
        img = cv2.imread(img_path)
        faces = app.get(img)
        if faces:
            emb = normalize(faces[0].embedding)
            key = ("student", student["id"])
            known_embeddings_dict.setdefault(key, []).append(emb)
            known_labels_dict[key] = {
                "id": student["id"],
                "name": student["name"],
                "type": "student"
            }

    for staff in fetch_staff():
        img_path = staff.get("image_path")
        if not img_path or not os.path.exists(img_path):
            continue
        img = cv2.imread(img_path)
        faces = app.get(img)
        if faces:
            emb = normalize(faces[0].embedding)
            key = ("staff", staff["id"])
            known_embeddings_dict.setdefault(key, []).append(emb)
            known_labels_dict[key] = {
                "id": staff["id"],
                "name": staff["name"],
                "type": "staff"
            }

    print(f"[INFO] Loaded {sum(len(v) for v in known_embeddings_dict.values())} known face embeddings.")

# Load once at start
load_known_faces()

def match_known_face(embedding, threshold=KNOWN_THRESHOLD):
    embedding = normalize(embedding)
    best_score = -1
    best_key = None

    for key, emb_list in known_embeddings_dict.items():
        scores = [np.dot(embedding, emb) for emb in emb_list]
        max_score = max(scores)
        if max_score > best_score:
            best_score = max_score
            best_key = key

    if best_score > threshold:
        return known_labels_dict[best_key]["name"], known_labels_dict[best_key]["type"]
    return "Unknown", "unknown"

# Track active recognized people to prevent re-greeting
active_tracks = {}

def recognize_faces(frame):
    results = []
    if frame is None or frame.size == 0:
        return results

    faces = app.get(frame)
    now = time.time()
    seen_keys = set()
    recognized_faces_for_frontend = []

    for face in faces:
        embedding = normalize(face.embedding)
        name, entity_type = match_known_face(embedding)
        person_key = f"{name}-{entity_type}"
        seen_keys.add(person_key)
        img_path = None
        db_image_path = None
        department = None
        role = None

        if person_key not in active_tracks or now - active_tracks[person_key] > ACTIVE_TRACK_TIMEOUT:
            bbox = face.bbox.astype(int)
            x1, y1, x2, y2 = bbox
            face_img = frame[y1:y2, x1:x2]

            if entity_type == "unknown":
                if not is_duplicate_embedding(embedding):
                    img_path = log_unknown_face(face_img, 1.0)
                    print(f"[UNKNOWN] Logged new unknown face.")
            else:
                # Save recognized face snapshot
                ts = int(time.time())
                img_name = f"{name}_{ts}.jpg".replace("/", "_")
                img_path = os.path.join(UNKNOWN_DIR, img_name)
                os.makedirs(UNKNOWN_DIR, exist_ok=True)
                cv2.imwrite(img_path, cv2.cvtColor(face_img, cv2.COLOR_RGB2BGR))

                # Log recognition
                log_recognition(name, entity_type, 1.0, img_path)

                # Add to frontend memory
                recognized_faces_for_frontend.append({
                    "name": name,
                    "timestamp": now
                })

            if entity_type == "student":
                student = next((s for s in students if s["name"] == name), None)
                if student:
                    db_image_path = student.get("image_path")
                    department = student.get("department")
            elif entity_type == "staff":
                staff_member = next((s for s in staff if s["name"] == name), None)
                if staff_member:
                    db_image_path = staff_member.get("image_path")
                    role = staff_member.get("role")

        active_tracks[person_key] = now

        results.append({
            "name": name,
            "type": entity_type,
            "bbox": face.bbox.astype(int).tolist(),
            "image_path": img_path,
            "db_image_path": db_image_path,
            "department": department,
            "role": role
        })

    # Remove people no longer in frame
    to_remove = [k for k, t in active_tracks.items() if k not in seen_keys and now - t > ACTIVE_TRACK_TIMEOUT]
    for k in to_remove:
        del active_tracks[k]

    # Update shared state for frontend greeting
    if recognized_faces_for_frontend:
        set_last_recognized_faces(recognized_faces_for_frontend)

    return results
