// components/ui/alert.tsx
import { ReactNode } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface AlertProps {
  title?: string;
  children: ReactNode;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose?: () => void;
}

export default function Alert({ title, children, type = 'info', onClose }: AlertProps) {
  const config = {
    success: {
      icon: CheckCircleIcon,
      bg: 'bg-green-50 dark:bg-green-950',
      interaction: 'hover:bg-green-100 dark:hover:bg-green-900 focus-visible:ring-green-500',
      text: 'text-green-800 dark:text-green-200',
      iconColor: 'text-green-400',
    },
    error: {
      icon: XCircleIcon,
      bg: 'bg-red-50 dark:bg-red-950',
      interaction: 'hover:bg-red-100 dark:hover:bg-red-900 focus-visible:ring-red-500',
      text: 'text-red-800 dark:text-red-200',
      iconColor: 'text-red-400',
    },
    warning: {
      icon: ExclamationTriangleIcon,
      bg: 'bg-yellow-50 dark:bg-yellow-950',
      interaction: 'hover:bg-yellow-100 dark:hover:bg-yellow-900 focus-visible:ring-yellow-500',
      text: 'text-yellow-800 dark:text-yellow-200',
      iconColor: 'text-yellow-400',
    },
    info: {
      icon: InformationCircleIcon,
      bg: 'bg-blue-50 dark:bg-blue-950',
      interaction: 'hover:bg-blue-100 dark:hover:bg-blue-900 focus-visible:ring-blue-500',
      text: 'text-blue-800 dark:text-blue-200',
      iconColor: 'text-blue-400',
    },
  };

  const { icon: Icon, bg, text, iconColor, interaction } = config[type];

  return (
    <div className={`rounded-md p-4 ${bg}`}>
      <div className="flex">
        <div className="shrink-0">
          <Icon className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          {title && <h3 className={`text-sm font-medium ${text}`}>{title}</h3>}
          <div className={`mt-2 text-sm ${text}`}>{children}</div>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                className={`inline-flex rounded-md ${bg} p-1.5 ${text} ${interaction} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background`}
                onClick={onClose}
              >
                <span className="sr-only">Dismiss</span>
                <XCircleIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}