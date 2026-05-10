// app/[locale]/admin/dashboard/page.tsx
'use client';

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { useAuth } from '@/components/providers/AuthProvider';
import DashboardGreeting from '@/components/dashboard/dashboard-greeting';
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
  CheckCircleIcon,
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
    <div className="space-y-6">
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

      {/* Stats Grid - Section A */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pilots Card */}
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pilots</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {stats.activePilots}/{stats.totalPilots}
                </p>
                <div className="flex items-center mt-2">
                  <div className="text-xs text-gray-500">
                    {stats.activePilots} active
                  </div>
                </div>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <ChartBarIcon className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </Card>

          {/* Users Card */}
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {stats.totalUsers}
                </p>
                <div className="flex items-center mt-2">
                  <div className="text-xs text-gray-500">
                    Across all roles
                  </div>
                </div>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <UserGroupIcon className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </Card>

          {/* Activities Card */}
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Activities</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {stats.totalActivities}
                </p>
                <div className="flex items-center mt-2">
                  <div className="text-xs text-gray-500">
                    {stats.approvedActivities} approved • {stats.upcomingActivities} upcoming
                  </div>
                </div>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </Card>

          {/* Surveys Card */}
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Surveys</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {stats.totalSurveys}
                </p>
                <div className="flex items-center mt-2">
                  <div className="text-xs text-gray-500">
                    Activity: {stats.activitySurveys} • Student: {stats.studentSurveys} • Volunteer: {stats.volunteerSurveys}
                  </div>
                </div>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <DocumentTextIcon className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Additional Stats Row */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Schools</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">
                  {stats.totalSchools}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <BuildingOfficeIcon className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Approved Activities</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {stats.approvedActivities}
                </p>
                <div className="flex items-center mt-2">
                  <div className="text-xs text-gray-500">
                    of {stats.totalActivities} total
                  </div>
                </div>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Upcoming Activities</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {stats.upcomingActivities}
                </p>
                <div className="flex items-center mt-2">
                  <div className="text-xs text-gray-500">
                    Scheduled activities
                  </div>
                </div>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <ClockIcon className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </Card>
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
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pilot Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Users
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Activities
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Approved
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Schools
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {dashboardData.pilots.summary.map((pilot) => (
                        <tr key={pilot.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {pilot.name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              pilot.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : pilot.status === 'completed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {pilot.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {pilot.user_count}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {pilot.activity_count}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {pilot.approved_activities}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {pilot.school_count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Users by Role</h2>

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
                          ({Math.round((roleStat.user_count / dashboardData.users.total) * 100)}%)
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
