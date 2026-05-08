// app/[locale]/volunteer/dashboard/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation'; // Add this import
import { dashboardApi } from '@/lib/api/dashboard';
import { useAuth } from '@/components/providers/AuthProvider';
import DashboardGreeting from '@/components/dashboard/dashboard-greeting';
import StatsCard from '@/components/ui/stats-card';
import ActivityCard from '@/components/activities/activity-card';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import { Activity, Pilot } from '@/lib/types'; // Import Pilot type

export default function VolunteerDashboardPage() {
  const { user } = useAuth();
  const params = useParams(); // Get params including locale
  const locale = params.locale as string; // Extract locale
  
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['volunteer-dashboard'],
    queryFn: () => dashboardApi.getVolunteerDashboard(),
  });

  if (isLoading) {
    return <SkeletonLoader type="dashboard" />;
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{(error as Error).message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const dashboard = dashboardData;

  // Helper function to create dynamic links
  const createLink = (path: string): string => {
    return `/${locale}${path}`;
  };

  // Get the pending count with a safe fallback
  const pendingCount = dashboard?.statistics?.activities?.pending_count ?? 0;

  return (
    <div>
      <div className="mb-8">
        <DashboardGreeting
          name={user?.full_name}
          fallback={user?.role === 'facilitator' ? 'Facilitator' : 'Volunteer'}
          className="text-2xl font-bold text-gray-900 sm:text-3xl"
        />
        <p className="mt-2 text-gray-600">
          {dashboard?.summary?.message || 'Manage your volunteering activities'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title="Total Activities"
          value={dashboard?.statistics?.activities?.total_activities || 0}
          icon="activity"
          trend="up"
          color="green"
        />
        <StatsCard
          title="Pending Approval"
          value={pendingCount}
          icon="pending"
          trend={pendingCount > 0 ? 'up' : 'none'}
          color="yellow"
        />
        <StatsCard
          title="Upcoming"
          value={dashboard?.statistics?.activities?.upcoming_count || 0}
          icon="calendar"
          trend="up"
          color="blue"
        />
        <StatsCard
          title="Completed"
          value={dashboard?.statistics?.activities?.completed_count || 0}
          icon="check"
          trend="up"
          color="green"
        />
      </div>

      {/* Alerts */}
      {dashboard?.summary?.pendingApproval && (
        <div className="mb-6 rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <div className="shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Attention needed</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>{dashboard.summary.pendingApproval}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activities */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
          <Link
            href={createLink('/volunteer/activities')} // Use dynamic link
            className="text-sm font-medium text-green-600 hover:text-green-500"
          >
            View all →
          </Link>
        </div>
        
        {dashboard?.recentActivities && dashboard.recentActivities.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dashboard.recentActivities.slice(0, 3).map((activity) => {
              // Create a properly typed pilot object
              const pilot: Pilot | undefined = activity.pilot_name ? {
                id: '',
                name: activity.pilot_name,
                start_date: '',
                status: 'active',
                created_at: '',
                updated_at: '',
                success: true, // Add required property
                message: 'Pilot data from dashboard' // Add required property
              } as Pilot : undefined;
              
              const transformedActivity: Activity = {
                id: activity.id,
                title: activity.title,
                description: '',
                status: activity.status as any,
                scheduled_date: activity.scheduled_date,
                actual_date: activity.actual_date,
                volunteer_id: '',
                school_id: '',
                pilot_id: '',
                created_at: '',
                updated_at: '',
                school: activity.school_name ? {
                  id: '',
                  name: activity.school_name,
                  created_at: '',
                  updated_at: ''
                } : undefined,
                pilot: pilot, // Use the typed pilot
                type: ''
              };
              
              return <ActivityCard key={activity.id} activity={transformedActivity} />;
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No activities yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by viewing assigned activities.
            </p>
            <div className="mt-6">
              <Link
                href={createLink('/volunteer/activities')} // Use dynamic link
                className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-green-600"
              >
                View Activities
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Activities */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Activities</h2>
          <Link
            href={createLink('/volunteer/activities?status=upcoming')} // Use dynamic link
            className="text-sm font-medium text-green-600 hover:text-green-500"
          >
            View all →
          </Link>
        </div>
        
        {dashboard?.upcomingActivities && dashboard.upcomingActivities.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul role="list" className="divide-y divide-gray-200">
              {dashboard.upcomingActivities.map((activity) => (
                <li key={activity.id}>
                  <div className="px-4 py-4 flex items-center sm:px-6">
                    <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                      <div className="truncate">
                        <div className="flex text-sm">
                          <p className="font-medium text-green-600 truncate">{activity.title}</p>
                          <p className="ml-1 shrink-0 font-normal text-gray-500">
                            at {activity.school_name}
                          </p>
                        </div>
                        <div className="mt-2 flex">
                          <div className="flex items-center text-sm text-gray-500">
                            <svg className="shrink-0 mr-1.5 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            <p>
                              Scheduled: {new Date(activity.scheduled_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 shrink-0 sm:mt-0 sm:ml-5">
                        <div className="flex items-center">
                          <div className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${activity.status === 'approved' ? 'bg-green-100 text-green-800' : activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : activity.status === 'draft' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>
                            {activity.status}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-5 shrink-0">
                      <Link
                        href={createLink(`/volunteer/activities/${activity.id}`)} // Use dynamic link
                        className="text-green-600 hover:text-green-900"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming activities</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't have any activities scheduled yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
