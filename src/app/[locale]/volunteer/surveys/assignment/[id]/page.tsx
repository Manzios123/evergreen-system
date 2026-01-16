// app/[locale]/volunteer/surveys/assignment/[id]/page.tsx
'use client';

import { SurveyForm } from '@/components/surveys/survey-form';
import { Card } from '@/components/ui/card';
import Alert from '@/components/ui/alert';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import Button from '@/components/ui/button';
import { useApiQuery } from '@/lib/hooks/use-api';
import { api } from '@/lib/api/api';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  CalendarIcon,
  ClockIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SurveyQuestion {
  id: string;
  question_text: string;
  question_type: string;
  order_index: number;
  is_required: number;
  options?: string;
  validation_rules?: string;
}

interface SurveyAssignment {
  id: string;
  survey_template_id: string;
  due_date: string | null;
  status: string;
  survey_name: string;
  survey_description: string | null;
  survey_type: string;
  survey_period: string;
  pilot_id: string;
  pilot_name: string;
  assigned_by_name: string;
  volunteer_name: string;
  completed: boolean;
  completed_at: string | null;
  submission_count?: number;
  questions: SurveyQuestion[];
}

interface AssignmentResponse {
  assignment: SurveyAssignment;
  questions: SurveyQuestion[];
  completed: boolean;
  completed_at: string | null;
  response_id: string | null;
  can_edit: boolean;
  submission_count: number;
}

interface SurveyAssignmentPageProps {
  params: {
    id: string;
  };
}

