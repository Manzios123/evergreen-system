// app/[locale]/admin/reports/page.tsx
'use client';

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import SearchFilter from '@/components/ui/search-filter';
import EmptyState from '@/components/ui/empty-state';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import Alert from '@/components/ui/alert';
import { Tabs } from '@/components/ui/tabs';
import { useApiQuery } from '@/lib/hooks/use-api';
import {
  ChartBarIcon,
  UserGroupIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ClockIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { useState, useMemo, useEffect } from 'react';
import { pilotsApi } from '@/lib/api/pilots';
import { reportsApi } from '@/lib/api/reports';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

// Chart colors
const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#6b7280'];

// Helper to normalize array data
const normalizeArray = <T,>(data: any): T[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.results && Array.isArray(data.results)) return data.results;
  if (data.data && Array.isArray(data.data)) return data.data;
  return [];
};

// Default empty data structure
const defaultReportData = {
  overview: {
    totalUsers: 0,
    activeUsers: 0,
    totalActivities: 0,
    activitiesByStatus: [] as Array<{ status: string; count: number }>,
    totalSurveyResponses: 0,
    totalPhotos: 0,
  },
  userStats: {
    byActiveStatus: [] as Array<{ status: string; count: number }>,
    byPilot: [] as Array<{ pilot: string; count: number }>,
    newUsersOverTime: [] as Array<{ date: string; count: number }>,
    totalUsers: 0,
  },
  activityStats: {
    totalActivities: 0,
    byStatus: [] as Array<{ status: string; count: number }>,
    activitiesOverTime: [] as Array<{ date: string; count: number }>,
    byPilot: [] as Array<{ pilot: string; count: number }>,
    byVolunteer: [] as Array<{ volunteer: string; count: number }>,
  },
  surveyStats: {
    student: {
      total: 0,
      overTime: [] as Array<{ date: string; count: number }>,
      byTemplate: [] as Array<{ template: string; count: number }>,
    },
    volunteer: {
      total: 0,
      overTime: [] as Array<{ date: string; count: number }>,
      byTemplate: [] as Array<{ template: string; count: number }>,
    },
    combinedTotal: 0,
  },
};

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'activities' | 'surveys'>('overview');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedPilot, setSelectedPilot] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all reports data with filters
  const { 
    data: pilotsData, 
    isLoading: pilotsLoading, 
    error: pilotsError,
    refetch: refetchPilots
  } = useApiQuery(
    ['pilots-for-reports'],
    () => pilotsApi.getPilots({ limit: 100 })
  );

  // Overview data
  const { 
    data: overviewData, 
    isLoading: overviewLoading, 
    error: overviewError,
    refetch: refetchOverview
  } = useApiQuery(
    ['reports-overview', dateRange, selectedPilot],
    () => reportsApi.getOverview({ 
      dateRange, 
      pilotId: selectedPilot === 'all' ? undefined : selectedPilot 
    })
  );

  // User stats data - Now using the actual API endpoint
  const { 
    data: userStatsData, 
    isLoading: userStatsLoading, 
    error: userStatsError,
    refetch: refetchUserStats
  } = useApiQuery(
    ['reports-user-stats', dateRange, selectedPilot],
    () => reportsApi.getUserStats({ 
      dateRange, 
      pilotId: selectedPilot === 'all' ? undefined : selectedPilot 
    })
  );

  // Activity stats data
  const { 
    data: activityStatsData, 
    isLoading: activityStatsLoading, 
    error: activityStatsError,
    refetch: refetchActivityStats
  } = useApiQuery(
    ['reports-activity-stats', dateRange, selectedPilot],
    () => reportsApi.getActivityStats({ 
      dateRange, 
      pilotId: selectedPilot === 'all' ? undefined : selectedPilot 
    })
  );

  // Survey stats data
  const { 
    data: surveyStatsData, 
    isLoading: surveyStatsLoading, 
    error: surveyStatsError,
    refetch: refetchSurveyStats
  } = useApiQuery(
    ['reports-survey-stats', dateRange, selectedPilot],
    () => reportsApi.getSurveyStats({ 
      dateRange, 
      pilotId: selectedPilot === 'all' ? undefined : selectedPilot 
    })
  );

  // Build report data object from API responses
  const reportData = useMemo(() => {
    return {
      overview: {
        totalUsers: overviewData?.data?.totalUsers || 0,
        activeUsers: overviewData?.data?.activeUsers || 0,
        totalActivities: overviewData?.data?.totalActivities || 0,
        activitiesByStatus: normalizeArray<{ status: string; count: number }>(overviewData?.data?.activitiesByStatus),
        totalSurveyResponses: overviewData?.data?.totalSurveyResponses || 0,
        totalPhotos: overviewData?.data?.totalPhotos || 0,
      },
      userStats: {
        byActiveStatus: normalizeArray<{ status: string; count: number }>(userStatsData?.data?.byActiveStatus),
        byPilot: normalizeArray<{ pilot: string; count: number }>(userStatsData?.data?.byPilot),
        newUsersOverTime: normalizeArray<{ date: string; count: number }>(userStatsData?.data?.newUsersOverTime),
        totalUsers: userStatsData?.data?.totalUsers || 0,
      },
      activityStats: {
        totalActivities: activityStatsData?.data?.totalActivities || 0,
        byStatus: normalizeArray<{ status: string; count: number }>(activityStatsData?.data?.byStatus),
        activitiesOverTime: normalizeArray<{ date: string; count: number }>(activityStatsData?.data?.activitiesOverTime),
        byPilot: normalizeArray<{ pilot: string; count: number }>(activityStatsData?.data?.byPilot),
        byVolunteer: normalizeArray<{ volunteer: string; count: number }>(activityStatsData?.data?.byVolunteer),
      },
      surveyStats: {
        student: {
          total: surveyStatsData?.data?.student?.total || 0,
          overTime: normalizeArray<{ date: string; count: number }>(surveyStatsData?.data?.student?.overTime),
          byTemplate: normalizeArray<{ template: string; count: number }>(surveyStatsData?.data?.student?.byTemplate),
        },
        volunteer: {
          total: surveyStatsData?.data?.volunteer?.total || 0,
          overTime: normalizeArray<{ date: string; count: number }>(surveyStatsData?.data?.volunteer?.overTime),
          byTemplate: normalizeArray<{ template: string; count: number }>(surveyStatsData?.data?.volunteer?.byTemplate),
        },
        combinedTotal: surveyStatsData?.data?.combinedTotal || 0,
      },
    };
  }, [overviewData, userStatsData, activityStatsData, surveyStatsData]);

  // Refetch all data when filters change
  useEffect(() => {
    refetchOverview();
    refetchUserStats();
    refetchActivityStats();
    refetchSurveyStats();
  }, [dateRange, selectedPilot]);

  // Loading state - check if any query is loading
  const isLoading = pilotsLoading || overviewLoading || userStatsLoading || 
                   activityStatsLoading || surveyStatsLoading;

  // Error state - check if any query has error
  const hasError = pilotsError || overviewError || userStatsError || 
                  activityStatsError || surveyStatsError;

  // Custom Tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom Pie chart label
  const renderCustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const handleSearch = (query: string) => {
    setSearchTerm(query);
  };

  const handleExportReport = async () => {
    try {
      alert('Export functionality is not available. Backend does not support /api/exports/reports endpoint.');
    } catch (error) {
      console.error('Failed to export report:', error);
      alert('Failed to export report. Please try again.');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <SkeletonLoader type="form"  />
            <SkeletonLoader type="card"  />
          </div>
          <div className="flex space-x-3">
            <SkeletonLoader type="table"/>
            <SkeletonLoader type="table"/>
            <SkeletonLoader type="table"/>
          </div>
        </div>
        <SkeletonLoader type="card"/>
        <SkeletonLoader type="card"/>
        <SkeletonLoader type="card"/>
      </div>
    );
  }

  if (hasError) {
    return (
      <Alert
        type="error"
        title="Unable to load reports data"
        onClose={() => window.location.reload()}
      >
        There was an error loading analytics data. Please try again.
      </Alert>
    );
  }

  // Overview tab content
  const overviewTab = {
    id: 'overview',
    label: 'Overview',
    icon: <ChartBarIcon className="h-5 w-5" />,
    content: (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {reportData.overview.totalUsers}
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-xs text-gray-500">
                    {reportData.overview.activeUsers} active users
                  </span>
                </div>
              </div>
              <UserGroupIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Activities</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {reportData.overview.totalActivities}
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-xs text-gray-500">
                    {reportData.activityStats.byStatus.length} status types
                  </span>
                </div>
              </div>
              <CalendarIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Survey Responses</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {reportData.overview.totalSurveyResponses}
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-xs text-gray-500">
                    {reportData.surveyStats.combinedTotal} combined total
                  </span>
                </div>
              </div>
              <DocumentTextIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Photos</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {reportData.overview.totalPhotos}
                </p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
        </div>

        {/* Activities by Status */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activities by Status</h3>
            <div className="h-64">
              {reportData.overview.activitiesByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.overview.activitiesByStatus}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="status" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="count" 
                      fill="#10b981" 
                      name="Activities"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  title="No activity data"
                  description="No activity data available for the selected period"
                  icon={<CalendarIcon className="h-12 w-12 text-gray-400" />}
                />
              )}
            </div>
          </div>
        </Card>
      </div>
    ),
  };

  // User statistics tab
  const usersTab = {
    id: 'users',
    label: 'Users',
    icon: <UserGroupIcon className="h-5 w-5" />,
    content: (
      <div className="space-y-6">
        {/* User Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {reportData.userStats.totalUsers}
                </p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Users</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {reportData.userStats.byActiveStatus.find(s => s.status === 'active')?.count || 0}
                </p>
              </div>
              <ArrowTrendingUpIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pilots</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {reportData.userStats.byPilot.length}
                </p>
              </div>
              <BuildingOfficeIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
        </div>

        {/* User Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users by Active Status - Pie Chart */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Status</h3>
              <div className="h-64">
                {reportData.userStats.byActiveStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.userStats.byActiveStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomPieLabel}
                        outerRadius={80}
                        innerRadius={40}
                        paddingAngle={2}
                        dataKey="count"
                      >
                        {reportData.userStats.byActiveStatus.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value) => <span className="text-sm">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState
                    title="No user status data"
                    description="No user status data available"
                    icon={<UserGroupIcon className="h-12 w-12 text-gray-400" />}
                  />
                )}
              </div>
            </div>
          </Card>

          {/* Users by Pilot - Bar Chart */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Pilot</h3>
              <div className="h-64">
                {reportData.userStats.byPilot.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.userStats.byPilot}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="pilot" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="count" 
                        fill="#8b5cf6" 
                        name="Users"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState
                    title="No pilot data"
                    description="No user data by pilot available"
                    icon={<BuildingOfficeIcon className="h-12 w-12 text-gray-400" />}
                  />
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* New Users Over Time - Line Chart */}
        {reportData.userStats.newUsersOverTime.length > 0 && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">New Users Over Time</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData.userStats.newUsersOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="New Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        )}
      </div>
    ),
  };

  // Activity statistics tab
  const activitiesTab = {
    id: 'activities',
    label: 'Activities',
    icon: <CalendarIcon className="h-5 w-5" />,
    content: (
      <div className="space-y-6">
        {/* Activity Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Activities</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {reportData.activityStats.totalActivities}
                </p>
              </div>
              <CalendarIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Status Types</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {reportData.activityStats.byStatus.length}
                </p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pilots</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {reportData.activityStats.byPilot.length}
                </p>
              </div>
              <BuildingOfficeIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
        </div>

        {/* Activity Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activities by Status - Pie Chart */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activities by Status</h3>
              <div className="h-64">
                {reportData.activityStats.byStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.activityStats.byStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomPieLabel}
                        outerRadius={80}
                        innerRadius={40}
                        paddingAngle={2}
                        dataKey="count"
                      >
                        {reportData.activityStats.byStatus.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value) => <span className="text-sm">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState
                    title="No status data"
                    description="No activity status data available"
                    icon={<CalendarIcon className="h-12 w-12 text-gray-400" />}
                  />
                )}
              </div>
            </div>
          </Card>

          {/* Activities by Pilot - Bar Chart */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activities by Pilot</h3>
              <div className="h-64">
                {reportData.activityStats.byPilot.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.activityStats.byPilot}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="pilot" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="count" 
                        fill="#8b5cf6" 
                        name="Activities"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState
                    title="No pilot data"
                    description="No activity data by pilot available"
                    icon={<BuildingOfficeIcon className="h-12 w-12 text-gray-400" />}
                  />
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Monthly Activity Trends - Line Chart */}
        {reportData.activityStats.activitiesOverTime.length > 0 && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Trends Over Time</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData.activityStats.activitiesOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Activities"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        )}
      </div>
    ),
  };

  // Survey statistics tab
  const surveysTab = {
    id: 'surveys',
    label: 'Surveys',
    icon: <DocumentTextIcon className="h-5 w-5" />,
    content: (
      <div className="space-y-6">
        {/* Survey Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Student Surveys</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {reportData.surveyStats.student.total}
                </p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Volunteer Surveys</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {reportData.surveyStats.volunteer.total}
                </p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Surveys</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {reportData.surveyStats.combinedTotal}
                </p>
              </div>
              <ArrowTrendingUpIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
        </div>

        {/* Survey Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Student Surveys by Template */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Surveys by Template</h3>
              <div className="h-64">
                {reportData.surveyStats.student.byTemplate.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.surveyStats.student.byTemplate}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="template" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="count" 
                        fill="#10b981" 
                        name="Surveys"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState
                    title="No template data"
                    description="No student survey template data available"
                    icon={<DocumentTextIcon className="h-12 w-12 text-gray-400" />}
                  />
                )}
              </div>
            </div>
          </Card>

          {/* Volunteer Surveys by Template */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Volunteer Surveys by Template</h3>
              <div className="h-64">
                {reportData.surveyStats.volunteer.byTemplate.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.surveyStats.volunteer.byTemplate}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="template" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="count" 
                        fill="#3b82f6" 
                        name="Surveys"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState
                    title="No template data"
                    description="No volunteer survey template data available"
                    icon={<DocumentTextIcon className="h-12 w-12 text-gray-400" />}
                  />
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Student Survey Trends - Line Chart */}
        {reportData.surveyStats.student.overTime.length > 0 && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Survey Trends</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData.surveyStats.student.overTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Student Surveys"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        )}
      </div>
    ),
  };

  const tabs = [
    overviewTab,
    usersTab,
    activitiesTab,
    surveysTab,
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            System-wide analytics and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          
          <select
            value={selectedPilot}
            onChange={(e) => setSelectedPilot(e.target.value)}
            className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="all">All Pilot Programs</option>
            {normalizeArray<any>(pilotsData?.data).map((pilot: any) => (
              <option key={pilot.id} value={pilot.id}>{pilot.name}</option>
            ))}
          </select>
          
          <Button
            variant="default"
            icon={<ArrowDownTrayIcon className="h-4 w-4" />}
            onClick={handleExportReport}
            disabled
            title="Export functionality not available"
          >
            Export Report (Disabled)
          </Button>
        </div>
      </div>

      {/* Report Summary */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Report Summary</h2>
            <Alert type="info">
              All features now available with backend fixes
            </Alert>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Period</p>
              <p className="text-lg font-semibold text-gray-900 mt-1 capitalize">{dateRange}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Scope</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {selectedPilot === 'all' ? 'All Pilots' : 
                  normalizeArray<any>(pilotsData?.data).find((p: any) => p.id === selectedPilot)?.name || 'Unknown Pilot'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Total Activities</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {reportData.overview.totalActivities}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Total Surveys</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {reportData.overview.totalSurveyResponses}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Search and Filters */}
      <Card>
        <div className="p-4">
          <SearchFilter
            onSearch={handleSearch}
            placeholder="Search reports..."
          />
        </div>
      </Card>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as any)}
        variant="underline"
      />
    </div>
  );
}