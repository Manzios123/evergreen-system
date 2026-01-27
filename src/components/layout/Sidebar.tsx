// components/layout/sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  HomeIcon,
  CalendarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  PhotoIcon,
  ArrowRightOnRectangleIcon,
  PlusCircleIcon,
  ChatBubbleLeftIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ArrowDownTrayIcon,
  UsersIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';
import { useApiQuery } from '@/lib/hooks/use-api';
import { api } from '@/lib/api';

interface SidebarProps {
  role: 'admin' | 'coordinator' | 'volunteer';
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: 'pending' | 'count';
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;
  const { logout, user } = useAuth();
  
  // Fetch pending counts for badges - using the correct API endpoints
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
    enabled: role === 'volunteer',
  });

  const navigation: Record<string, NavigationItem[]> = {
    admin: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon, exact: true },
      { name: 'Users', href: '/admin/users', icon: UsersIcon },
      { name: 'Pilots', href: '/admin/pilots', icon: ChartBarIcon },
      { name: 'Schools', href: '/admin/schools', icon: BuildingLibraryIcon },
      { name: 'Activities', href: '/admin/activities', icon: CalendarIcon },
      { name: 'Surveys', href: '/admin/surveys', icon: ClipboardDocumentListIcon },
      { name: 'Exports', href: '/admin/exports', icon: ArrowDownTrayIcon },
      { name: 'Reports', href: '/admin/reports', icon: ChartBarIcon },
    ],
    coordinator: [
      { name: 'Dashboard', href: '/coordinator/dashboard', icon: HomeIcon, exact: true },
      { name: 'Activities', href: '/coordinator/activities', icon: CalendarIcon },
      { name: 'Assign Activity', href: '/coordinator/assign', icon: PlusCircleIcon },
      { 
        name: 'Approvals', 
        href: '/coordinator/approvals', 
        icon: CheckCircleIcon, 
        badge: 'count' 
      },
      { name: 'Volunteers', href: '/coordinator/volunteers', icon: UserGroupIcon },
      { name: 'Schools', href: '/coordinator/schools', icon: AcademicCapIcon },
      { name: 'Surveys', href: '/coordinator/surveys', icon: DocumentTextIcon },
      { name: 'Exports', href: '/coordinator/exports', icon: ArrowDownTrayIcon },
    ],
    volunteer: [
      { name: 'Dashboard', href: '/volunteer/dashboard', icon: HomeIcon, exact: true },
      { name: 'My Activities', href: '/volunteer/activities', icon: CalendarIcon },
      
      
      { 
        name: 'Feedback', 
        href: '/volunteer/surveys/volunteer', 
        icon: ChatBubbleLeftIcon, 
        badge: 'pending' 
      },
      //{ name: 'Photos', href: '/volunteer/photos', icon: PhotoIcon },
    ],
  };

  const getBadgeCount = (item: NavigationItem) => {
    if (!item.badge) return null;

    if (role === 'coordinator' || role === 'admin') {
      if (item.name === 'Approvals' && pendingData) {
        return (pendingData.pendingActivities || 0) + (pendingData.pendingPhotos || 0);
      }
    }

    if (role === 'volunteer') {
      if (item.name === 'Activity Surveys' && volunteerPendingData) {
        return volunteerPendingData.pendingSurveys || 0;
      }
      if (item.name === 'Volunteer Feedback' && volunteerPendingData) {
        // Separate count for volunteer feedback
        return volunteerPendingData.pendingSurveys || 0;
      }
    }

    return null;
  };

  const isActive = (href: string, exact?: boolean) => {
    const hrefWithLocale = `/${locale}${href}`;
    if (exact) {
      return pathname === hrefWithLocale;
    }
    return pathname.startsWith(hrefWithLocale);
  };

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 border-r border-gray-200">
      <div className="flex h-16 shrink-0 items-center">
        <div className="flex items-center">
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
              {navigation[role].map((item) => {
                const active = isActive(item.href, item.exact);
                const badgeCount = getBadgeCount(item);
                const hrefWithLocale = `/${locale}${item.href}`;
                
                return (
                  <li key={item.name}>
                    <Link
                      href={hrefWithLocale}
                      className={`
                        group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold
                        ${active
                          ? 'bg-green-50 text-green-600'
                          : 'text-gray-700 hover:text-green-600 hover:bg-gray-50'
                        }
                      `}
                    >
                      <item.icon
                        className={`h-6 w-6 shrink-0 ${
                          active ? 'text-green-600' : 'text-gray-400 group-hover:text-green-600'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="flex-1">{item.name}</span>
                      {badgeCount !== null && badgeCount > 0 && (
                        <span className={`
                          inline-flex items-center justify-center min-w-5 h-5 px-1.5 
                          text-xs font-medium rounded-full
                          ${active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                          }
                        `}>
                          {badgeCount}
                        </span>
                      )}
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
                    {user?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.full_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate capitalize">
                    {user?.role}
                  </p>
                </div>
              </div>
              
              <button
                onClick={logout}
                className="w-full flex items-center gap-x-3 rounded-md p-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-red-600"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 text-gray-400" />
                Sign out
              </button>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
}