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
import { useState, useMemo } from 'react';
import { pilotsApi } from '@/lib/api/pilots';
import { exportsApi } from '@/lib/api/exports';
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

// Mock data for reports (to be replaced with actual API)
const mockReportData = {
  overview: {
    totalUsers: 125,
    totalActivities: 345,
    totalSurveys: 89,
    totalPhotos: 567,
    userGrowth: 12,
    activityGrowth: 8,
    surveyGrowth: -3,
    avgEngagement: 78,
  },
  userStats: {
    byRole: [
      { name: 'Volunteer', value: 85, growth: 10 },
      { name: 'Coordinator', value: 25, growth: 5 },
      { name: 'Admin', value: 15, growth: 2 },
    ],
    byStatus: [
      { name: 'Active', value: 100 },
      { name: 'Inactive', value: 25 },
    ],
    byPilot: [
      { name: 'Kigali Pilot', value: 45 },
      { name: 'Northern Pilot', value: 35 },
      { name: 'Southern Pilot', value: 30 },
      { name: 'Eastern Pilot', value: 15 },
    ],
    activeUsers: 100,
    newUsers: 15,
  },
  activityStats: {
    byStatus: [
      { name: 'Completed', value: 200 },
      { name: 'In Progress', value: 85 },
      { name: 'Pending', value: 40 },
      { name: 'Cancelled', value: 20 },
    ],
    byMonth: [
      { month: 'Jan', count: 25 },
      { month: 'Feb', count: 30 },
      { month: 'Mar', count: 40 },
      { month: 'Apr', count: 35 },
      { month: 'May', count: 50 },
      { month: 'Jun', count: 55 },
    ],
    byPilot: [
      { name: 'Kigali Pilot', value: 120 },
      { name: 'Northern Pilot', value: 95 },
      { name: 'Southern Pilot', value: 80 },
      { name: 'Eastern Pilot', value: 50 },
    ],
    bySchoolType: [
      { type: 'Primary', count: 150 },
      { type: 'Secondary', count: 120 },
      { type: 'Vocational', count: 50 },
      { type: 'University', count: 25 },
    ],
    avgDuration: 3.5,
    totalHours: 1207,
  },
  surveyStats: {
    byType: [
      { name: 'Student Feedback', value: 35 },
      { name: 'Volunteer Experience', value: 30 },
      { name: 'Activity Evaluation', value: 20 },
      { name: 'Program Satisfaction', value: 4 },
    ],
    byStatus: [
      { status: 'Submitted', count: 65 },
      { status: 'Pending', count: 20 },
      { status: 'Draft', count: 4 },
    ],
    completionRate: 73,
    avgRating: 4.2,
    responseTrends: [
      { month: 'Jan', count: 10 },
      { month: 'Feb', count: 12 },
      { month: 'Mar', count: 15 },
      { month: 'Apr', count: 18 },
      { month: 'May', count: 20 },
      { month: 'Jun', count: 14 },
    ],
  },
  pilotStats: [
    {
      pilot: 'Kigali Pilot',
      users: 45,
      activities: 120,
      schools: 15,
      completionRate: 85,
      engagement: 78,
    },
    {
      pilot: 'Northern Pilot',
      users: 35,
      activities: 95,
      schools: 12,
      completionRate: 80,
      engagement: 72,
    },
    {
      pilot: 'Southern Pilot',
      users: 30,
      activities: 80,
      schools: 10,
      completionRate: 75,
      engagement: 68,
    },
    {
      pilot: 'Eastern Pilot',
      users: 15,
      activities: 50,
      schools: 8,
      completionRate: 70,
      engagement: 65,
    },
  ],
};

