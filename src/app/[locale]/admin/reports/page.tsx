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
  AcademicCapIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentIcon,
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
  AreaChart,
  Area,
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
    total_schools: 0,
    total_volunteers: 0,
    total_student_submissions: 0,
    total_volunteer_submissions: 0,
    submissions_last_7_days: 0,
    activities_total: 0,
    activities_by_status: [] as Array<{ status: string; count: number }>,
    media_total: 0,
    media_by_type: [] as Array<{ media_type: string; count: number }>,
  },
  schoolSubmissions: [] as Array<{
    school_id: string;
    school_name: string;
    student_submissions: number;
    volunteer_submissions: number;
    total_students_sum: number;
  }>,
  dailySubmissions: {
    daily_student_submissions: [] as Array<{ date: string; count: number }>,
    daily_volunteer_submissions: [] as Array<{ date: string; count: number }>,
  },
  assignmentFlow: {
    assignment_status: [] as Array<{ status: string; count: number }>,
    overdue_count: 0,
  },
};

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

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'schools' | 'daily' | 'assignments'>('overview');
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

  // School submissions data
  const { 
    data: schoolSubmissionsData, 
    isLoading: schoolSubmissionsLoading, 
    error: schoolSubmissionsError,
    refetch: refetchSchoolSubmissions
  } = useApiQuery(
    ['reports-school-submissions', dateRange, selectedPilot],
    () => reportsApi.getSchoolSubmissions({ 
      dateRange, 
      pilotId: selectedPilot === 'all' ? undefined : selectedPilot 
    })
  );

  // Daily submissions data
  const { 
    data: dailySubmissionsData, 
    isLoading: dailySubmissionsLoading, 
    error: dailySubmissionsError,
    refetch: refetchDailySubmissions
  } = useApiQuery(
    ['reports-daily-submissions', dateRange, selectedPilot],
    () => reportsApi.getDailySubmissions({ 
      dateRange, 
      pilotId: selectedPilot === 'all' ? undefined : selectedPilot 
    })
  );

  // Assignment flow data
  const { 
    data: assignmentFlowData, 
    isLoading: assignmentFlowLoading, 
    error: assignmentFlowError,
    refetch: refetchAssignmentFlow
  } = useApiQuery(
    ['reports-assignment-flow', selectedPilot],
    () => reportsApi.getAssignmentFlow({ 
      pilotId: selectedPilot === 'all' ? undefined : selectedPilot 
    })
  );

  // Build report data object from API responses
  const reportData = useMemo(() => {
    return {
      overview: {
        total_schools: overviewData?.data?.total_schools || 0,
        total_volunteers: overviewData?.data?.total_volunteers || 0,
        total_student_submissions: overviewData?.data?.total_student_submissions || 0,
        total_volunteer_submissions: overviewData?.data?.total_volunteer_submissions || 0,
        submissions_last_7_days: overviewData?.data?.submissions_last_7_days || 0,
        activities_total: overviewData?.data?.activities_total || 0,
        activities_by_status: normalizeArray<{ status: string; count: number }>(overviewData?.data?.activities_by_status),
        media_total: overviewData?.data?.media_total || 0,
        media_by_type: normalizeArray<{ media_type: string; count: number }>(overviewData?.data?.media_by_type),
      },
      schoolSubmissions: normalizeArray<any>(schoolSubmissionsData?.data) || [],
      dailySubmissions: {
        daily_student_submissions: normalizeArray<{ date: string; count: number }>(
          dailySubmissionsData?.data?.daily_student_submissions
        ),
        daily_volunteer_submissions: normalizeArray<{ date: string; count: number }>(
          dailySubmissionsData?.data?.daily_volunteer_submissions
        ),
      },
      assignmentFlow: {
        assignment_status: normalizeArray<{ status: string; count: number }>(
          assignmentFlowData?.data?.assignment_status
        ),
        overdue_count: assignmentFlowData?.data?.overdue_count || 0,
      },
    };
  }, [overviewData, schoolSubmissionsData, dailySubmissionsData, assignmentFlowData]);

  // Refetch all data when filters change
  useEffect(() => {
    refetchOverview();
    refetchSchoolSubmissions();
    refetchDailySubmissions();
    refetchAssignmentFlow();
  }, [dateRange, selectedPilot]);

  // Loading state - check if any query is loading
  const isLoading = pilotsLoading || overviewLoading || schoolSubmissionsLoading || 
                   dailySubmissionsLoading || assignmentFlowLoading;

  // Error state - check if any query has error
  const hasError = pilotsError || overviewError || schoolSubmissionsError || 
                  dailySubmissionsError || assignmentFlowError;

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

  // Filter school submissions by search term
  const filteredSchoolSubmissions = useMemo(() => {
    if (!searchTerm) return reportData.schoolSubmissions;
    return reportData.schoolSubmissions.filter(school =>
      school.school_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [reportData.schoolSubmissions, searchTerm]);

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
                <p className="text-sm font-medium text-gray-500">Total Schools</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {reportData.overview.total_schools}
                </p>
              </div>
              <AcademicCapIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Volunteers</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {reportData.overview.total_volunteers}
                </p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Student Submissions</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {reportData.overview.total_student_submissions}
                </p>
              </div>
              <DocumentTextIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Volunteer Submissions</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {reportData.overview.total_volunteer_submissions}
                </p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Last 7 Days Submissions</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">
                  {reportData.overview.submissions_last_7_days}
                </p>
              </div>
              <ArrowTrendingUpIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Activities</p>
                <p className="text-2xl font-bold text-pink-600 mt-1">
                  {reportData.overview.activities_total}
                </p>
              </div>
              <CalendarIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Media</p>
                <p className="text-2xl font-bold text-cyan-600 mt-1">
                  {reportData.overview.media_total}
                </p>
              </div>
              <PhotoIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
        </div>

        {/* Activities by Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activities by Status</h3>
              <div className="h-64">
                {reportData.overview.activities_by_status.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.overview.activities_by_status}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomPieLabel}
                        outerRadius={80}
                        innerRadius={40}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="status" // Fix: use status field for legend labels
                      >
                        {reportData.overview.activities_by_status.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value, entry) => {
                          // Ensure we display the status string, not "count"
                          return <span className="text-sm">{value}</span>;
                        }}
                      />
                    </PieChart>
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

          {/* Media by Type */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Media by Type</h3>
              <div className="h-64">
                {reportData.overview.media_by_type.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.overview.media_by_type}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="media_type" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="count" 
                        fill="#8b5cf6" 
                        name="Media Items"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState
                    title="No media data"
                    description="No media data available for the selected period"
                    icon={<PhotoIcon className="h-12 w-12 text-gray-400" />}
                  />
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    ),
  };

  // School submissions tab content
  const schoolsTab = {
    id: 'schools',
    label: 'Schools',
    icon: <AcademicCapIcon className="h-5 w-5" />,
    content: (
      <div className="space-y-6">
        {/* School Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Schools</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {filteredSchoolSubmissions.length}
                </p>
              </div>
              <BuildingOfficeIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Students Reported</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {filteredSchoolSubmissions.reduce((sum, school) => sum + school.total_students_sum, 0)}
                </p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Submissions</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {filteredSchoolSubmissions.reduce((sum, school) => sum + school.student_submissions + school.volunteer_submissions, 0)}
                </p>
              </div>
              <DocumentTextIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
        </div>

        {/* School Submissions Chart */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Submissions by School</h3>
            <div className="h-96">
              {filteredSchoolSubmissions.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredSchoolSubmissions.slice(0, 10)} // Show top 10 schools
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="school_name" 
                      width={90}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                      dataKey="student_submissions" 
                      name="Student Submissions" 
                      fill="#10b981" 
                      radius={[0, 4, 4, 0]}
                    />
                    <Bar 
                      dataKey="volunteer_submissions" 
                      name="Volunteer Submissions" 
                      fill="#3b82f6" 
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  title="No school data"
                  description="No school submission data available for the selected period"
                  icon={<AcademicCapIcon className="h-12 w-12 text-gray-400" />}
                />
              )}
            </div>
          </div>
        </Card>

        {/* School List Table */}
        {filteredSchoolSubmissions.length > 0 && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">School Performance Details</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        School Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Submissions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Volunteer Submissions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Students Reported
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Submissions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSchoolSubmissions.map((school) => (
                      <tr key={school.school_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {school.school_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {school.student_submissions}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {school.volunteer_submissions}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {school.total_students_sum}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {school.student_submissions + school.volunteer_submissions}
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
    ),
  };

  // Daily submissions tab content
  const dailyTab = {
    id: 'daily',
    label: 'Daily Trends',
    icon: <CalendarIcon className="h-5 w-5" />,
    content: (
      <div className="space-y-6">
        {/* Combined Daily Chart */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Submission Trends</h3>
            <div className="h-96">
              {(reportData.dailySubmissions.daily_student_submissions.length > 0 || 
                reportData.dailySubmissions.daily_volunteer_submissions.length > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={reportData.dailySubmissions.daily_student_submissions.map((item, index) => ({
                      date: item.date,
                      'Student Submissions': item.count,
                      'Volunteer Submissions': reportData.dailySubmissions.daily_volunteer_submissions[index]?.count || 0
                    }))}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="Student Submissions" 
                      stackId="1"
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.6}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Volunteer Submissions" 
                      stackId="1"
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  title="No daily data"
                  description="No daily submission data available for the selected period"
                  icon={<CalendarIcon className="h-12 w-12 text-gray-400" />}
                />
              )}
            </div>
          </div>
        </Card>

        {/* Separate Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Student Daily Submissions */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Submissions Daily</h3>
              <div className="h-64">
                {reportData.dailySubmissions.daily_student_submissions.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportData.dailySubmissions.daily_student_submissions}>
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
                        name="Student Submissions"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState
                    title="No student data"
                    description="No student submission data available"
                    icon={<UserGroupIcon className="h-12 w-12 text-gray-400" />}
                  />
                )}
              </div>
            </div>
          </Card>

          {/* Volunteer Daily Submissions */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Volunteer Submissions Daily</h3>
              <div className="h-64">
                {reportData.dailySubmissions.daily_volunteer_submissions.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportData.dailySubmissions.daily_volunteer_submissions}>
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
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Volunteer Submissions"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState
                    title="No volunteer data"
                    description="No volunteer submission data available"
                    icon={<ChartBarIcon className="h-12 w-12 text-gray-400" />}
                  />
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    ),
  };

  // Assignment flow tab content
  const assignmentsTab = {
    id: 'assignments',
    label: 'Assignments',
    icon: <ArrowTrendingUpIcon className="h-5 w-5" />,
    content: (
      <div className="space-y-6">
        {/* Assignment Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Assignments</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {reportData.assignmentFlow.assignment_status.reduce((sum, item) => sum + item.count, 0)}
                </p>
              </div>
              <DocumentTextIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Overdue Assignments</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {reportData.assignmentFlow.overdue_count}
                </p>
              </div>
              <ClockIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {(() => {
                    const total = reportData.assignmentFlow.assignment_status.reduce((sum, item) => sum + item.count, 0);
                    const completed = reportData.assignmentFlow.assignment_status.find(item => item.status === 'completed')?.count || 0;
                    return total > 0 ? `${Math.round((completed / total) * 100)}%` : '0%';
                  })()}
                </p>
              </div>
              <ArrowTrendingUpIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
        </div>

        {/* Assignment Status Distribution - FIXED LAYOUT */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Status Distribution</h3>
            <div className="h-96 overflow-hidden"> {/* Added overflow-hidden to contain any potential overflow */}
              {reportData.assignmentFlow.assignment_status.length > 0 ? (
                <div className="flex h-full gap-6">
                  {/* Chart container - left half */}
                  <div className="w-1/2 h-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.assignmentFlow.assignment_status}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomPieLabel}
                          outerRadius={100}
                          innerRadius={60}
                          paddingAngle={2}
                          dataKey="count"
                          nameKey="status"
                        >
                          {reportData.assignmentFlow.assignment_status.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend/stats - right half */}
                  <div className="w-1/2 flex flex-col justify-center">
                    <div className="space-y-4">
                      {reportData.assignmentFlow.assignment_status.map((item, index) => (
                        <div key={item.status} className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded-full mr-3 shrink-0"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}:
                          </span>
                          <span className="text-sm font-bold text-gray-900 ml-2">
                            {item.count}
                          </span>
                        </div>
                      ))}
                      <div className="pt-4 mt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Total Assignments:</span>
                          <span className="text-lg font-bold text-gray-900">
                            {reportData.assignmentFlow.assignment_status.reduce((sum, item) => sum + item.count, 0)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-medium text-red-600">Overdue Assignments:</span>
                          <span className="text-lg font-bold text-red-600">
                            {reportData.assignmentFlow.overdue_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No assignment data"
                  description="No assignment flow data available"
                  icon={<ArrowTrendingUpIcon className="h-12 w-12 text-gray-400" />}
                />
              )}
            </div>
          </div>
        </Card>
      </div>
    ),
  };

  const tabs = [
    overviewTab,
    schoolsTab,
    dailyTab,
    assignmentsTab,
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
              Showing data for {selectedPilot === 'all' ? 'all pilots' : 
                normalizeArray<any>(pilotsData?.data).find((p: any) => p.id === selectedPilot)?.name || 'selected pilot'}
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
              <p className="text-sm font-medium text-gray-500">Total Schools</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {reportData.overview.total_schools}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Total Submissions</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {reportData.overview.total_student_submissions + reportData.overview.total_volunteer_submissions}
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
            placeholder="Search schools..."
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