import React from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiUserCheck, FiAlertCircle, FiBookOpen, FiMessageCircle } from 'react-icons/fi';
import { useAuth } from '../App';

const adminLinks = [
  {
    to: '/students',
    icon: <FiUsers className="text-3xl text-blue-600 mb-2 " />,
    title: 'Student Database',
    desc: 'View, edit, and manage student records',
    color: 'from-blue-100 to-blue-50',
  },
  {
    to: '/staff',
    icon: <FiUserCheck className="text-3xl text-purple-600 mb-2" />,
    title: 'Staff Database',
    desc: 'View, edit, and manage staff records',
    color: 'from-purple-100 to-purple-50',
  },
  {
    to: '/unknowns',
    icon: <FiAlertCircle className="text-3xl text-red-500 mb-2" />,
    title: 'Unknown Faces',
    desc: 'Review and enroll unknown face detections',
    color: 'from-red-100 to-red-50',
  },
  {
    to: '/collegeinfo',
    icon: <FiBookOpen className="text-3xl text-green-600 mb-2" />,
    title: 'College Info',
    desc: 'Edit and manage college, event, and staff info',
    color: 'from-green-100 to-green-50',
  },
  {
    to: '/chatlogs',
    icon: <FiMessageCircle className="text-3xl text-indigo-600 mb-2" />,
    title: 'Chat Logs',
    desc: 'View and manage all chat interactions',
    color: 'from-indigo-100 to-indigo-50',
  },
];

// Placeholder data for future dynamic content
const recentUsers = [
  { username: 'vishal', role: 'admin', lastLogin: '2025-07-07 10:00' },
  { username: 'sabari', role: 'admin', lastLogin: '2025-07-06 15:30' },

  // ...more rows
];

const changeLog = [
  { user: 'sabari', action: 'edited student sabari', time: '2025-07-07 10:05' },
  { user: 'vishal', action: 'added college info', time: '2025-07-06 15:35' },
  // ...more log entries
];

export default function AdminPanel() {
  const { isAuthenticated } = useAuth();
  // Placeholder for future: user info and change log
  const currentUser = isAuthenticated ? 'admin' : 'guest'; // Replace with real user info in future

  return (
    <div className="min-h-screen py-10 px-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 fade-in">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold text-blue-800 dark:text-white mb-8 text-center drop-shadow">Admin Control Panel</h1>
        {/* Main admin links grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
          {adminLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`group bg-gradient-to-br ${link.color} rounded-2xl shadow-lg p-8 flex flex-col items-center text-center hover:scale-105 hover:shadow-2xl transition-all border border-gray-200 dark:border-gray-700`}
            >
              {link.icon}
              <div className="text-xl font-bold mb-1 text-gray-800 dark:text-white group-hover:text-blue-700 transition-colors">{link.title}</div>
              <div className="text-gray-500 dark:text-gray-300 text-sm">{link.desc}</div>
            </Link>
          ))}
        </div>

        {/* Recent User Logins */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-blue-700">Recent User Logins</h2>
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left">Username</th>
                <th className="p-2 text-left">Role</th>
                <th className="p-2 text-left">Last Login</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((user, idx) => (
                <tr key={idx}>
                  <td className="p-2">{user.username}</td>
                  <td className="p-2">{user.role}</td>
                  <td className="p-2">{user.lastLogin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Changes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-blue-700">Recent Changes</h2>
          <ul className="text-gray-700 dark:text-gray-300 text-sm list-disc ml-5">
            {changeLog.map((log, idx) => (
              <li key={idx}>
                {log.user} {log.action} <span className="text-xs text-gray-400">({log.time})</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
