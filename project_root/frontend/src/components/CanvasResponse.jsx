import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RobotSpeechDisplay({ message, isSpeaking, volume }) {
  const [displayed, setDisplayed] = useState('');

  // Typing effect
  useEffect(() => {
    setDisplayed('');
    if (!message) return;
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed((prev) => prev + message[i]);
      i++;
      if (i >= message.length) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [message]);

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Head - more expressive, no blinking */}
      <div className="relative">
        <motion.div
          animate={{
            scale: isSpeaking ? 1.08 : 1,
            boxShadow: isSpeaking ? '0 0 32px #38bdf8, 0 0 64px #6366f1' : 'none',
            rotate: isSpeaking ? [0, 2, -2, 2, 0] : 0
          }}
          transition={{ duration: 0.6, repeat: isSpeaking ? Infinity : 0, repeatType: 'loop' }}
          className="w-28 h-28 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center shadow-2xl border-4 border-white/40"
        >
          {/* Eyes - static */}
          <div className="absolute left-8 top-11 w-4 h-4 bg-white rounded-full border border-blue-200" />
          <div className="absolute right-8 top-11 w-4 h-4 bg-white rounded-full border border-blue-200" />
          {/* Mouth - animated width for talking */}
          <motion.div
            className="absolute left-1/2 bottom-8 h-3 bg-white rounded-full"
            animate={{
              width: isSpeaking ? `${16 + (volume || 0.5) * 32}px` : '16px',
              opacity: isSpeaking ? 1 : 0.7
            }}
            style={{
              transform: 'translateX(-50%)',
              transition: 'width 0.2s ease-out'
            }}
          />
        </motion.div>
      </div>

      {/* Typing Response */}
      <AnimatePresence>
        <motion.div
          key={displayed}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="bg-white/80 dark:bg-gray-800/80 rounded-xl px-6 py-4 shadow-lg text-lg font-mono text-gray-800 dark:text-white min-h-[48px]"
        >
          {displayed}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
