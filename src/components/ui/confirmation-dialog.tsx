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
      confirmColor: 'bg-yellow-700 hover:bg-yellow-800',
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
          <div className="fixed inset-0 bg-black/60 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-3 text-left sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-lg transform overflow-y-auto rounded-xl border border-border bg-card p-4 text-left text-card-foreground shadow-xl transition-all sm:p-6">
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconColor.replace('text-', 'bg-').replace('-400', '-100')}`}>
                    <Icon className={`h-6 w-6 ${iconColor}`} aria-hidden="true" />
                  </div>
                  <div className="min-w-0 text-left">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      {title}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">{message}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex flex-col gap-2 sm:mt-4 sm:flex-row-reverse">
                  <Button
                    onClick={onConfirm}
                    loading={loading}
                    className={`${confirmColor} w-full sm:w-auto`}
                  >
                    {confirmText}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                    className="w-full sm:w-auto"
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
