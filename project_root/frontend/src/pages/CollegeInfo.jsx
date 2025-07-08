import React, { useEffect, useState } from 'react';
import { FiEdit, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import Notification from '../components/Notification';
import API from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../App';

const API_URL = API.defaults.baseURL.replace('/api', '');

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md relative animate-fadeIn">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          onClick={onClose}
        >
          <FiX size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}

export default function CollegeInfoEditor() {
  const [info, setInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingInfo, setEditingInfo] = useState(null);
  const [newInfo, setNewInfo] = useState({ category: '', content: '' });
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchInfo();
  }, []);
  
  const fetchInfo = async () => {
    try {
      setLoading(true);
      const res = await API.get('/college_info');
      setInfo(res.data || []);
    } catch (err) {
      showNotification('error', 'Failed to fetch college information.');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAddInfo = async () => {
    try {
      await API.post('/college_info', newInfo);
      setNewInfo({ category: '', content: '' });
      setModalOpen(false);
      showNotification('success', 'Info added successfully.');
      fetchInfo();
    } catch (err) {
      showNotification('error', 'Failed to add info.');
    }
  };

  const handleEditInfo = async () => {
    try {
      await API.put(`/college_info/${editingInfo.id}`, editingInfo);
      setEditingInfo(null);
      setEditModalOpen(false);
      showNotification('success', 'Info updated successfully.');
      fetchInfo();
    } catch (err) {
      showNotification('error', 'Failed to update info.');
    }
  };

  const handleDeleteInfo = async (id) => {
    if (window.confirm('Are you sure you want to delete this info?')) {
      try {
        await API.delete(`/college_info/${id}`);
        showNotification('success', 'Info deleted successfully.');
        fetchInfo();
      } catch (err) {
        showNotification('error', 'Failed to delete info.');
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-800 dark:text-white mb-1">College Info</h1>
        </div>
        {isAuthenticated && (
          <button
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition"
            onClick={() => setModalOpen(true)}
          >
            <FiPlus /> Add Info
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {info.length === 0 ? (
            <div className="col-span-full text-center text-gray-400">No info available.</div>
          ) : (
            info.map(row => (
              <div
                key={row.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex flex-col gap-3 relative group border border-gray-100 dark:border-gray-700 hover:shadow-lg transition"
              >
                <div className="text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 font-semibold mb-1">{row.category}</div>
                <div className="text-gray-800 dark:text-gray-100 text-base whitespace-pre-line flex-1">{row.content}</div>
                {isAuthenticated && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        setEditingInfo(row);
                        setEditModalOpen(true);
                      }}
                      className="p-2 rounded-lg bg-yellow-400/90 hover:bg-yellow-500 text-white transition"
                    >
                      <FiEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteInfo(row.id)}
                      className="p-2 rounded-lg bg-red-500/90 hover:bg-red-600 text-white transition"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Info Modal */}
      {isAuthenticated && (
        <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
          <h2 className="text-xl font-bold mb-4">Add New Info</h2>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Category"
              value={newInfo.category}
              onChange={(e) => setNewInfo({ ...newInfo, category: e.target.value })}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
            />
            <textarea
              placeholder="Content"
              value={newInfo.content}
              onChange={(e) => setNewInfo({ ...newInfo, content: e.target.value })}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
            />
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg mt-2 transition"
              onClick={handleAddInfo}
            >
              <FiPlus className="inline mr-1" /> Add Info
            </button>
          </div>
        </Modal>
      )}

      {/* Edit Info Modal */}
      {isAuthenticated && (
        <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)}>
          <h2 className="text-xl font-bold mb-4">Edit Info</h2>
          {editingInfo && (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={editingInfo.category}
                onChange={e => setEditingInfo({ ...editingInfo, category: e.target.value })}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                placeholder="Category"
              />
              <textarea
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                value={editingInfo.content}
                onChange={e => setEditingInfo({ ...editingInfo, content: e.target.value })}
                placeholder="Content"
              ></textarea>
              <button
                onClick={handleEditInfo}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg mt-2 transition"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditModalOpen(false)}
                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold px-4 py-2 rounded-lg mt-1 transition"
              >
                Cancel
              </button>
            </div>
          )}
        </Modal>
      )}

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}