import React from 'react';

const StatsCard = ({ 
  icon: Icon, 
  title, 
  value, 
  subtitle, 
  color = "from-blue-500 to-indigo-500",
  delay = 0,
  className = "" 
}) => {
  return (
    <div 
      className={`gradient-card p-6 text-center slide-in-up ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${color} mb-4 text-white text-2xl shadow-lg`}>
        <Icon />
      </div>
      <div className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
        {value}
      </div>
      <div className="text-gray-600 dark:text-gray-300 font-medium mb-1">
        {title}
      </div>
      {subtitle && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {subtitle}
        </div>
      )}
      
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
    </div>
  );
};

export default StatsCard; 