// app/[locale]/admin/surveys/templates/page.tsx
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import DataTable from '@/components/ui/data-table';
import EmptyState from '@/components/ui/empty-state';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import Alert from '@/components/ui/alert';
import { useApiQuery, useApiMutation } from '@/lib/hooks/use-api';
import { api } from '@/lib/api/api';
import {
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChartBarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface SurveyTemplate {
  id: string;
  name: string;
  description: string | null;
  survey_type: 'volunteer' | 'student' | 'activity_monitoring';
  survey_period: 'pre_pilot' | 'post_pilot' | 'mid_pilot' | 'end_pilot';
  pilot_id: string;
  pilot_name: string;
  version: number;
  change_reason: string;
  created_by: string;
  creator_name: string;
  created_at: string;
  question_count: number;
}

function normalizeArray<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response as T[];
  if (response && typeof response === 'object') {
    const data = response as { data?: unknown; results?: unknown; templates?: unknown; items?: unknown };
    if (Array.isArray(data.data)) return data.data as T[];
    if (Array.isArray(data.results)) return data.results as T[];
    if (Array.isArray(data.templates)) return data.templates as T[];
    if (Array.isArray(data.items)) return data.items as T[];
  }
  return [];
}

export default function SurveyTemplatesPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch survey templates
  const { data: templatesResponse, isLoading, error, refetch } = useApiQuery<unknown>(
    ['survey-templates', selectedType, selectedPeriod],
    () => api.get<unknown>('/survey-templates')
  );
  const templates = normalizeArray<SurveyTemplate>(templatesResponse);

  // Delete template mutation
  const deleteMutation = useApiMutation(
    (templateId: string) => api.delete(`/survey-templates/${templateId}`),
    {
      onSuccess: () => {
        refetch();
      },
      onError: (error: any) => {
        setDeleteError(error.message || 'Failed to delete template');
      },
    }
  );

  const handleDelete = async (templateId: string, templateName: string) => {
    if (confirm(`Are you sure you want to delete "${templateName}"? This action cannot be undone.`)) {
      setDeleteError(null);
      deleteMutation.mutate(templateId);
    }
  };

  // Filter templates based on selections
  const filteredTemplates = templates.filter(template => {
    if (selectedType !== 'all' && template.survey_type !== selectedType) return false;
    if (selectedPeriod !== 'all' && template.survey_period !== selectedPeriod) return false;
    return true;
  });

  const columns = [
    {
      key: 'name',
      header: 'Template Name',
      render: (template: SurveyTemplate) => (
        <div>
          <p className="font-medium text-gray-900">{template.name}</p>
          <p className="text-sm text-gray-500">{template.description || 'No description'}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (template: SurveyTemplate) => (
        <div className="flex items-center">
          {template.survey_type === 'volunteer' ? (
            <UserGroupIcon className="h-5 w-5 text-blue-400 mr-2" />
          ) : template.survey_type === 'student' ? (
            <ChartBarIcon className="h-5 w-5 text-green-400 mr-2" />
          ) : (
            <DocumentTextIcon className="h-5 w-5 text-purple-400 mr-2" />
          )}
          <div>
            <span className="capitalize">{template.survey_type.replace('_', ' ')}</span>
            <span className="text-xs text-gray-500 block capitalize">
              {template.survey_period.replace('_', ' ')}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'pilot',
      header: 'Pilot',
      render: (template: SurveyTemplate) => (
        <div>
          <p className="text-sm text-gray-900">{template.pilot_name}</p>
          <p className="text-xs text-gray-500">Version {template.version}</p>
        </div>
      ),
    },
    {
      key: 'questions',
      header: 'Questions',
      render: (template: SurveyTemplate) => (
        <div className="text-center">
          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
            {template.question_count} questions
          </span>
        </div>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      render: (template: SurveyTemplate) => (
        <div>
          <p className="text-sm text-gray-900">
            {format(new Date(template.created_at), 'MMM d, yyyy')}
          </p>
          <p className="text-xs text-gray-500">by {template.creator_name}</p>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (template: SurveyTemplate) => (
        <div className="flex space-x-2">
          <Link href={`/${locale}/admin/surveys/templates/${template.id}`}>
            <Button size="sm" variant="outline">
              <EyeIcon className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/${locale}/admin/surveys/templates/${template.id}/edit`}>
            <Button size="sm" variant="outline">
              <PencilIcon className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDelete(template.id, template.name)}
            disabled={deleteMutation.isPending}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'volunteer', label: 'Volunteer Surveys' },
    { value: 'student', label: 'Student Surveys' },
    { value: 'activity_monitoring', label: 'Activity Monitoring' },
  ];

  const periodOptions = [
    { value: 'all', label: 'All Periods' },
    { value: 'pre_pilot', label: 'Pre Pilot' },
    { value: 'post_pilot', label: 'Post Pilot' },
    { value: 'mid_pilot', label: 'Mid Pilot' },
    { value: 'end_pilot', label: 'End Pilot' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonLoader type="card" />
        <SkeletonLoader type="table" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to load survey templates"
        description="There was an error loading survey templates. Please try again."
        action={{
          label: 'Try Again',
          onClick: () => refetch(),
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Survey Templates</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage survey templates for pre and post surveys
          </p>
        </div>
        <Link href={`/${locale}/admin/surveys/templates/new`}>
          <Button>
            <PlusIcon className="h-5 w-5 mr-2" />
            New Template
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Survey Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {typeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Survey Period
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {periodOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pilot
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled
              >
                <option>All Pilots</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSelectedType('all');
                  setSelectedPeriod('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Delete Error Alert */}
      {deleteError && (
        <Alert type="error" title="Error deleting template">
          <p className="mt-2">{deleteError}</p>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={() => setDeleteError(null)}>
              Dismiss
            </Button>
          </div>
        </Alert>
      )}

      {/* Templates Table */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Survey Templates ({filteredTemplates?.length || 0})
            </h2>
            <div className="text-sm text-gray-500">
              Showing {filteredTemplates.length} of {templates.length} templates
            </div>
          </div>
          
          <DataTable
            data={filteredTemplates}
            columns={columns}
            emptyMessage={
              <EmptyState
                icon={<DocumentTextIcon className="h-12 w-12 text-gray-400" />}
                title="No survey templates found"
                description={
                  selectedType !== 'all' || selectedPeriod !== 'all'
                    ? 'No templates match your filter criteria. Try changing your filters.'
                    : 'No survey templates have been created yet. Create your first template to get started.'
                }
                action={
                  selectedType !== 'all' || selectedPeriod !== 'all'
                    ? {
                        label: 'Clear Filters',
                        onClick: () => {
                          setSelectedType('all');
                          setSelectedPeriod('all');
                        },
                      }
                    : {
                        label: 'Create Template',
                        onClick: () => router.push(`/${locale}/admin/surveys/templates/new`),
                      }
                }
              />
            }
          />
        </div>
      </Card>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 p-3">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Volunteer Templates</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {templates.filter(t => t.survey_type === 'volunteer').length}
                </p>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-green-100 p-3">
                <ChartBarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Student Templates</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {templates.filter(t => t.survey_type === 'student').length}
                </p>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-purple-100 p-3">
                <DocumentTextIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Questions</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {templates.reduce((sum, t) => sum + (t.question_count || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
