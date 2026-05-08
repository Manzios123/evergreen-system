// components/layout/Header.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { BellIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Bars3Icon } from '@heroicons/react/24/solid';

// Days and months for display
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!now) return null;

  const day = DAYS[now.getDay()];
  const date = now.getDate();
  const month = MONTHS[now.getMonth()];
  const year = now.getFullYear();

  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const display12 = (hours % 12 || 12).toString().padStart(2, '0');

  return (
    <div className="hidden lg:flex items-center gap-3 select-none">
      {/* Date pill */}
      <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5">
        <span className="text-xs font-medium text-gray-500">{day},</span>
        <span className="text-xs font-semibold text-gray-800">{date} {month} {year}</span>
      </div>

      {/* Time display */}
      <div className="flex items-center gap-1 bg-green-50 border border-green-100 rounded-full px-3 py-1.5">
        {/* Hours */}
        <span className="text-sm font-bold text-green-700 tabular-nums w-5 text-center">
          {display12}
        </span>
        {/* Blinking colon */}
        <BlinkingColon />
        {/* Minutes */}
        <span className="text-sm font-bold text-green-700 tabular-nums w-5 text-center">
          {minutes}
        </span>
        <BlinkingColon />
        {/* Seconds */}
        <span className="text-sm font-bold text-green-600 tabular-nums w-5 text-center">
          {seconds}
        </span>
        {/* AM/PM */}
        <span className="text-[10px] font-bold text-green-500 ml-1 leading-none">
          {ampm}
        </span>
      </div>
    </div>
  );
}

function BlinkingColon() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setVisible(v => !v), 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={`text-sm font-bold text-green-600 transition-opacity duration-100 ${visible ? 'opacity-100' : 'opacity-20'}`}>
      :
    </span>
  );
}

function getDisplayName(user: any) {
  return user?.full_name || user?.name || user?.email || user?.phone || 'User';
}

function getInitials(user: any) {
  const displayName = getDisplayName(user);
  const nameParts = (user?.full_name || user?.name || '').trim().split(/\s+/).filter(Boolean);

  if (nameParts.length > 0) {
    return nameParts.map((part: string) => part[0]).slice(0, 2).join('').toUpperCase();
  }

  return displayName.charAt(0).toUpperCase();
}

function UserAvatar({ user }: { user: any }) {
  if (user?.profile_picture) {
    return (
      <div className="h-8 w-8 rounded-full overflow-hidden ring-2 ring-green-200">
        <Image
          src={user.profile_picture}
          alt={user.full_name || 'Profile'}
          width={32}
          height={32}
          className="object-cover w-full h-full"
        />
      </div>
    );
  }

  const initials = getInitials(user);

  const colors: Record<string, string> = {
    admin: 'bg-rose-100 text-rose-700',
    coordinator: 'bg-blue-100 text-blue-700',
    volunteer: 'bg-green-100 text-green-700',
    facilitator: 'bg-emerald-100 text-emerald-700',
  };
  const colorClass = colors[user?.role] || colors.volunteer;

  return (
    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ring-2 ring-offset-1 ring-green-200 ${colorClass}`}>
      {initials}
    </div>
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const role = user?.role || 'volunteer';
  const profileHref = `/${locale}/${role}/profile`;
  const dashboardHref = role === 'facilitator'
    ? `/${locale}/volunteer/dashboard`
    : `/${locale}/${role}/dashboard`;
  const displayName = getDisplayName(user);

  return (
    <header className="sticky top-0 z-40 flex items-center gap-x-4 bg-white/95 backdrop-blur-sm px-4 py-3 border-b border-gray-100 shadow-sm sm:px-6">
      {/* Mobile menu button */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Search */}
      <div className="flex-1 min-w-0">
        <div className="relative max-w-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="search"
            name="search"
            className="block w-full rounded-full border-0 bg-gray-50 py-1.5 pl-9 pr-3 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-green-500 text-sm"
            placeholder="Search..."
          />
        </div>
      </div>

      {/* Right side: clock + bell + avatar */}
      <div className="flex items-center gap-x-3">
        {/* Live clock */}
        <LiveClock />

        {/* Notifications */}
        <button
          type="button"
          className="relative rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
        >
          <span className="sr-only">View notifications</span>
          <BellIcon className="h-5 w-5" aria-hidden="true" />
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
        </button>

        {/* User avatar + name */}
        <div className="relative hidden lg:block">
          <button
            type="button"
            onClick={() => setProfileMenuOpen((open) => !open)}
            className="flex items-center gap-x-2.5 rounded-full pl-1 pr-3 py-1 hover:bg-gray-50 transition-colors group"
          >
            <UserAvatar user={user} />
            <div className="min-w-0 text-left">
              <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                {displayName}
              </p>
              <p className="text-xs text-gray-400 capitalize truncate leading-tight">
                {role}
              </p>
            </div>
            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-md bg-white py-2 shadow-lg ring-1 ring-black/5 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || role}</p>
              </div>
              <Link
                href={profileHref}
                onClick={() => setProfileMenuOpen(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Profile
              </Link>
              <Link
                href={dashboardHref}
                onClick={() => setProfileMenuOpen(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  logout();
                }}
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
