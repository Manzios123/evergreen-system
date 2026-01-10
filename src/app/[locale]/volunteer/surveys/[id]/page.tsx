// app/[locale]/volunteer/surveys/[id]/page.tsx
'use client';

import { SurveyForm } from '@/components/surveys/survey-form';
import { Card } from '@/components/ui/card';
import Alert from '@/components/ui/alert'; // Fixed import (default not named)
import SkeletonLoader from '@/components/ui/skeleton-loader'; // Fixed import (default not named)
import Button from '@/components/ui/button'; // Added import
import { useApiQuery } from '@/lib/hooks/use-api';
import { Survey, SurveyTemplate } from '@/lib/types'; // Changed import path
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  CalendarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/api'; // Added import

interface SurveyCompletionPageProps {
  params: {
    id: string;
  };
}

export default function SurveyCompletionPage({ params }: SurveyCompletionPageProps) {
  const router = useRouter();

  const { data: survey, isLoading, error } = useApiQuery<Survey>(
    ['survey', params.id],
    () => api.get(`/surveys/${params.id}`), // Fixed API call
    {
      enabled: !!params.id,
    }
  );

  const handleComplete = () => {
    // Determine where to redirect based on survey template type
    const surveyType = survey?.template?.type || 'activity';
    router.push(
      surveyType === 'activity'
        ? '/volunteer/surveys/activity'
        : '/volunteer/surveys/volunteer'
    );
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
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
          <div className="mt-4">
            <Link href="/volunteer/surveys/activity" className="inline-flex items-center text-sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Surveys
            </Link>
          </div>
        </Alert>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert
          type="error"
          title="Survey not found"
        >
          <p className="mt-2">The requested survey does not exist.</p>
          <div className="mt-4">
            <Link href="/volunteer/surveys/activity" className="inline-flex items-center text-sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Surveys
            </Link>
          </div>
        </Alert>
      </div>
    );
  }

  if (survey.status === 'completed') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Alert
          type="success"
          title="Survey already completed"
        >
          <p className="mt-2">You have already completed this survey.</p>
          <div className="mt-4">
            {/* Assuming there's a responses page, otherwise adjust the link */}
            <Link href={`/volunteer/surveys/${survey.id}/responses`}>
              View Responses
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
              <Link href="/volunteer/surveys/activity">
                <Button variant="outline">Back to Surveys</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const isOverdue = survey.status === 'overdue';
  const surveyType = survey?.template?.type || 'activity';
  const isActivitySurvey = surveyType === 'activity';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href={
            isActivitySurvey
              ? '/volunteer/surveys/activity'
              : '/volunteer/surveys/volunteer'
          }
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Surveys
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-3">
              {isActivitySurvey ? (
                <DocumentTextIcon className="h-8 w-8 text-gray-400" />
              ) : (
                <ChatBubbleLeftIcon className="h-8 w-8 text-gray-400" />
              )}
              <h1 className="text-2xl font-bold text-gray-900">
                {survey.title || `${isActivitySurvey ? 'Activity' : 'Volunteer'} Survey`}
              </h1>
            </div>
            <p className="mt-2 text-gray-600">{survey.description || survey.template?.description || 'Please complete this survey'}</p>
          </div>
          {isOverdue && (
            <span className="inline-flex items-center rounded-md bg-red-50 px-3 py-1 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
              Overdue
            </span>
          )}
        </div>

        {/* Survey Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {survey.activity && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-500">Activity</p>
              <p className="mt-1 text-sm text-gray-900">
                {survey.activity.title}
              </p>
              <p className="text-xs text-gray-500">
                {survey.activity.school?.name}
              </p>
            </div>
          )}

          {survey.due_date && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                <p className="text-sm font-medium text-gray-500">Due Date</p>
              </div>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(survey.due_date).toLocaleDateString()}
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
              {/* Assuming estimated time might be in template or calculate from questions */}
              {survey.template?.questions?.length 
                ? `${Math.ceil(survey.template.questions.length * 0.5)} minutes`
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

          <SurveyForm survey={survey} onComplete={handleComplete} />
        </div>
      </Card>
    </div>
  );
}