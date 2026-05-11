// components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  HomeIcon,
  CalendarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  PlusCircleIcon,
  ChatBubbleLeftIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ArrowDownTrayIcon,
  UsersIcon,
  BuildingLibraryIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { useApiQuery } from '@/lib/hooks/use-api';
import { api } from '@/lib/api';
import { useTranslations } from 'next-intl';

interface SidebarProps {
  role: 'admin' | 'coordinator' | 'volunteer' | 'facilitator';
}

interface NavigationItem {
  name: string;
  labelKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: 'pending' | 'count';
}

// Avatar component — shows profile picture or initials
function UserAvatar({ user, size = 'md' }: { user: any; size?: 'sm' | 'md' }) {
  const sizeClasses = size === 'sm'
    ? 'h-7 w-7 text-xs'
    : 'h-10 w-10 text-sm';

  if (user?.profile_picture) {
    return (
      <div className={`${sizeClasses} rounded-full overflow-hidden ring-2 ring-green-200 shrink-0`}>
        <Image
          src={user.profile_picture}
          alt={user.full_name || 'Profile'}
          width={40}
          height={40}
          className="object-cover w-full h-full"
        />
      </div>
    );
  }

  // Initials fallback
  const displayName = user?.full_name || user?.name || user?.email || user?.phone || 'User';
  const initialsSource = user?.full_name || user?.name || displayName;
  const initials = initialsSource
    .split(/\s+/)
    .filter(Boolean)
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  const colors: Record<string, string> = {
    admin: 'bg-rose-100 text-rose-700 ring-rose-200',
    coordinator: 'bg-blue-100 text-blue-700 ring-blue-200',
    volunteer: 'bg-green-100 text-green-700 ring-green-200',
    facilitator: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  };
  const colorClass = colors[user?.role] || colors.volunteer;

  return (
    <div className={`${sizeClasses} rounded-full flex items-center justify-center ring-2 font-bold shrink-0 ${colorClass}`}>
      {initials}
    </div>
  );
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const { logout, user } = useAuth();
  const tNav = useTranslations('navigation');
  const tLayout = useTranslations('layout');

  const { data: pendingData } = useApiQuery<{
    pendingActivities: number;
    pendingPhotos: number;
    pendingSurveys: number;
  }>(['sidebar', 'pending-counts'], () =>
    api.get('/approvals/pending-counts'), {
    enabled: role === 'coordinator' || role === 'admin',
  });

  const { data: volunteerPendingData } = useApiQuery<{
    pendingSurveys: number;
    pendingApprovals: number;
  }>(['volunteer', 'pending-counts'], () =>
    api.get('/dashboard/volunteer/pending-counts'), {
    enabled: role === 'volunteer' || role === 'facilitator',
  });

  const navigation: Record<string, NavigationItem[]> = {
    admin: [
      { name: 'Dashboard', labelKey: 'dashboard', href: '/admin/dashboard', icon: HomeIcon, exact: true },
      { name: 'Users', labelKey: 'users', href: '/admin/users', icon: UsersIcon },
      { name: 'Pilots', labelKey: 'pilots', href: '/admin/pilots', icon: ChartBarIcon },
      { name: 'Schools', labelKey: 'schools', href: '/admin/schools', icon: BuildingLibraryIcon },
      { name: 'Activities', labelKey: 'activities', href: '/admin/activities', icon: CalendarIcon },
      { name: 'Surveys', labelKey: 'surveys', href: '/admin/surveys', icon: ClipboardDocumentListIcon },
      { name: 'Media', labelKey: 'media', href: '/admin/media', icon: PhotoIcon },
      { name: 'Exports', labelKey: 'exports', href: '/admin/exports', icon: ArrowDownTrayIcon },
      { name: 'Reports', labelKey: 'reports', href: '/admin/reports', icon: ChartBarIcon },
      { name: 'Analytics', labelKey: 'analytics', href: '/admin/analytics', icon: ChartBarIcon },
    ],
    coordinator: [
      { name: 'Dashboard', labelKey: 'dashboard', href: '/coordinator/dashboard', icon: HomeIcon, exact: true },
      { name: 'Activities', labelKey: 'activities', href: '/coordinator/activities', icon: CalendarIcon },
      { name: 'Assign Activity', labelKey: 'assignActivity', href: '/coordinator/assign', icon: PlusCircleIcon },
      { name: 'Approvals', labelKey: 'approvals', href: '/coordinator/approvals', icon: CheckCircleIcon, badge: 'count' },
      { name: 'Volunteers', labelKey: 'volunteers', href: '/coordinator/volunteers', icon: UserGroupIcon },
      { name: 'Schools', labelKey: 'schools', href: '/coordinator/schools', icon: AcademicCapIcon },
      { name: 'Surveys', labelKey: 'surveys', href: '/coordinator/surveys', icon: DocumentTextIcon },
      { name: 'Media', labelKey: 'media', href: '/coordinator/media', icon: PhotoIcon },
      { name: 'Exports', labelKey: 'exports', href: '/coordinator/exports', icon: ArrowDownTrayIcon },
    ],
    volunteer: [
      { name: 'Dashboard', labelKey: 'dashboard', href: '/volunteer/dashboard', icon: HomeIcon, exact: true },
      { name: 'My Activities', labelKey: 'myActivities', href: '/volunteer/activities', icon: CalendarIcon },
      { name: 'Feedback', labelKey: 'feedback', href: '/volunteer/surveys/volunteer', icon: ChatBubbleLeftIcon, badge: 'pending' },
    ],
    facilitator: [
      { name: 'Dashboard', labelKey: 'dashboard', href: '/volunteer/dashboard', icon: HomeIcon, exact: true },
      { name: 'My Activities', labelKey: 'myActivities', href: '/volunteer/activities', icon: CalendarIcon },
      { name: 'Feedback', labelKey: 'feedback', href: '/volunteer/surveys/volunteer', icon: ChatBubbleLeftIcon, badge: 'pending' },
    ],
  };

  const getBadgeCount = (item: NavigationItem) => {
    if (!item.badge) return null;
    if ((role === 'coordinator' || role === 'admin') && item.name === 'Approvals' && pendingData) {
      return (pendingData.pendingActivities || 0) + (pendingData.pendingPhotos || 0);
    }
    if ((role === 'volunteer' || role === 'facilitator') && item.name === 'Feedback' && volunteerPendingData) {
      return volunteerPendingData.pendingSurveys || 0;
    }
    return null;
  };

  const isActive = (href: string, exact?: boolean) => {
    const hrefWithLocale = `/${locale}${href}`;
    if (exact) return pathname === hrefWithLocale;
    return pathname.startsWith(hrefWithLocale);
  };

  const profileHref = `/${locale}/${role}/profile`;
  const displayName = user?.full_name || user?.name || user?.email || user?.phone || 'User';
  const secondaryText = user?.email || user?.phone || tLayout('viewProfileSettings');

  return (
    <div className="flex grow flex-col overflow-y-auto bg-white border-r border-gray-100 shadow-sm">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 shrink-0">
            <Image
              src="/evergreen.png"
              alt="Evergreen"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-lg font-bold tracking-tight text-gray-900">
            Evergreen
          </span>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-5 pt-4 pb-2">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize
          ${role === 'admin' ? 'bg-rose-50 text-rose-700' :
            role === 'coordinator' ? 'bg-blue-50 text-blue-700' :
            'bg-green-50 text-green-700'}`}>
          {role}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-3 pb-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-1">
          {navigation[role].map((item) => {
            const active = isActive(item.href, item.exact);
            const badgeCount = getBadgeCount(item);
            const hrefWithLocale = `/${locale}${item.href}`;

            return (
              <li key={item.name}>
                <Link
                  href={hrefWithLocale}
                  className={`
                    group flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150
                    ${active
                      ? 'bg-green-50 text-green-700 shadow-sm'
                      : 'text-gray-600 hover:text-green-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <item.icon
                    className={`h-5 w-5 shrink-0 transition-colors ${
                      active ? 'text-green-600' : 'text-gray-400 group-hover:text-green-600'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="flex-1 truncate">{tNav(item.labelKey)}</span>
                  {badgeCount !== null && badgeCount > 0 && (
                    <span className={`
                      inline-flex items-center justify-center min-w-[20px] h-5 px-1.5
                      text-xs font-semibold rounded-full
                      ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}
                    `}>
                      {badgeCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Bottom user section */}
        <div className="mt-auto pt-4 border-t border-gray-100">
          {/* Profile link */}
          <Link
            href={profileHref}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 mb-1 transition-all duration-150 group
              ${pathname === profileHref
                ? 'bg-green-50 text-green-700'
                : 'text-gray-600 hover:text-green-700 hover:bg-gray-50'
              }`}
          >
            <UserAvatar user={user} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {displayName}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {secondaryText}
              </p>
            </div>
            <Cog6ToothIcon className="h-4 w-4 text-gray-300 group-hover:text-green-500 shrink-0" />
          </Link>

          {/* Sign out */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 text-gray-400 group-hover:text-red-500" />
            {tNav('signOut')}
          </button>
        </div>
      </nav>
    </div>
  );
}
