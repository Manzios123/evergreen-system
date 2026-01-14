// app/[locale]/admin/surveys/assignments/page.tsx
'use client';

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import DataTable from '@/components/ui/data-table';
import StatusBadge from '@/components/ui/status-badge';
import EmptyState from '@/components/ui/empty-state';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import { useApiQuery } from '@/lib/hooks/use-api';
import { api } from '@/lib/api/api';
import {
  ChatBubbleLeftIcon,
  CalendarIcon,
  UserIcon,
  AcademicCapIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useState } from 'react';
import Alert from '@/components/ui/alert';

interface SurveyAssignment {
  id: string;
  survey_template_id: string;
  assigned_to_user_id: string | null;
  assigned_to_pilot_id: string | null;
  due_date: string | null;
  status: string;
  created_at: string;
  survey_name: string;
  survey_description: string | null;
  survey_type: string;
  survey_period: string;
  pilot_name: string;
  assigned_by_name: string;
  volunteer_name: string | null;
}

export default function AdminSurveyAssignmentsPage() {
  const [filters, setFilters] = useState({
    status: '',
    survey_type: '',
    pilot_id: '',
    page: 1,
    limit: 20
  });

  // Fetch all survey assignments for admin
  const { data: assignments, isLoading, error, refetch } = useApiQuery<SurveyAssignment[]>(
    ['survey-assignments', 'admin', filters],
    () => api.get<SurveyAssignment[]>('/survey-assignments', { params: filters })
  );

  // Fetch pilots for filter
  const { data: pilots } = useApiQuery<any[]>(
    ['pilots'],
    () => api.get<any[]>('/pilots')
  );

  const columns = [
    {
      key: 'assignment',
      header: 'Assignment',
      render: (assignment: SurveyAssignment) => (
        <div>
          <p className="font-medium text-gray-900">
            {assignment.survey_name}
          </p>
          <div className="flex items-center text-sm text-gray-500">
            <span className="capitalize">{assignment.survey_period.replace('_', ' ')}</span>
            <span className="mx-2">•</span>
            <span className="capitalize">{assignment.survey_type}</span>
            <span className="mx-2">•</span>
            <span>{assignment.pilot_name}</span>
          </div>
          <div className="flex items-center text-xs text-gray-400 mt-1">
            <ClockIcon className="h-3 w-3 mr-1" />
            <span>Assigned by {assignment.assigned_by_name} on {new Date(assignment.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'assigned_to',
      header: 'Assigned To',
      render: (assignment: SurveyAssignment) => (
        <div className="flex items-center">
          {assignment.survey_type === 'volunteer' ? (
            <>
              <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="font-medium text-gray-900">{assignment.volunteer_name || 'Volunteer'}</p>
                <p className="text-xs text-gray-500">Individual Volunteer</p>
              </div>
            </>
          ) : (
            <>
              <AcademicCapIcon className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="font-medium text-gray-900">Student Survey</p>
                <p className="text-xs text-gray-500">Entire Pilot</p>
              </div>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'due_date',
      header: 'Due Date',
      render: (assignment: SurveyAssignment) => (
        <div className="flex items-center">
          <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
          <div>
            <p className="text-gray-900">
              {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}
            </p>
            {assignment.due_date && new Date(assignment.due_date) < new Date() && assignment.status !== 'completed' && (
              <p className="text-xs text-red-600">Overdue</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (assignment: SurveyAssignment) => {
        const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date() && assignment.status !== 'completed';
        return <StatusBadge status={isOverdue ? 'overdue' : assignment.status as any} />;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (assignment: SurveyAssignment) => (
        <div className="flex space-x-2">
          <Link href={`/admin/surveys/assignments/${assignment.id}`}>
            <Button size="sm" variant="outline">
              <EyeIcon className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/admin/surveys/assignments/${assignment.id}/edit`}>
            <Button size="sm" variant="outline">
              <PencilIcon className="h-4 w-4" />
            </Button>
          </Link>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => handleDeleteAssignment(assignment.id)}
            className="text-red-600 hover:text-red-700"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    
    try {
      await api.delete(`/survey-assignments/${assignmentId}`);
      refetch();
    } catch (error) {
      console.error('Failed to delete assignment:', error);
    }
  };

  const handleCreateAssignment = () => {
    // Redirect to create assignment page
    window.location.href = '/admin/surveys/assignments/new';
  };

  const handleBulkAssignPreSurveys = async () => {
    if (!confirm('This will assign pre-surveys to ALL volunteers in the selected pilot. Continue?')) return;
    
    const pilotId = prompt('Enter Pilot ID for bulk assignment:');
    if (!pilotId) return;
    
    try {
      await api.post('/survey-assignments/bulk-assign-pre', { pilot_id: pilotId });
      alert('Bulk assignment started successfully!');
      refetch();
    } catch (error) {
      console.error('Bulk assignment failed:', error);
    }
  };

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
        title="Unable to load survey assignments"
        description="There was an error loading survey assignments. Please try again."
        action={{
          label: 'Try Again',
          onClick: () => refetch(),
        }}
      />
    );
  }

  const pendingAssignments = assignments?.filter(a => a.status === 'pending');
  const completedAssignments = assignments?.filter(a => a.status === 'completed');
  const overdueAssignments = assignments?.filter(a => 
    a.due_date && new Date(a.due_date) < new Date() && a.status !== 'completed'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Survey Assignments</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track all survey assignments across pilots
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleBulkAssignPreSurveys}>
            Bulk Assign Pre-Surveys
          </Button>
          <Button onClick={handleCreateAssignment}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Assignment
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
                <option value="locked">Locked</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Survey Type
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={filters.survey_type}
                onChange={(e) => setFilters({...filters, survey_type: e.target.value})}
              >
                <option value="">All Types</option>
                <option value="volunteer">Volunteer</option>
                <option value="student">Student</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pilot
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={filters.pilot_id}
                onChange={(e) => setFilters({...filters, pilot_id: e.target.value})}
              >
                <option value="">All Pilots</option>
                {pilots?.map(pilot => (
                  <option key={pilot.id} value={pilot.id}>
                    {pilot.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setFilters({status: '', survey_type: '', pilot_id: '', page: 1, limit: 20})}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 p-3">
                <ClockIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {pendingAssignments?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="rounded-full bg-green-100 p-3">
                <CalendarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {completedAssignments?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="rounded-full bg-red-100 p-3">
                <ChatBubbleLeftIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Overdue</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {overdueAssignments?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Assignments Table */}
      <Card>
        <div className="p-6">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              All Assignments ({assignments?.length || 0})
            </h2>
            <div className="text-sm text-gray-500">
              Showing {assignments?.length || 0} assignments
            </div>
          </div>
          
          <DataTable
            data={assignments || []}
            columns={columns}
            emptyMessage="No survey assignments found"
          />
        </div>
      </Card>

      {/* Instructions */}
      <Alert type="info" title="How to use this page">
        <div className="space-y-2 mt-2">
          <p><strong>Bulk Assign Pre-Surveys:</strong> Assign pre-surveys to all volunteers in a pilot at once.</p>
          <p><strong>Create Assignment:</strong> Manually create a new survey assignment for a volunteer or pilot.</p>
          <p><strong>Filters:</strong> Use filters to find specific assignments by status, type, or pilot.</p>
          <p><strong>Actions:</strong> View details, edit, or delete assignments using the action buttons.</p>
        </div>
      </Alert>
    </div>
  );
}