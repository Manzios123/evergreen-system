// app/[locale]/volunteer/activities/page.tsx
'use client'

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import StatusBadge from '@/components/ui/status-badge';
import DataTable from '@/components/ui/data-table';
import EmptyState from '@/components/ui/empty-state';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import { useApiQuery } from '@/lib/hooks/use-api';
import { PlusIcon, CalendarIcon, MapPinIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { activitiesApi, type Activity as ApiActivity } from '@/lib/api/activities'; // Import from activities API

// Create a unified type that works for both
type Activity = ApiActivity & {
  type?: string; // Make type optional since API doesn't provide it
  school?: { name: string }; // Add school object for compatibility
};

export default function VolunteerActivitiesPage() {
  // Use activitiesApi.list() which returns the properly typed response
  const { data: response, isLoading, error } = useApiQuery<{ data: ApiActivity[]; count: number }>(
    ['activities'],
    () => activitiesApi.list()
  );

  // Transform the API data to match the expected Activity type
  const activities: Activity[] = (response?.data || []).map(activity => ({
    ...activity,
    // Add missing properties that might be expected
    type: 'volunteer', // Default value or derive from activity data
    school: { name: activity.school_name || 'Unknown School' }
  }));

  const columns = [
    {
      key: 'title',
      header: 'Activity',
      render: (activity: Activity) => (
        <div className="min-w-0 flex-1">
          <Link 
            href={`/volunteer/activities/${activity.id}`}
            className="font-medium text-gray-900 hover:text-green-600"
          >
            {activity.title}
          </Link>
          <p className="mt-1 text-sm text-gray-500 truncate">
            {activity.description}
          </p>
        </div>
      ),
    },
    {
      key: 'school',
      header: 'School',
      render: (activity: Activity) => (
        <div className="flex items-center">
          <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
          <span>{activity.school?.name || activity.school_name || 'Unknown School'}</span>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (activity: Activity) => (
        <div className="flex items-center">
          <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
          <span>{new Date(activity.scheduled_date).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (activity: Activity) => <StatusBadge status={activity.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (activity: Activity) => (
        <div className="flex space-x-2">
          <Link href={`/volunteer/activities/${activity.id}`}>
            <Button size="sm" variant="outline">
              View
            </Button>
          </Link>
          {activity.status === 'draft' && (
            <Link href="/volunteer/activities/new">
              <Button
                variant="default"
                size="sm"
                icon={<PlusIcon className="h-5 w-5" />}
              >
                Report
              </Button>
            </Link>
          )}
          {activity.status === 'pending' && (
            <Button size="sm" variant="outline" disabled>
              Awaiting Approval
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonLoader type="card" />
        <SkeletonLoader type="table" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to load activities"
        description="There was an error loading your activities. Please try again."
        action={{
          label: 'Try Again',
          onClick: () => window.location.reload(),
        }}
      />
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <EmptyState
        icon={<CalendarIcon className="h-12 w-12 text-gray-400" />}
        title="No activities yet"
        description="You haven't been assigned any activities. Check back soon!"
        action={{
          label: 'Create New Activity',
          onClick: () => window.location.href = '/volunteer/activities/new',
        }}
      />
    );
  }

  const activeActivities = activities.filter(
    (activity) => !['completed', 'cancelled'].includes(activity.status)
  );

  const pastActivities = activities.filter((activity) =>
    ['completed', 'cancelled'].includes(activity.status)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Activities</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage your volunteering activities
          </p>
        </div>
        <Link href="/volunteer/activities/new">
          <Button variant="default" icon={<PlusIcon className="h-5 w-5" />}>
            Report New Activity
          </Button>
        </Link>
      </div>

      {activeActivities.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Active Activities ({activeActivities.length})
          </h2>
          <Card>
            <DataTable
              data={activeActivities}
              columns={columns}
              emptyMessage="No active activities found"
            />
          </Card>
        </div>
      )}

      {pastActivities.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Past Activities ({pastActivities.length})
          </h2>
          <Card>
            <DataTable
              data={pastActivities}
              columns={columns}
              emptyMessage="No past activities found"
            />
          </Card>
        </div>
      )}
    </div>
  );
}