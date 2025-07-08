import queue
import sounddevice as sd
import pyttsx3
from vosk import Model, KaldiRecognizer
import json
import requests
import threading

# Queue for audio stream
q = queue.Queue()

# Initialize pyttsx3 engine globally
engine = pyttsx3.init()
engine.setProperty("rate", 160)

# Flag to control interruption
stop_flag = threading.Event()

# Callback for VOSK input
def callback(indata, frames, time, status):
    q.put(bytes(indata))

# Function to stop all ongoing voice activities
def stop_all():
    stop_flag.set()
    engine.stop()

# Voice listener (returns transcribed text or None if interrupted)
def listen_to_voice():
    model = Model(r"vosk-model-small-en-us-0.15")
    rec = KaldiRecognizer(model, 16000)
    with sd.RawInputStream(samplerate=16000, blocksize=8000, dtype='int16',
                           channels=1, callback=callback):
        print("🎤 Listening...")
        while True:
            if stop_flag.is_set():
                print("❌ Listening interrupted")
                return None
            data = q.get()
            if rec.AcceptWaveform(data):
                result = json.loads(rec.Result())
                text = result.get("text", "")
                if text:
                    return text

# Speak function (threaded for non-blocking + interrupt)
def speak(text):
    stop_flag.clear()

    def _speak():
        try:
            engine.say(text)
            engine.runAndWait()
        except Exception as e:
            print("Speech error:", e)

    thread = threading.Thread(target=_speak)
    thread.start()

# Main robot loop (always listening/responding)
def start_robot():
    while True:
        stop_all()
        query = listen_to_voice()
        if not query:
            continue

        print(f"🗣️ You said: {query}")
        try:
            stop_all()
            response = requests.post("http://localhost:8081/robot_ask", json={"query": query}, timeout=10)
            reply = response.json().get("response", "Sorry, I didn't get that.")
        except Exception as e:
            print("⚠️ Error calling backend:", e)
            reply = "Sorry, I couldn't connect to my brain right now."

        print(f"🤖 Robot: {reply}")
        speak(reply)

# Run the robot
if __name__ == "__main__":
    start_robot()
