# shared_state.py
# Shared state for recognized faces (for live feed & frontend polling)

import threading
import time

# Max number of recent recognitions to store (you can adjust this)
MAX_HISTORY = 20

# Global shared state and lock
last_recognized_faces = []
state_lock = threading.Lock()

def set_last_recognized_faces(faces):
    """
    Set the current recognized faces (with timestamps).
    Only stores unique names.
    """
    global last_recognized_faces
    with state_lock:
        # Filter out duplicates
        seen_names = set()
        new_faces = []
        for face in faces:
            if face["name"] not in seen_names:
                seen_names.add(face["name"])
                new_faces.append({
                    "name": face["name"],
                    "timestamp": face.get("timestamp", time.time())
                })

        # Add to history, keeping only the latest MAX_HISTORY
        last_recognized_faces.extend(new_faces)
        last_recognized_faces = last_recognized_faces[-MAX_HISTORY:]

def get_last_recognized_faces():
    """
    Return the most recent recognized faces list.
    """
    with state_lock:
        return list(last_recognized_faces)
