// components/layout/Header.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/providers/AuthProvider';
import { BellIcon, ChevronDownIcon, MagnifyingGlassIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { Bars3Icon } from '@heroicons/react/24/solid';
import { notificationsApi, NotificationItem } from '@/lib/api/notifications';

// Days and months for display
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SUPPORTED_LOCALES = ['en', 'fr', 'rw'];

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

function LanguageSwitcher() {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations('common');
  const currentLocale = (params?.locale as string) || 'en';

  const switchLanguage = (nextLocale: string) => {
    const segments = (pathname || '/').split('/');
    if (SUPPORTED_LOCALES.includes(segments[1])) {
      segments[1] = nextLocale;
    } else {
      segments.splice(1, 0, nextLocale);
    }

    const queryString = searchParams.toString();
    router.push(`${segments.join('/') || `/${nextLocale}`}${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <label className="block px-4 py-2 text-sm text-gray-700">
      <span className="mb-1 block text-xs font-medium text-gray-500">{t('language')}</span>
      <select
        value={currentLocale}
        onChange={(event) => switchLanguage(event.target.value)}
        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
      >
        <option value="en">{t('english')}</option>
        <option value="fr">{t('french')}</option>
        <option value="rw">{t('kinyarwanda')}</option>
      </select>
    </label>
  );
}

interface HeaderProps {
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export default function Header({ theme = 'light', onToggleTheme }: HeaderProps) {
  const { user, logout } = useAuth();
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const tLayout = useTranslations('layout');
  const role = user?.role || 'volunteer';
  const profileHref = `/${locale}/${role}/profile`;
  const dashboardHref = `/${locale}/${role === 'facilitator' ? 'volunteer' : role}/dashboard`;
  const displayName = getDisplayName(user);

  const loadUnreadCount = async () => {
    if (!user?.id) return;
    try {
      const response = await notificationsApi.unreadCount();
      setUnreadCount(response.count || 0);
    } catch {
      setUnreadCount(0);
    }
  };

  const loadNotifications = async () => {
    if (!user?.id) return;
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const response = await notificationsApi.list(10);
      setNotifications(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      setNotificationsError(error?.message || 'Unable to load notifications');
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    loadUnreadCount();
    const interval = window.setInterval(loadUnreadCount, 45000);
    return () => window.clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    if (notificationsOpen) {
      loadNotifications();
    }
  }, [notificationsOpen]);

  const notificationHref = (notification: NotificationItem) => {
    const uiRole = role === 'facilitator' ? 'volunteer' : role;
    if (notification.entity_type === 'activity' && notification.entity_id) {
      return `/${locale}/${uiRole}/activities/${notification.entity_id}`;
    }
    if (notification.entity_type === 'survey_assignment' && notification.entity_id) {
      if (role === 'admin' || role === 'coordinator') {
        return `/${locale}/${role}/surveys/assignments/${notification.entity_id}`;
      }
      return `/${locale}/volunteer/surveys/volunteer`;
    }
    return dashboardHref;
  };

  const markNotificationRead = async (notification: NotificationItem) => {
    if (!notification.read_at) {
      try {
        await notificationsApi.markRead(notification.id);
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item
          )
        );
        setUnreadCount((count) => Math.max(count - 1, 0));
      } catch {
        // Keep navigation responsive even if the read update fails.
      }
    }
    setNotificationsOpen(false);
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      const now = new Date().toISOString();
      setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at || now })));
      setUnreadCount(0);
    } catch (error: any) {
      setNotificationsError(error?.message || 'Unable to mark notifications read');
    }
  };

  return (
    <header className="sticky top-0 z-40 flex items-center gap-x-4 bg-white/95 backdrop-blur-sm px-4 py-3 border-b border-gray-100 shadow-sm sm:px-6 dark:border-slate-800 dark:bg-slate-950/90">
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
            className="block w-full rounded-full border-0 bg-gray-50 py-1.5 pl-9 pr-3 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-green-500 text-sm dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700 dark:placeholder:text-slate-500"
            placeholder="Search..."
          />
        </div>
      </div>

      {/* Right side: clock + bell + avatar */}
      <div className="flex items-center gap-x-3">
        {/* Live clock */}
        <LiveClock />

        <button
          type="button"
          onClick={onToggleTheme}
          className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 dark:hover:bg-slate-900 dark:hover:text-slate-200"
          title={theme === 'dark' ? 'Use light theme' : 'Use dark theme'}
        >
          <span className="sr-only">{theme === 'dark' ? 'Use light theme' : 'Use dark theme'}</span>
          {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen((open) => !open);
              setProfileMenuOpen(false);
            }}
            className="relative rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-5 w-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black/5">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">{tLayout('notifications')}</h2>
                  <p className="text-xs text-gray-500">{unreadCount} {tLayout('unread')}</p>
                </div>
                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={unreadCount === 0}
                  className="text-xs font-medium text-green-700 hover:text-green-800 disabled:text-gray-400"
                >
                  {tLayout('markAllRead')}
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notificationsLoading && (
                  <div className="space-y-3 p-4">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="animate-pulse space-y-2">
                        <div className="h-4 w-3/4 rounded bg-gray-100" />
                        <div className="h-3 w-full rounded bg-gray-100" />
                      </div>
                    ))}
                  </div>
                )}

                {!notificationsLoading && notificationsError && (
                  <div className="p-4 text-sm text-red-700">{notificationsError}</div>
                )}

                {!notificationsLoading && !notificationsError && notifications.length === 0 && (
                  <div className="p-6 text-center text-sm text-gray-500">{tLayout('noNotifications')}</div>
                )}

                {!notificationsLoading && !notificationsError && notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    href={notificationHref(notification)}
                    onClick={() => markNotificationRead(notification)}
                    className={`block border-b border-gray-100 px-4 py-3 last:border-b-0 hover:bg-gray-50 ${
                      notification.read_at ? 'bg-white' : 'bg-green-50/70'
                    }`}
                  >
                    <div className="flex gap-3">
                      {!notification.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-green-600" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{notification.title}</p>
                        <p className="mt-1 max-h-8 overflow-hidden text-xs text-gray-600">{notification.message}</p>
                        <p className="mt-1 text-[11px] text-gray-400">
                          {notification.created_at ? new Date(notification.created_at).toLocaleString() : ''}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User avatar + name */}
        <div className="relative hidden lg:block">
          <button
            type="button"
            onClick={() => {
              setProfileMenuOpen((open) => !open);
              setNotificationsOpen(false);
            }}
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
                {tLayout('profile')}
              </Link>
              <Link
                href={dashboardHref}
                onClick={() => setProfileMenuOpen(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                {tLayout('dashboard')}
              </Link>
              <LanguageSwitcher />
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  logout();
                }}
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                {tLayout('logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
