// app/[locale]/coordinator/dashboard/page.tsx
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
import { Activity, User, School, Survey } from '@/lib/types';
import {
  Calendar,
  Users,
  Building,
  FileText,
  Image as PhotoIcon,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Plus,
  Eye,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { api } from '@/lib/api/api';
import { useRouter } from 'next/navigation';

export default function CoordinatorDashboardPage() {
  const router = useRouter();
  
  // Fetch dashboard data
  const { 
    data: dashboardData, 
    isLoading, 
    error, 
    refetch 
  } = useApiQuery<{
    stats: {
      totalActivities: number;
      pendingApprovals: number;
      totalVolunteers: number;
      totalSchools: number;
      completedActivities: number;
      pendingSurveys: number;
      totalPhotos: number;
      volunteerHours: number;
    };
    recentActivities: Activity[];
    pendingApprovals: Activity[];
    upcomingActivities: Activity[];
    volunteerStats: {
      topVolunteers: User[];
      engagementRate: number;
    };
    schoolStats: {
      topSchools: School[];
      activitiesBySchool: Array<{ school: School; count: number }>;
    };
    surveyStats: {
      pendingSurveys: Survey[];
      completionRate: number;
    };
  }>(
    ['coordinator-dashboard'],
    () => api.get('/dashboard/coordinator')
  );

  // Calculate derived stats
  const stats = useMemo(() => {
    if (!dashboardData) return null;

    const {
      stats: baseStats,
      recentActivities,
      pendingApprovals,
      volunteerStats,
      schoolStats,
      surveyStats,
    } = dashboardData;

    // Calculate completion rate
    const completionRate = baseStats.totalActivities > 0
      ? Math.round((baseStats.completedActivities / baseStats.totalActivities) * 100)
      : 0;

    // Calculate average activities per volunteer
    const avgActivitiesPerVolunteer = baseStats.totalVolunteers > 0
      ? (baseStats.totalActivities / baseStats.totalVolunteers).toFixed(1)
      : '0.0';

    // Calculate average volunteer hours
    const avgVolunteerHours = baseStats.totalVolunteers > 0
      ? (baseStats.volunteerHours / baseStats.totalVolunteers).toFixed(1)
      : '0.0';

    return {
      ...baseStats,
      completionRate,
      avgActivitiesPerVolunteer,
      avgVolunteerHours,
      urgentApprovals: pendingApprovals.filter(activity => {
        const daysAgo = Math.floor(
          (new Date().getTime() - new Date(activity.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysAgo > 3;
      }).length,
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
        type="error"
        title="Unable to load dashboard"
      >
        There was an error loading your dashboard data. Please try again.
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coordinator Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your pilot program's activities and progress
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => router.push('/coordinator/approvals')}
            icon={<Eye className="h-4 w-4" />}
          >
            Review Approvals
          </Button>
          <Button
            variant="default"
            onClick={() => router.push('/coordinator/assign')}
            icon={<Plus className="h-4 w-4" />}
          >
            Assign Activity
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Activities</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalActivities}
                </p>
                <div className="flex items-center mt-2">
                  <Progress value={stats.completionRate} className="flex-1 mr-2" />
                  <span className="text-xs text-gray-500">{stats.completionRate}% complete</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {stats.pendingApprovals}
                </p>
                {stats.urgentApprovals > 0 && (
                  <div className="flex items-center mt-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-xs text-red-600">{stats.urgentApprovals} urgent</span>
                  </div>
                )}
              </div>
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Volunteers</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {stats.totalVolunteers}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Avg. {stats.avgActivitiesPerVolunteer} activities each
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Volunteer Hours</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {stats.volunteerHours}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Avg. {stats.avgVolunteerHours} hours per volunteer
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Activities */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Activities */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
                <Link
                  href="/coordinator/activities"
                  className="text-sm font-medium text-green-600 hover:text-green-500 flex items-center"
                >
                  View all
                  <ArrowRight className="h-4 w-4 ml-1" />
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
                          <div className="ml-2">
                            <StatusBadge status={activity.status} />
                          </div>
                        </div>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <Building className="h-3 w-3 mr-1" />
                          <span className="truncate">{activity.school?.name}</span>
                          <span className="mx-2">•</span>
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{format(new Date(activity.scheduled_date), 'MMM d')}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/coordinator/activities/${activity.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Calendar className="h-8 w-8 text-gray-400" />}
                  title="No recent activities"
                  description="Activities will appear here once assigned and completed."
                  action={{
                    label: 'Assign First Activity',
                    onClick: () => router.push('/coordinator/assign'),
                  }}
                />
              )}
            </div>
          </Card>

          {/* Pending Approvals */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
                <Link
                  href="/coordinator/approvals"
                  className="text-sm font-medium text-green-600 hover:text-green-500 flex items-center"
                >
                  Review all
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              
              {dashboardData?.pendingApprovals && dashboardData.pendingApprovals.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.pendingApprovals.slice(0, 5).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center">
                          <p className="font-medium text-gray-900 truncate">{activity.title}</p>
                          <span className="ml-2 text-xs font-medium text-yellow-800 bg-yellow-100 px-2 py-1 rounded">
                            Awaiting Review
                          </span>
                        </div>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <Users className="h-3 w-3 mr-1" />
                          <span>{activity.volunteer?.full_name}</span>
                          <span className="mx-2">•</span>
                          <Clock className="h-3 w-3 mr-1" />
                          <span>
                            {Math.floor(
                              (new Date().getTime() - new Date(activity.created_at).getTime()) / (1000 * 60 * 60 * 24)
                            )} days ago
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => router.push(`/coordinator/activities/${activity.id}`)}
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<CheckCircle className="h-8 w-8 text-gray-400" />}
                  title="No pending approvals"
                  description="All submissions have been reviewed and approved."
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/coordinator/assign')}
                  icon={<Plus className="h-5 w-5" />}
                >
                  Assign New Activity
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/coordinator/volunteers/invite')}
                  icon={<Users className="h-5 w-5" />}
                >
                  Invite Volunteer
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/coordinator/schools/new')}
                  icon={<Building className="h-5 w-5" />}
                >
                  Add School
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/coordinator/exports')}
                  icon={<TrendingUp className="h-5 w-5" />}
                >
                  Export Data
                </Button>
              </div>
            </div>
          </Card>

          {/* Top Volunteers */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Volunteers</h2>
              
              {dashboardData?.volunteerStats.topVolunteers && dashboardData.volunteerStats.topVolunteers.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.volunteerStats.topVolunteers.slice(0, 3).map((volunteer, index) => (
                    <div
                      key={volunteer.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center">
                        <div className="shrink-0 mr-3">
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-600 font-medium text-sm">
                              {volunteer.full_name?.charAt(0) || 'V'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{volunteer.full_name}</p>
                          <p className="text-xs text-gray-500">
                            {volunteer.email}
                          </p>
                        </div>
                      </div>
                      {index === 0 && (
                        <span className="text-xs font-medium bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          #1
                        </span>
                      )}
                    </div>
                  ))}
                  
                  <div className="pt-3 border-t">
                    <Link
                      href="/coordinator/volunteers"
                      className="text-sm font-medium text-green-600 hover:text-green-500 flex items-center justify-center"
                    >
                      View all volunteers
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<Users className="h-8 w-8 text-gray-400" />}
                  title="No volunteers yet"
                  description="Invite volunteers to get started."
                  action={{
                    label: 'Invite Volunteers',
                    onClick: () => router.push('/coordinator/volunteers/invite'),
                  }}
                />
              )}
            </div>
          </Card>

          {/* Activity Summary */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-green-500 mr-2" />
                    <span className="text-sm text-gray-600">Completed</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {stats?.completedActivities || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-blue-500 mr-2" />
                    <span className="text-sm text-gray-600">Scheduled</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {dashboardData?.upcomingActivities?.length || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2" />
                    <span className="text-sm text-gray-600">Pending Approval</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {stats?.pendingApprovals || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-red-500 mr-2" />
                    <span className="text-sm text-gray-600">Overdue</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {stats?.urgentApprovals || 0}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Upcoming Activities */}
      {dashboardData?.upcomingActivities && dashboardData.upcomingActivities.length > 0 && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Activities</h2>
              <Link
                href="/coordinator/activities?status=scheduled"
                className="text-sm font-medium text-green-600 hover:text-green-500 flex items-center"
              >
                View all upcoming
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      School
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Volunteer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dashboardData.upcomingActivities.slice(0, 5).map((activity) => (
                    <tr key={activity.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link
                          href={`/coordinator/activities/${activity.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-green-600"
                        >
                          {activity.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{activity.school?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{activity.volunteer?.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {format(new Date(activity.scheduled_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={activity.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}