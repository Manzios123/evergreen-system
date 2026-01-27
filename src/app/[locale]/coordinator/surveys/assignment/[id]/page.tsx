// app/[locale]/admin/surveys/assignment/[id]/page.tsx - ADMIN VERSION
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
  questions: SurveyQuestion[];
}

interface AssignmentResponse {
  assignment: SurveyAssignment;
  questions: SurveyQuestion[];
  completed: boolean;
  completed_at: string | null;
  response_id: string | null;
  can_edit: boolean;
  submission_stats?: {
    submissions_count: number;
    last_submission_at: string | null;
    my_submissions_count: number;
    my_last_submission_at: string | null;
  };
}

interface SurveyAssignmentPageProps {
  params: {
    id: string;
  };
}

export default function AdminSurveyAssignmentPage({ params }: SurveyAssignmentPageProps) {
  const router = useRouter();
  const urlParams = useParams();
  const [surveyData, setSurveyData] = useState<any>(null);
  const [showSubmissionSuccess, setShowSubmissionSuccess] = useState(false);
  
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
        completed: apiResponse.completed || false,
        completed_at: apiResponse.completed_at || null,
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
    }
  }, [apiResponse, assignmentId]);

  const handleComplete = () => {
    refetch();
    
    if (apiResponse?.assignment?.survey_type === 'student') {
      setShowSubmissionSuccess(true);
      setTimeout(() => {
        setShowSubmissionSuccess(false);
      }, 5000);
    } else {
      // ADMIN CHANGE: Redirect to admin surveys page instead of volunteer
      setTimeout(() => {
        router.push('/admin/surveys?tab=admin');
        router.refresh();
      }, 1500);
    }
  };

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
            {/* ADMIN CHANGE: Link to admin surveys page */}
            <Link href="/admin/surveys?tab=admin" className="inline-flex items-center text-sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Admin Surveys
            </Link>
          </div>
        </Alert>
      </div>
    );
  }

  if (!apiResponse) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert
          type="error"
          title="Survey not found"
        >
          <p className="mt-2">This survey assignment could not be found. It may have been deleted or you may not have access.</p>
          <div className="mt-4">
            {/* ADMIN CHANGE: Link to admin surveys page */}
            <Link href="/admin/surveys?tab=admin" className="inline-flex items-center text-sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Admin Surveys
            </Link>
          </div>
        </Alert>
      </div>
    );
  }

  const assignment = apiResponse.assignment;
  const isVolunteerSurvey = assignment.survey_type === 'volunteer';
  const isStudentSurvey = assignment.survey_type === 'student';

  // For admin context, we treat volunteer surveys as staff/admin surveys
  const isStaffSurvey = isVolunteerSurvey;

  // Check if staff/admin survey is completed
  if (isStaffSurvey && apiResponse.completed) {
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
              onClick={() => router.push(`/admin/surveys?tab=admin`)}
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
              Your responses have been recorded and will help us improve the program.
            </p>
            <div className="mt-6">
              {/* ADMIN CHANGE: Link to admin surveys page */}
              <Button 
                variant="outline"
                onClick={() => router.push('/admin/surveys?tab=admin')}
              >
                Back to Admin Surveys
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Check if user can edit staff surveys
  if (isStaffSurvey && !apiResponse.can_edit) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert
          type="warning"
          title="Survey not available for editing"
        >
          <p className="mt-2">This survey cannot be edited. It may have been submitted or is no longer active.</p>
          <div className="mt-4">
            {/* ADMIN CHANGE: Link to admin surveys page */}
            <Link href="/admin/surveys?tab=admin" className="inline-flex items-center text-sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Admin Surveys
            </Link>
          </div>
        </Alert>
      </div>
    );
  }

  const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        {/* ADMIN CHANGE: Link to admin surveys page */}
        <Link
          href="/admin/surveys?tab=admin"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Admin Surveys
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-3">
              {isStaffSurvey ? (
                <ChatBubbleLeftIcon className="h-8 w-8 text-gray-400" />
              ) : (
                <DocumentTextIcon className="h-8 w-8 text-gray-400" />
              )}
              <h1 className="text-2xl font-bold text-gray-900">
                {assignment.survey_name}
              </h1>
              {isStaffSurvey && (
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                  Staff Survey
                </span>
              )}
            </div>
            <p className="mt-2 text-gray-600">
              {assignment.survey_description || 
                (isStaffSurvey 
                  ? `Please complete this staff survey` 
                  : `Please complete this ${assignment.survey_period.replace('_', ' ')} student survey`)}
            </p>
          </div>
          {isOverdue && (
            <span className="inline-flex items-center rounded-md bg-red-50 px-3 py-1 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
              Overdue
            </span>
          )}
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
                Estimated Time
              </p>
            </div>
            <p className="mt-1 text-sm text-gray-900">
              {apiResponse.questions?.length 
                ? `${Math.ceil(apiResponse.questions.length * 0.5)} minutes`
                : '5-10 minutes'}
            </p>
          </div>
        </div>

        {/* Student Survey Submission Stats Banner */}
        {isStudentSurvey && apiResponse.submission_stats && (
          <div className="mt-6">
            <Alert
              type="info"
              title="Student Survey Progress"
            >
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Total Submissions:</p>
                  <p className="text-lg">{apiResponse.submission_stats.submissions_count}</p>
                  {apiResponse.submission_stats.last_submission_at && (
                    <p className="text-sm text-gray-600">
                      Last submission: {new Date(apiResponse.submission_stats.last_submission_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <div>
                  <p className="font-medium">Your Submissions:</p>
                  <p className="text-lg">{apiResponse.submission_stats.my_submissions_count}</p>
                  {apiResponse.submission_stats.my_last_submission_at && (
                    <p className="text-sm text-gray-600">
                      Your last: {new Date(apiResponse.submission_stats.my_last_submission_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <p className="mt-3 text-sm">
                You can submit multiple student surveys. Each submission helps build a more complete picture.
              </p>
            </Alert>
          </div>
        )}

        {/* Success message for student survey submissions */}
        {showSubmissionSuccess && isStudentSurvey && (
          <div className="mt-6">
            <Alert
              type="success"
              title="Survey Submitted Successfully!"
            >
              <p className="mt-2">
                Your student survey has been recorded. You can submit another survey if needed.
              </p>
            </Alert>
          </div>
        )}
      </div>

      {/* Survey Form */}
      <Card>
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {isStudentSurvey ? 'Submit Student Survey' : 'Complete Staff Survey'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {isStudentSurvey 
                ? 'Please collect responses from students and enter the aggregated results below.'
                : 'Please answer all questions honestly. Your feedback as staff is valuable!'}
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

          {isStudentSurvey && (
            <Alert
              type="info"
              title="Student Survey Instructions"
            >
              <p className="mt-2">
                This is a student survey. Please collect responses from students and enter the aggregated results below.
                You can write questions on the board and record votes, or collect individual student responses.
                <br /><br />
                <strong>Note:</strong> You can submit multiple times as you collect more student responses.
              </p>
            </Alert>
          )}

          {isStaffSurvey && (
            <Alert
              type="info"
              title="Staff Survey Instructions"
            >
              <p className="mt-2">
                This is a staff survey for administrators and coordinators. Your responses will help improve the program.
                <br /><br />
                <strong>Note:</strong> This survey is specific to your role and responsibilities.
              </p>
            </Alert>
          )}

          {surveyData && apiResponse.questions && apiResponse.questions.length > 0 ? (
            <SurveyForm 
              survey={surveyData} 
              onComplete={handleComplete}
              assignmentId={assignmentId}
              surveyType={assignment.survey_type}
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
    </div>
  );
}