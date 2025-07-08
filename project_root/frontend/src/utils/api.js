import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8081/api',
});

// Student/Staff
export const fetchStudents = () => API.get('/students');
export const fetchStaff = () => API.get('/staff');

// Face Recognition
export const fetchRecognizedFace = () => API.get('/recognized_face');
export const fetchUnknowns = () => API.get('/unknowns');
export const enrollFace = (filename, data) => API.post(`/enroll/${filename}`, data);

// Upload & Logs
export const uploadImage = (data) => API.post('/upload', data);
export const fetchLogs = () => API.get('/logs');

// College Info
export const fetchCollegeInfo = () => API.get('/college_info');
export const addCollegeInfo = (data) => API.post('/college_info', data);
export const updateCollegeInfo = (id, data) => API.put(`/college_info/${id}`, data);
export const deleteCollegeInfo = (id) => API.delete(`/college_info/${id}`);

// Q&A / Voice
export const askRobotInfo = (question) => API.get(`/info?question=${encodeURIComponent(question)}`);
export const triggerVoiceAssistant = () => API.post('/robot_ask', { query: 'listen_voice' });
export const robotAsk = (query) => API.post('/robot_ask', { query });

// Recognition Greet
export const fetchCollegeName = () => API.get('/college_name');
export const logChat = (payload) => API.post('/chat_log', payload);

// ✅ Chat Logs

export const fetchLiveChatLogs = () => API.get('/live_chat');
export const clearLiveChatLogs = () => API.post('/live_chat/clear');
export const deleteLiveChatLog = (id) => API.delete(`/live_chat/${id}`);
export default API;
