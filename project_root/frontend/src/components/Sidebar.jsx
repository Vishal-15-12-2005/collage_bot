import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FiUsers, 
  FiUserCheck, 
  FiEye, 
  FiUpload, 
  FiGrid, 
  FiActivity, 
  FiDatabase, 
  FiHome,
  FiMenu,
  FiX
} from 'react-icons/fi';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const commonLinkClass = "flex items-center px-4 py-3 text-gray-600 dark:text-gray-300 rounded-xl transition-all duration-300 group relative overflow-hidden";
  const activeLinkClass = "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105";
  const inactiveLinkClass = "hover:bg-white/50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white hover:shadow-md";

  const getLinkClass = ({ isActive }) => `${commonLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`;

  const navItems = [
    { to: "/", icon: FiHome, label: "Home", end: true },
    { to: "/students", icon: FiUsers, label: "Students" },
    { to: "/staff", icon: FiUserCheck, label: "Staff" },
    { to: "/unknowns", icon: FiEye, label: "Unknowns" },
    { to: "/upload", icon: FiUpload, label: "Upload" },
    { to: "/live", icon: FiGrid, label: "Live Feed" },
    { to: "/logs", icon: FiActivity, label: "Logs" },
    { to: "/chatlogs", icon: FiDatabase, label: "Chat Logs" },
    { to: "/collegeinfo", icon: FiDatabase, label: "College Info" },
    { to: "/robotview", icon: FiEye, label: "Robot View" },
    { to: "/robotcontroller", icon: FiGrid, label: "Robot Controller" }
  ];

  return (
    <>
      {/* Mobile menu button */}
      <motion.button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg"
        onClick={() => setIsCollapsed(!isCollapsed)}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.08 }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {isCollapsed ? <FiX size={24} /> : <FiMenu size={24} />}
      </motion.button>

      {/* Sidebar */}
      <motion.aside
        className={`
          ${isCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0 w-64'} 
          lg:w-64 flex-shrink-0 glass-card p-6 shadow-2xl flex flex-col transition-all duration-500 ease-out
          fixed lg:relative z-40 h-screen lg:h-auto
        `}
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        {/* Logo/Header */}
        <motion.div className="flex items-center justify-center mb-10 slide-in-left" initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="relative">
            <FiEye className="text-3xl text-blue-500 float" />
            <div className="absolute -inset-2 bg-blue-500/20 rounded-full blur-xl"></div>
          </div>
          {!isCollapsed && (
            <h1 className="text-2xl font-bold ml-3 gradient-text">FaceRec</h1>
          )}
        </motion.div>

        {/* Navigation */}
        <nav className="flex-grow space-y-3">
          {navItems.map((item, index) => (
            <motion.div key={item.to} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 * index }}>
              <NavLink 
                to={item.to} 
                className={getLinkClass}
                end={item.end}
              >
                <div className="relative">
                  <item.icon className="mr-4" size={20} />
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}
                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </NavLink>
            </motion.div>
          ))}
        </nav>

        {/* Footer/Status */}
        <motion.div className="mt-auto slide-in-up" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center">
              <div className="relative">
                <FiDatabase className="text-green-500" size={24} />
                <div className="absolute -inset-1 bg-green-500/20 rounded-full blur-sm"></div>
              </div>
              {!isCollapsed && (
                <div className="ml-3">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">Database</p>
                  <div className="flex items-center space-x-2">
                    <div className="status-online"></div>
                    <p className="text-xs text-green-500">Connected</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.aside>

      {/* Mobile overlay */}
      {!isCollapsed && (
        <motion.div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
          onClick={() => setIsCollapsed(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        ></motion.div>
      )}
    </>
  );
};

export default Sidebar;