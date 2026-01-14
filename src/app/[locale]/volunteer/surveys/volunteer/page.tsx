// app/[locale]/volunteer/surveys/volunteer/page.tsx

'use client'

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button'; // Changed to default import
import DataTable from '@/components/ui/data-table'; // Changed to default import
import StatusBadge from '@/components/ui/status-badge'; // Changed to default import
import EmptyState from '@/components/ui/empty-state'; // Changed to default import
import SkeletonLoader from '@/components/ui/skeleton-loader'; // Changed to default import
import { useApiQuery } from '@/lib/hooks/use-api';
import { Survey } from '@/lib/types'; // Fixed import path
import { api } from '@/lib/api/api'; // Added missing api import
import { ChatBubbleLeftIcon, CalendarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function VolunteerFeedbackPage() {
  const { data: surveys, isLoading, error } = useApiQuery<Survey[]>(
    ['surveys', 'volunteer'],
    () => api.get<Survey[]>('/surveys-templaes', { type: 'volunteer' }) // Fixed api call
  );

  // Note: The DataTable component expects columns with 'header' property, not 'label'
  const columns = [
    {
      key: 'title',
      header: 'Feedback Survey', // Changed from 'label' to 'header'
      render: (survey: Survey) => (
        <div>
          <p className="font-medium text-gray-900">
            {survey.title || 'Volunteer Feedback'}
          </p>
          <p className="text-sm text-gray-500">
            {survey.description || 'Share your volunteering experience'}
          </p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type', // Changed from 'label' to 'header'
      render: (survey: Survey) => (
        <div className="flex items-center">
          <ChatBubbleLeftIcon className="h-5 w-5 text-gray-400 mr-2" />
          <span>Volunteer Feedback</span>
        </div>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date', // Changed from 'label' to 'header'
      render: (survey: Survey) => (
        <div className="flex items-center">
          <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
          <span>
            {survey.due_date // Changed from dueDate to due_date (snake_case)
              ? new Date(survey.due_date).toLocaleDateString()
              : 'No due date'}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status', // Changed from 'label' to 'header'
      render: (survey: Survey) => <StatusBadge status={survey.status as any} />, // Cast to any since StatusBadge expects ActivityStatus
    },
    {
      key: 'actions',
      header: 'Actions', // Changed from 'label' to 'header'
      render: (survey: Survey) => (
        <div className="flex space-x-2">
          {survey.status === 'completed' ? (
            <>
              <Button size="sm" variant="outline" disabled>
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Completed
              </Button>
              <Link href={`/volunteer/surveys-templates/${survey.id}/responses`}> {/* Added /responses */}
                <Button size="sm" variant="outline">
                  View Responses
                </Button>
              </Link>
            </>
          ) : survey.status === 'pending' ? (
            <Link href={`/volunteer/surveys-templates/${survey.id}`}>
              <Button size="sm" variant="default">
                Provide Feedback
              </Button>
            </Link>
          ) : (
            <Button size="sm" variant="outline" disabled>
              {survey.status === 'overdue' ? 'Overdue' : 'Not Available'}
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonLoader type="card" />
        <SkeletonLoader type="table" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to load feedback surveys"
        description="There was an error loading your feedback surveys. Please try again."
        action={{
          label: 'Try Again',
          onClick: () => window.location.reload(),
        }}
      />
    );
  }

  const pendingSurveys = surveys?.filter(
    (survey) => survey.status === 'pending' || survey.status === 'overdue'
  );

  const completedSurveys = surveys?.filter(
    (survey) => survey.status === 'completed'
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Volunteer Feedback</h1>
        <p className="mt-1 text-sm text-gray-500">
          Share your experience and help us improve the volunteering program
        </p>
      </div>

      {pendingSurveys && pendingSurveys.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Feedback to Provide ({pendingSurveys.length})
            </h2>
            {pendingSurveys.length > 0 && (
              <p className="text-sm text-gray-500">
                {pendingSurveys.filter((s) => s.status === 'overdue').length}{' '}
                overdue
              </p>
            )}
          </div>
          <Card>
            <DataTable
              data={pendingSurveys}
              columns={columns}
              emptyMessage="No pending feedback surveys"
            />
          </Card>
        </div>
      )}

      {completedSurveys && completedSurveys.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Completed Feedback ({completedSurveys.length})
          </h2>
          <Card>
            <DataTable
              data={completedSurveys}
              columns={columns}
              emptyMessage="No completed feedback surveys"
            />
          </Card>
        </div>
      )}

      {(!surveys || surveys.length === 0) && (
        <EmptyState
          icon={<ChatBubbleLeftIcon className="h-12 w-12 text-gray-400" />}
          title="No feedback surveys available"
          description="You don't have any feedback surveys to complete at the moment. Feedback surveys will appear here periodically."
        />
      )}
    </div>
  );
}