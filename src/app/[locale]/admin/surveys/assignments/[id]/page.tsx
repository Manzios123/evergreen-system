// app/[locale]/admin/surveys/assignments/[id]/page.tsx
'use client';

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import StatusBadge from '@/components/ui/status-badge';
import { useApiQuery } from '@/lib/hooks/use-api';
import { api } from '@/lib/api/api';
import {
  ArrowLeftIcon,
  UserIcon,
  AcademicCapIcon,
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SurveyAssignment {
  id: string;
  survey_template_id: string;
  assigned_to_user_id: string | null;
  assigned_to_pilot_id: string | null;
  assigned_by_user_id: string;
  due_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  survey_name: string;
  survey_description: string | null;
  survey_type: string;
  survey_period: string;
  pilot_id: string;
  pilot_name: string;
  assigned_by_name: string;
  volunteer_name: string | null;
  volunteer_email: string | null;
  completed: boolean;
  completed_at: string | null;
}

interface SurveyResponse {
  id: string;
  submitted_at: string;
  responses: Record<string, any>;
  submitted_by_name: string;
}

interface AssignmentDetailPageProps {
  params: {
    locale: string;
    id: string;
  };
}

export default function AssignmentDetailPage({ params }: AssignmentDetailPageProps) {
  const router = useRouter();
  const locale = params.locale || 'en';

  // Fetch assignment details
  const { data: assignment, isLoading, error, refetch } = useApiQuery<SurveyAssignment>(
    ['survey-assignment', params.id],
    () => api.get<SurveyAssignment>(`/survey-assignments/${params.id}`)
  );

  // Fetch response if completed
  const { data: response } = useApiQuery<SurveyResponse>(
    ['survey-response', params.id],
    () => {
      if (!assignment || !assignment.completed) {
        // Return a rejected promise with a specific error
        return Promise.reject(new Error('Assignment not completed'));
      }
      if (assignment.survey_type === 'volunteer') {
        return api.get<SurveyResponse>(`/survey-responses/volunteer/assignment/${params.id}`);
      } else {
        return api.get<SurveyResponse>(`/survey-responses/student/assignment/${params.id}`);
      }
    },
    { 
      enabled: !!assignment && assignment.completed,
      retry: false // Don't retry on "not completed" errors
    }
  );

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    
    try {
      await api.delete(`/survey-assignments/${params.id}`);
      router.push(`/${locale}/admin/surveys/assignments`);
    } catch (error) {
      console.error('Failed to delete assignment:', error);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await api.put(`/survey-assignments/${params.id}`, { status: newStatus });
      refetch();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleExtendDueDate = async () => {
    const newDate = prompt('Enter new due date (YYYY-MM-DD):', assignment?.due_date || '');
    if (!newDate) return;
    
    try {
      await api.put(`/survey-assignments/${params.id}`, { due_date: newDate });
      refetch();
    } catch (error) {
      console.error('Failed to extend due date:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <SkeletonLoader type="card" />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert
          type="error"
          title="Unable to load assignment"
        >
          <p className="mt-2">The assignment could not be loaded.</p>
          <div className="mt-4">
            <Link href={`/${locale}/admin/surveys/assignments`} className="inline-flex items-center text-sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Assignments
            </Link>
          </div>
        </Alert>
      </div>
    );
  }

  const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date() && assignment.status !== 'completed';
  const isVolunteerAssignment = assignment.survey_type === 'volunteer';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/${locale}/admin/surveys/assignments`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Assignments
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {assignment.survey_name}
            </h1>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span className="capitalize">{assignment.survey_period.replace('_', ' ')} Survey</span>
              <span>•</span>
              <span className="capitalize">{assignment.survey_type}</span>
              <span>•</span>
              <span>{assignment.pilot_name}</span>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link href={`/${locale}/admin/surveys/assignments/${params.id}/edit`}>
              <Button variant="outline">
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
            <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Assignment Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignment Details</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="rounded-full bg-blue-100 p-2">
                  {isVolunteerAssignment ? (
                    <UserIcon className="h-5 w-5 text-blue-600" />
                  ) : (
                    <AcademicCapIcon className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Assigned To</p>
                  <p className="text-gray-900">
                    {isVolunteerAssignment ? assignment.volunteer_name : 'All Students in Pilot'}
                  </p>
                  {isVolunteerAssignment && assignment.volunteer_email && (
                    <p className="text-sm text-gray-500">{assignment.volunteer_email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <div className="rounded-full bg-green-100 p-2">
                  <CalendarIcon className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Due Date</p>
                  <p className="text-gray-900">
                    {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}
                  </p>
                  {isOverdue && (
                    <p className="text-sm text-red-600">Overdue</p>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <div className="rounded-full bg-purple-100 p-2">
                  <ClockIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={assignment.status as any} />
                    {assignment.completed && assignment.completed_at && (
                      <span className="text-sm text-gray-500">
                        Completed on {new Date(assignment.completed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="rounded-full bg-gray-100 p-2">
                  <DocumentTextIcon className="h-5 w-5 text-gray-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Created By</p>
                  <p className="text-gray-900">{assignment.assigned_by_name}</p>
                  <p className="text-sm text-gray-500">
                    Created on {new Date(assignment.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            
            <div className="space-y-3">
              {!assignment.completed && (
                <>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleUpdateStatus('completed')}
                  >
                    <EyeIcon className="h-4 w-4 mr-2" />
                    Mark as Completed
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleExtendDueDate}
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Extend Due Date
                  </Button>
                  
                  {assignment.status !== 'locked' && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleUpdateStatus('locked')}
                    >
                      Lock Assignment
                    </Button>
                  )}
                  
                  {assignment.status === 'locked' && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleUpdateStatus('pending')}
                    >
                      Unlock Assignment
                    </Button>
                  )}
                </>
              )}
              
              {assignment.completed && response && (
                <Link href={`/${locale}/admin/surveys/assignments/${params.id}/responses`} className="block">
                  <Button variant="default" className="w-full justify-start">
                    <EyeIcon className="h-4 w-4 mr-2" />
                    View Survey Responses
                  </Button>
                </Link>
              )}
              
              <Link href={`/${locale}/admin/surveys/templates/${assignment.survey_template_id}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  View Survey Template
                </Button>
              </Link>
              
              <Link href={`/${locale}/admin/pilots/${assignment.pilot_id}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <AcademicCapIcon className="h-4 w-4 mr-2" />
                  View Pilot Details
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Response Preview */}
      {assignment.completed && response && (
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Survey Response</h2>
              <span className="text-sm text-gray-500">
                Submitted by {response.submitted_by_name} on {new Date(response.submitted_at).toLocaleDateString()}
              </span>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Response ID</p>
                  <p className="text-gray-900">{response.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Questions</p>
                  <p className="text-gray-900">{Object.keys(response.responses).length}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <Link href={`/${locale}/admin/surveys/assignments/${params.id}/responses`}>
                  <Button variant="default">
                    View Full Responses
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Assignment Description */}
      {assignment.survey_description && (
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Survey Description</h2>
            <p className="text-gray-700">{assignment.survey_description}</p>
          </div>
        </Card>
      )}

      {/* Status History */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status History</h2>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="rounded-full bg-green-100 p-2">
                <DocumentTextIcon className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900">Created</p>
                <p className="text-sm text-gray-500">
                  Assignment created by {assignment.assigned_by_name}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(assignment.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            {assignment.completed_at && (
              <div className="flex items-center">
                <div className="rounded-full bg-blue-100 p-2">
                  <EyeIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">Completed</p>
                  <p className="text-sm text-gray-500">
                    Survey was completed
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(assignment.completed_at).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center">
              <div className="rounded-full bg-gray-100 p-2">
                <ClockIcon className="h-4 w-4 text-gray-600" />
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900">Last Updated</p>
                <p className="text-sm text-gray-500">
                  Assignment was last modified
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(assignment.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
