// app/[locale]/admin/surveys/assignments/[id]/responses/page.tsx
'use client';

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
  UserIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format } from 'date-fns';

interface SurveyQuestion {
  id: string;
  question_text: string;
  question_type: string;
  order_index: number;
}

interface SurveyResponse {
  id: string;
  submitted_at: string;
  submitted_by_name: string;
  volunteer_name?: string;
  pilot_name: string;
  total_students?: number;
  is_aggregated?: boolean;
  responses: Record<string, any>;
}

interface AssignmentDetails {
  id: string;
  survey_name: string;
  survey_description: string;
  survey_type: string;
  survey_period: string;
  assigned_to_user_id: string | null;
  assigned_to_pilot_id: string | null;
  due_date: string;
  status: string;
  volunteer_name: string | null;
  pilot_name: string;
  questions: SurveyQuestion[];
}

interface AssignmentResponsesPageProps {
  params: {
    locale: string;
    id: string;
  };
}

export default function AssignmentResponsesPage({ params }: AssignmentResponsesPageProps) {
  const locale = params.locale || 'en';
  // Fetch assignment details
  const { data: assignment, isLoading: assignmentLoading } = useApiQuery<AssignmentDetails>(
    ['assignment-details', params.id],
    () => api.get<AssignmentDetails>(`/survey-assignments/${params.id}`)
  );

  // Fetch responses based on assignment type
  const { data: response, isLoading: responseLoading } = useApiQuery<SurveyResponse | null>(
    ['assignment-response', params.id],
    () => {
      if (!assignment) return Promise.resolve(null);
      
      if (assignment.survey_type === 'volunteer') {
        return api.get<SurveyResponse>(`/survey-responses/volunteer/assignment/${params.id}`);
      } else if (assignment.survey_type === 'student') {
        return api.get<SurveyResponse>(`/survey-responses/student/assignment/${params.id}`);
      }
      return Promise.resolve(null);
    },
    {
      enabled: !!assignment,
    }
  );

  const isLoading = assignmentLoading || responseLoading;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <SkeletonLoader type="card" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert 
          type="error" 
          title="Unable to load assignment"
        >
          <p className="text-sm text-red-700 mt-1">
            The assignment could not be loaded.
          </p>
          <div className="mt-4">
            <Link href={`/${locale}/admin/surveys/assignments`}>
              <Button variant="outline" className="inline-flex items-center">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Assignments
              </Button>
            </Link>
          </div>
        </Alert>
      </div>
    );
  }

  const isStudentSurvey = assignment.survey_type === 'student';
  const isAggregated = response?.is_aggregated;
  const assignmentQuestions = Array.isArray(assignment.questions) ? assignment.questions : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/${locale}/admin/surveys/assignments/${params.id}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Assignment
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Survey Responses</h1>
            <p className="mt-1 text-sm text-gray-500">
              View submitted responses for this survey assignment
            </p>
          </div>
          {response && (
            <div className="flex items-center text-green-600">
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              <span className="font-medium">Submitted</span>
            </div>
          )}
        </div>

        {/* Assignment Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-500">Survey</p>
            <p className="mt-1 text-sm text-gray-900">{assignment.survey_name}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-500">Assigned To</p>
            <div className="mt-1 flex items-center">
              <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
              <p className="text-sm text-gray-900">
                {assignment.volunteer_name || assignment.pilot_name}
              </p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-500">Survey Type</p>
            <p className="mt-1 text-sm text-gray-900 capitalize">
              {assignment.survey_type} • {assignment.survey_period.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Response Status Card */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Response Status</h2>
              <p className="mt-1 text-sm text-gray-500">
                {response ? 'Survey has been submitted' : 'Awaiting submission'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-500">Assignment Status</p>
              <span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
                assignment.status === 'overdue' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {assignment.status}
              </span>
            </div>
          </div>

          {response && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <UserIcon className="h-4 w-4 text-blue-400 mr-2" />
                  <p className="text-sm font-medium text-blue-900">Submitted By</p>
                </div>
                <p className="mt-2 text-sm text-blue-700">{response.submitted_by_name}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 text-blue-400 mr-2" />
                  <p className="text-sm font-medium text-blue-900">Submitted On</p>
                </div>
                <p className="mt-2 text-sm text-blue-700">
                  {format(new Date(response.submitted_at), 'PPP')}
                </p>
              </div>
              {isStudentSurvey && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <ChartBarIcon className="h-4 w-4 text-blue-400 mr-2" />
                    <p className="text-sm font-medium text-blue-900">Response Type</p>
                  </div>
                  <p className="mt-2 text-sm text-blue-700">
                    {isAggregated ? 'Aggregated Responses' : 'Individual Responses'}
                    {response.total_students && ` • ${response.total_students} students`}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Responses Card */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Survey Responses</h2>

          {response && response.responses && Object.keys(response.responses).length > 0 ? (
            <div className="space-y-8">
              {assignmentQuestions.map((question: SurveyQuestion) => {
                const questionResponse = response.responses[question.id];
                return (
                  <div key={question.id} className="border-b pb-8 last:border-0">
                    <div className="mb-4">
                      <h3 className="font-medium text-gray-900 mb-2">
                        {question.order_index + 1}. {question.question_text}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Type: <span className="capitalize">{question.question_type.replace('_', ' ')}</span>
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      {isStudentSurvey && isAggregated ? (
                        // Aggregated student responses
                        <div className="space-y-3">
                          <p className="font-medium text-gray-700">Aggregated Results:</p>
                          {typeof questionResponse === 'object' && questionResponse ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {Object.entries(questionResponse).map(([key, value]) => (
                                <div key={key} className="bg-white rounded border p-3">
                                  <p className="text-sm font-medium text-gray-900 capitalize">{key}</p>
                                  <div className="text-2xl font-bold text-blue-600">
                                     {String(value)} {/* Convert value to string */}
                                </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-700">{JSON.stringify(questionResponse)}</p>
                          )}
                        </div>
                      ) : question.question_type === 'agree_disagree_unsure' ? (
                        // Agree/Disagree/Unsure responses
                        <div className="space-y-2">
                          <p className="font-medium text-gray-700">Response:</p>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              questionResponse === 'agree' ? 'bg-green-100 text-green-800' :
                              questionResponse === 'disagree' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {questionResponse}
                            </span>
                            <span className="text-sm text-gray-500">
                              {questionResponse === 'agree' ? '(Ndabyemera)' :
                               questionResponse === 'disagree' ? '(Simbyemera)' :
                               '(Simbizi neza)'}
                            </span>
                          </div>
                        </div>
                      ) : question.question_type === 'scale_1_10' ? (
                        // Scale 1-10 responses
                        <div className="space-y-2">
                          <p className="font-medium text-gray-700">Rating:</p>
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-blue-600 h-full"
                                style={{ width: `${(questionResponse / 10) * 100}%` }}
                              />
                            </div>
                            <span className="ml-3 text-2xl font-bold text-gray-900">
                              {questionResponse}/10
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            1 = Extremely, 10 = Not at all
                          </p>
                        </div>
                      ) : Array.isArray(questionResponse) ? (
                        // Array responses (multiple choice)
                        <div className="space-y-2">
                          <p className="font-medium text-gray-700">Responses:</p>
                          <ul className="list-disc pl-5 space-y-1">
                            {questionResponse.map((item: string, index: number) => (
                              <li key={index} className="text-gray-700">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        // Text responses
                        <div className="space-y-2">
                          <p className="font-medium text-gray-700">Response:</p>
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {questionResponse || 'No response provided'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">
                No responses submitted yet
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                The assigned user has not submitted responses for this survey.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Link href={`/${locale}/admin/surveys/assignments/${params.id}`}>
          <Button variant="outline">Back to Assignment</Button>
        </Link>
        <Link href={`/${locale}/admin/surveys/assignments/${params.id}/edit`}>
          <Button variant="default">Edit Assignment</Button>
        </Link>
      </div>
    </div>
  );
}
