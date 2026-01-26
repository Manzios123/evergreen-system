'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import Alert from '@/components/ui/alert';
import { api } from '@/lib/api/api';
import { 
  DocumentTextIcon,
  UserGroupIcon,
  UsersIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface SurveyResponse {
  id: string;
  survey_template_id: string;
  template_name: string;
  survey_type: string;
  survey_period: string;
  pilot_id: string;
  pilot_name?: string;
  submitted_at: string;
  // Student specific
  submitted_by?: string;
  submitted_by_name?: string;
  total_students?: number;
  activity_id?: string;
  // Volunteer specific
  volunteer_id?: string;
  volunteer_name?: string;
  volunteer_email?: string;
}

interface SurveyStats {
  totalSubmissions: number;
  submissionsThisWeek: number;
  submissionsThisMonth: number;
  submissionsOverTime: Array<{ date: string; count: number }>;
  submissionsPerTemplate: Array<{ template_id: string; template_name: string; count: number }>;
  studentTotalStudentsSum?: number;
}

interface Template {
  id: string;
  name: string;
  survey_type: string;
  survey_period: string;
  pilot_id: string;
  pilot_name?: string;
}

interface Pilot {
  id: string;
  name: string;
}

type TabType = 'student' | 'volunteer' | 'admin';

export default function AdminSurveysPage() {
  const [activeTab, setActiveTab] = useState<TabType>('student');
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [pilotId, setPilotId] = useState<string>('');
  const [templateId, setTemplateId] = useState<string>('');
  const [surveyPeriod, setSurveyPeriod] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Data
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [stats, setStats] = useState<SurveyStats | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  
  // Admin survey state
  const [adminAssignment, setAdminAssignment] = useState<any>(null);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [adminSurveyLoading, setAdminSurveyLoading] = useState(false);

  // Fetch pilots and templates on mount
  useEffect(() => {
    fetchPilots();
    fetchTemplates();
  }, []);

  // Fetch data when filters or tab changes
  useEffect(() => {
    fetchResponses();
    fetchStats();
  }, [activeTab, pilotId, templateId, surveyPeriod, dateFrom, dateTo, pagination.page]);

  const fetchPilots = async () => {
    try {
      const data = await api.get<any>('/pilots');
      // Ensure data is an array
      if (Array.isArray(data)) {
        setPilots(data);
      } else if (data && Array.isArray(data.results)) {
        setPilots(data.results);
      } else if (data && data.data && Array.isArray(data.data)) {
        setPilots(data.data);
      } else {
        console.warn('Pilots API returned non-array format:', data);
        setPilots([]);
      }
    } catch (err) {
      console.error('Error fetching pilots:', err);
      setPilots([]); // Set to empty array on error
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await api.get<any>('/survey-templates');
      // Ensure data is an array
      if (Array.isArray(data)) {
        setTemplates(data);
      } else if (data && Array.isArray(data.results)) {
        setTemplates(data.results);
      } else if (data && data.data && Array.isArray(data.data)) {
        setTemplates(data.data);
      } else {
        console.warn('Templates API returned non-array format:', data);
        setTemplates([]);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
      setTemplates([]);
    }
  };

  const fetchResponses = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: pagination.page,
        limit: pagination.limit
      };
      
      // Map frontend tab to backend type
      let backendType = activeTab;
      if (activeTab === 'admin') {
        backendType = 'volunteer'; // Admin/coordinator surveys are stored in volunteer tables
      }
      params.type = backendType;
      
      if (pilotId) params.pilot_id = pilotId;
      if (templateId) params.template_id = templateId;
      if (surveyPeriod) params.survey_period = surveyPeriod;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      if (searchQuery && searchQuery.trim()) params.search = searchQuery;
      
      const response = await api.get<any>('/admin/surveys/responses', params);
      
      // Handle different response formats
      let responseData: SurveyResponse[] = [];
      let total = 0;
      
      if (response && response.success) {
        // New format with success flag
        if (Array.isArray(response.data)) {
          responseData = response.data;
        }
        total = response.total || 0;
      } else if (Array.isArray(response)) {
        // Legacy format: direct array
        responseData = response;
        total = response.length;
      } else if (response && response.data && Array.isArray(response.data)) {
        // Another possible format
        responseData = response.data;
        total = response.total || response.data.length || 0;
      } else if (response && response.results && Array.isArray(response.results)) {
        // Results format
        responseData = response.results;
        total = response.total || response.results.length || 0;
      } else {
        console.warn('Unexpected response format:', response);
      }
      
      setResponses(responseData);
      setPagination(prev => ({
        ...prev,
        total,
        totalPages: Math.ceil(total / pagination.limit)
      }));
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch survey responses');
      console.error('Error fetching responses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const params: Record<string, any> = {};
      
      // Map frontend tab to backend type
      let backendType = activeTab;
      if (activeTab === 'admin') {
        backendType = 'volunteer';
      }
      params.type = backendType;
      
      if (pilotId) params.pilot_id = pilotId;
      if (templateId) params.template_id = templateId;
      if (surveyPeriod) params.survey_period = surveyPeriod;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      
      const response = await api.get<any>('/admin/surveys/stats', params);
      
      // Handle different response formats
      if (response && response.success && response.data) {
        setStats(response.data);
      } else if (response && !response.success) {
        console.error('Stats API returned error:', response.error);
        setStats(null);
      } else {
        // Assume direct stats object
        setStats(response);
      }
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadAdminSurvey = async () => {
    setAdminSurveyLoading(true);
    try {
      const response = await api.post('/survey-assignments/auto-assign-role-survey');
      setAdminAssignment(response);
      setShowAdminForm(true);
    } catch (err: any) {
      setError(err.message || 'Failed to load admin survey');
    } finally {
      setAdminSurveyLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params: Record<string, any> = {
        type: activeTab === 'admin' ? 'volunteer' : activeTab,
        format: 'csv'
      };
      
      if (pilotId) params.pilot_id = pilotId;
      if (templateId) params.template_id = templateId;
      if (surveyPeriod) params.survey_period = surveyPeriod;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      
      const blob = await api.get<Blob>('/admin/surveys/export', params);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}-surveys-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || 'Failed to export data');
    }
  };

  const viewResponse = (responseId: string) => {
    window.open(`/admin/surveys/responses/${responseId}`, '_blank');
  };

  const resetFilters = () => {
    setPilotId('');
    setTemplateId('');
    setSurveyPeriod('');
    setDateFrom('');
    setDateTo('');
    setSearchQuery('');
  };

  // Fix: Ensure filteredTemplates is always an array
  const filteredTemplates = Array.isArray(templates) ? templates.filter(t => 
    t.survey_type === activeTab && 
    (!pilotId || t.pilot_id === pilotId)
  ) : [];

  // Fix: Ensure surveyPeriods is always an array
  const surveyPeriods = Array.isArray(templates) ? 
    Array.from(new Set(
      templates
        .filter(t => t.survey_type === activeTab)
        .map(t => t.survey_period)
        .filter(Boolean)
    )) : [];

  if (showAdminForm && adminAssignment) {
    // We'll implement the survey form component later
    // For now, redirect to the volunteer survey form
    window.location.href = `/volunteer/surveys/assignment/${adminAssignment.assignment_id}`;
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Survey Analytics Center</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and analyze survey submissions across all pilots
          </p>
        </div>
        
        <div className="flex gap-3">
          <Link href="/admin/surveys/template">
            <Button variant="outline">
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              Manage Templates
            </Button>
          </Link>
          <Link href="/admin/surveys/assignments">
            <Button variant="outline">
              <UsersIcon className="h-4 w-4 mr-2" />
              View Assignments
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(['student', 'volunteer', 'admin'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                py-4 px-1 text-sm font-medium border-b-2 whitespace-nowrap
                ${activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab === 'student' && (
                <>
                  <UserGroupIcon className="h-5 w-5 inline mr-2" />
                  Student Survey Reports
                </>
              )}
              {tab === 'volunteer' && (
                <>
                  <UsersIcon className="h-5 w-5 inline mr-2" />
                  Volunteer Survey Reports
                </>
              )}
              {tab === 'admin' && (
                <>
                  <ChartBarIcon className="h-5 w-5 inline mr-2" />
                  Admin & Coordinator Surveys
                </>
              )}
            </button>
          ))}
        </nav>
      </div>

      {error && (
        <Alert type="error" title="Error">
          {error}
        </Alert>
      )}

      {/* Admin & Coordinator Tab Content */}
      {activeTab === 'admin' && (
        <div className="space-y-6">
          <Card className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Complete Your Staff Survey
              </h2>
              <p className="text-gray-600 mb-6">
                As an administrator or coordinator, please complete this survey to provide 
                your feedback. Your responses will help improve the program.
              </p>
              <Button
                onClick={loadAdminSurvey}
                disabled={adminSurveyLoading}
                className="px-8"
                size="lg"
              >
                {adminSurveyLoading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    Loading Survey...
                  </>
                ) : (
                  'Start / Continue My Survey'
                )}
              </Button>
              <p className="mt-4 text-sm text-gray-500">
                Note: Your survey responses will appear in the Volunteer Survey Reports section
              </p>
            </div>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-medium text-gray-900 mb-4">About Staff Surveys</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  All admin/coordinator surveys are stored in volunteer tables for consistency
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  One survey per staff member per template
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  You can edit your responses until submitted
                </li>
              </ul>
            </Card>
            <Card className="p-6">
              <h3 className="font-medium text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-3">
                <Link 
                  href="/admin/surveys?tab=volunteer" 
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  View all staff survey submissions
                </Link>
                <Link 
                  href="/admin/surveys/templates" 
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  Create or edit survey templates
                </Link>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Student & Volunteer Tab Content */}
      {(activeTab === 'student' || activeTab === 'volunteer') && (
        <>
          {/* Filters */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Filters</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-gray-500"
              >
                Clear All
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pilot
                </label>
                <select
                  value={pilotId}
                  onChange={(e) => setPilotId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Pilots</option>
                  {Array.isArray(pilots) && pilots.map(pilot => (
                    <option key={pilot.id} value={pilot.id}>
                      {pilot.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Survey Template
                </label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Templates</option>
                  {filteredTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.survey_period})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Survey Period
                </label>
                <select
                  value={surveyPeriod}
                  onChange={(e) => setSurveyPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Periods</option>
                  {surveyPeriods.map(period => (
                    <option key={period} value={period}>
                      {period.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="From"
                  />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="To"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search {activeTab === 'student' ? 'by Volunteer' : 'by Email/Name'}
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchResponses()}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={activeTab === 'student' ? 'Search volunteer name...' : 'Search email or name...'}
                  />
                </div>
                <Button
                  onClick={fetchResponses}
                  variant="default"
                >
                  <FunnelIcon className="h-4 w-4 mr-2" />
                  Apply
                </Button>
              </div>
            </div>
          </Card>

          {/* Summary Cards */}
          {statsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SkeletonLoader type="card" />
              <SkeletonLoader type="card" />
              <SkeletonLoader type="card" />
            </div>
          ) : stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Submissions</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalSubmissions}</p>
                  </div>
                  <DocumentTextIcon className="h-8 w-8 text-blue-500" />
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">This Month</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.submissionsThisMonth}</p>
                  </div>
                  <CalendarIcon className="h-8 w-8 text-green-500" />
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      {activeTab === 'student' ? 'Total Students' : 'Active Volunteers'}
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {activeTab === 'student' 
                        ? stats.studentTotalStudentsSum || 0
                        : stats.totalSubmissions
                      }
                    </p>
                  </div>
                  {activeTab === 'student' ? (
                    <UserGroupIcon className="h-8 w-8 text-purple-500" />
                  ) : (
                    <UsersIcon className="h-8 w-8 text-orange-500" />
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Charts */}
          {stats && stats.submissionsOverTime && stats.submissionsPerTemplate && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-medium text-gray-900 mb-4">Submissions Over Time</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.submissionsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(date) => new Date(date).toLocaleDateString()}
                        formatter={(value) => [`${value} submissions`, 'Count']}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }}
                        name="Submissions"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              
              <Card className="p-6">
                <h3 className="font-medium text-gray-900 mb-4">Submissions by Template</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.submissionsPerTemplate}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="template_name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} submissions`, 'Count']} />
                      <Legend />
                      <Bar dataKey="count" fill="#82ca9d" name="Submissions" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}

          {/* Data Table */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-medium text-gray-900">Survey Responses</h3>
                <p className="text-sm text-gray-500">
                  Showing {responses.length} of {pagination.total} responses
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleExport}
                  disabled={responses.length === 0}
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
            
            {loading ? (
              <div className="space-y-3">
                <SkeletonLoader type="table" />
                <SkeletonLoader type="table" />
                <SkeletonLoader type="table" />
              </div>
            ) : responses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No survey responses found with current filters
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Template
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pilot
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Period
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted At
                        </th>
                        {activeTab === 'student' ? (
                          <>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Volunteer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Students
                            </th>
                          </>
                        ) : (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Volunteer
                          </th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {responses.map((response) => (
                        <tr key={response.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {response.template_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {response.pilot_name || response.pilot_id}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {response.survey_period.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(response.submitted_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(response.submitted_at).toLocaleTimeString()}
                            </div>
                          </td>
                          {activeTab === 'student' ? (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {response.submitted_by_name || 'Unknown'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Activity: {response.activity_id ? response.activity_id.substring(0, 8) + '...' : 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {response.total_students || 0}
                              </td>
                            </>
                          ) : (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {response.volunteer_name || response.volunteer_email || 'Unknown'}
                              </div>
                              {response.volunteer_email && (
                                <div className="text-xs text-gray-500">
                                  {response.volunteer_email}
                                </div>
                              )}
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewResponse(response.id)}
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <Button
                        variant="outline"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page === pagination.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Page <span className="font-medium">{pagination.page}</span> of{' '}
                          <span className="font-medium">{pagination.totalPages}</span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(pageNum => (
                          <Button
                            key={pageNum}
                            variant={pagination.page === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                            className="min-w-10"
                          >
                            {pageNum}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </>
      )}
    </div>
  );
}