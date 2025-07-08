# ollama_client.py

import requests
from mysql_connection import fetch_college_info_db, fetch_students_info, fetch_staff_info

def ask_ollama(query: str, model: str = "phi:latest") -> str: #model: str = "llama3.1:latest") - to use a specific model, change this parameter
    try:
        # Fetch college info, students, and staff for prompt context
        info_list = fetch_college_info_db()
        students = fetch_students_info()
        staff = fetch_staff_info()
        context_parts = []
        if info_list:
            context_parts.append("\n\n".join([
                f"[{item['category']}]\n{item['content']}" for item in info_list
            ]))
        if students:
            student_lines = [f"{s['name']} (Age: {s['age']}, Dept: {s['department']})" for s in students]
            context_parts.append("[Students]\n" + "\n".join(student_lines))
        if staff:
            staff_lines = [f"{s['name']} ({s['role']}, Dept: {s['department']})" for s in staff]
            context_parts.append("[Staff]\n" + "\n".join(staff_lines))
        context = "\n\n".join(context_parts)
        if not context:
            raise ValueError("No info from database.")
    except Exception as e:
        print(f"⚠️ Error fetching context from DB: {e}")
        context = (
            "General Info:\n"
            "This is a robot assistant for a college. It can help users with information about departments, staff, students, events, facilities, and more."
        )

    # Compose prompt
    system_prompt = (
        f"You are a helpful college robot assistant. Use the following college-related information to respond:\n\n"
        f"{context}\n\n"
        f"Now answer the user's question as clearly and helpfully as possible:\n"
        f"Q: {query}\nA:"
    )

    payload = {
        "model": model,
        "prompt": system_prompt,
        "stream": False
    }

    try:
        response = requests.post("http://localhost:11434/api/generate", json=payload, timeout=60)
        if response.ok:
            return response.json().get("response", "").strip()
        else:
            print(f"⚠️ Ollama error: {response.status_code} - {response.text}")
            return "Sorry, the robot brain is not available right now."
    except Exception as e:
        print(f"❌ Ollama request failed: {e}")
        return "Sorry, I couldn't reach my brain. Please try again later."
