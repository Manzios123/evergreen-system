// app/[locale]/admin/dashboard/page.tsx
'use client';

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import DataTable from '@/components/ui/data-table';
import StatusBadge from '@/components/ui/status-badge';
import { Progress } from '@/components/ui/proggress';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import Alert from '@/components/ui/alert';
import EmptyState from '@/components/ui/empty-state';
import { useApiQuery } from '@/lib/hooks/use-api';
import { User, Pilot, School, Activity } from '@/lib/types';
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
import { useMemo } from 'react';
import { format, subDays } from 'date-fns';

export default function AdminDashboardPage() {
  // Fetch admin dashboard data
  const { 
    data: dashboardData, 
    isLoading, 
    error, 
    refetch 
  } = useApiQuery<{
    stats: {
      totalUsers: number;
      totalPilots: number;
      totalSchools: number;
      totalActivities: number;
      pendingApprovals: number;
      systemHealth: number;
      activeVolunteers: number;
      completedSurveys: number;
    };
    recentUsers: User[];
    recentActivities: Activity[];
    systemAlerts: Array<{
      id: string;
      type: 'warning' | 'error' | 'info';
      title: string;
      description: string;
      timestamp: string;
    }>;
    pilotStats: Array<{
      pilot: Pilot;
      activityCount: number;
      volunteerCount: number;
      schoolCount: number;
      completionRate: number;
    }>;
    usageStats: {
      usersByRole: Array<{ role: string; count: number }>;
      activitiesByMonth: Array<{ month: string; count: number }>;
      storageUsage: number;
      storageLimit: number;
    };
  }>(
    ['admin-dashboard'],
    () => api.get('/dashboard/admin')
  );

  // Calculate derived stats
  const stats = useMemo(() => {
    if (!dashboardData) return null;

    const { stats: baseStats, usageStats, pilotStats } = dashboardData;

    // Calculate storage percentage
    const storagePercentage = usageStats?.storageLimit > 0
      ? Math.round((usageStats.storageUsage / usageStats.storageLimit) * 100)
      : 0;

    // Calculate average activities per pilot
    const avgActivitiesPerPilot = pilotStats?.length > 0
      ? (baseStats.totalActivities / pilotStats.length).toFixed(1)
      : '0.0';

    // Calculate active pilot count
    const activePilots = pilotStats?.filter(p => p.pilot.status === 'active').length || 0;

    return {
      ...baseStats,
      storagePercentage,
      avgActivitiesPerPilot,
      activePilots,
      totalPilots: pilotStats?.length || 0,
    };
  }, [dashboardData]);

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

  // Error state
  if (error) {
    return (
      <Alert
        title="Unable to load admin dashboard"
        type="error"
      >
        There was an error loading dashboard data. Please try again.
        <div className="mt-4">
          <Button variant="outline" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
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

      {/* System Alerts */}
      {dashboardData?.systemAlerts && dashboardData.systemAlerts.length > 0 && (
        <div className="space-y-3">
          {dashboardData.systemAlerts.slice(0, 3).map((alert) => (
            <Alert
              key={alert.id}
              title={alert.title}
              type={alert.type}
            >
              {alert.description}
              {alert.type === 'warning' || alert.type === 'error' ? (
                <div className="mt-2">
                  <Button variant="outline" size="sm" onClick={() => { /* Navigate to system logs */ }}>
                    View Details
                  </Button>
                </div>
              ) : null}
            </Alert>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {stats.totalUsers}
                </p>
                <div className="flex items-center mt-2">
                  <div className="text-xs text-gray-500">
                    {stats.activeVolunteers} active volunteers
                  </div>
                </div>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <UserGroupIcon className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pilot Programs</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {stats.activePilots}/{stats.totalPilots}
                </p>
                <div className="flex items-center mt-2">
                  <div className="text-xs text-gray-500">
                    {stats.avgActivitiesPerPilot} avg. activities per pilot
                  </div>
                </div>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <ChartBarIcon className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">System Health</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {stats.systemHealth}%
                </p>
                <div className="flex items-center mt-2">
                  <Progress value={stats.systemHealth} className="flex-1 mr-2" />
                  <span className="text-xs text-gray-500">Optimal</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <CheckCircleIcon className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Storage Usage</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {stats.storagePercentage}%
                </p>
                <div className="flex items-center mt-2">
                  <Progress value={stats.storagePercentage} className="flex-1 mr-2" />
                  <span className="text-xs text-gray-500">
                    {dashboardData?.usageStats ? `${Math.round(dashboardData.usageStats.storageUsage / 1024)} GB / ${Math.round(dashboardData.usageStats.storageLimit / 1024)} GB` : '0 GB / 0 GB'}
                  </span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <PhotoIcon className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recent Activity & Users */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Activities */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent System Activities</h2>
                <Link
                  href="/admin/activities"
                  className="text-sm font-medium text-green-600 hover:text-green-500 flex items-center"
                >
                  View all
                  <ArrowRightIcon className="h-4 w-4 ml-1" />
                </Link>
              </div>
              
              {dashboardData?.recentActivities && dashboardData.recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recentActivities.slice(0, 5).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center">
                          <p className="font-medium text-gray-900 truncate">{activity.title}</p>
                          <StatusBadge status={activity.status} size="sm" />
                        </div>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <BuildingOfficeIcon className="h-3 w-3 mr-1" />
                          <span className="truncate">{activity.school?.name}</span>
                          <span className="mx-2">•</span>
                          <ChartBarIcon className="h-3 w-3 mr-1" />
                          <span>{activity.pilot?.name}</span>
                        </div>
                      </div>
                      <Link href={`/admin/activities/${activity.id}`}>
                        <Button size="sm" variant="ghost">
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<CalendarIcon className="h-12 w-12 text-gray-400" />}
                  title="No recent activities"
                  description="System activities will appear here."
                />
              )}
            </div>
          </Card>

          {/* Recent Users */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recently Added Users</h2>
                <Link
                  href="/admin/users"
                  className="text-sm font-medium text-green-600 hover:text-green-500 flex items-center"
                >
                  View all
                  <ArrowRightIcon className="h-4 w-4 ml-1" />
                </Link>
              </div>
              
              {dashboardData?.recentUsers && dashboardData.recentUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {dashboardData.recentUsers.slice(0, 5).map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                                <span className="text-gray-600 font-medium text-sm">
                                  {user.full_name?.charAt(0) || 'U'}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-gray-100 text-gray-800">
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(user.created_at), 'MMM d, yyyy')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  icon={<UserGroupIcon className="h-12 w-12 text-gray-400" />}
                  title="No recent users"
                  description="New users will appear here."
                />
              )}
            </div>
          </Card>
        </div>

        {/* Right Column - Quick Stats & Actions */}
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
                <Link href="/admin/templates/new" className="block">
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

          {/* Pilot Programs Overview */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pilot Programs</h2>
              
              {dashboardData?.pilotStats && dashboardData.pilotStats.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.pilotStats.slice(0, 3).map((pilotStat) => (
                    <div
                      key={pilotStat.pilot.id}
                      className="p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900">{pilotStat.pilot.name}</p>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          pilotStat.pilot.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : pilotStat.pilot.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {pilotStat.pilot.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {pilotStat.activityCount}
                          </p>
                          <p className="text-xs text-gray-500">Activities</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {pilotStat.volunteerCount}
                          </p>
                          <p className="text-xs text-gray-500">Volunteers</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {pilotStat.schoolCount}
                          </p>
                          <p className="text-xs text-gray-500">Schools</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Completion Rate</span>
                          <span>{pilotStat.completionRate}%</span>
                        </div>
                        <Progress value={pilotStat.completionRate} className="mt-1" />
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-3 border-t">
                    <Link
                      href="/admin/pilots"
                      className="text-sm font-medium text-green-600 hover:text-green-500 flex items-center justify-center"
                    >
                      View all pilot programs
                      <ArrowRightIcon className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<ChartBarIcon className="h-12 w-12 text-gray-400" />}
                  title="No pilot programs"
                  description="Create your first pilot program to get started."
                  action={{
                    label: 'Create Pilot',
                    onClick: () => window.location.href = '/admin/pilots/new',
                  }}
                />
              )}
            </div>
          </Card>

          {/* System Usage */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">System Usage</h2>
              <div className="space-y-4">
                {dashboardData?.usageStats?.usersByRole?.map((roleStat) => (
                  <div key={roleStat.role} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`h-3 w-3 rounded-full mr-2 ${
                        roleStat.role === 'admin' ? 'bg-red-500' :
                        roleStat.role === 'coordinator' ? 'bg-blue-500' :
                        'bg-green-500'
                      }`} />
                      <span className="text-sm text-gray-600 capitalize">{roleStat.role}s</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{roleStat.count}</span>
                  </div>
                ))}
                
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Activities This Month</span>
                    <span className="text-sm font-medium text-gray-900">
                      {dashboardData?.usageStats?.activitiesByMonth?.[0]?.count || 0}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full"
                      style={{ 
                        width: `${Math.min(
                          ((dashboardData?.usageStats?.activitiesByMonth?.[0]?.count || 0) / 100) * 100, 
                          100
                        )}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}