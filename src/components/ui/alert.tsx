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
      bg: 'bg-green-50',
      text: 'text-green-800',
      iconColor: 'text-green-400',
    },
    error: {
      icon: XCircleIcon,
      bg: 'bg-red-50',
      text: 'text-red-800',
      iconColor: 'text-red-400',
    },
    warning: {
      icon: ExclamationTriangleIcon,
      bg: 'bg-yellow-50',
      text: 'text-yellow-800',
      iconColor: 'text-yellow-400',
    },
    info: {
      icon: InformationCircleIcon,
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      iconColor: 'text-blue-400',
    },
  };

  const { icon: Icon, bg, text, iconColor } = config[type];

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
                className={`inline-flex rounded-md ${bg} p-1.5 ${text} hover:${bg.replace('50', '100')} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-${bg.replace('bg-', '').replace('-50', '')} focus:ring-${iconColor.replace('text-', '')}`}
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