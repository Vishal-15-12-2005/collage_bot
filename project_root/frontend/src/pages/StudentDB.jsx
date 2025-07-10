import React, { useEffect, useState } from 'react';
import {
  FiUsers, FiSearch, FiFilter, FiRefreshCw, FiEye, FiDownload, FiChevronDown, FiPlus, FiEdit, FiTrash2, FiCamera, FiX
} from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification from '../components/Notification';
import API from '../utils/api';
import { useAuth } from '../App';

const API_URL = API.defaults.baseURL.replace('/api', '');

const UpdatePhotoModal = ({ person, personType, onClose, onPhotoUpdated }) => {
  const [newImage, setNewImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newImage) {
      setError('Please select an image file.');
      return;
    }
    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('image', newImage);
    formData.append('personId', person.id);
    formData.append('personType', personType);

    try {
      const response = await API.post('/update_photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onPhotoUpdated(response.data.new_image_path);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update photo.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center fade-in">
      <div className="glass-card p-8 rounded-2xl shadow-xl w-full max-w-md m-4 relative slide-in-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <FiX size={24} />
        </button>
        <h2 className="text-2xl font-bold gradient-text mb-4">Update Photo for {person.name}</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="w-full h-48 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center bg-white/5">
              {preview ? (
                <img src={preview} alt="New photo preview" className="w-full h-full object-contain rounded-lg" />
              ) : (
                <label htmlFor="photo-upload" className="text-center cursor-pointer">
                  <FiCamera className="mx-auto text-4xl text-gray-400 mb-2" />
                  <span className="text-gray-400">Click to select an image</span>
                </label>
              )}
              <input type="file" id="photo-upload" accept="image/*" onChange={handleFileChange} className="sr-only" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={isUploading}
            >
              {isUploading ? <LoadingSpinner size="sm" /> : 'Upload and Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StudentCard = ({ student, index, onUpdatePhoto, onEdit, onDelete }) => {
  return (
    <div 
      className="glass-card overflow-hidden group slide-in-up"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="relative">
        <img 
          src={`${API_URL}/${student.image_path}?t=${new Date().getTime()}`} 
          alt={student.name}
          className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
        <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onUpdatePhoto(student)} title="Update Photo" className="p-2 rounded-full bg-blue-500/80 hover:bg-blue-600 text-white backdrop-blur-sm">
            <FiCamera size={16} />
          </button>
          <button onClick={() => onEdit(student)} title="Edit Details" className="p-2 rounded-full bg-yellow-500/80 hover:bg-yellow-600 text-white backdrop-blur-sm">
            <FiEdit size={16} />
          </button>
          <button onClick={() => onDelete(student.id)} title="Delete Student" className="p-2 rounded-full bg-red-500/80 hover:bg-red-600 text-white backdrop-blur-sm">
            <FiTrash2 size={16} />
          </button>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-800 dark:text-white truncate">{student.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">{student.department}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Age: {student.age}</p>
      </div>
    </div>
  );
};

// Utility to convert students data to CSV
function studentsToCSV(studentsList) {
  const header = ['ID', 'Name', 'Age', 'Department', 'Image URL'];
  const rows = studentsList.map(student => [
    student.id,
    '"' + student.name.replace(/"/g, '""') + '"',
    student.age,
    '"' + student.department.replace(/"/g, '""') + '"',
    `${API_URL}/${student.image_path}`
  ]);
  return [header, ...rows].map(row => row.join(',')).join('\r\n');
}

function downloadStudentsCSV(studentsList) {
  const csv = studentsToCSV(studentsList);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'students_database.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function AddStudentForm({ onSuccess }) {
  const [form, setForm] = useState({
    name: '',
    age: '',
    department: '',
    photo: null,
  });
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('age_or_role', form.age); // backend expects 'age_or_role'
    formData.append('department', form.department);
    formData.append('type', 'student');
    if (form.photo) formData.append('image', form.photo);

    try {
      await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Student added!');
      setForm({ name: '', age: '', department: '', photo: null });
      if (onSuccess) onSuccess();
    } catch (err) {
      alert('Failed to add student');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md bg-white/90 rounded-xl shadow-lg p-6 flex flex-col gap-5">
      <h3 className="text-xl font-bold text-blue-800 mb-2 text-center">Student Details</h3>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Name</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Name"
          required
          className="border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Age</label>
        <input
          name="age"
          value={form.age}
          onChange={handleChange}
          placeholder="Age"
          type="number"
          required
          className="border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Department</label>
        <input
          name="department"
          value={form.department}
          onChange={handleChange}
          placeholder="Department"
          required
          className="border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Photo</label>
        <input
          name="photo"
          type="file"
          accept="image/*"
          onChange={handleChange}
          required
          className="border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base bg-white"
        />
      </div>
      <button
        type="submit"
        disabled={uploading}
        className="w-full py-2 mt-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-lg shadow hover:from-blue-600 hover:to-purple-600 transition disabled:opacity-60"
      >
        {uploading ? 'Uploading...' : 'Add Student'}
      </button>
    </form>
  );
}

export default function StudentDB() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [filterDepartment, setFilterDepartment] = useState('');
  const { isAuthenticated, user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);

  const staticDepartments = [
    'Artificial Intelligence and Data Science',
    'Computer Science Engineering',
    'Information Technology',
    'Electronic and Communcation Engineering',
    'Electrical and Electronic Engineering',
    'Mechnical Engineering'
  ];
  const departments = [
    ...staticDepartments,
    ...[...new Set(students.map(student => student.department))].filter(
      dept => !staticDepartments.includes(dept)
    )
  ];

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await API.get('/students');
      setStudents(response.data);
    } catch (err) {
      showNotification('error', 'Error', 'Failed to fetch student data.');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const showNotification = (type, title, message) => {
    setNotification({ type, title, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handlePhotoUpdated = (newImagePath) => {
    fetchStudents();
    showNotification('success', 'Success', 'Photo has been updated and faces are reloading.');
  };

  const handleEditStudent = async (updatedStudent) => {
    setSelectedStudent(updatedStudent);
  };

  const handleUpdateStudent = async (updatedData) => {
    setLoading(true);
    try {
      const response = await API.put(`/students/${selectedStudent.id}`, updatedData);
      const updatedStudents = students.map(student => student.id === selectedStudent.id ? response.data : student);
      setStudents(updatedStudents);
      setSelectedStudent(null);
      showNotification('success', 'Success', 'Student details updated successfully.');
    } catch (err) {
      showNotification('error', 'Error', 'Failed to update student details.');
      console.error('Error updating student:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    setLoading(true);
    try {
      await API.delete(`/students/${studentId}`);
      setStudents(students.filter(student => student.id !== studentId));
      showNotification('success', 'Success', 'Student deleted successfully.');
    } catch (err) {
      showNotification('error', 'Error', 'Failed to delete student.');
      console.error('Error deleting student:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestChange = async (changeType, targetId, data) => {
    const res = await API.post('/change_requests', {
      username: user.username,
      change_type: changeType, // e.g., 'add_student', 'edit_student', 'delete_student'
      target_id: targetId,
      data: JSON.stringify(data)
    });
    const result = res.data;
    if (result.success) {
      alert('Change request submitted for admin approval.');
    } else {
      alert(result.error || 'Failed to submit request');
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.id.toString().includes(searchTerm);
    const matchesDepartment = !filterDepartment || student.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 py-4 px-1 fade-in relative overflow-x-hidden">
      {/* Animated background highlights */}
      <div className="pointer-events-none select-none">
        <div className="absolute top-6 left-1/4 w-1/2 h-20 bg-gradient-to-r from-blue-400/30 to-purple-400/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-6 right-1/4 w-1/3 h-16 bg-gradient-to-l from-purple-400/30 to-pink-400/20 rounded-full blur-2xl animate-pulse"></div>
      </div>
      <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-4">
        {/* Add Student Button - only for admin */}
        <div className="flex justify-end mb-1 gap-2">
          <button
            onClick={() => downloadStudentsCSV(filteredStudents)}
            className="p-2 rounded-full bg-gradient-to-br from-green-400 to-blue-400 text-white shadow-2xl hover:scale-110 transition flex items-center justify-center text-lg"
            title="Download CSV"
          >
            <FiDownload size={16} />
          </button>
          {isAuthenticated && (
            <button
              onClick={() => setShowAddModal(true)}
              className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-2xl hover:scale-110 transition flex items-center justify-center text-lg"
              title="Add Student"
            >
              <FiPlus size={20} />
            </button>
          )}
        </div>
        {/* Filters (modern, wide, compact) */}
        <div className="glass-card p-3 rounded-xl shadow-xl border-2 border-blue-100 max-w-5xl w-full mx-auto mb-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-base" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="enhanced-input pl-10 text-base"
              />
            </div>
            <div className="relative">
              <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-base" />
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="enhanced-input pl-10 text-base"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {/* Student Table (replaces card grid) */}
        <div className="w-full">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <LoadingSpinner size="lg" text="Loading student database..." />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <FiUsers className="mx-auto text-5xl text-gray-400 mb-2" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
                {students.length === 0 ? 'No Students Found' : 'No Results Found'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {students.length === 0 
                  ? 'The student database is empty. Try enrolling new students.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
            </div>
          ) : (
            <div className="glass-card overflow-x-auto p-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-blue-100 to-purple-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Photo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Age</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Department</th>
                    {isAuthenticated && (
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white/60 divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-blue-50/60 transition">
                      <td className="px-4 py-2">
                        <img
                          src={`${API_URL}/${student.image_path}?t=${new Date().getTime()}`}
                          alt={student.name}
                          className="w-14 h-14 object-cover rounded-lg border border-gray-200 shadow"
                        />
                      </td>
                      <td className="px-4 py-2 font-semibold text-gray-800 dark:text-white">{student.name}</td>
                      <td className="px-4 py-2 text-gray-700">{student.id}</td>
                      <td className="px-4 py-2 text-gray-700">{student.age}</td>
                      <td className="px-4 py-2 text-gray-700">{student.department}</td>
                      {isAuthenticated && (
                        <td className="px-4 py-2 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => setSelectedStudent(student)} title="Update Photo" className="p-2 rounded-full bg-blue-500/80 hover:bg-blue-600 text-white">
                              <FiCamera size={16} />
                            </button>
                            <button onClick={() => handleEditStudent(student)} title="Edit Details" className="p-2 rounded-full bg-yellow-500/80 hover:bg-yellow-600 text-white">
                              <FiEdit size={16} />
                            </button>
                            <button onClick={() => handleDeleteStudent(student.id)} title="Delete Student" className="p-2 rounded-full bg-red-500/80 hover:bg-red-600 text-white">
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* Update Photo Modal, Edit Modal, Notification (unchanged) */}
        {notification && (
          <Notification 
            type={notification.type}
            title={notification.title}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}
        {selectedStudent && (
          <UpdatePhotoModal 
            person={selectedStudent}
            personType="student"
            onClose={() => setSelectedStudent(null)}
            onPhotoUpdated={handlePhotoUpdated}
          />
        )}
        {/* Add Student Modal */}
        {showAddModal && isAuthenticated && (
          <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center fade-in">
            <div className="glass-card p-8 rounded-2xl shadow-xl w-full max-w-md m-4 relative slide-in-up">
              <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                <span style={{fontSize: 24, fontWeight: 'bold'}}>&times;</span>
              </button>
              <h2 className="text-2xl font-bold gradient-text mb-4">Add New Student</h2>
              <AddStudentForm onSuccess={() => { setShowAddModal(false); fetchStudents(); }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}