// Chart colors
const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#6b7280'];

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'activities' | 'surveys'>('overview');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedPilot, setSelectedPilot] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch pilots for filter
  const { 
    data: pilotsData, 
    isLoading: pilotsLoading, 
    error: pilotsError 
  } = useApiQuery<any>(
    ['pilots-for-reports'],
    () => pilotsApi.getPilots({ limit: 100 })
  );

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
  if (pilotsLoading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="card" />
        <SkeletonLoader type="card" />
      </div>
    );
  }

  if (pilotsError) {
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
                  {mockReportData.overview.totalUsers}
                </p>
                <div className="flex items-center mt-2">
                  {mockReportData.overview.userGrowth >= 0 ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${mockReportData.overview.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(mockReportData.overview.userGrowth)}% from last period
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
                  {mockReportData.overview.totalActivities}
                </p>
                <div className="flex items-center mt-2">
                  {mockReportData.overview.activityGrowth >= 0 ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${mockReportData.overview.activityGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(mockReportData.overview.activityGrowth)}% from last period
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
                  {mockReportData.overview.totalSurveys}
                </p>
                <div className="flex items-center mt-2">
                  {mockReportData.overview.surveyGrowth >= 0 ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${mockReportData.overview.surveyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(mockReportData.overview.surveyGrowth)}% from last period
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
                  {mockReportData.overview.avgEngagement}%
                </p>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${mockReportData.overview.avgEngagement}%` }}
                  />
                </div>
              </div>
              <ChartBarIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
        </div>

        {/* Pilot Performance */}
        {mockReportData.pilotStats.length > 0 && (
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
                    {mockReportData.pilotStats.map((pilot, index) => (
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
                                style={{ width: `${pilot.completionRate}%` }}
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
                                style={{ width: `${pilot.engagement}%` }}
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
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockReportData.activityStats.byMonth}>
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
                  {mockReportData.userStats.activeUsers}
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
                  {mockReportData.userStats.newUsers}
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
                  {mockReportData.userStats.byPilot.length > 0
                    ? Math.round(
                        mockReportData.userStats.byPilot.reduce((sum, p) => sum + p.value, 0) /
                        mockReportData.userStats.byPilot.length
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
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockReportData.userStats.byRole}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomPieLabel}
                      outerRadius={80}
                      innerRadius={40}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {mockReportData.userStats.byRole.map((entry, index) => (
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
              </div>
            </div>
          </Card>

          {/* Users by Status - Bar Chart */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Status</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockReportData.userStats.byStatus}>
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
              </div>
            </div>
          </Card>
        </div>

        {/* Users by Pilot - Horizontal Bar Chart */}
        {mockReportData.userStats.byPilot.length > 0 && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Pilot Program</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={mockReportData.userStats.byPilot}
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
                  {mockReportData.activityStats.totalHours}
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
                  {mockReportData.activityStats.avgDuration}h
                </p>
              </div>
              <CalendarIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Schools Covered</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {mockReportData.activityStats.bySchoolType.length}
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
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockReportData.activityStats.byStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomPieLabel}
                      outerRadius={80}
                      innerRadius={40}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {mockReportData.activityStats.byStatus.map((entry, index) => (
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
              </div>
            </div>
          </Card>

          {/* Activities by School Type - Bar Chart */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activities by School Type</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockReportData.activityStats.bySchoolType}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="type" 
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
              </div>
            </div>
          </Card>
        </div>

        {/* Monthly Activity Trends - Line Chart */}
        {mockReportData.activityStats.byMonth.length > 0 && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Activity Trends</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockReportData.activityStats.byMonth}>
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
                  {mockReportData.surveyStats.completionRate}%
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
                  {mockReportData.surveyStats.avgRating}/5
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
                  {mockReportData.surveyStats.responseTrends[mockReportData.surveyStats.responseTrends.length - 1]?.count || 0}
                </p>
                <div className="flex items-center mt-2">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">+12% from last month</span>
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
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockReportData.surveyStats.byType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomPieLabel}
                      outerRadius={80}
                      innerRadius={40}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {mockReportData.surveyStats.byType.map((entry, index) => (
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
              </div>
            </div>
          </Card>

          {/* Survey Responses by Status - Bar Chart */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Survey Responses by Status</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockReportData.surveyStats.byStatus}>
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
              </div>
            </div>
          </Card>
        </div>

        {/* Response Trends - Line Chart */}
        {mockReportData.surveyStats.responseTrends.length > 0 && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Trends Over Time</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockReportData.surveyStats.responseTrends}>
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
            {pilotsData?.data?.map((pilot: any) => (
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
                {selectedPilot === 'all' ? 'All Pilots' : pilotsData?.data?.find((p: any) => p.id === selectedPilot)?.name}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Data Points</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {mockReportData.overview.totalUsers + mockReportData.overview.totalActivities + mockReportData.overview.totalSurveys}
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