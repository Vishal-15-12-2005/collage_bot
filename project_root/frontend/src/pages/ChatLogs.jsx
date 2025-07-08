import React, { useEffect, useState } from 'react';
import {
  fetchLiveChatLogs,
  deleteLiveChatLog,
  clearLiveChatLogs
} from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../App';

export default function ChatLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const fetchLogs = async () => {
    try {
      const res = await fetchLiveChatLogs();
      setLogs(res.data || []);
    } catch (err) {
      console.error("Failed to fetch live chat logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000); // Auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const onDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this chat log?')) {
      try {
        await deleteLiveChatLog(id);
        setLogs((prevLogs) => prevLogs.filter((log) => log.id !== id));
      } catch (err) {
        console.error('Failed to delete chat log:', err);
      }
    }
  };

  const clearLogs = async () => {
    if (window.confirm('Are you sure you want to clear ALL chat logs?')) {
      try {
        setLoading(true);
        await clearLiveChatLogs();
        setLogs([]);
      } catch (err) {
        console.error("Failed to clear chat logs:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatTime = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-blue-800 dark:text-white mb-1">Live Chat Logs</h1>
        {isAuthenticated && (
          <button
            onClick={clearLogs}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition"
          >
            <FiTrash2 /> Clear All
          </button>
        )}
      </div>
      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-separate border-spacing-0 rounded-xl overflow-hidden shadow-md bg-white dark:bg-gray-900">
            <thead>
              <tr className="bg-blue-100 dark:bg-blue-900 text-left">
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-200">Time</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-200">Sender</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-200">Receiver</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-200">Message</th>
                {isAuthenticated && (
                  <th className="p-3 font-semibold text-gray-700 dark:text-gray-200">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={isAuthenticated ? 5 : 4} className="p-6 text-center text-gray-400">
                    No chat logs available.
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr
                    key={log.id}
                    className={
                      (idx % 2 === 0
                        ? 'bg-gray-50 dark:bg-gray-800'
                        : 'bg-white dark:bg-gray-900') +
                      ' border-b border-gray-200 dark:border-gray-700 last:border-0'
                    }
                  >
                    <td className="p-3 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 font-mono">{formatTime(log.timestamp)}</td>
                    <td className="p-3 font-semibold text-blue-700 dark:text-blue-300">{log.sender}</td>
                    <td className="p-3 font-semibold text-green-700 dark:text-green-300">{log.receiver}</td>
                    <td className="p-3 break-words max-w-[300px] text-gray-800 dark:text-gray-100">{log.message}</td>
                    {isAuthenticated && (
                      <td className="p-3">
                        <button
                          onClick={() => onDelete(log.id)}
                          className="p-2 rounded-lg bg-red-500/90 hover:bg-red-600 text-white transition"
                          title="Delete log"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
