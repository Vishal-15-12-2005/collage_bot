import React, { useState, useEffect, useRef } from 'react';
import { 
  FiVideo, FiVideoOff, FiCamera, FiRefreshCw, FiUsers, FiEye, FiUser, FiUserCheck, FiAlertCircle, FiMaximize, FiMinimize, FiSettings, FiPower
} from 'react-icons/fi';

import API from '../utils/api';
const API_URL = API.defaults.baseURL.replace('/api', '');

const badgeColors = {
  student: 'bg-blue-500',
  staff: 'bg-green-500',
  unknown: 'bg-red-500',
};

const LiveFeed = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [faces, setFaces] = useState([]);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef();

  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      try {
        const res = await API.get('/recognized_faces');
        setFaces(res.data || []);
      } catch (e) {
        setFaces([]);
      }
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const togglePlayPause = () => setIsPlaying(!isPlaying);
  const refreshFeed = () => {
    const videoElement = document.getElementById('video-feed');
    if (videoElement) {
      videoElement.src = `${API_URL}/video_feed?t=${Date.now()}`;
    }
  };
  const toggleCamera = () => setIsCameraOn((prev) => !prev);
  const toggleFullscreen = () => {
    const videoContainer = document.getElementById('video-feed-container');
    if (!isFullscreen) {
      if (videoContainer.requestFullscreen) videoContainer.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };
  const openSettings = () => setShowSettings(true);
  const closeSettings = () => setShowSettings(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-indigo-100 py-4 px-1 fade-in">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Video Feed Section - more compact */}
        <div
          id="video-feed-container"
          className={`relative rounded-2xl overflow-hidden shadow-2xl glass-card p-0 bg-white/60 col-span-3 lg:col-span-3 flex-[2] max-w-full w-full mx-auto ${
            isFullscreen ? 'fixed inset-0 z-50 w-screen h-screen rounded-none bg-black' : ''
          }`}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white/70">
            <div className="flex items-center gap-3">
              <FiCamera className="text-gray-600" />
              <span className="font-bold text-lg text-gray-800">Live Camera</span>
              <span className="ml-3 flex items-center gap-1 text-red-500 font-semibold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span> LIVE
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={refreshFeed} className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition" title="Refresh">
                <FiRefreshCw />
              </button>
              <button onClick={togglePlayPause} className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition" title={isPlaying ? 'Pause Feed' : 'Play Feed'}>
                {isPlaying ? <FiVideoOff /> : <FiVideo />}
              </button>
              <button onClick={toggleCamera} className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition" title={isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}>
                <FiPower />
              </button>
              <button onClick={toggleFullscreen} className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition" title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
                {isFullscreen ? <FiMinimize /> : <FiMaximize />}
              </button>
              <button onClick={openSettings} className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition" title="Camera Settings">
                <FiSettings />
              </button>
            </div>
          </div>
          <div className={`relative bg-black flex items-center justify-center ${isFullscreen ? 'w-screen h-screen' : 'min-h-[700px] w-full max-w-full'}`}>
            {isCameraOn ? (
              isPlaying ? (
                <img
                  id="video-feed"
                  src={`${API_URL}/video_feed`}
                  alt="Live camera feed"
                  className={`object-contain ${isFullscreen ? 'w-screen h-screen' : 'w-full h-[700px] max-w-full'} rounded-b-3xl`}
                  style={isFullscreen ? { borderRadius: 0 } : {}}
                />
              ) : (
                <div className="w-full h-[700px] flex items-center justify-center bg-gray-900 rounded-b-3xl">
                  <div className="text-center text-gray-400">
                    <FiVideoOff className="mx-auto text-6xl mb-4" />
                    <p className="text-lg">Feed Paused</p>
                    <p className="text-sm">Click play to resume</p>
                  </div>
                </div>
              )
            ) : (
              <div className="w-full h-[700px] flex items-center justify-center bg-gray-900 rounded-b-3xl">
                <div className="text-center text-gray-400">
                  <FiPower className="mx-auto text-6xl mb-4" />
                  <p className="text-lg">Camera is Off</p>
                  <p className="text-sm">Click power to turn on</p>
                </div>
              </div>
            )}
          </div>
          {/* Camera Settings Modal */}
          {showSettings && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
              <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
                <button onClick={closeSettings} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-xl font-bold">&times;</button>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FiSettings /> Camera Settings</h2>
                <div className="text-gray-600">(Settings options coming soon...)</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveFeed;
