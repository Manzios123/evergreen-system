// app/[locale]/volunteer/surveys/assignment/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { SurveyForm } from '@/components/surveys/survey-form';
import { Card } from '@/components/ui/card';
import Alert from '@/components/ui/alert';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import Button from '@/components/ui/button';
import StatusBadge from '@/components/ui/status-badge';
import SurveyTypeBadge from '@/components/ui/survey-type-badge';
import ReadOnlySurvey from '@/components/surveys/read-only-survey';
import { useApiQuery } from '@/lib/hooks/use-api';
import { api } from '@/lib/api/api';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SurveyQuestion {
  id: string;
  question_text: string;
  question_type: string;
  order_index: number;
  is_required: boolean;
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
  assignment_type: string;
  can_edit: boolean;
  response_id?: string;
}

interface SurveyAssignmentPageProps {
  params: {
    id: string;
  };
}

export default function SurveyAssignmentPage({ params }: SurveyAssignmentPageProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Fetch assignment details
  const { data: assignmentData, isLoading, error, refetch } = useApiQuery<SurveyAssignment>(
    ['survey-assignment', params.id],
    () => api.get<SurveyAssignment>(`/survey-assignments/${params.id}`),
    {
      enabled: !!params.id,
    }
  );

  // Step 1: Auto-start survey if not completed and not already started
  useEffect(() => {
    const startSurveyIfNeeded = async () => {
      if (assignmentData && !assignmentData.completed && assignmentData.can_edit) {
        // Only auto-start if not already in progress
        if (assignmentData.status === 'assigned') {
          try {
            setIsStarting(true);
            setStartError(null);
            await api.post('/survey-assignments/start', { 
              assignment_id: params.id 
            });
            
            // Refresh assignment data to get updated status
            await refetch();
          } catch (err: any) {
            console.error('Failed to start survey:', err);
            setStartError(err.message || 'Failed to start survey');
          } finally {
            setIsStarting(false);
          }
        }
      }
    };

    if (assignmentData) {
      startSurveyIfNeeded();
    }
  }, [assignmentData, params.id, refetch]);

  const handleComplete = () => {
    setShowSuccess(true);
    // Refresh after a delay to update the UI
    setTimeout(() => {
      router.push('/volunteer/surveys/volunteer');
      router.refresh();
    }, 2000);
  };

  const handleViewSubmissions = () => {
    router.push('/volunteer/surveys/submissions');
  };

  if (isLoading || isStarting) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <SkeletonLoader type="card" />
        </div>
        <SkeletonLoader type="card" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert
          type="error"
          title="Unable to load survey"
        >
          <p className="mt-2">The survey could not be loaded. It may have been completed or is no longer available.</p>
          <div className="mt-4 flex gap-3">
            <Link href="/volunteer/surveys/volunteer" className="inline-flex items-center text-sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Surveys
            </Link>
            <Button variant="outline" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  if (!assignmentData) {
    return null;
  }

  const isOverdue = assignmentData.due_date && new Date(assignmentData.due_date) < new Date();
  const isVolunteerSurvey = assignmentData.assignment_type === 'volunteer_personal';
  const isStudentSurvey = assignmentData.assignment_type === 'student_survey';

  // Create survey object for SurveyForm component
  const survey = {
    id: assignmentData.id,
    title: assignmentData.survey_name,
    description: assignmentData.survey_description,
    due_date: assignmentData.due_date,
    status: isOverdue ? 'overdue' : assignmentData.status,
    type: assignmentData.assignment_type,
    template: {
      id: assignmentData.survey_template_id,
      type: assignmentData.survey_type,
      description: assignmentData.survey_description,
      pilot_id: assignmentData.pilot_id,
      questions: assignmentData.questions || [],
    }
  };

  // Show read-only view if completed or can't edit
  const showReadOnly = assignmentData.completed || !assignmentData.can_edit;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Success Message */}
      {showSuccess && (
        <Alert
          type="success"
          title="Survey Submitted Successfully!"
          onClose={() => setShowSuccess(false)}
        >
          <p className="mt-2">Thank you for completing the survey. Your responses have been recorded.</p>
          <div className="mt-4 flex gap-3">
            <Button variant="default" onClick={handleViewSubmissions}>
              View All Submissions
            </Button>
            <Link href="/volunteer/surveys/volunteer">
              <Button variant="outline">Back to Surveys</Button>
            </Link>
          </div>
        </Alert>
      )}

      {/* Header */}
      <div>
        <Link
          href="/volunteer/surveys/volunteer"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Surveys
        </Link>

        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              {isVolunteerSurvey ? (
                <ChatBubbleLeftIcon className="h-8 w-8 text-blue-500" />
              ) : (
                <DocumentTextIcon className="h-8 w-8 text-emerald-500" />
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <SurveyTypeBadge type={assignmentData.assignment_type as any} />
                  <StatusBadge status={isOverdue ? 'overdue' : assignmentData.status as any} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {assignmentData.survey_name}
                </h1>
              </div>
            </div>
            <p className="text-gray-600">
              {assignmentData.survey_description || `Please complete this ${assignmentData.survey_period.replace('_', ' ')} survey`}
            </p>
          </div>
        </div>

        {/* Status Banner */}
        {!assignmentData.completed && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <div className="p-4">
              <div className="flex items-center">
                <ExclamationCircleIcon className="h-5 w-5 text-blue-500 mr-3" />
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900">
                    {assignmentData.status === 'in_progress' ? 'Survey In Progress' : 'Ready to Start'}
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    {assignmentData.status === 'in_progress' 
                      ? 'Please complete the survey below. Your progress will be saved.' 
                      : 'Click the Start button below to begin the survey.'}
                  </p>
                </div>
                {assignmentData.status === 'assigned' && !showReadOnly && (
                  <Button
                    onClick={async () => {
                      try {
                        setIsStarting(true);
                        await api.post('/survey-assignments/start', { 
                          assignment_id: params.id 
                        });
                        await refetch();
                      } catch (err: any) {
                        setStartError(err.message);
                      } finally {
                        setIsStarting(false);
                      }
                    }}
                    disabled={isStarting}
                  >
                    {isStarting ? 'Starting...' : 'Start Survey'}
                  </Button>
                )}
              </div>
              {startError && (
                <p className="text-sm text-red-600 mt-2">{startError}</p>
              )}
            </div>
          </Card>
        )}

        {/* Survey Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-500">Pilot</p>
            <p className="mt-1 text-sm text-gray-900">
              {assignmentData.pilot_name}
            </p>
          </div>

          {assignmentData.due_date && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                <p className="text-sm font-medium text-gray-500">Due Date</p>
              </div>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(assignmentData.due_date).toLocaleDateString()}
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
              {assignmentData.questions?.length 
                ? `${Math.ceil(assignmentData.questions.length * 0.5)} minutes`
                : '5-10 minutes'}
            </p>
          </div>
        </div>
      </div>

      {/* Show read-only or editable form */}
      {showReadOnly ? (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Survey Completed
                </h2>
                <p className="text-sm text-gray-500">
                  You have already completed this survey
                  {assignmentData.completed_at && (
                    <> on {new Date(assignmentData.completed_at).toLocaleDateString()}</>
                  )}
                </p>
              </div>
              <div className="flex items-center text-green-600">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                <span className="font-medium">Completed</span>
              </div>
            </div>

            <ReadOnlySurvey
              assignmentId={params.id}
              questions={assignmentData.questions || []}
              surveyType={assignmentData.assignment_type}
            />

            <div className="mt-8 pt-6 border-t flex justify-between">
              <Link href="/volunteer/surveys/volunteer">
                <Button variant="outline">Back to Surveys</Button>
              </Link>
              <Link href={`/volunteer/surveys/assignment/${params.id}/responses`}>
                <Button variant="default">View Detailed Responses</Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Complete Survey
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Please answer all questions honestly. Your feedback is valuable!
              </p>
            </div>

            {isOverdue && (
              <div className="mb-6">
                <Alert
                  type="warning"
                  title="This survey is overdue"
                >
                  <p className="mt-2">Please complete this survey as soon as possible. Your feedback is still important to us.</p>
                </Alert>
              </div>
            )}

            {isStudentSurvey && (
              <div className="mb-6">
                <Alert
                  type="info"
                  title="Student Survey Instructions"
                >
                  <p className="mt-2">
                    This is a student survey. Please collect responses from students and enter the aggregated results below.
                    You can write questions on the board and record votes, or collect individual student responses.
                  </p>
                </Alert>
              </div>
            )}

            <SurveyForm 
              survey={survey} 
              onComplete={handleComplete}
              assignmentId={params.id}
              surveyType={assignmentData.assignment_type}
            />
          </div>
        </Card>
      )}
    </div>
  );
}