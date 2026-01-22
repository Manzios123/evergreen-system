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
import { exportsApi } from '@/lib/api/exports';
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
    totalActivities: 0,
    totalSurveys: 0,
    totalPhotos: 0,
    userGrowth: 0,
    activityGrowth: 0,
    surveyGrowth: 0,
    avgEngagement: 0,
  },
  userStats: {
    byRole: [],
    byStatus: [],
    byPilot: [],
    activeUsers: 0,
    newUsers: 0,
  },
  activityStats: {
    byStatus: [],
    byMonth: [],
    byPilot: [],
    bySchoolType: [],
    avgDuration: 0,
    totalHours: 0,
  },
  surveyStats: {
    byType: [],
    byStatus: [],
    completionRate: 0,
    avgRating: 0,
    responseTrends: [],
  },
  pilotStats: [],
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

  // User stats data
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

  // Pilot stats data
  const { 
    data: pilotStatsData, 
    isLoading: pilotStatsLoading, 
    error: pilotStatsError,
    refetch: refetchPilotStats
  } = useApiQuery(
    ['reports-pilot-stats', dateRange],
    () => reportsApi.getPilotStats({ dateRange })
  );

  // Build report data object from API responses
  const reportData = useMemo(() => {
    return {
      overview: {
        totalUsers: overviewData?.data?.totalUsers || 0,
        totalActivities: overviewData?.data?.totalActivities || 0,
        totalSurveys: overviewData?.data?.totalSurveys || 0,
        totalPhotos: overviewData?.data?.totalPhotos || 0,
        userGrowth: overviewData?.data?.userGrowth || 0,
        activityGrowth: overviewData?.data?.activityGrowth || 0,
        surveyGrowth: overviewData?.data?.surveyGrowth || 0,
        avgEngagement: overviewData?.data?.avgEngagement || 0,
      },
      userStats: {
        byRole: normalizeArray<any>(userStatsData?.data?.byRole),
        byStatus: normalizeArray<any>(userStatsData?.data?.byStatus),
        byPilot: normalizeArray<any>(userStatsData?.data?.byPilot),
        activeUsers: userStatsData?.data?.activeUsers || 0,
        newUsers: userStatsData?.data?.newUsers || 0,
      },
      activityStats: {
        byStatus: normalizeArray<any>(activityStatsData?.data?.byStatus),
        byMonth: normalizeArray<any>(activityStatsData?.data?.byMonth),
        byPilot: normalizeArray<any>(activityStatsData?.data?.byPilot),
        bySchoolType: normalizeArray<any>(activityStatsData?.data?.bySchoolType),
        avgDuration: activityStatsData?.data?.avgDuration || 0,
        totalHours: activityStatsData?.data?.totalHours || 0,
      },
      surveyStats: {
        byType: normalizeArray<any>(surveyStatsData?.data?.byType),
        byStatus: normalizeArray<any>(surveyStatsData?.data?.byStatus),
        completionRate: surveyStatsData?.data?.completionRate || 0,
        avgRating: surveyStatsData?.data?.avgRating || 0,
        responseTrends: normalizeArray<any>(surveyStatsData?.data?.responseTrends),
      },
      pilotStats: normalizeArray<any>(pilotStatsData?.data),
    };
  }, [overviewData, userStatsData, activityStatsData, surveyStatsData, pilotStatsData]);

  // Refetch all data when filters change
  useEffect(() => {
    refetchOverview();
    refetchUserStats();
    refetchActivityStats();
    refetchSurveyStats();
    refetchPilotStats();
  }, [dateRange, selectedPilot]);

  // Loading state - check if any query is loading
  const isLoading = pilotsLoading || overviewLoading || userStatsLoading || 
                   activityStatsLoading || surveyStatsLoading || pilotStatsLoading;

  // Error state - check if any query has error
  const hasError = pilotsError || overviewError || userStatsError || 
                  activityStatsError || surveyStatsError || pilotStatsError;

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
      // Use exports API to export report
      const result = await exportsApi.exportReports('monthly', {
        dateRange,
        pilotId: selectedPilot === 'all' ? undefined : selectedPilot,
      });
      
      if (result.data?.downloadUrl) {
        // Create a temporary link to download the file
        const link = document.createElement('a');
        link.href = result.data.downloadUrl;
        link.download = `report-${dateRange}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
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
                  {reportData.overview.userGrowth >= 0 ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${reportData.overview.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(reportData.overview.userGrowth)}% from last period
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
                  {reportData.overview.activityGrowth >= 0 ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${reportData.overview.activityGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(reportData.overview.activityGrowth)}% from last period
                  </span>
                </div>
              </div>
              <CalendarIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Surveys</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {reportData.overview.totalSurveys}
                </p>
                <div className="flex items-center mt-2">
                  {reportData.overview.surveyGrowth >= 0 ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${reportData.overview.surveyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(reportData.overview.surveyGrowth)}% from last period
                  </span>
                </div>
              </div>
              <DocumentTextIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg. Engagement</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {reportData.overview.avgEngagement}%
                </p>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${Math.min(reportData.overview.avgEngagement, 100)}%` }}
                  />
                </div>
              </div>
              <ChartBarIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
        </div>

        {/* Pilot Performance */}
        {reportData.pilotStats.length > 0 && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pilot Program Performance</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pilot Program
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Users
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Activities
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Schools
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completion
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Engagement
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.pilotStats.map((pilot: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                              <ChartBarIcon className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{pilot.pilot}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{pilot.users}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{pilot.activities}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{pilot.schools}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm text-gray-900 mr-2">{pilot.completionRate}%</div>
                            <div className="h-2 w-16 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${Math.min(pilot.completionRate, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm text-gray-900 mr-2">{pilot.engagement}%</div>
                            <div className="h-2 w-16 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${Math.min(pilot.engagement, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}

        {/* Activity Trends Chart */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Trends</h3>
            <div className="h-64">
              {reportData.activityStats.byMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.activityStats.byMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="month" 
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
                <p className="text-sm font-medium text-gray-500">Active Users</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {reportData.userStats.activeUsers}
                </p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">New Users</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {reportData.userStats.newUsers}
                </p>
              </div>
              <ArrowTrendingUpIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg. per Pilot</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {reportData.userStats.byPilot.length > 0
                    ? Math.round(
                        reportData.userStats.byPilot.reduce((sum: number, p: any) => sum + (p.value || 0), 0) /
                        reportData.userStats.byPilot.length
                      )
                    : 0}
                </p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
        </div>

        {/* User Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users by Role - Pie Chart */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Role</h3>
              <div className="h-64">
                {reportData.userStats.byRole.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.userStats.byRole}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomPieLabel}
                        outerRadius={80}
                        innerRadius={40}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {reportData.userStats.byRole.map((entry: any, index: number) => (
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
                    title="No role data"
                    description="No user role data available"
                    icon={<UserGroupIcon className="h-12 w-12 text-gray-400" />}
                  />
                )}
              </div>
            </div>
          </Card>

          {/* Users by Status - Bar Chart */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Status</h3>
              <div className="h-64">
                {reportData.userStats.byStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.userStats.byStatus}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="value" 
                        fill="#3b82f6" 
                        name="Users"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState
                    title="No status data"
                    description="No user status data available"
                    icon={<UserGroupIcon className="h-12 w-12 text-gray-400" />}
                  />
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Users by Pilot - Horizontal Bar Chart */}
        {reportData.userStats.byPilot.length > 0 && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Pilot Program</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={reportData.userStats.byPilot}
                    margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="value" 
                      fill="#10b981" 
                      name="Users"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
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
                <p className="text-sm font-medium text-gray-500">Total Hours</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {reportData.activityStats.totalHours}
                </p>
              </div>
              <ClockIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg. Duration</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {reportData.activityStats.avgDuration}h
                </p>
              </div>
              <CalendarIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Activities</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {reportData.activityStats.byStatus.reduce((sum: number, item: any) => sum + (item.value || 0), 0)}
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
                        dataKey="value"
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
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="value" 
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
        {reportData.activityStats.byMonth.length > 0 && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Activity Trends</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData.activityStats.byMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="month" 
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
                <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {reportData.surveyStats.completionRate}%
                </p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Average Rating</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {reportData.surveyStats.avgRating}/5
                </p>
              </div>
              <StarIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Response Trend</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {reportData.surveyStats.responseTrends[reportData.surveyStats.responseTrends.length - 1]?.count || 0}
                </p>
                <div className="flex items-center mt-2">
                  {reportData.surveyStats.responseTrends.length >= 2 ? (
                    <>
                      {reportData.surveyStats.responseTrends[reportData.surveyStats.responseTrends.length - 1]?.count >= 
                       reportData.surveyStats.responseTrends[reportData.surveyStats.responseTrends.length - 2]?.count ? (
                        <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-xs ${reportData.surveyStats.responseTrends[reportData.surveyStats.responseTrends.length - 1]?.count >= 
                        reportData.surveyStats.responseTrends[reportData.surveyStats.responseTrends.length - 2]?.count ? 'text-green-600' : 'text-red-600'}`}>
                        {reportData.surveyStats.responseTrends.length >= 2 ? 
                          Math.abs(reportData.surveyStats.responseTrends[reportData.surveyStats.responseTrends.length - 1]?.count - 
                                  reportData.surveyStats.responseTrends[reportData.surveyStats.responseTrends.length - 2]?.count) || 0 : 0} from last month
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-500">No trend data</span>
                  )}
                </div>
              </div>
              <ArrowTrendingUpIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
        </div>

        {/* Survey Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Surveys by Type - Pie Chart */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Surveys by Type</h3>
              <div className="h-64">
                {reportData.surveyStats.byType.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.surveyStats.byType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomPieLabel}
                        outerRadius={80}
                        innerRadius={40}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {reportData.surveyStats.byType.map((entry: any, index: number) => (
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
                    title="No type data"
                    description="No survey type data available"
                    icon={<DocumentTextIcon className="h-12 w-12 text-gray-400" />}
                  />
                )}
              </div>
            </div>
          </Card>

          {/* Survey Responses by Status - Bar Chart */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Survey Responses by Status</h3>
              <div className="h-64">
                {reportData.surveyStats.byStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.surveyStats.byStatus}>
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
                        fill="#f59e0b" 
                        name="Responses"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState
                    title="No status data"
                    description="No survey status data available"
                    icon={<DocumentTextIcon className="h-12 w-12 text-gray-400" />}
                  />
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Response Trends - Line Chart */}
        {reportData.surveyStats.responseTrends.length > 0 && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Trends Over Time</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData.surveyStats.responseTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Responses"
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
          >
            Export Report
          </Button>
        </div>
      </div>

      {/* Report Summary */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Report Summary</h2>
            <Button
              variant="outline"
              icon={<EyeIcon className="h-4 w-4" />}
              onClick={() => window.open('/admin/reports/full', '_blank')}
            >
              Full Report View
            </Button>
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
              <p className="text-sm font-medium text-gray-500">Data Points</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {reportData.overview.totalUsers + reportData.overview.totalActivities + reportData.overview.totalSurveys}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Last Updated</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {new Date().toLocaleDateString()}
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