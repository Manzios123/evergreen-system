// components/layout/Header.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/providers/AuthProvider';
import { BellIcon, ChevronDownIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { Bars3Icon } from '@heroicons/react/24/solid';
import { notificationsApi, NotificationItem } from '@/lib/api/notifications';

// Days and months for display
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SUPPORTED_LOCALES = ['en', 'fr', 'rw'];

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1280px)');
    let interval: ReturnType<typeof setInterval> | undefined;
    const update = () => {
      if (interval) clearInterval(interval);
      interval = undefined;
      if (desktop.matches) {
        setNow(new Date());
        interval = setInterval(() => setNow(new Date()), 1000);
      }
    };
    update();
    desktop.addEventListener('change', update);
    return () => { if (interval) clearInterval(interval); desktop.removeEventListener('change', update); };
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
    <div className="hidden xl:flex items-center gap-3 select-none">
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
  return (
    <span className="text-sm font-bold text-green-600">
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
  onOpenMobileNav?: () => void;
}

export default function Header({ theme = 'light', onToggleTheme, onOpenMobileNav }: HeaderProps) {
  const { user, logout } = useAuth();
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!notificationsOpen && !profileMenuOpen) return;
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!notificationsRef.current?.contains(target)) setNotificationsOpen(false);
      if (!profileRef.current?.contains(target)) setProfileMenuOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      (notificationsOpen ? notificationsRef : profileRef).current?.querySelector('button')?.focus();
      setNotificationsOpen(false); setProfileMenuOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [notificationsOpen, profileMenuOpen]);

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
    <header className="sticky top-0 z-40 flex min-h-16 items-center gap-x-2 border-b border-border bg-card px-3 py-2 text-card-foreground shadow-sm sm:gap-x-4 sm:px-6">
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={onOpenMobileNav}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 lg:hidden"
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      <div className="min-w-0 flex-1"><span className="font-semibold lg:hidden">Evergreen</span></div>

      {/* Right side: clock + bell + avatar */}
      <div className="flex shrink-0 items-center gap-x-1 sm:gap-x-3">
        {/* Live clock */}
        <LiveClock />

        <button
          type="button"
          onClick={onToggleTheme}
          className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-green-500"
          title={theme === 'dark' ? 'Use light theme' : 'Use dark theme'}
        >
          <span className="sr-only">{theme === 'dark' ? 'Use light theme' : 'Use dark theme'}</span>
          {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen((open) => !open);
              setProfileMenuOpen(false);
            }}
            aria-expanded={notificationsOpen}
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-green-500"
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
            <div className="fixed inset-x-3 top-16 z-50 overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-lg sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80">
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

              <div className="max-h-[min(24rem,calc(100dvh-9rem))] overflow-y-auto">
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
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setProfileMenuOpen((open) => !open);
              setNotificationsOpen(false);
            }}
            aria-label={displayName}
            aria-expanded={profileMenuOpen}
            className="group flex min-h-11 min-w-11 items-center justify-center gap-x-2.5 rounded-full p-1 hover:bg-accent lg:pr-3"
          >
            <UserAvatar user={user} />
            <div className="hidden min-w-0 text-left lg:block">
              <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                {displayName}
              </p>
              <p className="text-xs text-gray-400 capitalize truncate leading-tight">
                {role}
              </p>
            </div>
            <ChevronDownIcon className="hidden h-4 w-4 text-gray-400 lg:block" />
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
