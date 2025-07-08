import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiUser, FiBriefcase, FiHash, FiCheckCircle, FiAlertCircle, FiLoader, FiUserPlus } from 'react-icons/fi';

import API from '../utils/api';
const API_URL = API.defaults.baseURL.replace('/api', '');

const Enroll = () => {
  const { filename } = useParams();
  const navigate = useNavigate();

  const [personType, setPersonType] = useState('student');
  const [name, setName] = useState('');
  const [ageOrRole, setAgeOrRole] = useState('');
  const [department, setDepartment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !ageOrRole || !department) {
      setError("All fields are required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('type', personType);
    formData.append('name', name);
    formData.append(personType === 'student' ? 'age' : 'role', ageOrRole);
    formData.append('department', department);

    try {
      await API.post(`/enroll/${filename}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('Enrollment successful! Redirecting...');
      setTimeout(() => {
        navigate(personType === 'student' ? '/' : '/staff');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong during enrollment.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const FormInput = ({ icon, id, placeholder, value, onChange, type = 'text' }) => (
    <div className="relative">
      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">{icon}</span>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        required
      />
    </div>
  );

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Enroll New Person</h2>
      
      <div className="card p-8 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Side: Image Preview */}
          <div className="flex flex-col items-center justify-center">
             <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Person to Enroll</h3>
             <img 
                src={`${API_URL}/unknown_faces/${filename}`} 
                alt="Person to enroll" 
                className="rounded-lg shadow-xl w-full max-w-sm"
                onError={(e) => setError("Could not load the image for this person.")}
              />
          </div>

          {/* Right Side: Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Enter Details</h3>
            
            <div className="flex space-x-4">
              <button type="button" onClick={() => setPersonType('student')} className={`flex-1 py-2 rounded-lg transition ${personType === 'student' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 dark:bg-gray-700'}`}>Student</button>
              <button type="button" onClick={() => setPersonType('staff')} className={`flex-1 py-2 rounded-lg transition ${personType === 'staff' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 dark:bg-gray-700'}`}>Staff</button>
            </div>

            <FormInput icon={<FiUser />} id="name" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
            <FormInput icon={<FiBriefcase />} id="department" placeholder="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />

            {personType === 'student' ? (
              <FormInput icon={<FiHash />} id="age" placeholder="Age" type="number" value={ageOrRole} onChange={(e) => setAgeOrRole(e.target.value)} />
            ) : (
              <FormInput icon={<FiBriefcase />} id="role" placeholder="Role" value={ageOrRole} onChange={(e) => setAgeOrRole(e.target.value)} />
            )}
            
            {error && <div className="flex items-center p-3 text-sm text-red-800 bg-red-100 dark:text-red-300 dark:bg-red-900 rounded-lg"><FiAlertCircle className="mr-2" />{error}</div>}
            {success && <div className="flex items-center p-3 text-sm text-green-800 bg-green-100 dark:text-green-300 dark:bg-green-900 rounded-lg"><FiCheckCircle className="mr-2" />{success}</div>}

            <button type="submit" disabled={isSubmitting || success} className="w-full btn-primary py-3 flex items-center justify-center disabled:opacity-50">
              {isSubmitting ? <FiLoader className="animate-spin mr-2" /> : <FiUserPlus className="mr-2" />}
              {isSubmitting ? 'Enrolling...' : 'Complete Enrollment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Enroll;
