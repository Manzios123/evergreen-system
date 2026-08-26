// app/[locale]/volunteer/surveys/assignment/[id]/responses/page.tsx
'use client'

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import Alert from '@/components/ui/alert';
import { useApiQuery } from '@/lib/hooks/use-api';
import { api } from '@/lib/api/api';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  CalendarIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { ReactNode } from 'react';

interface SurveyQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options?: string | null;
}

interface SurveyResponse {
  id: string;
  submitted_at: string;
  responses: Record<string, any>;
}

interface SurveyAssignmentPageProps {
  params: {
    id: string;
  };
}

const AGREE_DISAGREE_OPTIONS = ['Agree', 'Disagree', 'Unsure'];

function parseOptions(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((option) => String(option)) : [];
  } catch {
    return [];
  }
}

export default function SurveyResponsesPage({ params }: SurveyAssignmentPageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedResponses, setEditedResponses] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // First get assignment details
  const { data: assignmentData, isLoading: assignmentLoading } = useApiQuery<any>(
    ['survey-assignment', params.id, 'details'],
    () => api.get(`/survey-assignments/${params.id}`)
  );

  // Then get responses based on survey type
  const { data: responseData, isLoading: responseLoading, refetch: refetchResponse } = useApiQuery<SurveyResponse | null>(
    ['survey-response', params.id],
    () => {
      if (!assignmentData) return Promise.resolve(null);

      if (assignmentData.assignment.survey_type === 'volunteer') {
        return api.get<SurveyResponse>(`/survey-responses/volunteer/assignment/${params.id}`);
      } else if (assignmentData.assignment.survey_type === 'student') {
        return api.get<SurveyResponse>(`/survey-responses/student/assignment/${params.id}`);
      }
      return Promise.resolve(null);
    },
    {
      enabled: !!assignmentData,
    }
  );

  const isLoading = assignmentLoading || responseLoading;

  useEffect(() => {
    if (responseData?.responses) {
      setEditedResponses(responseData.responses);
    }
  }, [responseData]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <SkeletonLoader type="card" />
      </div>
    );
  }

  if (!assignmentData) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert
          type="error"
          title="Unable to load survey responses"
        >
          <p className="text-sm text-red-700 mt-1">
            The survey assignment could not be loaded.
          </p>
          <div className="mt-4">
            <Link href="/volunteer/surveys/volunteer">
              <Button variant="outline" className="inline-flex items-center">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Surveys
              </Button>
            </Link>
          </div>
        </Alert>
      </div>
    );
  }

  const assignment = assignmentData.assignment;
  const questions = assignmentData.questions || [];
  const response = responseData;
  const surveyPeriodLabel = (assignment.survey_period || 'survey').replace('_', ' ');
  const canEdit = !!assignmentData.can_edit && !!response;

  // Fix the type error by properly handling the value
  const renderResponseValue = (value: any): ReactNode => {
    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return String(value);
  };

  const handleStartEdit = () => {
    setEditedResponses(response?.responses || {});
    setSaveError(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedResponses(response?.responses || {});
    setSaveError(null);
    setIsEditing(false);
  };

  const handleFieldChange = (questionId: string, value: any) => {
    setEditedResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSave = async () => {
    if (!response) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const endpoint = assignment.survey_type === 'volunteer'
        ? `/survey-responses/volunteer/${response.id}`
        : `/survey-responses/student/${response.id}`;
      await api.put(endpoint, { responses: editedResponses });
      await refetchResponse();
      setIsEditing(false);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Renders one editable field, keyed by question type. Media questions aren't
  // editable here yet (would need the full upload widget) - their existing
  // value is carried through unchanged in editedResponses instead.
  const renderEditField = (question: SurveyQuestion) => {
    const value = editedResponses[question.id];
    const options = parseOptions(question.options);

    if (question.question_type === 'media') {
      return (
        <p className="text-sm text-gray-500 italic">
          Media answers can't be changed here yet - contact your coordinator if this needs updating.
        </p>
      );
    }

    if (question.question_type === 'agree_disagree_unsure') {
      return (
        <select
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => handleFieldChange(question.id, e.target.value)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
        >
          <option value="">Select a response...</option>
          {AGREE_DISAGREE_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );
    }

    if (['single_choice', 'radio', 'select', 'yes_no', 'choice'].includes(question.question_type) && options.length > 0) {
      return (
        <select
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => handleFieldChange(question.id, e.target.value)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
        >
          <option value="">Select a response...</option>
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );
    }

    if (['multiple_choice', 'checkbox', 'multi_select'].includes(question.question_type) && options.length > 0) {
      const selected: string[] = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2">
          {options.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...selected, option]
                    : selected.filter((item) => item !== option);
                  handleFieldChange(question.id, next);
                }}
                className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              {option}
            </label>
          ))}
        </div>
      );
    }

    if (['number', 'scale_1_5', 'scale_1_10', 'rating', 'scale'].includes(question.question_type)) {
      return (
        <input
          type="number"
          value={typeof value === 'number' || typeof value === 'string' ? value : ''}
          onChange={(e) => handleFieldChange(question.id, e.target.value)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
        />
      );
    }

    // Default: free text
    return (
      <textarea
        value={typeof value === 'string' ? value : (value ? String(value) : '')}
        onChange={(e) => handleFieldChange(question.id, e.target.value)}
        rows={3}
        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
      />
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href="/volunteer/surveys/volunteer"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Surveys
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Survey Responses
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              View your completed survey responses
            </p>
          </div>
          <div className="flex items-center gap-4">
            {response && (
              <div className="flex items-center text-green-600">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                <span className="font-medium">Completed</span>
              </div>
            )}
            {canEdit && !isEditing && (
              <Button variant="outline" size="sm" onClick={handleStartEdit}>
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Responses
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center">
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            <span className="capitalize">
              {assignment.survey_type === 'volunteer' ? 'Volunteer' : 'Student'} Survey
            </span>
          </div>
          <div className="flex items-center">
            <span className="capitalize">
              {surveyPeriodLabel}
            </span>
          </div>
          {response?.submitted_at && (
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-2" />
              <span>
                Submitted on {new Date(response.submitted_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {assignment.survey_name}
          </h2>

          {saveError && (
            <Alert type="error" title="Couldn't save changes">
              {saveError}
            </Alert>
          )}

          {response && response.responses && Object.keys(response.responses).length > 0 ? (
            <div className="space-y-6">
              {questions.map((question: SurveyQuestion) => {
                const questionResponse = response.responses[question.id];
                return (
                  <div key={question.id} className="border-b pb-6 last:border-0">
                    <h3 className="font-medium text-gray-900 mb-2">
                      {question.question_text}
                    </h3>
                    {isEditing ? (
                      renderEditField(question)
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4">
                        {question.question_type === 'agree_disagree_unsure' ? (
                          <div>
                            <p className="text-gray-700 mb-2">
                              <strong>Response:</strong> {renderResponseValue(questionResponse) || 'No response provided'}
                            </p>
                            {typeof questionResponse === 'object' && questionResponse ? (
                              <div className="mt-2">
                                <p className="text-sm text-gray-600">Breakdown:</p>
                                <ul className="list-disc pl-5 mt-1">
                                  {Object.entries(questionResponse).map(([key, value]) => (
                                    <li key={key} className="text-gray-700">
                                      {key}: {renderResponseValue(value)}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                          </div>
                        ) : Array.isArray(questionResponse) ? (
                          <ul className="list-disc pl-5 space-y-1">
                            {questionResponse.map((item: string, index: number) => (
                              <li key={index} className="text-gray-700">
                                {renderResponseValue(item)}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-700">
                            {renderResponseValue(questionResponse) || 'No response provided'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">
                No responses available
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Survey responses could not be loaded or no responses were submitted.
              </p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t flex justify-end gap-3">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} loading={isSaving}>
                  Save Changes
                </Button>
              </>
            ) : (
              <Link href="/volunteer/surveys/volunteer">
                <Button variant="outline">Back to Surveys</Button>
              </Link>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
