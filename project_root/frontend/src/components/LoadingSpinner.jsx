import React from 'react';
import { FiLoader } from 'react-icons/fi';

const LoadingSpinner = ({ size = 'md', text = 'Loading...', className = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        {/* Outer ring */}
        <div className={`${sizeClasses[size]} border-4 border-blue-200 dark:border-gray-600 rounded-full animate-spin`}></div>
        
        {/* Inner ring */}
        <div className={`${sizeClasses[size]} border-4 border-transparent border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin absolute inset-0`} 
             style={{ animationDuration: '1s' }}></div>
        
        {/* Center dot */}
        <div className={`${sizeClasses[size]} bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full absolute inset-2 flex items-center justify-center`}>
          <FiLoader className="text-white animate-pulse" size={size === 'xl' ? 24 : size === 'lg' ? 20 : size === 'md' ? 16 : 12} />
        </div>
      </div>
      
      {text && (
        <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner; 