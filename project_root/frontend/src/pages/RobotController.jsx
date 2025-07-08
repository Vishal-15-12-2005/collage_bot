import React, { useEffect, useRef, useState } from 'react';
import { FiCpu, FiMic, FiMicOff, FiPower } from 'react-icons/fi';
import RobotSpeechDisplay from './RobotSpeechDisplay';
import {
  speakWithAudioFeedback,
  stopSpeaking,
  startListening,
} from '../utils/voice';
import API from '../utils/api';
const API_URL = API.defaults.baseURL.replace('/api', '');

export default function RobotController() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [recognizedName, setRecognizedName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [robotMessage, setRobotMessage] = useState('🎓 Initializing...');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(0);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  const greetedPeopleRef = useRef(new Set());
  const interruptedRef = useRef(false);

  useEffect(() => {
    greetedPeopleRef.current.clear();
    fetchCollegeName();

    const interval = setInterval(fetchRecognition, 2000);
    startListening(handleTranscript);

    return () => {
      clearInterval(interval);
      stopSpeaking();
    };
    // eslint-disable-next-line
  }, []);

  const logChatToServer = async (sender, receiver, message) => {
    try {
      await API.post('/log_chat', {
        sender,
        receiver,
        message,
      });
    } catch (err) {
      console.error('Logging chat failed:', err);
    }
  };

  const handleTranscript = async (text, isFinal) => {
    if (!isFinal || !text.trim()) return;

    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      interruptedRef.current = true;
    }

    const userQuery = text.trim();
    setRobotMessage(`🧠 Processing: ${userQuery}`);
    await logChatToServer('User', 'Bot', userQuery);

    try {
      const res = await API.post('/robot_ask', { query: userQuery });
      const response = res.data.response || "Sorry, I didn't catch that.";
      setRobotMessage(response);
      await logChatToServer('Bot', 'User', response);

      setIsSpeaking(true);
      speakWithAudioFeedback(response, setVolume, () => {
        setIsSpeaking(false);
        interruptedRef.current = false;
      }, handleTranscript);
    } catch (err) {
      console.error('Voice fetch failed:', err);
      setRobotMessage("⚠️ Error reaching assistant.");
    }
  };

  const fetchCollegeName = async () => {
    try {
      const res = await API.get('/college_name');
      setCollegeName(res.data.name || 'Your College');
    } catch {
      setCollegeName('Unknown College');
    }
  };

  const fetchRecognition = async () => {
    try {
      const res = await API.get('/recognized_face');
      const { name } = res.data;

      if (!name || greetedPeopleRef.current.has(name)) return;

      stopSpeaking();

      const isKnown = name.toLowerCase() !== 'unknown';
      const safeName = name || "there";
      const greeting = isKnown
        ? `Hi ${safeName}, I'm your assistant at ${collegeName}. How can I help you today?`
        : `Hi, I'm the college bot. How can I help you today?`;

      setRobotMessage(greeting);
      setRecognizedName(safeName);
      setIsSpeaking(true);

      await logChatToServer('Bot', safeName || 'Visitor', greeting);

      speakWithAudioFeedback(greeting, setVolume, () => {
        setIsSpeaking(false);
      }, handleTranscript);

      greetedPeopleRef.current.add(name);
    } catch (err) {
      console.error('Face recognition failed:', err);
    }
  };

  useEffect(() => {
    const drawOverlay = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const img = videoRef.current;
      if (!canvas || !ctx || !img) return;

      const width = img.clientWidth;
      const height = img.clientHeight;

      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);
    };

    const drawInterval = setInterval(drawOverlay, 500);
    return () => clearInterval(drawInterval);
  }, [recognizedName]);

  // Camera controls
  const toggleMic = () => setIsMicOn((prev) => !prev);
  const toggleCamera = () => setIsCameraOn((prev) => !prev);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-white to-blue-200 py-6 px-2 fade-in flex flex-col items-center justify-center">
      {/* Main Content */}
      <main className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Camera Feed Section */}
        <section className="rounded-3xl overflow-hidden shadow-2xl glass-card p-0 bg-white/80 flex flex-col items-center border-2 border-blue-100 relative">
          <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100 bg-white/90 w-full">
            <div className="flex items-center gap-3">
              <span className="font-bold text-lg text-blue-900 tracking-wide">Camera Feed</span>
              <span className="ml-2 flex items-center gap-1 text-green-500 font-semibold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span> ACTIVE
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleCamera} className={`p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 shadow transition text-xl ${isCameraOn ? 'ring-2 ring-blue-400' : ''}`} title={isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}>
                <FiPower />
              </button>
              <button onClick={toggleMic} className={`p-2 rounded-full bg-green-100 hover:bg-green-200 text-green-700 shadow transition text-xl ${isMicOn ? 'ring-2 ring-green-400' : ''}`} title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}>
                {isMicOn ? <FiMic /> : <FiMicOff />}
              </button>
            </div>
          </div>
          <div className="relative bg-black flex items-center justify-center min-h-[340px] w-full">
            {isCameraOn ? (
              <img
                ref={videoRef}
                src={`${API_URL}/video_feed`}
                alt="Robot Camera"
                className="object-contain w-full h-[340px] rounded-b-3xl"
              />
            ) : (
              <div className="w-full h-[340px] flex items-center justify-center bg-gray-900 rounded-b-3xl">
                <div className="text-center text-gray-400">
                  <FiPower className="mx-auto text-5xl mb-3" />
                  <p className="text-lg">Camera is Off</p>
                  <p className="text-xs">Click power to turn on</p>
                </div>
              </div>
            )}
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
            />
          </div>
        </section>

        {/* Robot Response Section */}
        <section className="flex flex-col gap-2 items-center justify-center w-full h-full">
          <div className="flex flex-col items-center justify-center w-full h-full p-2 flex-1">
            <RobotSpeechDisplay message={robotMessage} isSpeaking={isSpeaking} volume={volume} />
            <div className="mt-4 text-center">
              <span  className="text-black">{recognizedName ? `👤 ${recognizedName}` : 'Listening... Speak anytime 👂'}</span>
              <div className="text-black">{collegeName}</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
