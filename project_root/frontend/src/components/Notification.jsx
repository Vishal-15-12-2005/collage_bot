import React, { useEffect, useState } from 'react';
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiInfo, FiX } from 'react-icons/fi';

const Notification = ({ 
  type = 'info', 
  title, 
  message, 
  duration = 5000, 
  onClose, 
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const types = {
    success: {
      icon: FiCheckCircle,
      bgColor: 'bg-green-500',
      textColor: 'text-green-500',
      borderColor: 'border-green-200',
      bgLight: 'bg-green-50',
      iconColor: 'text-green-500'
    },
    error: {
      icon: FiXCircle,
      bgColor: 'bg-red-500',
      textColor: 'text-red-500',
      borderColor: 'border-red-200',
      bgLight: 'bg-red-50',
      iconColor: 'text-red-500'
    },
    warning: {
      icon: FiAlertTriangle,
      bgColor: 'bg-yellow-500',
      textColor: 'text-yellow-500',
      borderColor: 'border-yellow-200',
      bgLight: 'bg-yellow-50',
      iconColor: 'text-yellow-500'
    },
    info: {
      icon: FiInfo,
      bgColor: 'bg-blue-500',
      textColor: 'text-blue-500',
      borderColor: 'border-blue-200',
      bgLight: 'bg-blue-50',
      iconColor: 'text-blue-500'
    }
  };

  const currentType = types[type];
  const Icon = currentType.icon;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose && onClose();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full ${className}`}>
      <div className={`
        glass-card border-l-4 ${currentType.borderColor} p-4 shadow-2xl
        transform transition-all duration-300 ease-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
        slide-in-right
      `}>
        <div className="flex items-start space-x-3">
          <div className={`flex-shrink-0 ${currentType.iconColor}`}>
            <Icon size={20} />
          </div>
          
          <div className="flex-1 min-w-0">
            {title && (
              <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1">
                {title}
              </p>
            )}
            {message && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {message}
              </p>
            )}
          </div>
          
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200"
          >
            <FiX size={16} />
          </button>
        </div>
        
        {/* Progress bar */}
        {duration > 0 && (
          <div className="mt-3 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full ${currentType.bgColor} transition-all duration-300 ease-linear`}
              style={{ 
                width: isExiting ? '0%' : '100%',
                transitionDuration: `${duration}ms`
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Notification; 