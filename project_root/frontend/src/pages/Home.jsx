import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiUsers, 
  FiUserCheck, 
  FiEye, 
  FiUpload, 
  FiGrid, 
  FiActivity, 
  FiDatabase,
  FiTrendingUp,
  FiShield,
  FiZap,
  FiMonitor,
  FiCamera,
  FiClock,
  FiCheckCircle,
  FiCpu
} from 'react-icons/fi';
import StatsCard from '../components/StatsCard';
import LoadingSpinner from '../components/LoadingSpinner';
import API from '../utils/api';
const API_URL = API.defaults.baseURL.replace('/api', '');
import { motion } from 'framer-motion';

function animateValue(start, end, duration, setter) {
  if (start === end) {
    setter(end);
    return;
  }
  const range = end - start;
  let current = start;
  const increment = range / (duration / 16);
  let startTime = null;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = timestamp - startTime;
    current = start + increment * (progress / 16);
    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      setter(end);
      return;
    }
    setter(Math.round(current));
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

export default function Home() {
  const [stats, setStats] = useState({
    students: 0,
    staff: 0,
    unknowns: 0,
    accuracy: 0
  });
  const [loading, setLoading] = useState(true);
  const [displayStats, setDisplayStats] = useState(stats);
  const [robotQuery, setRobotQuery] = useState("");
  const [robotResponse, setRobotResponse] = useState("");

  useEffect(() => {
    setLoading(true);
    API.get('/statistics')
      .then(res => {
        const apiStats = {
          students: res.data.total_students,
          staff: res.data.total_staff,
          unknowns: res.data.total_unknowns,
          accuracy: res.data.accuracy_rate
        };
        setStats(apiStats);
        setLoading(false);
        // Animate numbers
        animateValue(displayStats.students, apiStats.students, 800, val => setDisplayStats(s => ({ ...s, students: val })));
        animateValue(displayStats.staff, apiStats.staff, 800, val => setDisplayStats(s => ({ ...s, staff: val })));
        animateValue(displayStats.unknowns, apiStats.unknowns, 800, val => setDisplayStats(s => ({ ...s, unknowns: val })));
        animateValue(displayStats.accuracy, apiStats.accuracy, 800, val => setDisplayStats(s => ({ ...s, accuracy: val })));
      })
      .catch(() => setLoading(false));
    // eslint-disable-next-line
  }, []);

  

  const quickActions = [
    { icon: FiUsers, title: "Students-Info", path: "/students", color: "bg-blue-500" },
    { icon: FiUserCheck, title: "Faculty-Info", path: "/staff", color: "bg-green-500" },
    { icon: FiEye, title: "Unknown", path: "/unknowns", color: "bg-red-500" },
    { icon: FiDatabase, title: "College-Info", path: "/collegeinfo", color: "bg-teal-500" },
    { icon: FiDatabase, title: "AI Chat", path: "/chatlogs", color: "bg-pink-500" }
  ];

  const statsData = [
    { 
      icon: FiUsers, 
      title: "Students Recognized",
      value: loading ? 0 : displayStats.students, 
      color: "from-blue-500 to-cyan-500",
      delay: 0.1
    },
    { 
      icon: FiUserCheck, 
      title: "Faculty Recognized",
      value: loading ? 0 : displayStats.staff, 
      color: "from-green-500 to-emerald-500",
      delay: 0.2
    },
    { 
      icon: FiEye,
      title: "Unknown Recognized",
      value: loading ? 0 : displayStats.unknowns,
      color: "from-red-500 to-pink-500",
      delay: 0.3
    }
  ];

  const startVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.start();

    recognition.onresult = function (event) {
      const query = event.results[0][0].transcript;
      setRobotQuery(query);

      API.post('/robot_ask', { query })
        .then(res => {
          const reply = res.data.response;
          setRobotResponse(reply);

          const synth = window.speechSynthesis;
          const utter = new window.SpeechSynthesisUtterance(reply);
          synth.speak(utter);
        })
        .catch(err => {
          setRobotResponse("Sorry, something went wrong.");
          console.error("Voice Assistant Error:", err);
        });
    };

    recognition.onerror = function (event) {
      console.error("Speech recognition error", event);
    };
  };

  return (
    <motion.div className="min-h-screen fade-in" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
      {/* Special College Name Display */}
      <section className="relative py-12 px-6 bg-gradient-to-br from-blue-100 via-white to-indigo-100 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold mb-4 bg-gradient-to-r from-blue-700 via-purple-500 to-indigo-600 bg-clip-text text-transparent drop-shadow-2xl tracking-tight special-font">
          Chettinad College of Engineering and Technology
        </h1>
        
      </section>

      {/* Robot Button - prominent and centered */}
      <div className="flex justify-center my-8">
        <Link to="/robotcontroller" className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-purple-700 via-blue-600 to-indigo-700 text-white text-2xl font-extrabold rounded-full shadow-2xl hover:scale-105 transition-transform border-4 border-white/40">
          <FiCpu className="text-3xl" /> Robot
        </Link>
      </div>

      {/* Quick Actions Section - Centered in one line */}
      <section className="max-w-5xl mx-auto px-6 py-8 flex flex-col items-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 bg-gradient-to-r from-blue-700 via-purple-500 to-indigo-600 bg-clip-text text-transparent drop-shadow text-center tracking-wide uppercase">Quick Actions</h2>
        <div className="w-full flex flex-col md:flex-row justify-center items-center gap-6">
          {quickActions.map((action, i) => (
            <motion.div key={action.title} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.97 }} className="flex-1 min-w-[160px]">
              <Link to={action.path} className={`flex flex-col items-center justify-center p-6 rounded-2xl shadow-lg text-white ${action.color} hover:shadow-2xl transition-all duration-300 w-full font-semibold text-lg`}>
                <action.icon className="text-3xl mb-2" />
                <span className="text-center">{action.title}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats Section - Centered in one line */}
      <section className="max-w-5xl mx-auto px-6 py-8 flex flex-col items-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 bg-gradient-to-r from-blue-700 via-purple-500 to-indigo-600 bg-clip-text text-transparent drop-shadow text-center tracking-wide uppercase">Recognition Stats</h2>
        <div className="w-full flex flex-col md:flex-row justify-center items-center gap-8">
          {statsData.map((stat, i) => (
            <motion.div key={stat.title} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: stat.delay, duration: 0.7 }} className="flex-1 min-w-[180px]">
              <div className="card flex flex-col items-center p-8">
                <span className={`text-4xl mb-4 bg-gradient-to-br ${stat.color} text-white p-3 rounded-full shadow-lg`}>
                  <stat.icon />
                </span>
                <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-blue-700 via-purple-500 to-indigo-600 bg-clip-text text-transparent text-center">{stat.title}</h3>
                <p className="text-3xl font-bold text-gray-800 dark:text-white text-center">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gradient-to-r from-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-300">
            © 2025 Chettinad Tech, Developed by AI&DS Dept.
          </p>
        </div>
      </footer>
    </motion.div>
  );
}