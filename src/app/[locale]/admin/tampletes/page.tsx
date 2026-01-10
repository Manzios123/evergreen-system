// app/[locale]/admin/templates/page.tsx
'use client';

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import DataTable from '@/components/ui/data-table';
import StatusBadge from '@/components/ui/status-badge';
import SearchFilter from '@/components/ui/search-filter';
import { Tabs } from '@/components/ui/tabs';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import EmptyState from '@/components/ui/empty-state';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import Alert from '@/components/ui/alert';
import { useApiQuery, useApiMutation } from '@/lib/hooks/use-api';
import { SurveyTemplate } from '@/lib/types'; // Remove ActivityTemplate from import
import { api } from '@/lib/api';
import {
  DocumentTextIcon,
  CalendarIcon,
  QuestionMarkCircleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// Define ActivityTemplate locally since it's not exported from '@/lib/types'
interface ActivityTemplate {
  id: string;
  name: string;
  description?: string;
  duration: number;
  gradeLevel?: string;
  objectives?: string[];
  usageCount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Define column interface for DataTable
interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export default function AdminTemplatesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'survey' | 'activity'>('survey');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<SurveyTemplate | ActivityTemplate | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  // Fetch survey templates
  const { 
    data: surveyTemplates, 
    isLoading: surveyLoading, 
    error: surveyError,
    refetch: refetchSurveys 
  } = useApiQuery<SurveyTemplate[]>(
    ['survey-templates', searchTerm, statusFilter],
    () => api.get('/survey-templates', {
      search: searchTerm,
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'active'
    })
  );

  // Fetch activity templates
  const { 
    data: activityTemplates, 
    isLoading: activityLoading, 
    error: activityError,
    refetch: refetchActivities 
  } = useApiQuery<ActivityTemplate[]>(
    ['activity-templates', searchTerm, statusFilter],
    () => api.get('/activity-templates', {
      search: searchTerm,
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'active'
    })
  );

  // Delete template mutations
  const deleteSurveyMutation = useApiMutation(
    (id: string) => api.delete(`/survey-templates/${id}`)
  );

  const deleteActivityMutation = useApiMutation(
    (id: string) => api.delete(`/activity-templates/${id}`)
  );

  // Archive/unarchive template mutations
  const archiveSurveyMutation = useApiMutation(
    (data: { id: string; isActive: boolean }) => 
      api.patch(`/survey-templates/${data.id}`, { isActive: data.isActive })
  );

  const archiveActivityMutation = useApiMutation(
    (data: { id: string; isActive: boolean }) => 
      api.patch(`/activity-templates/${data.id}`, { isActive: data.isActive })
  );

  const handleDelete = async () => {
    if (!selectedTemplate) return;
    
    try {
      if (activeTab === 'survey') {
        await deleteSurveyMutation.mutateAsync(selectedTemplate.id);
        refetchSurveys();
      } else {
        await deleteActivityMutation.mutateAsync(selectedTemplate.id);
        refetchActivities();
      }
      setShowDeleteDialog(false);
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const handleArchive = async (isActive: boolean) => {
    if (!selectedTemplate) return;
    
    try {
      if (activeTab === 'survey') {
        await archiveSurveyMutation.mutateAsync({ id: selectedTemplate.id, isActive });
        refetchSurveys();
      } else {
        await archiveActivityMutation.mutateAsync({ id: selectedTemplate.id, isActive });
        refetchActivities();
      }
      setShowArchiveDialog(false);
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Failed to update template status:', error);
    }
  };

  // Survey template columns
  const surveyColumns: Column<SurveyTemplate>[] = [
    {
      key: 'template',
      header: 'Survey Template',
      sortable: true,
      render: (template: SurveyTemplate) => (
        <div className="flex items-start">
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3 shrink-0">
            <DocumentTextIcon className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{template.name}</p>
            <p className="text-sm text-gray-500 mt-1">{template.description}</p>
            <div className="flex items-center mt-2">
              <span className="text-xs text-gray-500 mr-3">
                {template.questions?.length || 0} questions
              </span>
              <span className="text-xs text-gray-500">
                {template.type === 'activity' ? 'Activity Survey' : 'Volunteer Feedback'}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'usage',
      header: 'Usage',
      render: (template: SurveyTemplate) => (
        <div className="text-sm text-gray-900">
          {(template as any).usageCount || 0} times used
        </div>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      sortable: true,
      render: (template: SurveyTemplate) => (
        <div className="text-sm text-gray-900">
          {new Date(template.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (template: SurveyTemplate) => (
        <div className="text-sm">
          {template.isActive ? (
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-0.5 text-sm font-medium text-green-800">
              <CheckCircleIcon className="mr-1.5 h-4 w-4" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-0.5 text-sm font-medium text-gray-800">
              <XCircleIcon className="mr-1.5 h-4 w-4" />
              Inactive
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (template: SurveyTemplate) => (
        <div className="flex space-x-2">
          <button
            onClick={() => router.push(`/admin/templates/survey/${template.id}`)}
            className="inline-flex items-center justify-center rounded-md h-8 px-3 text-xs hover:bg-gray-100 hover:text-gray-900 text-gray-700"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            View
          </button>
          <button
            onClick={() => router.push(`/admin/templates/survey/${template.id}/edit`)}
            className="inline-flex items-center justify-center rounded-md h-8 px-3 text-xs hover:bg-gray-100 hover:text-gray-900 text-gray-700"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Edit
          </button>
          <button
            onClick={() => router.push(`/admin/templates/survey/${template.id}/clone`)}
            className="inline-flex items-center justify-center rounded-md h-8 px-3 text-xs hover:bg-gray-100 hover:text-gray-900 text-gray-700"
          >
            <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
            Clone
          </button>
          <button
            onClick={() => {
              setSelectedTemplate(template);
              setShowArchiveDialog(true);
            }}
            className={`inline-flex items-center justify-center rounded-md h-8 px-3 text-xs ${
              template.isActive 
                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {template.isActive ? (
              <>
                <XCircleIcon className="h-4 w-4 mr-1" />
                Archive
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Activate
              </>
            )}
          </button>
          <button
            onClick={() => {
              setSelectedTemplate(template);
              setShowDeleteDialog(true);
            }}
            className="inline-flex items-center justify-center rounded-md h-8 px-3 text-xs bg-red-100 text-red-700 hover:bg-red-200"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Delete
          </button>
        </div>
      ),
    },
  ];

  // Activity template columns
  const activityColumns: Column<ActivityTemplate>[] = [
    {
      key: 'template',
      header: 'Activity Template',
      sortable: true,
      render: (template: ActivityTemplate) => (
        <div className="flex items-start">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 shrink-0">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{template.name}</p>
            <p className="text-sm text-gray-500 mt-1">{template.description}</p>
            <div className="flex items-center mt-2">
              <span className="text-xs text-gray-500 mr-3">
                {template.duration} hours
              </span>
              <span className="text-xs text-gray-500">
                Grade {template.gradeLevel || 'All'}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'objectives',
      header: 'Objectives',
      render: (template: ActivityTemplate) => (
        <div className="text-sm text-gray-900">
          {template.objectives?.slice(0, 2).map((obj: string, i: number) => (
            <div key={i} className="truncate">• {obj}</div>
          ))}
          {template.objectives && template.objectives.length > 2 && (
            <div className="text-xs text-gray-500">+{template.objectives.length - 2} more</div>
          )}
        </div>
      ),
    },
    {
      key: 'usage',
      header: 'Usage',
      render: (template: ActivityTemplate) => (
        <div className="text-sm text-gray-900">
          {template.usageCount || 0} times used
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (template: ActivityTemplate) => (
        <div className="text-sm">
          {template.isActive ? (
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-0.5 text-sm font-medium text-green-800">
              <CheckCircleIcon className="mr-1.5 h-4 w-4" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-0.5 text-sm font-medium text-gray-800">
              <XCircleIcon className="mr-1.5 h-4 w-4" />
              Inactive
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (template: ActivityTemplate) => (
        <div className="flex space-x-2">
          <button
            onClick={() => router.push(`/admin/templates/activity/${template.id}`)}
            className="inline-flex items-center justify-center rounded-md h-8 px-3 text-xs hover:bg-gray-100 hover:text-gray-900 text-gray-700"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            View
          </button>
          <button
            onClick={() => router.push(`/admin/templates/activity/${template.id}/edit`)}
            className="inline-flex items-center justify-center rounded-md h-8 px-3 text-xs hover:bg-gray-100 hover:text-gray-900 text-gray-700"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Edit
          </button>
          <button
            onClick={() => router.push(`/admin/templates/activity/${template.id}/clone`)}
            className="inline-flex items-center justify-center rounded-md h-8 px-3 text-xs hover:bg-gray-100 hover:text-gray-900 text-gray-700"
          >
            <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
            Clone
          </button>
          <button
            onClick={() => {
              setSelectedTemplate(template);
              setShowArchiveDialog(true);
            }}
            className={`inline-flex items-center justify-center rounded-md h-8 px-3 text-xs ${
              template.isActive 
                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {template.isActive ? (
              <>
                <XCircleIcon className="h-4 w-4 mr-1" />
                Archive
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Activate
              </>
            )}
          </button>
          <button
            onClick={() => {
              setSelectedTemplate(template);
              setShowDeleteDialog(true);
            }}
            className="inline-flex items-center justify-center rounded-md h-8 px-3 text-xs bg-red-100 text-red-700 hover:bg-red-200"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Delete
          </button>
        </div>
      ),
    },
  ];

  // Filtered templates
  const filteredSurveyTemplates = useMemo(() => {
    if (!surveyTemplates) return [];
    if (!searchTerm && statusFilter === 'all') return surveyTemplates;
    
    return surveyTemplates.filter(template => {
      const matchesSearch = searchTerm
        ? template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (template.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        : true;
      
      const matchesStatus = statusFilter === 'all' 
        ? true
        : statusFilter === 'active' 
          ? template.isActive
          : !template.isActive;
      
      return matchesSearch && matchesStatus;
    });
  }, [surveyTemplates, searchTerm, statusFilter]);

  const filteredActivityTemplates = useMemo(() => {
    if (!activityTemplates) return [];
    if (!searchTerm && statusFilter === 'all') return activityTemplates;
    
    return activityTemplates.filter(template => {
      const matchesSearch = searchTerm
        ? template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (template.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          template.objectives?.some((obj: string) => obj.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;
      
      const matchesStatus = statusFilter === 'all' 
        ? true
        : statusFilter === 'active' 
          ? template.isActive
          : !template.isActive;
      
      return matchesSearch && matchesStatus;
    });
  }, [activityTemplates, searchTerm, statusFilter]);

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const tabs = [
    {
      id: 'survey',
      label: 'Survey Templates',
      icon: <DocumentTextIcon className="h-5 w-5" />,
      count: filteredSurveyTemplates.length,
      content: (
        <div className="space-y-4">
          {filteredSurveyTemplates.length > 0 ? (
            <Card>
              <DataTable
                data={filteredSurveyTemplates}
                columns={surveyColumns}
                emptyMessage="No survey templates found"
              />
            </Card>
          ) : (
            <EmptyState
              icon={<DocumentTextIcon className="h-12 w-12 text-gray-400" />}
              title="No survey templates found"
              description={
                searchTerm || statusFilter !== 'all'
                  ? "Try adjusting your search or filters to find templates."
                  : "You haven't created any survey templates yet."
              }
              action={
                !searchTerm && statusFilter === 'all'
                  ? {
                      label: 'Create First Survey Template',
                      onClick: () => router.push('/admin/templates/survey/new'),
                    }
                  : {
                      label: 'Clear Filters',
                      onClick: () => {
                        setSearchTerm('');
                        setStatusFilter('all');
                      },
                    }
              }
            />
          )}
        </div>
      ),
    },
    {
      id: 'activity',
      label: 'Activity Templates',
      icon: <CalendarIcon className="h-5 w-5" />,
      count: filteredActivityTemplates.length,
      content: (
        <div className="space-y-4">
          {filteredActivityTemplates.length > 0 ? (
            <Card>
              <DataTable
                data={filteredActivityTemplates}
                columns={activityColumns}
                emptyMessage="No activity templates found"
              />
            </Card>
          ) : (
            <EmptyState
              icon={<CalendarIcon className="h-12 w-12 text-gray-400" />}
              title="No activity templates found"
              description={
                searchTerm || statusFilter !== 'all'
                  ? "Try adjusting your search or filters to find templates."
                  : "You haven't created any activity templates yet."
              }
              action={
                !searchTerm && statusFilter === 'all'
                  ? {
                      label: 'Create First Activity Template',
                      onClick: () => router.push('/admin/templates/activity/new'),
                    }
                  : {
                      label: 'Clear Filters',
                      onClick: () => {
                        setSearchTerm('');
                        setStatusFilter('all');
                      },
                    }
              }
            />
          )}
        </div>
      ),
    },
  ];

  const isLoading = surveyLoading || activityLoading;
  const error = surveyError || activityError;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="card" />
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Unable to load templates</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>There was an error loading templates. Please try again.</p>
            </div>
            <div className="mt-4">
              <button
                onClick={() => {
                  refetchSurveys();
                  refetchActivities();
                }}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = {
    surveyCount: surveyTemplates?.length || 0,
    activeSurveys: surveyTemplates?.filter(t => t.isActive).length || 0,
    activityCount: activityTemplates?.length || 0,
    activeActivities: activityTemplates?.filter(t => t.isActive).length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage survey and activity templates for the system
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => router.push('/admin/templates/survey/new')}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            New Survey Template
          </button>
          <button
            onClick={() => router.push('/admin/templates/activity/new')}
            className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Activity Template
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Survey Templates</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {stats.surveyCount}
              </p>
            </div>
            <DocumentTextIcon className="h-8 w-8 text-gray-300" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Surveys</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {stats.activeSurveys}
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-gray-300" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Activity Templates</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {stats.activityCount}
              </p>
            </div>
            <CalendarIcon className="h-8 w-8 text-gray-300" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Activities</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {stats.activeActivities}
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-gray-300" />
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder={`Search ${activeTab === 'survey' ? 'survey' : 'activity'} templates...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              />
            </div>
            <div className="sm:w-64">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as 'survey' | 'activity')}
        variant="underline"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedTemplate(null);
        }}
        title="Delete Template"
        message={`Are you sure you want to delete "${selectedTemplate?.name}"? This action cannot be undone.`}
        confirmText="Delete Template"
        type="danger"
        onConfirm={handleDelete}
        loading={
          activeTab === 'survey' 
            ? deleteSurveyMutation.isPending 
            : deleteActivityMutation.isPending
        }
      />

      {/* Archive/Activate Dialog */}
      <ConfirmationDialog
        open={showArchiveDialog}
        onClose={() => {
          setShowArchiveDialog(false);
          setSelectedTemplate(null);
        }}
        title={selectedTemplate?.isActive ? 'Archive Template' : 'Activate Template'}
        message={`Are you sure you want to ${selectedTemplate?.isActive ? 'archive' : 'activate'} "${selectedTemplate?.name}"?`}
        confirmText={selectedTemplate?.isActive ? 'Archive Template' : 'Activate Template'}
        type={selectedTemplate?.isActive ? 'warning' : 'info'}
        onConfirm={() => handleArchive(!selectedTemplate?.isActive)}
        loading={
          activeTab === 'survey'
            ? archiveSurveyMutation.isPending
            : archiveActivityMutation.isPending
        }
      />
    </div>
  );
}