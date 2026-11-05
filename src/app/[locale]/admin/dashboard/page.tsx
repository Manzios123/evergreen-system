// app/[locale]/admin/dashboard/page.tsx
'use client';

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { useAuth } from '@/components/providers/AuthProvider';
import DashboardGreeting from '@/components/dashboard/dashboard-greeting';
import PrimaryMetricCard from '@/components/dashboard/primary-metric-card';
import DataTable from '@/components/ui/data-table';
import StatusBadge from '@/components/ui/status-badge';
import { Progress } from '@/components/ui/proggress';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import Alert from '@/components/ui/alert';
import EmptyState from '@/components/ui/empty-state';
import { useApiQuery } from '@/lib/hooks/use-api';
import { api } from '@/lib/api/api';
import {
  UserGroupIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  DocumentTextIcon,
  PhotoIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { format } from 'date-fns';

// TypeScript types based on the backend response
type SystemStatistics = {
  total_pilots: number;
  active_pilots: number;
  total_users: number;
  total_activities: number;
  approved_activities: number;
  upcoming_activities: number;
  total_schools: number;
  activity_surveys: number;
  student_surveys: number;
  volunteer_surveys: number;
};

type PilotSummary = {
  id: string;
  name: string;
  status: string;
  user_count: number;
  activity_count: number;
  approved_activities: number;
  school_count: number;
};

type PilotsData = {
  summary: PilotSummary[];
  total: number;
  active: number;
};

type UserDistribution = {
  role: string;
  user_count: number;
};

type UsersData = {
  distribution: UserDistribution[];
  total: number;
};

type ActivityDistribution = {
  status: string;
  count: number;
};

type ActivitiesData = {
  distribution: ActivityDistribution[];
  total: number;
  approved: number;
  upcoming: number;
};

type SurveysData = {
  activity: number;
  student: number;
  volunteer: number;
  total: number;
};

type SchoolsData = {
  total: number;
};

type RecentActivity = {
  type: string;
  entity_id: string;
  entity_name: string;
  user_name: string;
  timestamp: string;
};

type Summary = {
  systemHealth: string;
  message: string;
};

type AdminDashboardData = {
  user: {
    id: string;
    email: string;
    role: string;
  };
  systemStatistics: SystemStatistics;
  pilots: PilotsData;
  users: UsersData;
  activities: ActivitiesData;
  surveys: SurveysData;
  schools: SchoolsData;
  recentActivity: RecentActivity[];
  summary: Summary;
};

export default function AdminDashboardPage() {
  // Fetch admin dashboard data with the correct type
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch
  } = useApiQuery<AdminDashboardData>(
    ['admin-dashboard'],
    () => api.get('/dashboard/admin')
  );

  // Calculate derived stats
  const stats = useMemo(() => {
    if (!dashboardData) return null;

    const { systemStatistics, pilots, surveys } = dashboardData;

    return {
      totalPilots: systemStatistics.total_pilots,
      activePilots: systemStatistics.active_pilots,
      totalUsers: systemStatistics.total_users,
      totalActivities: systemStatistics.total_activities,
      approvedActivities: systemStatistics.approved_activities,
      upcomingActivities: systemStatistics.upcoming_activities,
      totalSchools: systemStatistics.total_schools,
      totalSurveys: surveys.total,
      activitySurveys: surveys.activity,
      studentSurveys: surveys.student,
      volunteerSurveys: surveys.volunteer,
      pilotCount: pilots.summary?.length || 0,
    };
  }, [dashboardData]);

  const { user } = useAuth();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  // Get system health status and styling
  const getHealthStatus = (health: string | undefined) => {
    const healthValue = health?.toLowerCase();
    switch (healthValue) {
      case 'operational':
        return { label: 'Operational', className: 'bg-green-100 text-green-800' };
      case 'degraded':
        return { label: 'Degraded', className: 'bg-yellow-100 text-yellow-800' };
      case 'down':
        return { label: 'Down', className: 'bg-red-100 text-red-800' };
      default:
        return { label: 'Unknown', className: 'bg-gray-100 text-gray-800' };
    }
  };

  const healthStatus = dashboardData?.summary?.systemHealth
    ? getHealthStatus(dashboardData.summary.systemHealth)
    : { label: 'Unknown', className: 'bg-gray-100 text-gray-800' };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLoader key={i} type="card" />
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
        </div>

        {/* Tables Skeleton */}
        <SkeletonLoader type="table" />
      </div>
    );
  }

  // Error state - handle 401/403 specifically
  if (error) {
    const isAuthError = error.status === 401 || error.status === 403;

    return (
      <Alert
        title={isAuthError ? "Session expired" : "Unable to load admin dashboard"}
        type="error"
      >
        {isAuthError
          ? "Your session has expired or you don't have permission to view this page. Please log in again."
          : "There was an error loading dashboard data. Please try again."}
        <div className="mt-4">
          <Button variant="outline" onClick={() => refetch()}>
            Try Again
          </Button>
          {isAuthError && (
            <Link href="/login" className="ml-3">
              <Button variant="default">
                Go to Login
              </Button>
            </Link>
          )}
        </div>
      </Alert>
    );
  }

  return (
    <div className="dashboard-surface space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <DashboardGreeting name={user?.full_name || user?.name} email={user?.email} role={user?.role} fallback="Admin" />
          <p className="mt-1 text-sm text-gray-500">
            System-wide overview and administration
          </p>
        </div>
        <div className="flex space-x-3">
          <Link href="/admin/reports">
            <Button
              variant="outline"
              icon={<ChartBarIcon className="h-4 w-4" />}
            >
              View Reports
            </Button>
          </Link>
          <Link href="/admin/users/new">
            <Button
              variant="default"
              icon={<PlusIcon className="h-4 w-4" />}
            >
              Add User
            </Button>
          </Link>
        </div>
      </div>

      {/* System Health Banner */}
      {dashboardData?.summary && (
        <Alert
          title={`System Health: ${healthStatus.label}`}
          type={
            dashboardData.summary.systemHealth === 'operational' ? 'success' :
            dashboardData.summary.systemHealth === 'degraded' ? 'warning' : 'error'
          }
        >
          {dashboardData.summary.message}
        </Alert>
      )}

      {/* Reporting overview and supporting metrics */}
      {stats && (
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="min-w-0 sm:col-span-2 lg:row-span-2">
            <PrimaryMetricCard label="Activity reports" value={stats.totalActivities}
              description="Assigned reports across all pilots, including drafts and every report status."
              details={[{ label: 'Approved reports', value: stats.approvedActivities }, { label: 'Upcoming assignments', value: stats.upcomingActivities }]}
              href={`/${locale}/admin/activities`} />
          </div>
          {[
            { label: 'Registered users', value: stats.totalUsers, detail: 'All roles, including inactive accounts' },
            { label: 'Pilot programmes', value: stats.totalPilots, detail: `${stats.activePilots} active` },
            { label: 'Schools', value: stats.totalSchools, detail: 'Across all pilots' },
            { label: 'Survey submissions', value: stats.totalSurveys, detail: 'Response records, not unique respondents' },
          ].map(metric => (
            <Card key={metric.label} className="min-w-0 p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-gray-500 dark:text-slate-400">{metric.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">{metric.value.toLocaleString('en')}</p>
              <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-slate-400">{metric.detail}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Pilots Table & Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pilots Table - Section B */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Pilot Programs</h2>
                <Link
                  href="/admin/pilots"
                  className="text-sm font-medium text-green-600 hover:text-green-500 flex items-center"
                >
                  View all
                  <ArrowRightIcon className="h-4 w-4 ml-1" />
                </Link>
              </div>

              {dashboardData?.pilots?.summary && dashboardData.pilots.summary.length > 0 ? (
                <DataTable<PilotSummary>
                  columns={[
                    { key: 'name', header: 'Pilot name' },
                    { key: 'status', header: 'Status', render: pilot => <StatusBadge status={pilot.status} /> },
                    { key: 'user_count', header: 'Users', align: 'right' },
                    { key: 'activity_count', header: 'Activities', align: 'right' },
                    { key: 'approved_activities', header: 'Approved', align: 'right' },
                    { key: 'school_count', header: 'Schools', align: 'right' },
                  ]}
                  data={dashboardData.pilots.summary}
                />
              ) : (
                <EmptyState
                  icon={<ChartBarIcon className="h-12 w-12 text-gray-400" />}
                  title="No pilot programs"
                  description="Create your first pilot program to get started."
                />
              )}
            </div>
          </Card>

          {/* Recent Activity - Section D */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent System Activity</h2>
                <Link
                  href="/admin/activities"
                  className="text-sm font-medium text-green-600 hover:text-green-500 flex items-center"
                >
                  View all
                  <ArrowRightIcon className="h-4 w-4 ml-1" />
                </Link>
              </div>

              {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {[...dashboardData.recentActivity]
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice(0, 5)
                    .map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center">
                          <p className="font-medium text-gray-900 truncate">{activity.entity_name}</p>
                          <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 capitalize">
                            {activity.type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <UserGroupIcon className="h-3 w-3 mr-1" />
                          <span className="truncate">{activity.user_name}</span>
                          <span className="mx-2">•</span>
                          <ClockIcon className="h-3 w-3 mr-1" />
                          <span>{format(new Date(activity.timestamp), 'MMM d, yyyy HH:mm')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<CalendarIcon className="h-12 w-12 text-gray-400" />}
                  title="No recent activity"
                  description="System activities will appear here."
                />
              )}
            </div>
          </Card>
        </div>

        {/* Right Column - Distribution & Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Actions</h2>
              <div className="space-y-3">
                <Link href="/admin/users/new" className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    icon={<PlusIcon className="h-5 w-5" />}
                  >
                    Add New User
                  </Button>
                </Link>
                <Link href="/admin/pilots/new" className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    icon={<ChartBarIcon className="h-5 w-5" />}
                  >
                    Create Pilot Program
                  </Button>
                </Link>
                <Link href="/admin/schools/new" className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    icon={<BuildingOfficeIcon className="h-5 w-5" />}
                  >
                    Add School
                  </Button>
                </Link>
                <Link href={`/${locale}/admin/surveys/templates/new`} className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    icon={<DocumentTextIcon className="h-5 w-5" />}
                  >
                    Create Template
                  </Button>
                </Link>
                <Link href="/admin/exports" className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    icon={<ArrowTrendingUpIcon className="h-5 w-5" />}
                  >
                    System Export
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Users by Role - Section C */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Users by Role</h2>
              <p className="mb-4 text-xs leading-5 text-gray-500">Roles can overlap. Accounts without a role appear only in Registered users.</p>

              {dashboardData?.users?.distribution && dashboardData.users.distribution.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.users.distribution.map((roleStat) => (
                    <div key={roleStat.role} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`h-3 w-3 rounded-full mr-2 ${
                          roleStat.role === 'admin' ? 'bg-red-500' :
                          roleStat.role === 'coordinator' ? 'bg-blue-500' :
                          'bg-green-500'
                        }`} />
                        <span className="text-sm text-gray-600 capitalize">{roleStat.role}s</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 mr-2">{roleStat.user_count}</span>
                        <span className="text-xs text-gray-500">
                          ({dashboardData.users.total > 0 ? Math.round((roleStat.user_count / dashboardData.users.total) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">Total Users</span>
                      <span className="text-sm font-medium text-gray-900">{dashboardData.users.total}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<UserGroupIcon className="h-10 w-10 text-gray-400" />}
                  title="No user data"
                  description="User distribution will appear here."
                />
              )}
            </div>
          </Card>

          {/* Activities by Status - Section C */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Activities by Status</h2>

              {dashboardData?.activities?.distribution && dashboardData.activities.distribution.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.activities.distribution.map((statusStat) => (
                    <div key={statusStat.status} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          statusStat.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : statusStat.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {statusStat.status}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 mr-2">{statusStat.count}</span>
                        <span className="text-xs text-gray-500">
                          ({Math.round((statusStat.count / dashboardData.activities.total) * 100)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">Total Activities</span>
                      <span className="text-sm font-medium text-gray-900">{dashboardData.activities.total}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<CalendarIcon className="h-10 w-10 text-gray-400" />}
                  title="No activity data"
                  description="Activity status distribution will appear here."
                />
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
