// app/[locale]/volunteer/surveys/assignment/[id]/responses/page.tsx
'use client'

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
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { ReactNode } from 'react'; // Add this import

interface SurveyQuestion {
  id: string;
  question_text: string;
  question_type: string;
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

export default function SurveyResponsesPage({ params }: SurveyAssignmentPageProps) {
  // First get assignment details
  const { data: assignmentData, isLoading: assignmentLoading } = useApiQuery<any>(
    ['survey-assignment', params.id, 'details'],
    () => api.get(`/survey-assignments/${params.id}`)
  );

  // Then get responses based on survey type
  const { data: responseData, isLoading: responseLoading } = useApiQuery<SurveyResponse | null>(
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
          {response && (
            <div className="flex items-center text-green-600">
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              <span className="font-medium">Completed</span>
            </div>
          )}
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

          {response && response.responses && Object.keys(response.responses).length > 0 ? (
            <div className="space-y-6">
              {questions.map((question: SurveyQuestion) => {
                const questionResponse = response.responses[question.id];
                return (
                  <div key={question.id} className="border-b pb-6 last:border-0">
                    <h3 className="font-medium text-gray-900 mb-2">
                      {question.question_text}
                    </h3>
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

          <div className="mt-8 pt-6 border-t flex justify-end">
            <Link href="/volunteer/surveys/volunteer">
              <Button variant="outline">Back to Surveys</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
