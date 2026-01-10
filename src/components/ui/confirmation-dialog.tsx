// components/ui/confirmation-dialog.tsx
'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from './button';

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
  loading?: boolean;
}

export default function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  loading = false,
}: ConfirmationDialogProps) {
  const typeConfig = {
    warning: {
      icon: ExclamationTriangleIcon,
      iconColor: 'text-yellow-400',
      confirmColor: 'bg-yellow-600 hover:bg-yellow-700',
    },
    danger: {
      icon: ExclamationTriangleIcon,
      iconColor: 'text-red-400',
      confirmColor: 'bg-red-600 hover:bg-red-700',
    },
    info: {
      icon: ExclamationTriangleIcon,
      iconColor: 'text-blue-400',
      confirmColor: 'bg-blue-600 hover:bg-blue-700',
    },
  };

  const { icon: Icon, iconColor, confirmColor } = typeConfig[type];

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconColor.replace('text-', 'bg-').replace('-400', '-100')} sm:mx-0 sm:h-10 sm:w-10`}>
                    <Icon className={`h-6 w-6 ${iconColor}`} aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      {title}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">{message}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <Button
                    onClick={onConfirm}
                    loading={loading}
                    className={`${confirmColor} sm:ml-3 sm:w-auto`}
                  >
                    {confirmText}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                    className="mt-3 sm:mt-0 sm:w-auto"
                  >
                    {cancelText}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}