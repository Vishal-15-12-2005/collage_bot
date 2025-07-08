import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiAlertCircle, 
  FiUserPlus, 
  FiClock, 
  FiPercent, 
  FiEye, 
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiCalendar,
  FiUser,
  FiTrash2,
  FiDownload
} from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification from '../components/Notification';
import API from '../utils/api';
import { useAuth } from '../App';

const API_URL = API.defaults.baseURL.replace('/api', '');

// Utility to convert unknown faces data to CSV
function unknownsToCSV(unknownsList) {
  const header = ['ID', 'Label', 'Timestamp', 'Confidence', 'Image URL'];
  const rows = unknownsList.map(face => [
    face.id,
    '"' + (face.label || `Unknown-${face.id}`).replace(/"/g, '""') + '"',
    '"' + (face.timestamp || face.last_seen || '').replace(/"/g, '""') + '"',
    face.confidence ? (face.confidence * 100).toFixed(1) + '%' : '-',
    `${API_URL}/${face.representative_image_path || face.image_path}`
  ]);
  return [header, ...rows].map(row => row.join(',')).join('\r\n');
}

function downloadUnknownsCSV(unknownsList) {
  const csv = unknownsToCSV(unknownsList);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'unknown_faces.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const UnknownFaces = () => {
  const [unknowns, setUnknowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [notification, setNotification] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchUnknowns();
  }, []);

  const fetchUnknowns = async () => {
    try {
      setLoading(true);
      const response = await API.get('/unknown_faces');
      setUnknowns(response.data);
    } catch (err) {
      setError(err.message);
      showNotification('error', 'Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, title, message) => {
    setNotification({ type, title, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const filteredUnknowns = unknowns.filter(face => {
    const matchesSearch = face.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         face.id.toString().includes(searchTerm);
    const matchesDate = !filterDate || face.timestamp?.startsWith(filterDate);
    return matchesSearch && matchesDate;
  });

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this unknown face?')) {
      try {
        await API.delete(`/unknown_faces/${id}`);
        showNotification('success', 'Deleted', 'Unknown face has been removed.');
        setUnknowns(unknowns.filter(face => face.id !== id));
      } catch (err) {
        showNotification('error', 'Error', 'Failed to delete unknown face.');
      }
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" text="Loading unknown faces..." />
        </div>
      );
    }

    if (error) {
      return (
        <div className="glass-card p-12 text-center">
          <FiAlertCircle className="mx-auto text-6xl text-red-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Failed to load data</h3>
          <p className="text-gray-600 dark:text-gray-300">{error}</p>
          <button 
            onClick={fetchUnknowns}
            className="btn-primary mt-4"
          >
            <FiRefreshCw className="mr-2" />
            Try Again
          </button>
        </div>
      );
    }
    
    if (filteredUnknowns.length === 0) {
      return (
        <div className="glass-card p-12 text-center">
          <FiEye className="mx-auto text-6xl text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            {unknowns.length === 0 ? 'No Unknown Faces Detected' : 'No Results Found'}
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            {unknowns.length === 0 
              ? 'The system hasn\'t detected any unrecognized individuals yet.'
              : 'Try adjusting your search or filter criteria.'
            }
          </p>
        </div>
      );
    }

    return (
      <div className="glass-card overflow-x-auto p-0 border border-gray-200 shadow-sm">
        <table className="min-w-full text-sm divide-y divide-gray-100">
          <thead className="bg-white">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-600"> <span title="Photo"><FiEye /></span> </th>
              <th className="px-3 py-2 text-left font-semibold text-gray-600"> <span title="ID"><FiUser /></span> </th>
              <th className="px-3 py-2 text-left font-semibold text-gray-600"> <span title="Label"><FiAlertCircle /></span> </th>
              <th className="px-3 py-2 text-left font-semibold text-gray-600"> <span title="Timestamp"><FiClock /></span> </th>
              <th className="px-3 py-2 text-left font-semibold text-gray-600"> <span title="Confidence"><FiPercent /></span> </th>
              {isAuthenticated && (
                <th className="px-3 py-2 text-center font-semibold text-gray-600"> <span title="Actions"><FiDownload /></span> </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredUnknowns.map((face) => {
              const filename = face.representative_image_path?.split('/').pop() || face.image_path?.split('/').pop();
              return (
                <tr key={face.id} className="hover:bg-blue-50 transition">
                  <td className="px-3 py-2">
                    <img
                      src={`${API_URL}/${face.representative_image_path || face.image_path}`}
                      alt="Unknown Face"
                      className="w-10 h-10 object-cover rounded border border-gray-200 shadow-sm"
                    />
                  </td>
                  <td className="px-3 py-2 text-gray-800 font-medium">{face.id}</td>
                  <td className="px-3 py-2 text-gray-700">{face.label || `Unknown-${face.id}`}</td>
                  <td className="px-3 py-2 text-gray-500">{new Date(face.timestamp || face.last_seen).toLocaleString()}</td>
                  <td className="px-3 py-2 text-gray-500">{face.confidence ? `${(face.confidence * 100).toFixed(1)}%` : '-'}</td>
                  {isAuthenticated && (
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link to={`/enroll/${filename}`} className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 border border-gray-200" title="Enroll">
                          <FiUserPlus size={16} />
                        </Link>
                        <button onClick={() => handleDelete(face.id)} className="p-2 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-gray-200" title="Delete">
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Enhanced Filter Bar (larger, more modern, visually distinct) */}
      <div className="glass-card p-6 flex flex-wrap items-center justify-center gap-6 rounded-2xl shadow-lg bg-blue-50/60 border border-blue-100 mb-2">
        <div className="flex items-center gap-6 w-full sm:w-auto justify-center">
          <button
            onClick={() => downloadUnknownsCSV(filteredUnknowns)}
            className="p-4 rounded-full bg-gradient-to-br from-green-400 to-blue-400 text-white shadow-2xl hover:scale-110 transition flex items-center justify-center text-xl"
            title="Download CSV"
            style={{ minHeight: 56, minWidth: 56 }}
          >
            <FiDownload size={20} />
          </button>
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="enhanced-input pl-16 pr-4 py-5 text-xl w-72 sm:w-96 rounded-2xl border-2 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all shadow-md hover:bg-blue-100/30"
              aria-label="Search by ID or label"
              style={{ minHeight: 64 }}
            />
            <FiSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 text-3xl pointer-events-none" title="Search" />
          </div>
          <div className="relative">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="enhanced-input pl-16 pr-4 py-5 text-xl w-60 rounded-2xl border-2 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all shadow-md hover:bg-blue-100/30"
              aria-label="Filter by date"
              style={{ minHeight: 64 }}
            />
            <FiCalendar className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 text-3xl pointer-events-none" title="Filter by date" />
          </div>
          <button
            onClick={fetchUnknowns}
            className="p-5 rounded-full bg-white hover:bg-blue-100 text-blue-600 border-2 border-gray-200 hover:border-blue-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all shadow-md"
            title="Refresh"
            disabled={loading}
            style={{ minHeight: 64, minWidth: 64, fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} size={32} />
          </button>
        </div>
      </div>
      {/* Table Content */}
        {renderContent()}
      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default UnknownFaces;
