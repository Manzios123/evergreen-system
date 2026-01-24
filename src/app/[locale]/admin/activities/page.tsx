'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import DataTable from '@/components/ui/data-table';
import EmptyState from '@/components/ui/empty-state';
import SearchFilter from '@/components/ui/search-filter';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import Alert from '@/components/ui/alert';
import { useApiQuery } from '@/lib/hooks/use-api';
import { api } from '@/lib/api';
import { Activity, ApiResponse } from '@/lib/types';
import {
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  UsersIcon,
  EyeIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

// Define Column interface for DataTable
interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

// Extended Activity type for table display
interface ActivityForTable extends Activity {
  volunteer_name?: string;
  school_name?: string;
  pilot_name?: string;
}

export default function AdminActivitiesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch approved activities
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useApiQuery<ApiResponse<Activity[]>>(
    ['activities', 'approved'],
    () => api.get('/activities', { status: 'approved' })
  );

  const activities: ActivityForTable[] = response?.data || [];

  // Filter activities based on search term
  const filteredActivities = useMemo(() => {
    if (!searchTerm.trim()) return activities;

    const term = searchTerm.toLowerCase();
    return activities.filter(activity => {
      const title = activity.title?.toLowerCase() || '';
      const description = activity.description?.toLowerCase() || '';
      const volunteerName = activity.volunteer_name?.toLowerCase() || '';
      const schoolName = activity.school_name?.toLowerCase() || '';
      const pilotName = activity.pilot_name?.toLowerCase() || '';

      return (
        title.includes(term) ||
        description.includes(term) ||
        volunteerName.includes(term) ||
        schoolName.includes(term) ||
        pilotName.includes(term)
      );
    });
  }, [activities, searchTerm]);

  const columns: Column<ActivityForTable>[] = [
    {
      key: 'activity',
      header: 'Activity',
      sortable: true,
      render: (activity) => (
        <div>
          <p className="font-medium text-gray-900">{activity.title}</p>
          <p className="text-sm text-gray-500 mt-1 truncate max-w-xs">
            {activity.description || 'No description'}
          </p>
        </div>
      ),
    },
    {
      key: 'volunteer',
      header: 'Volunteer',
      sortable: true,
      render: (activity) => (
        <div className="flex items-center">
          <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
          <div>
            <p className="text-sm text-gray-900">
              {activity.volunteer_name || activity.volunteer?.full_name || 'Unknown'}
            </p>
            {activity.volunteer?.email && (
              <p className="text-xs text-gray-500">{activity.volunteer.email}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'school',
      header: 'School',
      sortable: true,
      render: (activity) => (
        <div className="flex items-center">
          <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900">
            {activity.school_name || activity.school?.name || activity.school_id || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'pilot',
      header: 'Pilot',
      sortable: true,
      render: (activity) => (
        <div className="flex items-center">
          <ChartBarIcon className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900">
            {activity.pilot_name || activity.pilot?.name || activity.pilot_id || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Dates',
      render: (activity) => (
        <div className="text-sm">
          <div className="flex items-center text-gray-900">
            <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
            <span>
              {new Date(activity.scheduled_date).toLocaleDateString()}
            </span>
          </div>
          {activity.actual_date && (
            <div className="text-xs text-gray-500 mt-1">
              Actual: {new Date(activity.actual_date).toLocaleDateString()}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'participants',
      header: 'Participants',
      render: (activity) => (
        <div className="flex items-center">
          <UsersIcon className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900">
            {activity.number_of_participants || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'engagement',
      header: 'Engagement',
      render: (activity) => {
        const engagement = activity.engagement_level;
        if (!engagement) return <span className="text-gray-400">—</span>;
        
        let displayText = String(engagement);
        if (engagement === 'low') displayText = 'Low';
        if (engagement === 'medium') displayText = 'Medium';
        if (engagement === 'high') displayText = 'High';
        
        const getColor = (level: any) => {
          if (level === 'high' || level === 3) return 'text-green-600 bg-green-100';
          if (level === 'medium' || level === 2) return 'text-yellow-600 bg-yellow-100';
          return 'text-red-600 bg-red-100';
        };
        
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getColor(engagement)}`}>
            {displayText}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (activity) => (
        <Link href={`/admin/activities/${activity.id}`}>
          <Button variant="outline" size="sm" className="inline-flex items-center">
            <EyeIcon className="h-4 w-4 mr-1" />
            View Report
          </Button>
        </Link>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-36 animate-pulse"></div>
        </div>
        <Card className="p-6">
          <SkeletonLoader type="table" rows={5} />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert type="error" title="Failed to load activities">
          {error.message || 'Unable to load activities'}
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => refetch()}
            >
              Try Again
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
          <p className="mt-1 text-sm text-gray-500">
            Approved activity reports from volunteers
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <div className="p-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search activities by title, description, volunteer, school, or pilot..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Activities Table */}
      {filteredActivities.length > 0 ? (
        <Card>
          <DataTable
            data={filteredActivities}
            columns={columns}
            emptyMessage="No activities found"
          />
        </Card>
      ) : (
        <EmptyState
          icon={<DocumentTextIcon className="h-12 w-12 text-gray-400" />}
          title={searchTerm ? "No matching activities found" : "No approved activity reports yet"}
          description={
            searchTerm
              ? "Try adjusting your search to find what you're looking for."
              : "When volunteers submit activity reports and they get approved, they will appear here."
          }
          action={
            searchTerm
              ? {
                  label: 'Clear Search',
                  onClick: () => setSearchTerm(''),
                }
              : undefined
          }
        />
      )}
    </div>
  );
}