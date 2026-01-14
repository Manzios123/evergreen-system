// app/[locale]/volunteer/surveys/volunteer/page.tsx

'use client'

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import DataTable from '@/components/ui/data-table';
import StatusBadge from '@/components/ui/status-badge';
import EmptyState from '@/components/ui/empty-state';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import { useApiQuery } from '@/lib/hooks/use-api';
import { api } from '@/lib/api/api';
import { ChatBubbleLeftIcon, CalendarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface SurveyAssignment {
  id: string;
  survey_template_id: string;
  due_date: string | null;
  status: string;
  created_at: string;
  survey_name: string;
  survey_description: string | null;
  survey_type: string;
  survey_period: string;
  pilot_name: string;
  assigned_by_name: string;
}

export default function VolunteerFeedbackPage() {
  // Fetch survey assignments for the current volunteer
  const { data: assignments, isLoading, error } = useApiQuery<SurveyAssignment[]>(
    ['survey-assignments', 'volunteer'],
    () => api.get<SurveyAssignment[]>('/survey-assignments/volunteer')
  );

  const columns = [
    {
      key: 'title',
      header: 'Survey',
      render: (assignment: SurveyAssignment) => (
        <div>
          <p className="font-medium text-gray-900">
            {assignment.survey_name || 'Survey'}
          </p>
          <p className="text-sm text-gray-500">
            {assignment.survey_description || 'Complete this survey to provide feedback'}
          </p>
          <div className="flex items-center mt-1 text-xs text-gray-500">
            <span className="capitalize">{assignment.survey_period.replace('_', ' ')} Survey</span>
            <span className="mx-2">•</span>
            <span>{assignment.pilot_name}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (assignment: SurveyAssignment) => (
        <div className="flex items-center">
          <ChatBubbleLeftIcon className="h-5 w-5 text-gray-400 mr-2" />
          <span className="capitalize">
            {assignment.survey_type === 'volunteer' ? 'Volunteer Feedback' : assignment.survey_type}
          </span>
        </div>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (assignment: SurveyAssignment) => (
        <div className="flex items-center">
          <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
          <span>
            {assignment.due_date
              ? new Date(assignment.due_date).toLocaleDateString()
              : 'No due date'}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (assignment: SurveyAssignment) => (
        <StatusBadge 
          status={assignment.status === 'completed' ? 'completed' : 
                 assignment.status === 'overdue' ? 'overdue' : 'pending'} 
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (assignment: SurveyAssignment) => {
        const isOverdue = new Date(assignment.due_date || '') < new Date() && assignment.status !== 'completed';
        const currentStatus = isOverdue ? 'overdue' : assignment.status;
        
        return (
          <div className="flex space-x-2">
            {currentStatus === 'completed' ? (
              <>
                <Button size="sm" variant="outline" disabled>
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Completed
                </Button>
                <Link href={`/volunteer/surveys/assignment/${assignment.id}/responses`}>
                  <Button size="sm" variant="outline">
                    View Responses
                  </Button>
                </Link>
              </>
            ) : currentStatus === 'pending' || currentStatus === 'overdue' ? (
              <Link href={`/volunteer/surveys/assignment/${assignment.id}`}>
                <Button size="sm" variant="default">
                  {currentStatus === 'overdue' ? 'Complete Overdue Survey' : 'Take Survey'}
                </Button>
              </Link>
            ) : (
              <Button size="sm" variant="outline" disabled>
                {assignment.status === 'locked' ? 'Locked' : 'Not Available'}
              </Button>
            )}
          </div>
        );
      },
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
        title="Unable to load surveys"
        description="There was an error loading your surveys. Please try again."
        action={{
          label: 'Try Again',
          onClick: () => window.location.reload(),
        }}
      />
    );
  }

  const pendingAssignments = assignments?.filter(
    (assignment) => assignment.status === 'pending' || 
    (assignment.due_date && new Date(assignment.due_date) < new Date())
  );

  const completedAssignments = assignments?.filter(
    (assignment) => assignment.status === 'completed'
  );

  const lockedAssignments = assignments?.filter(
    (assignment) => assignment.status === 'locked'
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Volunteer Surveys</h1>
        <p className="mt-1 text-sm text-gray-500">
          Complete pre and post surveys to help us improve the volunteering program
        </p>
      </div>

      {pendingAssignments && pendingAssignments.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Surveys to Complete ({pendingAssignments.length})
            </h2>
            {pendingAssignments.length > 0 && (
              <p className="text-sm text-gray-500">
                {pendingAssignments.filter(a => 
                  a.due_date && new Date(a.due_date) < new Date()
                ).length} overdue
              </p>
            )}
          </div>
          <Card>
            <DataTable
              data={pendingAssignments}
              columns={columns}
              emptyMessage="No pending surveys"
            />
          </Card>
        </div>
      )}

      {completedAssignments && completedAssignments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Completed Surveys ({completedAssignments.length})
          </h2>
          <Card>
            <DataTable
              data={completedAssignments}
              columns={columns}
              emptyMessage="No completed surveys"
            />
          </Card>
        </div>
      )}

      {lockedAssignments && lockedAssignments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Locked Surveys ({lockedAssignments.length})
          </h2>
          <Card>
            <DataTable
              data={lockedAssignments}
              columns={columns}
              emptyMessage="No locked surveys"
            />
          </Card>
        </div>
      )}

      {(!assignments || assignments.length === 0) && (
        <EmptyState
          icon={<ChatBubbleLeftIcon className="h-12 w-12 text-gray-400" />}
          title="No surveys available"
          description="You don't have any surveys to complete at the moment. Surveys will be assigned when you join a pilot or complete activities."
        />
      )}
    </div>
  );
}