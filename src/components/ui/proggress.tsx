'use client';

import * as React from 'react';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  showValue?: boolean;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  className = '',
  showValue = false,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`relative ${className}`}>
      <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
        <div
          style={{ width: `${percentage}%` }}
          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 transition-all duration-300"
        />
      </div>
      {showValue && (
        <div className="text-right mt-1">
          <span className="text-xs font-medium text-gray-700">{percentage.toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
};

// Circular Progress Variant
interface CircularProgressProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  strokeWidth?: number;
  showValue?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 'md',
  strokeWidth = 2,
  showValue = true,
}) => {
  const percentage = Math.min(Math.max(value, 0), 100);
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        className={`transform -rotate-90 ${sizeClasses[size]}`}
        viewBox="0 0 36 36"
      >
        {/* Background circle */}
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="#22c55e"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-medium text-gray-700 ${textSizes[size]}`}>
            {percentage.toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
};