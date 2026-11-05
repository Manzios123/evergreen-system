// components/ui/stats-card.tsx
import {
    CalendarDaysIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentTextIcon,
  } from '@heroicons/react/24/outline';
  
  interface StatsCardProps {
    title: string;
    value: number | string;
    icon: 'activity' | 'pending' | 'calendar' | 'check' | 'document';
    trend?: 'up' | 'down' | 'none';
    color: 'green' | 'blue' | 'yellow' | 'red' | 'purple';
    description?: string;
  }
  
  const iconMap = {
    activity: DocumentTextIcon,
    pending: ClockIcon,
    calendar: CalendarDaysIcon,
    check: CheckCircleIcon,
    document: DocumentTextIcon,
  };
  
  const colorClasses = {
    green: {
      bg: 'bg-green-600',
      text: 'text-green-600',
      lightBg: 'bg-green-50 dark:bg-green-950',
    },
    blue: {
      bg: 'bg-blue-600',
      text: 'text-blue-600',
      lightBg: 'bg-blue-50 dark:bg-blue-950',
    },
    yellow: {
      bg: 'bg-yellow-700',
      text: 'text-yellow-600',
      lightBg: 'bg-yellow-50 dark:bg-yellow-950',
    },
    red: {
      bg: 'bg-red-600',
      text: 'text-red-600',
      lightBg: 'bg-red-50 dark:bg-red-950',
    },
    purple: {
      bg: 'bg-purple-600',
      text: 'text-purple-600',
      lightBg: 'bg-purple-50 dark:bg-purple-950',
    },
  };
  
  export default function StatsCard({
    title,
    value,
    icon,
    trend = 'none',
    color,
    description,
  }: StatsCardProps) {
    const Icon = iconMap[icon];
    const colors = colorClasses[color];
  
    return (
      <div className={`min-w-0 overflow-hidden rounded-xl border border-black/5 dark:border-white/10 ${colors.lightBg} px-4 py-5 sm:p-6`}>
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md ${colors.bg} p-3`}>
            <Icon className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="break-words text-sm font-medium text-gray-600 dark:text-gray-300">{title}</dt>
              <dd>
                <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
        {description && (
          <div className="mt-4">
            <div className="text-sm text-gray-600 dark:text-gray-300">{description}</div>
          </div>
        )}
        {trend !== 'none' && (
          <div className="mt-4">
            <div className={`flex items-center text-sm font-medium ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? (
                <svg className="mr-1.5 h-5 w-5 shrink-0 self-center text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="mr-1.5 h-5 w-5 flex-shrink-0 self-center text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
                </svg>
              )}
              {trend === 'up' ? 'Increase' : 'Decrease'}
            </div>
          </div>
        )}
      </div>
    );
  }