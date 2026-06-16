// app/[locale]/coordinator/exports/page.tsx
'use client';

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import SearchFilter from '@/components/ui/search-filter';
import Alert from '@/components/ui/alert';
import { useApiQuery } from '@/lib/hooks/use-api';
import { activitiesApi } from '@/lib/api/activities';
import { activityTemplatesApi } from '@/lib/api/activity-templates';
import { api } from '@/lib/api/api';
import { exportsApi } from '@/lib/api/exports';
import { surveyTemplatesApi } from '@/lib/api/survey-templates';
import { usersApi } from '@/lib/api/users';
import {
  CalendarIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  PhotoIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

interface ExportTypeItem {
  id: string;
  label: string;
  icon: typeof CalendarIcon;
  color: string;
  description: string;
  csvOnly?: boolean;
  disabledReason?: string;
}

interface ExportFilters {
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

interface ExportFilterOption {
  id: string;
  label: string;
}

const selectClassName =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100';

const responseArray = (response: any, keyedArray?: string): any[] => {
  if (Array.isArray(response)) return response;
  if (keyedArray && Array.isArray(response?.[keyedArray])) return response[keyedArray];
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

const sortOptions = (options: ExportFilterOption[]) =>
  options.sort((a, b) => a.label.localeCompare(b.label));

const buildOptions = (
  items: any[],
  getLabel: (item: any) => string | undefined
): ExportFilterOption[] =>
  sortOptions(
    items
      .map((item) => ({
        id: String(item.id || ''),
        label: getLabel(item) || 'Unnamed',
      }))
      .filter((item) => item.id)
  );

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default function CoordinatorExportsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingExport, setIsCreatingExport] = useState(false);
  const [selectedExportType, setSelectedExportType] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json' | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [exportFilters, setExportFilters] = useState<ExportFilters>(emptyExportFilters);

  const { data: surveyTemplateOptions = [] } = useApiQuery<ExportFilterOption[]>(
    ['coordinator-export-filter-survey-templates'],
    async () => buildOptions(await surveyTemplatesApi.list(), (template) => template.name)
  );

  const { data: activityTemplateOptions = [] } = useApiQuery<ExportFilterOption[]>(
    ['coordinator-export-filter-activity-templates'],
    async () => buildOptions(await activityTemplatesApi.list(), (template) => template.name)
  );

  const { data: activityOptions = [] } = useApiQuery<ExportFilterOption[]>(
    ['coordinator-export-filter-activities'],
    async () => {
      const response = await activitiesApi.list();
      return buildOptions(responseArray(response), (activity) => {
        const date = activity.scheduled_date ? ` (${activity.scheduled_date})` : '';
        const school = activity.school_name ? ` - ${activity.school_name}` : '';
        return `${activity.title || 'Untitled activity'}${school}${date}`;
      });
    }
  );

  const { data: schoolOptions = [] } = useApiQuery<ExportFilterOption[]>(
    ['coordinator-export-filter-schools'],
    async () => {
      const response = await api.get<any>('/schools', { limit: 500, is_active: true });
      return buildOptions(responseArray(response), (school) => school.name);
    }
  );

  const { data: userOptions = [] } = useApiQuery<ExportFilterOption[]>(
    ['coordinator-export-filter-users'],
    async () => {
      const response = await usersApi.list();
      return buildOptions(responseArray(response, 'users'), (user) => {
        const email = user.email ? ` (${user.email})` : '';
        return `${user.full_name || user.email || 'Unnamed user'}${email}`;
      });
    }
  );

  const handleExport = async (type: string, format: 'csv' | 'json', options?: Record<string, any>) => {
    setIsCreatingExport(true);
    setSelectedExportType(type);
    setSelectedFormat(format);
    setError(null);

    try {
      let result: Blob | any;
      const params = { ...options };

      switch (type) {
        case 'activities':
          result = await exportsApi.exportActivities(params, format);
          break;
        case 'surveys':
          result = await exportsApi.exportSurveys(params, format);
          break;
        case 'schools':
          result = await exportsApi.exportSchools(params, format);
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
        default:
          throw new Error(`Unsupported export type: ${type}`);
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${type}-export-${timestamp}.${format}`;

      if (result instanceof Blob) {
        downloadBlob(result, filename);
      } else {
        const content = format === 'csv'
          ? (typeof result === 'string' ? result : JSON.stringify(result, null, 2))
          : JSON.stringify(result, null, 2);
        const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
        downloadBlob(blob, filename);
      }

      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} export completed. The file will download automatically.`);
    } catch (error: any) {
      console.error('Failed to create export:', error);
      setError(error?.message || 'Export failed. Please try again.');
    } finally {
      setIsCreatingExport(false);
      setSelectedExportType('');
      setSelectedFormat('');
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

  const renderDropdownFilter = (
    label: string,
    key: keyof Pick<ExportFilters, 'survey_template_id' | 'activity_template_id' | 'activity_id' | 'school_id' | 'user_id'>,
    options: ExportFilterOption[],
    allLabel: string
  ) => (
    <label className="space-y-1 text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      <select
        value={exportFilters[key]}
        onChange={(event) => updateFilter(key, event.target.value)}
        className={selectClassName}
        disabled={!options.length && !exportFilters[key]}
      >
        <option value="">{options.length ? allLabel : 'No options available'}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );

  const exportTypes: ExportTypeItem[] = [
    {
      id: 'activities',
      label: 'Activities',
      icon: CalendarIcon,
      color: 'bg-blue-100 text-blue-600',
      description: 'Activities for your assigned pilot only',
    },
    {
      id: 'surveys',
      label: 'Surveys',
      icon: DocumentTextIcon,
      color: 'bg-purple-100 text-purple-600',
      description: 'Survey responses for your assigned pilot only',
    },
    {
      id: 'photos',
      label: 'Photos',
      icon: PhotoIcon,
      color: 'bg-green-100 text-green-600',
      description: 'Photo metadata for your assigned pilot only',
      disabledReason: 'No immediate photo export endpoint is available yet.',
    },
    {
      id: 'volunteers',
      label: 'Volunteers',
      icon: UserGroupIcon,
      color: 'bg-orange-100 text-orange-600',
      description: 'Volunteer data for your assigned pilot only',
      disabledReason: 'No immediate volunteer export endpoint is available yet.',
    },
    {
      id: 'schools',
      label: 'Schools',
      icon: BuildingOfficeIcon,
      color: 'bg-indigo-100 text-indigo-600',
      description: 'Schools in your assigned pilot only',
    },
    {
      id: 'activity-templates',
      label: 'Activity Templates',
      icon: DocumentTextIcon,
      color: 'bg-green-100 text-green-600',
      description: 'Activity templates for your assigned pilot only',
    },
    {
      id: 'survey-answers',
      label: 'Raw Survey Q&A CSV',
      icon: DocumentArrowDownIcon,
      color: 'bg-emerald-100 text-emerald-700',
      description: 'English-only report export. One row per answer. Untranslated free-text responses appear blank.',
      csvOnly: true,
    },
    {
      id: 'survey-matrix',
      label: 'Survey Response Matrix CSV',
      icon: DocumentArrowDownIcon,
      color: 'bg-sky-100 text-sky-700',
      description: 'English-only Excel review format. One row per survey submission, with questions as columns.',
      csvOnly: true,
    },
    {
      id: 'activity-survey-answers',
      label: 'Activity Survey Answers CSV',
      icon: DocumentArrowDownIcon,
      color: 'bg-cyan-100 text-cyan-700',
      description: 'English-only activity answer export.',
      csvOnly: true,
    },
    {
      id: 'activities-detailed',
      label: 'Detailed Activities CSV',
      icon: CalendarIcon,
      color: 'bg-lime-100 text-lime-700',
      description: 'Activity assignment and completion tracking with total, boys, and girls counts.',
      csvOnly: true,
    },
  ];

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredExportTypes = normalizedSearch
    ? exportTypes.filter((exportType) =>
        exportType.label.toLowerCase().includes(normalizedSearch) ||
        exportType.description.toLowerCase().includes(normalizedSearch)
      )
    : exportTypes;

  const exportFormats = [
    { id: 'csv', label: 'CSV', description: 'Comma-separated values' },
    { id: 'json', label: 'JSON', description: 'JavaScript Object Notation' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Exports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Export data for the pilot you are allowed to manage
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
        type="info"
        title="Scoped Coordinator Exports"
      >
        Coordinator exports are limited to your assigned pilot. Full system backups, user directory exports, and pilot-wide system exports remain administrator-only.
      </Alert>

      {error && (
        <Alert type="error" title="Export failed">
          <p className="mt-2">{error}</p>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </div>
        </Alert>
      )}

      {/* Export Filters */}
      <Card>
        <div className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">CSV Export Filters</h2>
              <p className="mt-1 text-sm text-gray-500">
                These filters apply to the analytics-ready CSV exports.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {renderDropdownFilter('Survey Template', 'survey_template_id', surveyTemplateOptions, 'All survey templates')}
            {renderDropdownFilter('Activity Template', 'activity_template_id', activityTemplateOptions, 'All activity templates')}
            {renderDropdownFilter('Activity', 'activity_id', activityOptions, 'All activities')}
            {renderDropdownFilter('School', 'school_id', schoolOptions, 'All schools')}
            {renderDropdownFilter('Participant / Volunteer', 'user_id', userOptions, 'All people')}
            <label className="space-y-1 text-sm">
              <span className="font-medium text-gray-700">Status</span>
              <select
                value={exportFilters.status}
                onChange={(event) => updateFilter('status', event.target.value)}
                className={selectClassName}
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
                className={selectClassName}
              >
                <option value="">All sources</option>
                <option value="student">Student</option>
                <option value="volunteer">Volunteer</option>
                <option value="all">All</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">Date From</span>
                <input
                  type="date"
                  value={exportFilters.date_from}
                  onChange={(event) => updateFilter('date_from', event.target.value)}
                  className={selectClassName}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">Date To</span>
                <input
                  type="date"
                  value={exportFilters.date_to}
                  onChange={(event) => updateFilter('date_to', event.target.value)}
                  className={selectClassName}
                />
              </label>
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Current filters: {activeFilters.length ? `${activeFilters.length} active` : 'none'}
          </p>
        </div>
      </Card>

      {/* Quick Export Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Exports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredExportTypes.map((exportTypeItem) => (
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
                          onClick={() => handleExport(exportTypeItem.id, selectedFormat)}
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
        {filteredExportTypes.length === 0 && (
          <Card className="p-6 text-center text-sm text-gray-500">
            No matching export types found.
          </Card>
        )}
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
                <li>Coordinators can export activities, surveys, schools, and activity templates for their assigned pilot only</li>
                <li>Full system backups, users, and pilot program exports are administrator-only</li>
                <li>Downloads use authenticated requests and do not put tokens in URLs</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
