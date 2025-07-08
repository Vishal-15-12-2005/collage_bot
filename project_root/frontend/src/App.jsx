import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import AnimatedBackground from './components/AnimatedBackground';

import Home from './pages/Home';
import StudentDB from './pages/StudentDB';
import StaffDB from './pages/StaffDB';
import UnknownFaces from './pages/UnknownFaces';
import UploadImage from './pages/UploadImage';
import Enroll from './pages/Enroll';
import LiveFeed from './pages/LiveFeed';
import RecognitionLog from './pages/RecognitionLog';
import ChatLogs from './pages/ChatLogs';
import CollegeInfo from './pages/CollegeInfo';
import RobotView from './pages/RobotView';
import RobotController from './pages/RobotController';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';

// Auth context
const AuthContext = createContext();
export function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAdminLoggedIn') === 'true';
  });

  const login = (username, password) => {
    // Hardcoded admin credentials
    if (username === 'admin' && password === 'yourpassword') {
      setIsAuthenticated(true);
      localStorage.setItem('isAdminLoggedIn', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAdminLoggedIn');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 relative">
          <AnimatedBackground />
          <Navbar />
          <div className="flex-1 flex flex-col relative z-10">
            <main className="flex-1 p-6">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/students" element={<StudentDB />} />
                <Route path="/staff" element={<StaffDB />} />
                <Route path="/unknowns" element={<UnknownFaces />} />
                <Route path="/upload" element={<UploadImage />} />
                <Route path="/enroll/:filename" element={<ProtectedRoute><Enroll /></ProtectedRoute>} />
                <Route path="/live" element={<LiveFeed />} />
                <Route path="/logs" element={<RecognitionLog />} />
                <Route path="/chatlogs" element={<ChatLogs />} />
                <Route path="/collegeinfo" element={<CollegeInfo />} />
                <Route path="/robotview" element={<RobotView />} />
                <Route path="/robotcontroller" element={<RobotController />} />
                <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}
