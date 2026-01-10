// app/[locale]/volunteer/surveys/[id]/responses/page.tsx
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import Alert from '@/components/ui/alert';
import { useApiQuery } from '@/lib/hooks/use-api';
import { Survey, SurveyQuestion } from '@/lib/types';
import { api } from '@/lib/api/api';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface SurveyResponsesPageProps {
  params: {
    id: string;
  };
}

export default function SurveyResponsesPage({ params }: SurveyResponsesPageProps) {
  const { data: survey, isLoading, error } = useApiQuery<Survey>(
    ['survey', params.id, 'responses'],
    () => api.get<Survey>(`/surveys/${params.id}/responses`)
  );

  if (isLoading) {
    return <SkeletonLoader type="card" />;
  }

  if (error || !survey) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert 
          type="error" 
          title="Unable to load survey responses"
        >
          <p className="text-sm text-red-700 mt-1">
            The survey responses could not be loaded.
          </p>
          <div className="mt-4">
            <Link href="/volunteer/surveys/activity">
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

  // Determine survey type from template
  const surveyType = survey.template?.type || 'activity';
  
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href={
            surveyType === 'activity'
              ? '/volunteer/surveys/activity'
              : '/volunteer/surveys/volunteer'
          }
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
          <div className="flex items-center text-green-600">
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            <span className="font-medium">Completed</span>
          </div>
        </div>

        <div className="mt-6 flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center">
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            <span className="capitalize">
              {surveyType === 'activity' ? 'Activity Survey' : 'Volunteer Feedback'}
            </span>
          </div>
          {survey.completed_at && (
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-2" />
              <span>
                Completed on {new Date(survey.completed_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {survey.title || `${surveyType === 'activity' ? 'Activity' : 'Volunteer'} Survey`}
          </h2>

          {survey.responses?.responses && Object.keys(survey.responses.responses).length > 0 ? (
            <div className="space-y-6">
              {survey.template?.questions?.map((question: SurveyQuestion) => {
                const response = survey.responses?.responses?.[question.id];
                return (
                  <div key={question.id} className="border-b pb-6 last:border-0">
                    <h3 className="font-medium text-gray-900 mb-2">
                      {question.question}
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      {Array.isArray(response) ? (
                        <ul className="list-disc pl-5 space-y-1">
                          {response.map((item: string, index: number) => (
                            <li key={index} className="text-gray-700">
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-700">
                          {response || 'No response provided'}
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
                Survey responses could not be loaded.
              </p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t flex justify-end">
            <Link href={
              surveyType === 'activity'
                ? '/volunteer/surveys/activity'
                : '/volunteer/surveys/volunteer'
            }>
              <Button variant="outline">Back to Surveys</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}