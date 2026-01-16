// app/[locale]/volunteer/surveys/volunteer/page.tsx
'use client'

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import SurveyCard from '@/components/surveys/survey-card';
import { useApiQuery } from '@/lib/hooks/use-api';
import { api } from '@/lib/api/api';
import { 
  ChatBubbleLeftIcon, 
  DocumentTextIcon,
  ArrowRightIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
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
  assignment_type: string;
  completed_at?: string;
  completed?: boolean | number;
  submission_count?: number;
}

export default function VolunteerFeedbackPage() {
  // Fetch survey assignments for the current volunteer
  const { data: assignments, isLoading, error, refetch } = useApiQuery<SurveyAssignment[]>(
    ['survey-assignments', 'volunteer'],
    () => api.get<any[]>('/survey-assignments/volunteer').then(res => {
      // Transform the response to match frontend expectations
      return res.map(assignment => ({
        ...assignment,
        // Backend returns 1/0 for booleans, convert to boolean
        completed: assignment.completed === 1 || assignment.completed === true,
        // Ensure due_date is properly formatted
        due_date: assignment.due_date ? new Date(assignment.due_date).toISOString().split('T')[0] : null,
        // Add survey_type from assignment_type for consistency
        survey_type: assignment.assignment_type === 'volunteer_personal' ? 'volunteer' : 'student',
      }));
    })
  );

  // Filter assignments by type
  const personalSurveys = assignments?.filter(
    a => a.assignment_type === 'volunteer_personal'
  ) || [];

  const studentSurveys = assignments?.filter(
    a => a.assignment_type === 'student_survey'
  ) || [];

  // Counts for display
  const pendingPersonal = personalSurveys.filter(a => 
    !a.completed && (!a.due_date || new Date(a.due_date) > new Date())
  ).length;

  const pendingStudent = studentSurveys.filter(a => 
    !a.completed && (!a.due_date || new Date(a.due_date) > new Date())
  ).length;

  const overduePersonal = personalSurveys.filter(a => 
    a.due_date && new Date(a.due_date) < new Date() && !a.completed
  ).length;

  const overdueStudent = studentSurveys.filter(a => 
    a.due_date && new Date(a.due_date) < new Date() && !a.completed
  ).length;

  // Calculate total student submissions
  const totalStudentSubmissions = studentSurveys.reduce((total, survey) => {
    return total + (survey.submission_count || 0);
  }, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
        </div>
        <SkeletonLoader type="card" />
        <SkeletonLoader type="card" />
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
          onClick: () => refetch(),
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Volunteer Surveys</h1>
          <p className="mt-1 text-sm text-gray-500">
            Complete surveys to help us improve the volunteering program
          </p>
        </div>
        
        <div className="flex gap-3">
          <Link href="/volunteer/surveys/submissions">
            <Button variant="outline">
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              My Submissions
            </Button>
          </Link>
          
          {(assignments?.length || 0) > 0 && (
            <Button 
              variant="default"
              onClick={() => {
                // Start the first pending survey
                const firstPending = assignments?.find(a => !a.completed);
                if (firstPending) {
                  window.location.href = `/volunteer/surveys/assignment/${firstPending.id}`;
                }
              }}
            >
              Start Next Survey
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Surveys</p>
              <p className="text-2xl font-semibold text-gray-900">{assignments?.length || 0}</p>
            </div>
            <ChatBubbleLeftIcon className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">To Complete</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingPersonal + pendingStudent}</p>
            </div>
            <div className="text-orange-500">
              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="text-sm font-semibold">{pendingPersonal + pendingStudent}</span>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className="text-2xl font-semibold text-gray-900">{overduePersonal + overdueStudent}</p>
            </div>
            <div className="text-red-500">
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-sm font-semibold">{overduePersonal + overdueStudent}</span>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Student Submissions</p>
              <p className="text-2xl font-semibold text-gray-900">{totalStudentSubmissions}</p>
            </div>
            <DocumentDuplicateIcon className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Personal Surveys Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Your Personal Surveys
            </h2>
            <p className="text-sm text-gray-500">
              Surveys about your volunteer experience (one-time submission)
            </p>
          </div>
          {personalSurveys.length > 0 && (
            <div className="text-sm text-gray-500">
              {pendingPersonal} to do • {overduePersonal} overdue
            </div>
          )}
        </div>

        {personalSurveys.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {personalSurveys.map((assignment) => (
              <SurveyCard
                key={assignment.id}
                assignment={assignment}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <ChatBubbleLeftIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">
              No personal surveys
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              You don't have any personal surveys assigned at the moment.
            </p>
          </div>
        )}
      </div>

      {/* Student Activity Surveys Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Student Activity Surveys
            </h2>
            <p className="text-sm text-gray-500">
              Surveys about student activities (multiple submissions allowed)
            </p>
          </div>
          {studentSurveys.length > 0 && (
            <div className="text-sm text-gray-500">
              {pendingStudent} to do • {overdueStudent} overdue • {totalStudentSubmissions} total submissions
            </div>
          )}
        </div>

        {studentSurveys.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {studentSurveys.map((assignment) => (
              <SurveyCard
                key={assignment.id}
                assignment={assignment}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">
              No student surveys
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              You don't have any student activity surveys assigned at the moment.
            </p>
          </div>
        )}
      </div>

      {/* No Surveys State */}
      {(!assignments || assignments.length === 0) && (
        <EmptyState
          icon={<ChatBubbleLeftIcon className="h-12 w-12 text-gray-400" />}
          title="No surveys available"
          description="You don't have any surveys to complete at the moment. Surveys will be assigned when you join a pilot or complete activities."
          action={{
            label: 'Join a Pilot',
            onClick: () => window.location.href = '/volunteer/pilots',
          }}
        />
      )}
    </div>
  );
}