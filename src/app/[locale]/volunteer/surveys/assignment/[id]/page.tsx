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
}

interface SurveyAssignmentPageProps {
  params: {
    id: string;
  };
}

// Update your survey loading logic
const loadSurvey = async (assignmentId: string): Promise<SurveyAssignment> => {
  try {
    const response = await api.get<SurveyAssignment>(`/survey-assignments/${assignmentId}`);
    
    // Transform the data to match what SurveyForm expects
    const transformedData = {
      ...response,
      questions: response.questions?.map((q: any) => ({
        ...q,
        is_required: q.is_required === 1 // Convert 1/0 to boolean
      })) || []
    };
    
    return transformedData;
  } catch (error) {
    console.error('Failed to load survey:', error);
    throw error;
  }
};

export default function SurveyAssignmentPage({ params }: SurveyAssignmentPageProps) {
  const router = useRouter();
  
  const { data: assignmentData, isLoading, error } = useApiQuery<SurveyAssignment>(
    ['survey-assignment', params.id],
    () => loadSurvey(params.id),
    {
      enabled: !!params.id,
    }
  );

  const handleComplete = () => {
    router.push('/volunteer/surveys/volunteer');
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <SkeletonLoader type="card" />
      </div>
    );
  }

  if (error || !assignmentData) {
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

  if (assignmentData.completed) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Alert
          type="success"
          title="Survey already completed"
        >
          <p className="mt-2">You have already completed this survey on {new Date(assignmentData.completed_at!).toLocaleDateString()}.</p>
          <div className="mt-4">
            <Link href={`/volunteer/surveys/assignment/${params.id}/responses`}>
              <Button variant="outline">View Responses</Button>
            </Link>
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
              <Link href="/volunteer/surveys/volunteer">
                <Button variant="outline">Back to Surveys</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const isOverdue = assignmentData.due_date && new Date(assignmentData.due_date) < new Date();
  const isVolunteerSurvey = assignmentData.survey_type === 'volunteer';
  const isStudentSurvey = assignmentData.survey_type === 'student';

  // Create survey object for SurveyForm component
  const survey = {
    id: assignmentData.id,
    title: assignmentData.survey_name,
    description: assignmentData.survey_description,
    due_date: assignmentData.due_date,
    status: isOverdue ? 'overdue' : assignmentData.status,
    type: assignmentData.survey_type,
    template: {
      id: assignmentData.survey_template_id,
      type: assignmentData.survey_type,
      description: assignmentData.survey_description,
      questions: assignmentData.questions,
    }
  };

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
                {assignmentData.survey_name}
              </h1>
            </div>
            <p className="mt-2 text-gray-600">
              {assignmentData.survey_description || `Please complete this ${assignmentData.survey_period.replace('_', ' ')} survey`}
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

      {/* Survey Form */}
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
              </p>
            </Alert>
          )}

          <SurveyForm 
            survey={survey} 
            onComplete={handleComplete}
            assignmentId={params.id}
            surveyType={assignmentData.survey_type}
          />
        </div>
      </Card>
    </div>
  );
}