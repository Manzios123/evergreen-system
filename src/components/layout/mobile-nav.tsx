// components/layout/mobile-nav.tsx
'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, Bars3Icon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useAuth } from '@/components/providers/AuthProvider';
import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';

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
  ],
  facilitator: [
    { name: 'Dashboard', href: '/volunteer/dashboard' },
    { name: 'My Activities', href: '/volunteer/activities' },
    { name: 'Feedback', href: '/volunteer/surveys/volunteer' },
  ],
};

function UserAvatar({ user }: { user: any }) {
  if (user?.profile_picture) {
    return (
      <div className="h-9 w-9 rounded-full overflow-hidden ring-2 ring-green-200 shrink-0">
        <Image
          src={user.profile_picture}
          alt={user.full_name || 'Profile'}
          width={36}
          height={36}
          className="object-cover w-full h-full"
        />
      </div>
    );
  }

  const displayName = user?.full_name || user?.name || user?.email || user?.phone || 'User';
  const initials = (user?.full_name || user?.name || displayName)
    .split(/\s+/)
    .filter(Boolean)
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  const colors: Record<string, string> = {
    admin: 'bg-rose-100 text-rose-700',
    coordinator: 'bg-blue-100 text-blue-700',
    volunteer: 'bg-green-100 text-green-700',
    facilitator: 'bg-emerald-100 text-emerald-700',
  };
  const colorClass = colors[user?.role] || colors.volunteer;

  return (
    <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm ring-2 ring-green-200 shrink-0 ${colorClass}`}>
      {initials}
    </div>
  );
}

export default function MobileNav() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;

  if (!user) return null;

  const userNav = navigation[user.role as keyof typeof navigation] || [];
  const profileHref = `/${locale}/${user.role}/profile`;
  const displayName = user.full_name || user.name || user.email || user.phone || 'User';
  const secondaryText = user.email || user.phone || 'Profile & settings';

  return (
    <>
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-50 p-2 text-gray-700 bg-white rounded-lg shadow-md border border-gray-100"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-5 w-5" aria-hidden="true" />
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
            <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm" />
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
                <div className="flex grow flex-col gap-y-4 overflow-y-auto bg-white px-5 pb-4">
                  {/* Header with logo and close */}
                  <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="relative h-8 w-8 shrink-0">
                        <Image
                          src="/evergreen.png"
                          alt="Evergreen"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <span className="text-lg font-bold tracking-tight text-gray-900">Evergreen</span>
                    </div>
                    <button
                      type="button"
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Role badge */}
                  <div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize
                      ${user.role === 'admin' ? 'bg-rose-50 text-rose-700' :
                        user.role === 'coordinator' ? 'bg-blue-50 text-blue-700' :
                        'bg-green-50 text-green-700'}`}>
                      {user.role}
                    </span>
                  </div>

                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-1">
                      {userNav.map((item) => {
                        const hrefWithLocale = `/${locale}${item.href}`;
                        const isActive = pathname === hrefWithLocale || pathname.startsWith(hrefWithLocale + '/');
                        return (
                          <li key={item.name}>
                            <Link
                              href={hrefWithLocale}
                              className={`flex gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all
                                ${isActive
                                  ? 'bg-green-50 text-green-700'
                                  : 'text-gray-600 hover:text-green-700 hover:bg-gray-50'
                                }`}
                              onClick={() => setSidebarOpen(false)}
                            >
                              {item.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>

                    {/* Bottom: profile + logout */}
                    <div className="mt-auto pt-4 border-t border-gray-100 space-y-1">
                      <Link
                        href={profileHref}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-gray-50 transition-all"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <UserAvatar user={user} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                          <p className="text-xs text-gray-400 truncate">{secondaryText}</p>
                        </div>
                      </Link>

                      <button
                        onClick={() => { logout(); setSidebarOpen(false); }}
                        className="w-full flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
                      >
                        Sign out
                      </button>
                    </div>
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
