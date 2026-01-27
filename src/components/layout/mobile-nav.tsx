// components/layout/mobile-nav.tsx
'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useAuth } from '@/components/providers/AuthProvider';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const navigation = {
  admin: [
    { name: 'Dashboard', href: '/admin/dashboard' },
    { name: 'Users', href: '/admin/users' },
    { name: 'Pilots', href: '/admin/pilots' },
    { name: 'Schools', href: '/admin/schools' },
    { name: 'Activities', href: '/admin/activities' },
    { name: 'Surveys', href: '/admin/surveys' },
    { name: 'Exports', href: '/admin/exports' },
    { name: 'Reports', href: '/admin/reports' },
  ],
  coordinator: [
    { name: 'Dashboard', href: '/coordinator/dashboard' },
    { name: 'Activities', href: '/coordinator/activities' },
    { name: 'Assign Activity', href: '/coordinator/assign' },
    { name: 'Approvals', href: '/coordinator/approvals' },
    { name: 'Volunteers', href: '/coordinator/volunteers' },
    { name: 'Schools', href: '/coordinator/schools' },
    { name: 'Surveys', href: '/coordinator/surveys' },
    { name: 'Exports', href: '/coordinator/exports' },
  ],
  volunteer: [
    { name: 'Dashboard', href: '/volunteer/dashboard' },
    { name: 'My Activities', href: '/volunteer/activities' },
    
    { name: 'Feedback', href: '/volunteer/surveys/volunteer' },
    //{ name: 'Photos', href: '/volunteer/photos' },
  ],
};

export default function MobileNav() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;

  if (!user) return null;

  const userNav = navigation[user.role as keyof typeof navigation] || [];

  return (
    <>
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 text-gray-700 bg-white rounded-md shadow"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                  <div className="flex h-16 shrink-0 items-center">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                    <div className="ml-3 flex items-center">
                      <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">E</span>
                      </div>
                      <span className="ml-3 text-xl font-bold text-gray-900">Evergreen</span>
                    </div>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {userNav.map((item) => {
                            // Add locale to href
                            const hrefWithLocale = `/${locale}${item.href}`;
                            const isActive = pathname === hrefWithLocale;
                            return (
                              <li key={item.name}>
                                <Link
                                  href={hrefWithLocale}
                                  className={`
                                    group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold
                                    ${isActive
                                      ? 'bg-green-50 text-green-600'
                                      : 'text-gray-700 hover:text-green-600 hover:bg-gray-50'
                                    }
                                  `}
                                  onClick={() => setSidebarOpen(false)}
                                >
                                  {item.name}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </li>
                      <li className="mt-auto">
                        <div className="p-2 border-t border-gray-200">
                          <div className="flex items-center gap-x-3 mb-4">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                              <span className="text-green-600 font-semibold text-sm">
                                {user.full_name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.full_name}
                              </p>
                              <p className="text-xs text-gray-500 truncate capitalize">
                                {user.role}
                              </p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => {
                              logout();
                              setSidebarOpen(false);
                            }}
                            className="w-full flex items-center gap-x-3 rounded-md p-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-red-600"
                          >
                            Sign out
                          </button>
                        </div>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}