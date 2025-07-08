import React from 'react';
import { useLocation, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiGrid, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../App';

const getTitleFromPath = (path) => {
  if (path.startsWith('/enroll')) return 'Enroll New Person';
  switch (path) {
    case '/': return 'Student Database';
    case '/staff': return 'Staff Database';
    case '/unknowns': return 'Unknown Faces';
    case '/upload': return 'Upload New Image';
    case '/live': return 'Live Camera Feed';
    case '/cams': return 'All Camera Feeds';
    case '/logs': return 'Recognition Logs';
    default: return 'Dashboard';
  }
};

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/robotcontroller', label: 'Robot Controller' },
  { to: '/upload', label: 'Upload' },
  { to: '/live', label: 'Live Feed' },
  { to: '/logs', label: 'Logs' },
  { to: '/robotview', label: 'Robot View' }
];

const Navbar = () => {
  const location = useLocation();
  const title = getTitleFromPath(location.pathname);
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isOnAdminPage = location.pathname === '/admin';

  return (
    <motion.header className="bg-white/90 dark:bg-gray-900/90 shadow-md px-6 py-3 z-20 w-full backdrop-blur-md border-b border-blue-100 dark:border-gray-800" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7 }}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* College Name/Logo */}
        <div className="flex items-center space-x-3">
          <span className="text-2xl font-bold text-blue-700 tracking-tight drop-shadow-md">Chettinad Tech</span>
        </div>
        {/* Menu */}
        <nav className="flex space-x-2 md:space-x-4">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive ? 'bg-blue-600 text-white shadow' : 'text-blue-800 hover:bg-blue-100 dark:text-blue-200 dark:hover:bg-gray-800'}`
              }
              end={item.to === '/'}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        {/* Admin Panel Button (not on /admin) & Logout (icon only, on /admin) */}
        <div className="flex items-center gap-2 ml-4">
          {!isOnAdminPage && (
            <NavLink
              to="/admin"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow hover:scale-105 transition-transform text-sm md:text-base"
              title="Admin Panel"
            >
              <FiGrid className="text-lg md:text-xl" />
            </NavLink>
          )}
          {isAuthenticated && isOnAdminPage && (
            <button
              onClick={handleLogout}
              className="flex items-center justify-center px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white shadow transition-transform text-sm md:text-base ml-2"
              title="Logout"
            >
              <FiLogOut className="text-xl" />
            </button>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Navbar;
