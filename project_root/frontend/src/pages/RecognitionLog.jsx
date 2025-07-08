import React, { useEffect, useState } from 'react';
import API from '../utils/api';
const API_URL = API.defaults.baseURL.replace('/api', '');
import { 
  FiActivity, 
  FiSearch, 
  FiFilter, 
  FiRefreshCw, 
  FiEye, 
  FiDownload,
  FiCalendar,
  FiUser,
  FiUsers,
  FiEye as FiUnknown,
  FiClock,
  FiPercent,
  FiImage,
  FiTrash2
} from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';

export default function RecognitionLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await API.get('/logs');
      setLogs(res.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || log.type === filterType;
    const matchesDate = !filterDate || log.timestamp.startsWith(filterDate);
    return matchesSearch && matchesType && matchesDate;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'student': return <FiUser className="text-blue-500" />;
      case 'staff': return <FiUsers className="text-green-500" />;
      case 'unknown': return <FiUnknown className="text-red-500" />;
      default: return <FiUser className="text-gray-500" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'student': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'staff': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'unknown': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getConfidenceColor = (confidence) => {
    const conf = parseFloat(confidence);
    if (conf >= 0.8) return 'text-green-600 dark:text-green-400';
    if (conf >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const exportLogs = () => {
    const csvContent = [
      ['ID', 'Name', 'Type', 'Confidence', 'Timestamp', 'Image Path'].join(','),
      ...filteredLogs.map(log => [
        log.id,
        log.name,
        log.type,
        log.confidence,
        log.timestamp,
        log.image_path || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recognition_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearAllLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all recognition logs? This action cannot be undone.')) return;
    try {
      setLoading(true);
      await API.post('/recognition_logs/clear');
      await fetchLogs();
    } catch (error) {
      alert('Failed to clear recognition logs.');
      console.error('Error clearing recognition logs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-blue-100 py-12 px-2 fade-in relative overflow-x-hidden">
      {/* Animated background highlights */}
      <div className="pointer-events-none select-none">
        <div className="absolute top-10 left-1/4 w-1/2 h-32 bg-gradient-to-r from-purple-400/30 to-blue-400/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-10 right-1/4 w-1/3 h-24 bg-gradient-to-l from-blue-400/30 to-pink-400/20 rounded-full blur-2xl animate-pulse"></div>
            </div>
      <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Left-side stats (extra small) */}
        <div className="flex flex-row md:flex-col gap-2 md:w-24 w-full md:shrink-0 mb-1 md:mb-0">
          <div className="gradient-card p-1 rounded-lg text-center shadow w-full">
            <div className="text-base font-bold text-blue-800 dark:text-white">{logs.filter(log => log.type === 'student').length}</div>
            <div className="text-gray-600 dark:text-gray-300 text-xs">Students</div>
            </div>
          <div className="gradient-card p-1 rounded-lg text-center shadow w-full">
            <div className="text-base font-bold text-blue-800 dark:text-white">{logs.filter(log => log.type === 'staff').length}</div>
            <div className="text-gray-600 dark:text-gray-300 text-xs">Staff</div>
          </div>
          <div className="gradient-card p-1 rounded-lg text-center shadow w-full">
            <div className="text-base font-bold text-blue-800 dark:text-white">{logs.filter(log => log.type === 'unknown').length}</div>
            <div className="text-gray-600 dark:text-gray-300 text-xs">Unknown</div>
          </div>
        </div>
        {/* Floating Export/Refresh button group - top right of viewport, horizontal */}
        <div className="fixed bottom-6 right-6 z-30 flex flex-row gap-2 items-center">
          <button
            onClick={exportLogs}
            className="group p-2 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow hover:scale-110 transition flex items-center justify-center"
            title="Export CSV"
          >
            <FiDownload size={18} />
          </button>
          <button
            onClick={fetchLogs}
            className="group p-2 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow hover:scale-110 transition flex items-center justify-center"
            title="Refresh"
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} size={18} />
          </button>
        </div>
        {/* Main content: filters + table (table much larger) */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Filters (even longer/wider) */}
          <div className="glass-card p-2 rounded-lg shadow border border-blue-100 mb-1 w-full max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
          <div className="relative">
                <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                  className="enhanced-input pl-8 text-[10px] py-0.5"
            />
          </div>
          <div className="relative">
                <FiFilter className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
                  className="enhanced-input pl-8 text-[10px] py-0.5"
            >
              <option value="">All Types</option>
              <option value="student">Students</option>
              <option value="staff">Staff</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
          <div className="relative">
                <FiCalendar className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
                  className="enhanced-input pl-8 text-[10px] py-0.5"
            />
          </div>
        </div>
      </div>
          {/* Log Table (extra small) */}
          <div className="glass-card overflow-auto rounded-3xl shadow-2xl border-2 border-blue-100 w-full max-w-full min-w-0">
        {loading ? (
              <div className="p-20">
            <LoadingSpinner size="lg" text="Loading recognition logs..." />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
                  <table className="enhanced-table text-[10px] min-w-[300px] w-full">
                    <thead className="bg-gradient-to-r from-blue-100 to-indigo-100 text-[9px]">
                      <tr>
                        <th className="py-1 px-1">#</th>
                        <th className="py-1 px-1">Name</th>
                        <th className="py-1 px-1">Type</th>
                        <th className="py-1 px-1">Confidence</th>
                        <th className="py-1 px-1">Timestamp</th>
                        <th className="py-1 px-1">Image</th>
            </tr>
          </thead>
          <tbody>
                  {currentLogs.map((log, index) => (
                        <tr key={log.id || index} className="slide-in-up border-b border-blue-50 hover:bg-blue-50/40 transition" style={{ animationDelay: `${index * 0.05}s` }}>
                          <td className="font-mono font-semibold py-0.5 px-1 text-[9px]">#{log.id || index + 1}</td>
                          <td className="font-semibold py-0.5 px-1 text-[9px]">{log.name}</td>
                          <td className="py-0.5 px-1">
                            <div className="flex items-center space-x-0.5">
                          {getTypeIcon(log.type)}
                              <span className={`px-1 py-0.5 rounded-full text-[8px] font-semibold ${getTypeColor(log.type)}`}>
                            {log.type}
                          </span>
                        </div>
                      </td>
                          <td className="py-0.5 px-1">
                            <div className="flex items-center space-x-0.5">
                              <FiPercent className="text-gray-400 text-[9px]" />
                              <span className={`font-semibold text-[9px] ${getConfidenceColor(log.confidence)}`}>
                            {(parseFloat(log.confidence) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                          <td className="py-0.5 px-1">
                            <div className="flex items-center space-x-0.5">
                              <FiClock className="text-gray-400 text-[9px]" />
                              <span className="text-[9px]">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      </td>
                          <td className="py-0.5 px-1">
                  {log.image_path ? (
                          <div className="flex justify-center">
                    <img
                      src={`${API_URL}/${log.image_path}`}
                      alt="snapshot"
                      className="w-5 h-5 object-cover rounded shadow-md border-2 border-white dark:border-gray-700 hover:scale-110 transition-transform duration-200"
                    />
                          </div>
                  ) : (
                          <div className="flex justify-center">
                                <FiImage className="text-gray-400" size={8} />
                          </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
            </div>
            {totalPages > 1 && (
                  <div className="p-6 border-t border-blue-100">
                <div className="flex items-center justify-between">
                      <div className="text-lg text-gray-600 dark:text-gray-300">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredLogs.length)} of {filteredLogs.length} results
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed text-base px-3 py-1"
                    >
                      Previous
                    </button>
                        <span className="px-3 py-2 text-lg text-gray-600 dark:text-gray-300">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed text-base px-3 py-1"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {!loading && filteredLogs.length === 0 && (
              <div className="p-20 text-center">
                <FiActivity className="mx-auto text-7xl text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-300 text-xl">
              {logs.length === 0 ? 'No recognition logs found' : 'No results match your filters'}
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              {logs.length === 0 
                ? 'Start the live feed to generate recognition logs.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}