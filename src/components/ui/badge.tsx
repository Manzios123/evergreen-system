// components/ui/badge.tsx
import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Badge({ children, variant = 'default', className = '', size = 'md' }: BadgeProps) {
  const baseStyles = 'inline-flex items-center rounded-full font-medium';
  
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const variantStyles = {
    default: 'bg-gray-100 text-gray-800 border border-gray-200',
    secondary: 'bg-gray-200 text-gray-800 border border-gray-300',
    outline: 'bg-transparent text-gray-700 border border-gray-300',
    destructive: 'bg-red-100 text-red-800 border border-red-200',
    success: 'bg-green-100 text-green-800 border border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}

export default Badge;