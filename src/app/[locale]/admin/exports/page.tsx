// app/[locale]/admin/exports/page.tsx
'use client';

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import SearchFilter from '@/components/ui/search-filter';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import Alert from '@/components/ui/alert';
import { useApiQuery } from '@/lib/hooks/use-api';
import { exportsApi } from '@/lib/api/exports';
import { dashboardApi } from '@/lib/api/dashboard';
import {
  CalendarIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
  PhotoIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ServerIcon,
  CircleStackIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

interface SystemStats {
  totalUsers: number;
  totalActivities: number;
  totalSurveys: number;
  totalPilots: number;
  totalSchools: number;
}

interface ExportTypeItem {
  id: string;
  label: string;
  icon: typeof CircleStackIcon;
  color: string;
  description: string;
  requiresConfirmation?: boolean;
  csvOnly?: boolean;
  disabledReason?: string;
}

interface ExportFilters {
  pilot_id: string;
  survey_template_id: string;
  activity_template_id: string;
  activity_id: string;
  school_id: string;
  user_id: string;
  status: string;
  source_type: '' | 'student' | 'volunteer' | 'all';
  date_from: string;
  date_to: string;
}

const emptyExportFilters: ExportFilters = {
  pilot_id: '',
  survey_template_id: '',
  activity_template_id: '',
  activity_id: '',
  school_id: '',
  user_id: '',
  status: '',
  source_type: '',
  date_from: '',
  date_to: '',
};

// Helper function to download blob as file
const downloadBlob = (blob: Blob, filename: string) => {
  // Create a temporary URL for the blob
  const url = window.URL.createObjectURL(blob);

  // Create a temporary anchor element
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;

  // Append to body, click, and remove
  document.body.appendChild(a);
  a.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
};

export default function AdminExportsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingExport, setIsCreatingExport] = useState(false);
  const [selectedExportType, setSelectedExportType] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json' | ''>('');
  const [exportFilters, setExportFilters] = useState<ExportFilters>(emptyExportFilters);

  // Fetch system stats from admin dashboard
  const {
    data: systemStats,
    isLoading: statsLoading,
    error: statsError
  } = useApiQuery<SystemStats>(
    ['system-stats'],
    async () => {
      const stats = await dashboardApi.getSystemStats();
      return {
        totalUsers: stats.total_users || 0,
        totalActivities: stats.total_activities || 0,
        totalSurveys: (stats.activity_surveys || 0) + (stats.student_surveys || 0) + (stats.volunteer_surveys || 0),
        totalPilots: stats.total_pilots || 0,
        totalSchools: stats.total_schools || 0,
      };
    }
  );

  const handleExport = async (type: string, format: 'csv' | 'json', options?: any) => {
    setIsCreatingExport(true);
    setSelectedExportType(type);
    setSelectedFormat(format);
    try {
      const params: any = {
        format,
        ...options
      };

      // Call the appropriate export API function
      let result: Blob | any;
      const timestamp = new Date().toISOString().slice(0, 10);

      switch (type) {
        case 'activities':
          result = await exportsApi.exportActivities(params, format);
          break;
        case 'surveys':
          result = await exportsApi.exportSurveys(params, format);
          break;
        case 'users':
          result = await exportsApi.exportUsers(params, format);
          break;
        case 'schools':
          result = await exportsApi.exportSchools(params, format);
          break;
        case 'pilots':
          result = await exportsApi.exportPilots(params, format);
          break;
        case 'activity-templates':
          result = await exportsApi.exportActivityTemplates(params, format);
          break;
        case 'survey-answers':
          result = await exportsApi.exportSurveyAnswers(options);
          break;
        case 'survey-matrix':
          result = await exportsApi.exportSurveyMatrix(options);
          break;
        case 'activity-survey-answers':
          result = await exportsApi.exportActivitySurveyAnswers(options);
          break;
        case 'activities-detailed':
          result = await exportsApi.exportActivitiesDetailed(options);
          break;
        case 'full_backup':
        case 'all':
          result = await exportsApi.exportAll(params, format);
          break;
        default:
          throw new Error(`Unsupported export type: ${type}`);
      }

      const extension = format === 'csv' ? 'csv' : 'json';
      const filename = `${type}-export-${timestamp}.${extension}`;

      // Export API returns a Blob for both CSV and JSON so protected downloads keep Authorization headers.
      if (result instanceof Blob) {
        downloadBlob(result, filename);
      } else {
        const content = format === 'csv'
          ? (typeof result === 'string' ? result : JSON.stringify(result, null, 2))
          : JSON.stringify(result, null, 2);
        const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
        downloadBlob(blob, filename);
      }

      // Show success message
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} export completed. The file will download automatically.`);
    } catch (error: any) {
      console.error('Failed to create export:', error);
      console.error('Error details:', {
        message: error?.message,
        status: error?.status,
        stack: error?.stack
      });

      let errorMessage = 'Unknown error';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.toString) {
        errorMessage = error.toString();
      }

      alert(`Failed to create export. Please try again. Error: ${errorMessage}`);
    } finally {
      setIsCreatingExport(false);
      setSelectedExportType('');
      setSelectedFormat('');
    }
  };

  const handleFullBackup = () => {
    if (window.confirm('Full system backup will export all data. This may take a while. Continue?')) {
      handleExport('all', 'json', {
        compress: true,
      });
    }
  };

  const updateFilter = <K extends keyof ExportFilters>(key: K, value: ExportFilters[K]) => {
    setExportFilters((current) => ({ ...current, [key]: value }));
  };

  const clearFilters = () => {
    setExportFilters(emptyExportFilters);
  };

  const activeFilters = Object.entries(exportFilters).filter(([, value]) => value);

  const buildAnalyticsExportFilters = (type: string) => {
    const base = {
      pilot_id: exportFilters.pilot_id,
      school_id: exportFilters.school_id,
      date_from: exportFilters.date_from,
      date_to: exportFilters.date_to,
    };

    if (type === 'survey-answers' || type === 'survey-matrix') {
      return {
        ...base,
        survey_template_id: exportFilters.survey_template_id,
        submitted_by_id: exportFilters.user_id,
        source_type: exportFilters.source_type,
      };
    }

    if (type === 'activity-survey-answers') {
      return {
        ...base,
        survey_template_id: exportFilters.survey_template_id,
        activity_template_id: exportFilters.activity_template_id,
        activity_id: exportFilters.activity_id,
        volunteer_id: exportFilters.user_id,
      };
    }

    return {
      ...base,
      activity_template_id: exportFilters.activity_template_id,
      volunteer_id: exportFilters.user_id,
      status: exportFilters.status,
    };
  };

  const exportTypes: ExportTypeItem[] = [
    {
      id: 'all',
      label: 'Full System Backup',
      icon: CircleStackIcon,
      color: 'bg-red-100 text-red-600',
      description: 'Complete database backup including all data',
      requiresConfirmation: true,
    },
    {
      id: 'activities',
      label: 'All Activities',
      icon: CalendarIcon,
      color: 'bg-blue-100 text-blue-600',
      description: 'All activities across all pilot programs',
    },
    {
      id: 'surveys',
      label: 'All Surveys',
      icon: DocumentTextIcon,
      color: 'bg-purple-100 text-purple-600',
      description: 'All survey responses and results',
    },
    {
      id: 'photos',
      label: 'Photo Metadata',
      icon: PhotoIcon,
      color: 'bg-green-100 text-green-600',
      description: 'Photo information and metadata (not actual files)',
      disabledReason: 'No immediate photo export endpoint is available yet.',
    },
    {
      id: 'users',
      label: 'User Directory',
      icon: UserGroupIcon,
      color: 'bg-orange-100 text-orange-600',
      description: 'All user accounts and profiles',
    },
    {
      id: 'schools',
      label: 'Schools Directory',
      icon: BuildingOfficeIcon,
      color: 'bg-indigo-100 text-indigo-600',
      description: 'All schools and their information',
    },
    {
      id: 'pilots',
      label: 'Pilot Programs',
      icon: ChartBarIcon,
      color: 'bg-teal-100 text-teal-600',
      description: 'All pilot programs and their configurations',
    },
    {
      id: 'system_logs',
      label: 'System Logs',
      icon: ServerIcon,
      color: 'bg-gray-100 text-gray-600',
      description: 'System audit logs and activity history',
      disabledReason: 'No immediate system logs export endpoint is available yet.',
    },
    {
      id: 'activity-templates',
      label: 'Activity Templates',
      icon: DocumentTextIcon,
      color: 'bg-green-100 text-green-600',
      description: 'All activity templates and their configurations',
    },
    {
      id: 'survey-answers',
      label: 'Raw Survey Q&A CSV',
      icon: DocumentArrowDownIcon,
      color: 'bg-emerald-100 text-emerald-700',
      description: 'Best for analysis, pivot tables, and per-question answer review',
      csvOnly: true,
    },
    {
      id: 'survey-matrix',
      label: 'Survey Response Matrix CSV',
      icon: DocumentArrowDownIcon,
      color: 'bg-sky-100 text-sky-700',
      description: 'One row per submitted survey response, with questions as Excel columns. Best for quick review in Excel.',
      csvOnly: true,
    },
    {
      id: 'activity-survey-answers',
      label: 'Activity Survey Answers CSV',
      icon: DocumentArrowDownIcon,
      color: 'bg-cyan-100 text-cyan-700',
      description: 'Activity-related question responses with activity, school, and volunteer context',
      csvOnly: true,
    },
    {
      id: 'activities-detailed',
      label: 'Detailed Activities CSV',
      icon: CalendarIcon,
      color: 'bg-lime-100 text-lime-700',
      description: 'Activity assignment and completion tracking for pilot analysis',
      csvOnly: true,
    },
  ];

  const exportFormats = [
    { id: 'csv' as const, label: 'CSV', description: 'Comma-separated values' },
    { id: 'json' as const, label: 'JSON', description: 'JavaScript Object Notation' },
  ];

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="card" />
        <SkeletonLoader type="table" />
      </div>
    );
  }

  if (statsError) {
    const errorMessage = statsError instanceof Error ? statsError.message : String(statsError);
    return (
      <Alert
        type="error"
        title="Unable to load system statistics"
      >
        <div className="space-y-2">
          <p>There was an error loading system statistics. Please try again.</p>
          <p className="text-sm text-gray-600">
            Error: {errorMessage}
          </p>
        </div>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Exports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Export system-wide data for backup, analysis, and reporting
          </p>
        </div>
        <div className="w-full sm:w-64">
          <SearchFilter
            placeholder="Search export types..."
            onSearch={setSearchTerm}
          />
        </div>
      </div>

      {/* Warning Alert for Large Exports */}
      <Alert
        type="warning"
        title="Large Data Exports"
      >
        Full system backups and large data exports may take several minutes to process. Please schedule these during off-peak hours.
      </Alert>

      {/* Export Filters */}
      <Card>
        <div className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">CSV Export Filters</h2>
              <p className="mt-1 text-sm text-gray-500">
                These filters apply to the three analytics-ready CSV exports.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-gray-700">Pilot ID</span>
              <input
                value={exportFilters.pilot_id}
                onChange={(event) => updateFilter('pilot_id', event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                placeholder="pilot_id"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-gray-700">Survey Template ID</span>
              <input
                value={exportFilters.survey_template_id}
                onChange={(event) => updateFilter('survey_template_id', event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                placeholder="survey_template_id"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-gray-700">Activity Template ID</span>
              <input
                value={exportFilters.activity_template_id}
                onChange={(event) => updateFilter('activity_template_id', event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                placeholder="activity_template_id"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-gray-700">Activity ID</span>
              <input
                value={exportFilters.activity_id}
                onChange={(event) => updateFilter('activity_id', event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                placeholder="activity_id"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-gray-700">School ID</span>
              <input
                value={exportFilters.school_id}
                onChange={(event) => updateFilter('school_id', event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                placeholder="school_id"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-gray-700">Volunteer/User ID</span>
              <input
                value={exportFilters.user_id}
                onChange={(event) => updateFilter('user_id', event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                placeholder="user_id"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-gray-700">Status</span>
              <select
                value={exportFilters.status}
                onChange={(event) => updateFilter('status', event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
              >
                <option value="">All statuses</option>
                <option value="planned">Planned</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In progress</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-gray-700">Source Type</span>
              <select
                value={exportFilters.source_type}
                onChange={(event) => updateFilter('source_type', event.target.value as ExportFilters['source_type'])}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
              >
                <option value="">All sources</option>
                <option value="student">Student</option>
                <option value="volunteer">Volunteer</option>
                <option value="all">All</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-gray-700">Date From</span>
              <input
                type="date"
                value={exportFilters.date_from}
                onChange={(event) => updateFilter('date_from', event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-gray-700">Date To</span>
              <input
                type="date"
                value={exportFilters.date_to}
                onChange={(event) => updateFilter('date_to', event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
              />
            </label>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Current filters: {activeFilters.length ? `${activeFilters.length} active` : 'none'}
          </p>
        </div>
      </Card>

      {/* System Statistics */}
      {systemStats && (
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{systemStats.totalUsers}</p>
                <p className="text-sm text-gray-500">Total Users</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{systemStats.totalActivities}</p>
                <p className="text-sm text-gray-500">Total Activities</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{systemStats.totalSurveys}</p>
                <p className="text-sm text-gray-500">Total Surveys</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{systemStats.totalSchools}</p>
                <p className="text-sm text-gray-500">Total Schools</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-teal-600">{systemStats.totalPilots}</p>
                <p className="text-sm text-gray-500">Total Pilots</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Export Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Exports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {exportTypes.map((exportTypeItem) => (
            <Card key={exportTypeItem.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col h-full">
                <div className="flex items-start mb-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 ${exportTypeItem.color}`}>
                    <exportTypeItem.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{exportTypeItem.label}</h3>
                    <p className="text-sm text-gray-500 mt-1">{exportTypeItem.description}</p>
                  </div>
                </div>

                <div className="mt-auto pt-3 border-t">
                  {exportTypeItem.disabledReason ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled
                      title={exportTypeItem.disabledReason}
                    >
                      Unavailable
                    </Button>
                  ) : exportTypeItem.id === 'all' ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleFullBackup}
                      loading={isCreatingExport && selectedExportType === exportTypeItem.id}
                    >
                      Create Backup
                    </Button>
                  ) : exportTypeItem.csvOnly ? (
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={() => handleExport(exportTypeItem.id, 'csv', buildAnalyticsExportFilters(exportTypeItem.id))}
                      loading={isCreatingExport && selectedExportType === exportTypeItem.id}
                    >
                      Export CSV
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <select
                        value={selectedExportType === exportTypeItem.id ? selectedFormat : ''}
                        onChange={(e) => {
                          setSelectedExportType(exportTypeItem.id);
                          setSelectedFormat(e.target.value as 'csv' | 'json' | '');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Select format...</option>
                        {exportFormats.map((format) => (
                          <option key={format.id} value={format.id}>
                            {format.label} ({format.description})
                          </option>
                        ))}
                      </select>

                      {selectedExportType === exportTypeItem.id && selectedFormat && (
                        <Button
                          variant="default"
                          className="w-full"
                          onClick={() => handleExport(exportTypeItem.id, selectedFormat as 'csv' | 'json')}
                          loading={isCreatingExport && selectedExportType === exportTypeItem.id}
                        >
                          Export as {selectedFormat.toUpperCase()}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Export Information */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Information</h2>
          <div className="space-y-4 text-sm text-gray-600">
            <p>
              <strong>Note:</strong> The current export system provides immediate downloads. There is no export job tracking or history available.
            </p>
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="font-medium text-blue-900 mb-2">Available Export Formats:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>CSV:</strong> Comma-separated values format for spreadsheet applications</li>
                <li><strong>JSON:</strong> JavaScript Object Notation for data interchange</li>
              </ul>
            </div>
            <div className="bg-yellow-50 p-4 rounded-md">
              <h3 className="font-medium text-yellow-900 mb-2">Permissions:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Only administrators can export user data and full system backups</li>
                <li>Coordinators can export data for their assigned pilots only</li>
                <li>Volunteers have access to their own data only</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