export default function SurveyAssignmentPage({ params }: SurveyAssignmentPageProps) {
  const router = useRouter();
  const urlParams = useParams();
  const [surveyData, setSurveyData] = useState<any>(null);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [showForm, setShowForm] = useState(true);
  
  const assignmentId = params?.id || (urlParams?.id as string);

  const { data: apiResponse, isLoading, error, refetch } = useApiQuery<AssignmentResponse>(
    ['survey-assignment', assignmentId],
    () => {
      if (!assignmentId) {
        return Promise.reject(new Error('Missing assignment ID'));
      }
      return api.get<AssignmentResponse>(`/survey-assignments/${assignmentId}`);
    },
    {
      enabled: !!assignmentId,
      refetchOnMount: true,
    }
  );

  useEffect(() => {
    if (apiResponse) {
      console.log('API Response received:', apiResponse);
      
      const transformedData = {
        id: apiResponse.assignment?.id || assignmentId,
        title: apiResponse.assignment?.survey_name || 'Survey',
        description: apiResponse.assignment?.survey_description || '',
        due_date: apiResponse.assignment?.due_date || null,
        status: apiResponse.assignment?.status || 'assigned',
        type: apiResponse.assignment?.survey_type || 'volunteer',
        completed: Boolean(apiResponse.completed),
        completed_at: apiResponse.completed_at || null,
        submission_count: apiResponse.submission_count || 0,
        template: {
          id: apiResponse.assignment?.survey_template_id || '',
          type: apiResponse.assignment?.survey_type || 'volunteer',
          description: apiResponse.assignment?.survey_description || '',
          questions: (apiResponse.questions || []).map((q: SurveyQuestion) => ({
            ...q,
            is_required: q.is_required === 1,
          })),
        }
      };
      setSurveyData(transformedData);
      
      // Auto-show form for student surveys even if completed
      const isStudentSurvey = apiResponse.assignment?.survey_type === 'student';
      const isCompleted = Boolean(apiResponse.completed);
      
      if (isStudentSurvey && isCompleted) {
        setShowForm(true); // Always show form for student surveys
      } else if (isCompleted) {
        setShowForm(false); // Hide form for completed volunteer surveys
      } else {
        setShowForm(true); // Show form for incomplete surveys
      }
    }
  }, [apiResponse, assignmentId]);

  const handleComplete = () => {
    // Refresh the data to show updated submission count
    refetch();
    // Show success message
    setTimeout(() => {
      const isStudentSurvey = apiResponse?.assignment?.survey_type === 'student';
      if (isStudentSurvey) {
        setIsResubmitting(false);
        alert(`Survey submitted successfully! Total submissions: ${(apiResponse?.submission_count || 0) + 1}`);
      } else {
        router.push('/volunteer/surveys/volunteer');
        router.refresh();
      }
    }, 1500);
  };

  // Show loading state if still getting the ID or fetching data
  if (!assignmentId || isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <SkeletonLoader type="card" />
      </div>
    );
  }

  if (error) {
    console.error('Error loading assignment:', error);
    return (
      <div className="max-w-3xl mx-auto">
        <Alert
          type="error"
          title="Unable to load survey"
        >
          <p className="mt-2">The survey could not be loaded. It may have been completed or is no longer available.</p>
          <div className="mt-4">
            <Link href="/volunteer/surveys/volunteer" className="inline-flex items-center text-sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Surveys
            </Link>
          </div>
        </Alert>
      </div>
    );
  }

  // Check if apiResponse is null
  if (!apiResponse) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert
          type="error"
          title="Survey not found"
        >
          <p className="mt-2">This survey assignment could not be found. It may have been deleted or you may not have access.</p>
          <div className="mt-4">
            <Link href="/volunteer/surveys/volunteer" className="inline-flex items-center text-sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Surveys
            </Link>
          </div>
        </Alert>
      </div>
    );
  }

  const assignment = apiResponse.assignment;
  const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date();
  const isVolunteerSurvey = assignment.survey_type === 'volunteer';
  const isStudentSurvey = assignment.survey_type === 'student';
  const isCompleted = Boolean(apiResponse.completed);
  const submissionCount = apiResponse.submission_count || 0;

  // For completed volunteer surveys, show completed message
  if (isVolunteerSurvey && isCompleted && !showForm) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Alert
          type="success"
          title="Survey already completed"
        >
          <p className="mt-2">You have already completed this survey on {apiResponse.completed_at ? new Date(apiResponse.completed_at).toLocaleDateString() : 'an unknown date'}.</p>
          <div className="mt-4">
            <Button 
              variant="outline"
              onClick={() => router.push(`/volunteer/surveys/submissions`)}
            >
              View My Submissions
            </Button>
          </div>
        </Alert>
        <Card>
          <div className="p-6 text-center">
            <DocumentTextIcon className="h-12 w-12 text-green-500 mx-auto" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              Thank you for your feedback!
            </h3>
            <p className="mt-2 text-gray-600">
              Your responses have been recorded and will help us improve the
              volunteering program.
            </p>
            <div className="mt-6">
              <Button 
                variant="outline"
                onClick={() => router.push('/volunteer/surveys/volunteer')}
              >
                Back to Surveys
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // For completed student surveys, show info message but allow form access
  if (isStudentSurvey && isCompleted && !isResubmitting) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Alert
          type="info"
          title="Student Survey - Additional Submission Available"
        >
          <p className="mt-2">
            You have already submitted this student survey {submissionCount} time(s).
            Student surveys can be submitted multiple times for different student groups or sessions.
          </p>
          <div className="mt-4 flex gap-3">
            <Button 
              variant="outline"
              onClick={() => router.push(`/volunteer/surveys/submissions`)}
            >
              View My Submissions
            </Button>
            <Button 
              variant="default"
              onClick={() => setIsResubmitting(true)}
            >
              <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
              Submit Additional Data
            </Button>
          </div>
        </Alert>
        
        {isResubmitting && (
          <Card>
            <div className="p-6">
              <SurveyForm 
                survey={surveyData} 
                onComplete={handleComplete}
                assignmentId={assignmentId}
                surveyType={assignment.survey_type}
              />
            </div>
          </Card>
        )}
      </div>
    );
  }

  // Check if user can edit
  if (!apiResponse.can_edit && !isStudentSurvey) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert
          type="warning"
          title="Survey not available for editing"
        >
          <p className="mt-2">This survey cannot be edited. It may have been submitted or is no longer active.</p>
          <div className="mt-4">
            <Link href="/volunteer/surveys/volunteer" className="inline-flex items-center text-sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Surveys
            </Link>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/volunteer/surveys/volunteer"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Surveys
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-3">
              {isVolunteerSurvey ? (
                <ChatBubbleLeftIcon className="h-8 w-8 text-gray-400" />
              ) : (
                <DocumentTextIcon className="h-8 w-8 text-gray-400" />
              )}
              <h1 className="text-2xl font-bold text-gray-900">
                {assignment.survey_name}
              </h1>
            </div>
            <p className="mt-2 text-gray-600">
              {assignment.survey_description || `Please complete this ${assignment.survey_period.replace('_', ' ')} survey`}
            </p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            {isOverdue && (
              <span className="inline-flex items-center rounded-md bg-red-50 px-3 py-1 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                Overdue
              </span>
            )}
            {isStudentSurvey && submissionCount > 0 && (
              <span className="inline-flex items-center rounded-md bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                Submission #{submissionCount + 1}
              </span>
            )}
          </div>
        </div>

        {/* Survey Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-500">Pilot</p>
            <p className="mt-1 text-sm text-gray-900">
              {assignment.pilot_name}
            </p>
          </div>

          {assignment.due_date && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                <p className="text-sm font-medium text-gray-500">Due Date</p>
              </div>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(assignment.due_date).toLocaleDateString()}
              </p>
              {isOverdue && (
                <p className="text-xs text-red-600">Past due</p>
              )}
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
              <p className="text-sm font-medium text-gray-500">
                {isStudentSurvey ? 'Time per Session' : 'Estimated Time'}
              </p>
            </div>
            <p className="mt-1 text-sm text-gray-900">
              {apiResponse.questions?.length 
                ? `${Math.ceil(apiResponse.questions.length * 0.5)} minutes`
                : '5-10 minutes'}
            </p>
          </div>
        </div>
      </div>

      {/* Survey Form */}
      {showForm && (
        <Card>
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {isStudentSurvey && submissionCount > 0 ? 'Additional Survey Submission' : 'Complete Survey'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {isStudentSurvey && submissionCount > 0
                  ? `This will be submission #${submissionCount + 1}. Enter data from your latest student session.`
                  : 'Please answer all questions honestly. Your feedback is valuable!'}
              </p>
            </div>

            {isOverdue && (
              <Alert
                type="warning"
                title="This survey is overdue"
              >
                <p className="mt-2">Please complete this survey as soon as possible. Your feedback is still important to us.</p>
              </Alert>
            )}

            {isStudentSurvey && submissionCount > 0 && (
              <Alert
                type="info"
                title="Multiple Submissions Allowed"
              >
                <p className="mt-2">
                  This is a student survey. You have already submitted {submissionCount} time(s). 
                  You can submit additional data for different student groups or sessions.
                </p>
              </Alert>
            )}

            {surveyData && apiResponse.questions && apiResponse.questions.length > 0 ? (
              <SurveyForm 
                survey={surveyData} 
                onComplete={handleComplete}
                assignmentId={assignmentId}
                surveyType={assignment.survey_type}
                submissionCount={submissionCount}
              />
            ) : (
              <Alert
                type="error"
                title="No questions found"
              >
                <p className="mt-2">This survey doesn't have any questions configured. Please contact the administrator.</p>
              </Alert>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}