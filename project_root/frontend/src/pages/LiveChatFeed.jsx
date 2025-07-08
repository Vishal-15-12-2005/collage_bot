import React, { useEffect, useState, useRef } from 'react';

import API from '../utils/api';
const API_URL = API.defaults.baseURL.replace('/api', '');

export default function LiveChatFeed() {
  const [messages, setMessages] = useState([]);
  const [recognized, setRecognized] = useState({ name: 'unknown', timestamp: null });
  const lastShownName = useRef('unknown');

  const fetchLiveChats = async () => { 
    try {
      const res = await API.get('/live_chat');
      setMessages(res.data || []);
    } catch (error) {
      console.error("Failed to fetch live chats:", error);
    }
  };

  const fetchRecognizedFace = async () => {
    try {
      const res = await API.get('/recognized_face');
      const data = res.data || { name: 'unknown', timestamp: null };
      if (data.name !== lastShownName.current) {
        setRecognized(data);
        lastShownName.current = data.name;
      }
    } catch (error) {
      console.error("Failed to fetch recognized face:", error);
    }
  };

  useEffect(() => {
    fetchLiveChats();
    fetchRecognizedFace();
    const chatInterval = setInterval(fetchLiveChats, 3000);
    const faceInterval = setInterval(fetchRecognizedFace, 1500);
    return () => {
      clearInterval(chatInterval);
      clearInterval(faceInterval);
    };
  }, []);

  const showPerson = recognized.name && recognized.name !== 'unknown';

  return (
    <div className="flex gap-4">
      <div className="glass-card p-4 min-w-[180px] flex flex-col items-center justify-center">
        <h3 className="text-lg font-semibold mb-2">🎯 Recognized</h3>
        {showPerson ? (
          <div className="text-blue-700 font-bold text-xl">{recognized.name}</div>
        ) : (
          <div className="text-gray-400 text-sm">No one recognized</div>
        )}
      </div>
      <div className="glass-card p-4 max-h-64 overflow-y-auto custom-scroll flex-1">
        <h2 className="text-xl font-bold mb-2">🗨️ Live Chat Feed</h2>
        <ul className="text-sm space-y-1">
          {messages.map(msg => (
            <li key={msg.id}>
              <strong>{msg.sender} ➤ {msg.receiver}</strong>: {msg.message}
              <span className="text-xs text-gray-400 ml-2">{new Date(msg.timestamp).toLocaleTimeString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
