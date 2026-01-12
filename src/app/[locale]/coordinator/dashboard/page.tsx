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
import { useParams } from 'next/navigation';

export default function CoordinatorDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  
  // Fetch dashboard data
  const { 
    data: dashboardData, 
    isLoading, 
    error, 
    refetch 
  } = useApiQuery<{
    pilot: {
      id: string;
      name: string;
      description: string;
      status: string;
    };
    statistics: {
      pendingApprovals: number;
      activityStatus: {
        approved: number;
        draft: number;
        rejected: number;
      };
      volunteers: {
        total_volunteers: number;
        active_volunteers: number;
        recent_volunteers: number;
      };
      surveys: {
        activitySurveys: {
          completed: number;
          total: number;
          completion_rate: number;
          recent_completion_rate: number;
        };
        studentSurveys: {
          total_surveys: number;
          total_students: number;
        };
      };
    };
    recentPendingActivities: Activity[];
    alerts: Array<{
      type: string;
      message: string;
    }>;
  }>(
    ['coordinator-dashboard'],
    () => api.get('/dashboard/coordinator')
  );

  // Calculate derived stats
  const stats = useMemo(() => {
    if (!dashboardData) return null;

    const { statistics } = dashboardData;

    // Calculate total activities from activityStatus
    const totalActivities = 
      (statistics.activityStatus?.approved || 0) + 
      (statistics.activityStatus?.draft || 0) + 
      (statistics.activityStatus?.rejected || 0);

    // Calculate completion rate
    const completionRate = statistics.surveys?.activitySurveys?.completion_rate || 0;

    // Calculate survey completion info
    const pendingSurveys = 
      (statistics.surveys?.activitySurveys?.total || 0) - 
      (statistics.surveys?.activitySurveys?.completed || 0);

    return {
      totalActivities,
      pendingApprovals: statistics.pendingApprovals || 0,
      totalVolunteers: statistics.volunteers?.total_volunteers || 0,
      activeVolunteers: statistics.volunteers?.active_volunteers || 0,
      completedActivities: statistics.activityStatus?.approved || 0,
      draftActivities: statistics.activityStatus?.draft || 0,
      rejectedActivities: statistics.activityStatus?.rejected || 0,
      pendingSurveys,
      surveyCompletionRate: completionRate,
      completionRate,
      urgentApprovals: 0, // Calculate if you have date data
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
            {dashboardData?.pilot?.name || 'Pilot Program Dashboard'}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/${locale}/coordinator/approvals`)}
            icon={<Eye className="h-4 w-4" />}
          >
            Review Approvals
          </Button>
          <Button
            variant="default"
            onClick={() => router.push(`/${locale}/coordinator/assign`)}
            icon={<Plus className="h-4 w-4" />}
          >
            Assign Activity
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {dashboardData?.alerts && dashboardData.alerts.length > 0 && (
        <div className="space-y-2">
          {dashboardData.alerts.map((alert, index) => (
            <Alert
              key={index}
              type={alert.type as any}
              title={alert.type === 'info' ? 'Information' : 
                     alert.type === 'warning' ? 'Warning' : 
                     alert.type === 'error' ? 'Error' : 'Notice'}
            >
              {alert.message}
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
                  {stats.activeVolunteers} active
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
                <p className="text-sm font-medium text-gray-500">Surveys</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {stats.pendingSurveys} pending
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {stats.surveyCompletionRate}% completion rate
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Activities */}
        <div className="lg:col-span-2 space-y-6">
          {/* Activity Status Summary */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Status</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Approved Activities</p>
                      <p className="text-sm text-gray-500">Completed and approved activities</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    {stats?.completedActivities || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Draft Activities</p>
                      <p className="text-sm text-gray-500">Activities in draft status</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    {stats?.draftActivities || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Rejected Activities</p>
                      <p className="text-sm text-gray-500">Activities that were rejected</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-red-600">
                    {stats?.rejectedActivities || 0}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Pending Approvals */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
                <Link
                  href={`/${locale}/coordinator/approvals`}
                  className="text-sm font-medium text-green-600 hover:text-green-500 flex items-center"
                >
                  Review all
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              
              {dashboardData?.recentPendingActivities && dashboardData.recentPendingActivities.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recentPendingActivities.slice(0, 5).map((activity) => (
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
                        {activity.volunteer && (
                          <div className="flex items-center mt-1 text-sm text-gray-500">
                            <Users className="h-3 w-3 mr-1" />
                            <span>{activity.volunteer?.full_name}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => router.push(`/${locale}/coordinator/activities/${activity.id}`)}
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
                  onClick={() => router.push(`/${locale}/coordinator/assign`)}
                  icon={<Plus className="h-5 w-5" />}
                >
                  Assign New Activity
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/${locale}/coordinator/volunteers/invite`)}
                  icon={<Users className="h-5 w-5" />}
                >
                  Invite Volunteer
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/${locale}/coordinator/schools/new`)}
                  icon={<Building className="h-5 w-5" />}
                >
                  Add School
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/${locale}/coordinator/exports`)}
                  icon={<TrendingUp className="h-5 w-5" />}
                >
                  Export Data
                </Button>
              </div>
            </div>
          </Card>

          {/* Survey Status */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Survey Status</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Activity Surveys</span>
                    <span className="text-sm text-gray-500">
                      {dashboardData?.statistics.surveys.activitySurveys.completed || 0}/
                      {dashboardData?.statistics.surveys.activitySurveys.total || 0}
                    </span>
                  </div>
                  <Progress 
                    value={dashboardData?.statistics.surveys.activitySurveys.completion_rate || 0} 
                    className="h-2"
                  />
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Student Surveys</p>
                      <p className="text-xs text-gray-500">
                        {dashboardData?.statistics.surveys.studentSurveys.total_students || 0} students
                      </p>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {dashboardData?.statistics.surveys.studentSurveys.total_surveys || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Pilot Info */}
          {dashboardData?.pilot && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Pilot Information</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{dashboardData.pilot.name}</p>
                    <p className="text-sm text-gray-500 mt-1">{dashboardData.pilot.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`text-sm font-medium px-2 py-1 rounded ${
                      dashboardData.pilot.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {dashboardData.pilot.status}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}