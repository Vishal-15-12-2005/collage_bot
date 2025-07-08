import React, { useState, useRef } from 'react';
import API from '../utils/api';
import { 
  FiUpload, FiUser, FiUsers, FiFile, FiX, FiCheckCircle, FiCamera, FiDatabase, FiArrowRightCircle 
} from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification from '../components/Notification';

export default function UploadImage() {
  const [name, setName] = useState('');
  const [ageOrRole, setAgeOrRole] = useState('');
  const [department, setDepartment] = useState('');
  const [type, setType] = useState('student');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [notification, setNotification] = useState(null);
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    if (selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setStep(2);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    } else {
      showNotification('error', 'Invalid file type', 'Please select an image file.');
    }
  };

  const showNotification = (type, title, message) => {
    setNotification({ type, title, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      showNotification('error', 'No file selected', 'Please select an image to upload.');
      return;
    }
    if (!name.trim() || !department.trim() || !ageOrRole.trim()) {
      showNotification('error', 'Missing information', 'Please fill in all required fields.');
      return;
    }
    setStep(3);
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('name', name);
    formData.append('department', department);
    formData.append('type', type);
    formData.append('age_or_role', ageOrRole);
    try {
      await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(true);
      showNotification('success', 'Upload successful!', 'The image has been uploaded successfully.');
      setTimeout(() => {
        setSuccess(false);
        resetForm();
        setStep(1);
      }, 2000);
    } catch (error) {
      console.error('Upload error:', error);
      showNotification('error', 'Upload failed', 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setAgeOrRole('');
    setDepartment('');
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setStep(1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const Stepper = () => (
    <div className="flex items-center justify-center gap-6 mb-8 w-full">
      <div className={`flex flex-col items-center ${step === 1 ? 'text-blue-600' : 'text-gray-400'}`}> <span className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-blue-400 bg-white font-bold">1</span> <span className="text-xs mt-1">Select Image</span> </div>
      <div className="h-1 w-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
      <div className={`flex flex-col items-center ${step === 2 ? 'text-blue-600' : 'text-gray-400'}`}> <span className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-blue-400 bg-white font-bold">2</span> <span className="text-xs mt-1">Fill Info</span> </div>
      <div className="h-1 w-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
      <div className={`flex flex-col items-center ${step === 3 ? 'text-blue-600' : 'text-gray-400'}`}> <span className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-blue-400 bg-white font-bold">3</span> <span className="text-xs mt-1">Upload</span> </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-indigo-100 py-6 px-1 fade-in">
      <div className="relative z-10 w-full max-w-2xl">
        <div className="glass-card p-6 md:p-8 rounded-2xl shadow-2xl flex flex-col gap-6 items-center">
          {/* Stepper at the top */}
          <Stepper />
          {/* Main Content */}
          {success ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
              <FiCheckCircle className="text-green-500 animate-bounce mb-4" size={56} />
              <h2 className="text-2xl font-bold text-green-700 mb-2">Upload Successful!</h2>
              <p className="text-base text-gray-700">The image has been uploaded to the database.</p>
            </div>
          ) : (
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {/* Upload Area - compact, centered, with icon */}
              <div className="flex flex-col items-center justify-center">
                <div
                  className={`relative w-32 h-32 flex flex-col items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-blue-400 shadow-xl border-4 border-white/60 mb-4 transition-all duration-300 ${dragActive ? 'ring-4 ring-purple-400' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {preview ? (
                    <>
                      <img src={preview} alt="Preview" className="w-28 h-28 object-cover rounded-full shadow-md" />
                      <button type="button" onClick={removeFile} className="absolute top-1 right-1 bg-white/80 hover:bg-red-100 text-red-500 rounded-full p-1 shadow transition" title="Remove">
                        <FiX size={18} />
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center w-full h-full group focus:outline-none">
                      <FiUpload className="text-4xl text-white group-hover:scale-110 transition-transform" />
                      <span className="text-xs text-white mt-2">Choose File</span>
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} className="hidden" />
                </div>
                <div className="text-xs text-gray-500 mt-2">JPG, PNG, or JPEG. Max 5MB.</div>
                {file && (
                  <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg w-full text-center">
                    <div className="flex items-center justify-center space-x-2 text-green-700 dark:text-green-300">
                      <FiCheckCircle />
                      <span className="text-xs font-medium truncate">{file.name}</span>
                    </div>
                  </div>
                )}
              </div>
              {/* Form */}
              <div className="flex flex-col justify-center w-full">
                <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-purple-700 via-blue-600 to-indigo-700 bg-clip-text text-transparent text-center">Information</h2>
                <form onSubmit={handleUpload} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Name *</label>
                    <input type="text" placeholder="Enter full name" required value={name} onChange={(e) => setName(e.target.value)} className="enhanced-input text-base" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Department *</label>
                    <input type="text" placeholder="Enter department" required value={department} onChange={(e) => setDepartment(e.target.value)} className="enhanced-input text-base" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Type *</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setType('student')} className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center space-x-2 text-base ${type === 'student' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'}`}><FiUser /><span>Student</span></button>
                      <button type="button" onClick={() => setType('staff')} className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center space-x-2 text-base ${type === 'staff' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'border-gray-300 dark:border-gray-600 hover:border-green-400'}`}><FiUsers /><span>Faculty</span></button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{type === 'student' ? 'Age' : 'Role'} *</label>
                    <input type="text" placeholder={type === 'student' ? 'Enter age' : 'Enter role'} required value={ageOrRole} onChange={(e) => setAgeOrRole(e.target.value)} className="enhanced-input text-base" />
                  </div>
                  <button type="submit" disabled={uploading || !file} className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-lg font-bold py-3 rounded-full mt-2">
                    {uploading ? (<><LoadingSpinner size="sm" text="" /><span className="ml-2">Uploading...</span></>) : (<><FiDatabase className="mr-2" />Upload</>)}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
        {/* Notification */}
        {notification && (
          <Notification type={notification.type} title={notification.title} message={notification.message} onClose={() => setNotification(null)} />
        )}
      </div>
    </div>
  );
}