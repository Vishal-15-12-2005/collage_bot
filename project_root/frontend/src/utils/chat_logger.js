// chat_logger.js
// Utility for logging chat messages to backend

import { logChat as logChatAPI } from './api';

export async function logChat({ sender, receiver, message, timestamp = null }) {
  try {
    const payload = {
      sender,
      receiver,
      message,
      timestamp: timestamp || new Date().toISOString(),
    };
    await logChatAPI(payload);
  } catch (err) {
    // Uncomment for debugging
    // console.error('Failed to log chat:', err);
  }
}
