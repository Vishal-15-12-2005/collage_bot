// RobotView.jsx (Full Updated View with Dashboard Features)
import React, { useEffect, useState, useRef } from 'react';
import { FiAlertTriangle, FiSend, FiMessageSquare, FiUser, FiCpu, FiBarChart2 } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import API, { fetchLiveChatLogs, robotAsk } from '../utils/api';
import AnimatedBackground from '../components/AnimatedBackground';
import LoadingSpinner from '../components/LoadingSpinner';
import { Link } from 'react-router-dom';

const API_URL = API.defaults.baseURL.replace('/api', '');

export default function RobotView() {
  const [stats, setStats] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [fps, setFps] = useState(30);
  const [chatLogs, setChatLogs] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [aiChat, setAiChat] = useState([
    { sender: 'AI', message: '👋 Hello! I am your college assistant. Ask me anything about the website, college, students, staff, or just have a general chat!', isUser: false, ts: new Date() }
  ]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchStats();
    fetchRobotChats();
    const interval = setInterval(() => {
      fetchStats();
      fetchRobotChats();
      setLastUpdated(new Date().toLocaleTimeString());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await API.get('/statistics');
      setStats(res.data);
    } catch (e) { console.error('❌ Failed to fetch stats'); }
  };

  // Fetch all chat logs, filter for robot-user conversations
  const fetchRobotChats = async () => {
    try {
      const res = await fetchLiveChatLogs();
      // Filter: sender or receiver is 'robot', 'ai', 'assistant', case-insensitive
      const robotNames = ['robot', 'ai', 'assistant'];
      const logs = (res.data || []).filter(
        log => robotNames.includes((log.sender || '').toLowerCase()) || robotNames.includes((log.receiver || '').toLowerCase())
      );
      setChatLogs(logs);
    } catch (e) {
      setChatLogs([]);
    }
  };

  // Auto-scroll to latest message
  useEffect(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [aiChat, chatLoading]);

  // Handle sending a message
  const handleChatSend = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = { sender: 'You', message: chatInput, isUser: true, ts: new Date() };
    setAiChat(prev => [...prev, userMsg]);
    setChatLoading(true);
    setChatInput('');
    try {
      const res = await robotAsk(userMsg.message);
      setAiChat(prev => [
        ...prev,
        { sender: 'AI', message: res.data.response, isUser: false, ts: new Date() }
      ]);
    } catch (e) {
      setAiChat(prev => [
        ...prev,
        { sender: 'AI', message: 'Sorry, I could not process your request.', isUser: false, ts: new Date() }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Format timestamp
  const formatTime = (date) => {
    if (!(date instanceof Date)) date = new Date(date);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100 overflow-hidden">
      <AnimatedBackground />
      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-8 min-h-[80vh] py-8">
        {/* Left: System Stats & Robot Actions */}
        <div className="flex-1 flex flex-col gap-6 min-w-[260px] max-w-sm">
          {/* System Stats */}
          <div className="glass-card p-6 rounded-3xl shadow-3xl">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 gradient-text"><FiBarChart2 /> System Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-indigo-500">{stats ? stats.total_students : '--'}</span>
                <span className="text-gray-500 text-xs">Students</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-indigo-500">{stats ? stats.total_staff : '--'}</span>
                <span className="text-gray-500 text-xs">Staff</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-indigo-500">{stats ? stats.total_recognitions : '--'}</span>
                <span className="text-gray-500 text-xs">Recognitions</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-indigo-500">{stats ? stats.accuracy_rate + '%' : '--'}</span>
                <span className="text-gray-500 text-xs">Accuracy</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-400">Last update: {lastUpdated || 'Just now'}</div>
          </div>
          {/* Robot Actions (last 5 robot-user chat logs) */}
          <div className="glass-card p-6 rounded-3xl shadow-3xl">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 gradient-text"><FiMessageSquare /> Robot Actions</h2>
            {chatLogs.length === 0 ? (
              <p className="text-gray-400">No recent robot actions.</p>
            ) : (
              <ul className="space-y-2">
                {chatLogs.slice(0, 5).map((log, idx) => (
                  <li key={log.id || idx} className="text-sm text-gray-700 flex flex-col">
                    <span className="font-semibold text-indigo-600">{log.sender} → {log.receiver}</span>
                    <span className="text-gray-500">{log.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {/* Center: AI Chat Assistant */}
        <div className="flex-[2] flex flex-col items-center justify-center">
          <div className="glass-card w-full max-w-2xl mx-auto rounded-3xl shadow-3xl p-0 flex flex-col h-[70vh] md:h-[65vh] overflow-hidden">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
              {aiChat.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-end gap-2 ${msg.isUser ? 'justify-end' : 'justify-start'} slide-in-up`}
                >
                  {/* Avatar */}
                  {!msg.isUser && (
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg text-white text-xl border-2 border-white/60 animate-pulse">
                      <FiCpu />
                    </div>
                  )}
                  {/* Bubble */}
                  <div
                    className={`relative max-w-[70%] px-5 py-3 rounded-2xl text-base font-medium shadow-xl backdrop-blur-xl transition-all duration-300
                      ${msg.isUser
                        ? 'bg-gradient-to-br from-indigo-500 to-blue-500 text-white ml-auto glass-card border border-blue-200/40'
                        : 'bg-white/80 text-gray-800 glass-card border border-indigo-100/60'}
                    `}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <span className="block mb-1 text-xs font-semibold opacity-60">
                      {msg.isUser ? 'You' : 'AI'}
                    </span>
                    <span className="whitespace-pre-line leading-relaxed">{msg.message}</span>
                    <span className="block mt-2 text-[10px] text-gray-400 text-right">{formatTime(msg.ts)}</span>
                  </div>
                  {/* User Avatar */}
                  {msg.isUser && (
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center shadow-lg text-white text-xl border-2 border-white/60">
                      <FiUser />
                    </div>
                  )}
                </div>
              ))}
              {/* Typing Indicator */}
              {chatLoading && (
                <div className="flex items-end gap-2 justify-start slide-in-up">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg text-white text-xl border-2 border-white/60 animate-pulse">
                    <FiCpu />
                  </div>
                  <div className="relative max-w-[70%] px-5 py-3 rounded-2xl bg-white/80 text-gray-800 glass-card border border-indigo-100/60 flex items-center gap-2">
                    <LoadingSpinner size="sm" text={null} />
                    <span className="ml-2 text-sm text-gray-500 animate-pulse">AI is typing…</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            {/* Input Bar */}
            <form
              onSubmit={handleChatSend}
              className="relative flex items-center gap-2 px-4 py-4 bg-gradient-to-r from-white/80 to-blue-50/80 border-t border-blue-100/40 backdrop-blur-xl"
              style={{ boxShadow: '0 -8px 32px 0 rgba(59,130,246,0.07)' }}
            >
              <input
                type="text"
                className="flex-1 enhanced-input bg-white/70 rounded-xl px-5 py-3 text-base shadow-inner focus:ring-2 focus:ring-blue-300/40 focus:outline-none transition-all text-black"
                placeholder="Type your message..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                disabled={chatLoading}
                required
                autoFocus
              />
              <button
                type="submit"
                className="btn-primary flex items-center gap-1 px-6 py-3 rounded-xl shadow-xl text-lg focus:ring-2 focus:ring-blue-400/40 transition-all duration-200"
                disabled={chatLoading || !chatInput.trim()}
                style={{ boxShadow: '0 2px 16px 0 rgba(99,102,241,0.15)' }}
              >
                <FiSend />
                {chatLoading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
          {/* Footer or extra info */}
          <div className="mt-8 text-center text-xs text-gray-400 select-none">
            Powered by <span className="font-bold gradient-text">AI College Assistant</span> • {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  );
}
