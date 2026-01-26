'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApiQuery } from '@/lib/hooks/use-api';
import { api } from '@/lib/api/api';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';
import EmptyState from '@/components/ui/empty-state';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import Badge from '@/components/ui/badge';
import { formatDate } from '@/lib/utils/date-utils';

// Define types based on backend response
interface SurveyQuestion {
  id: string;
  component_id: string | null;
  question_text: string;
  question_type: string;
  order_index: number;
  is_required: boolean;
  created_at: string;
  options?: string[]; // For multiple-choice questions
}

interface SurveyTemplate {
  id: string;
  pilot_id: string;
  name: string;
  description?: string;
  survey_type: 'student' | 'volunteer' | 'activity_monitoring';
  survey_period: 'pre_activity' | 'post_activity' | 'mid_pilot' | 'end_pilot';
  version: number;
  change_reason: string;
  created_by: string;
  created_at: string;
  pilot_name: string;
  creator_name: string;
  questions: SurveyQuestion[];
}

export default function ViewSurveyTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [error, setError] = useState<string | null>(null);

  // Fetch template data
  const {
    data: template,
    isLoading,
    isError,
    refetch,
  } = useApiQuery<SurveyTemplate>(
    ['survey-template', id],
    () => api.get(`/survey-templates/${id}`)
  );

  const handleEdit = () => {
    router.push(`/admin/surveys/templates/${id}/edit`);
  };

  const handleBack = () => {
    router.push('/admin/surveys/templates');
  };

  // Map survey type to display name
  const getSurveyTypeDisplay = (type: string) => {
    const typeMap: Record<string, string> = {
      student: 'Student',
      volunteer: 'Volunteer',
      activity_monitoring: 'Activity Monitoring',
    };
    return typeMap[type] || type;
  };

  // Map survey period to display name
  const getSurveyPeriodDisplay = (period: string) => {
    const periodMap: Record<string, string> = {
      pre_activity: 'Pre-Activity',
      post_activity: 'Post-Activity',
      mid_pilot: 'Mid-Pilot',
      end_pilot: 'End of Pilot',
    };
    return periodMap[period] || period;
  };

  // Map question type to display name
  const getQuestionTypeDisplay = (type: string) => {
    const typeMap: Record<string, string> = {
      text: 'Text',
      multiple_choice: 'Multiple Choice',
      checkbox: 'Checkbox',
      scale: 'Scale',
      date: 'Date',
      time: 'Time',
    };
    return typeMap[type] || type;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <SkeletonLoader className="h-8 w-48 mb-2" />
          <SkeletonLoader className="h-4 w-64" />
        </div>
        <Card className="p-6">
          <SkeletonLoader className="h-6 w-full mb-4" />
          <SkeletonLoader className="h-4 w-3/4 mb-4" />
          <SkeletonLoader className="h-4 w-1/2 mb-6" />
          <SkeletonLoader className="h-10 w-32" />
        </Card>
      </div>
    );
  }

  if (isError || !template) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          title="Template not found"
          description="The survey template you're looking for doesn't exist or you don't have permission to view it."
          action={{
            label: 'Back to Templates',
            onClick: handleBack,
          }}
          secondaryAction={{
            label: 'Try Again',
            onClick: () => refetch(),
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
          <p className="text-gray-600 mt-1">
            Version {template.version} • Created {formatDate(template.created_at)}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleBack}>
            Back to Templates
          </Button>
          <Button onClick={handleEdit}>Edit Template</Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Details */}
        <Card className="lg:col-span-2">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Template Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-gray-900">{template.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-gray-900">{template.description || 'No description provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Survey Type</label>
                <Badge variant="outline" className="mt-1">
                  {getSurveyTypeDisplay(template.survey_type)}
                </Badge>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Survey Period</label>
                <Badge variant="outline" className="mt-1">
                  {getSurveyPeriodDisplay(template.survey_period)}
                </Badge>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pilot</label>
                <p className="text-gray-900">{template.pilot_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                <p className="text-gray-900">{template.creator_name}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Change Reason</label>
                <p className="text-gray-900">{template.change_reason}</p>
              </div>
            </div>

            {/* Questions Section */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Questions ({template.questions.length})</h3>
              </div>

              {template.questions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No questions added to this template yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {template.questions
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((question, index) => (
                      <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                              {index + 1}
                            </span>
                            <h4 className="font-medium text-gray-900">{question.question_text}</h4>
                            {question.is_required && (
                              <Badge variant="error" size="sm">
                                Required
                              </Badge>
                            )}
                          </div>
                          <Badge variant="outline" size="sm">
                            {getQuestionTypeDisplay(question.question_type)}
                          </Badge>
                        </div>
                        
                        {question.component_id && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">Component ID: {question.component_id}</span>
                          </div>
                        )}
                        
                        {/* Display options for multiple choice questions */}
                        {question.question_type === 'multiple_choice' && question.options && question.options.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Options:</p>
                            <ul className="space-y-1">
                              {question.options.map((option, idx) => (
                                <li key={idx} className="text-sm text-gray-600">
                                  {idx + 1}. {option}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Sidebar with Metadata */}
        <Card className="h-fit">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Template Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template ID</label>
                <p className="text-sm text-gray-600 font-mono break-all">{template.id}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                <p className="text-sm text-gray-600">{formatDate(template.created_at, true)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                <div className="flex items-center gap-2">
                  <Badge variant="success" size="sm">
                    v{template.version}
                  </Badge>
                  <span className="text-sm text-gray-600">Latest</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <Badge variant="success">Active</Badge>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pilot ID</label>
                <p className="text-sm text-gray-600">{template.pilot_id}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Creator ID</label>
                <p className="text-sm text-gray-600">{template.created_by}</p>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Actions</h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" fullWidth onClick={handleEdit}>
                  Edit Template
                </Button>
                <Button variant="outline" size="sm" fullWidth onClick={handleBack}>
                  Back to List
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}