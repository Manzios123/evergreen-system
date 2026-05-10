// app/[locale]/admin/surveys/assignments/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import { useApiQuery, useApiMutation } from '@/lib/hooks/use-api';
import { api } from '@/lib/api/api';
import {
  ArrowLeftIcon,
  CalendarIcon,
  UserIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface SurveyAssignment {
  id: string;
  survey_template_id: string;
  assigned_to_user_id: string | null;
  assigned_to_pilot_id: string | null;
  due_date: string;
  status: string;
  survey_name: string;
  survey_description: string;
  survey_type: string;
  survey_period: string;
  pilot_name: string;
  volunteer_name: string;
}

interface EditAssignmentPageProps {
  params: {
    locale: string;
    id: string;
  };
}

export default function EditAssignmentPage({ params }: EditAssignmentPageProps) {
  const router = useRouter();
  const locale = params.locale || 'en';
  const [formData, setFormData] = useState({
    due_date: '',
    status: 'pending',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch assignment details
  const { data: assignment, isLoading, error: fetchError } = useApiQuery<SurveyAssignment>(
    ['survey-assignment', params.id],
    () => api.get<SurveyAssignment>(`/survey-assignments/${params.id}`),
    {
      enabled: !!params.id,
    }
  );

  // Update form data when assignment loads
  useEffect(() => {
    if (assignment) {
      setFormData({
        due_date: assignment.due_date ? format(new Date(assignment.due_date), 'yyyy-MM-dd') : '',
        status: assignment.status,
      });
    }
  }, [assignment]);

  // Update assignment mutation
  const updateMutation = useApiMutation(
    (data: any) => api.put(`/survey-assignments/${params.id}`, data),
    {
      onSuccess: () => {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/${locale}/admin/surveys/assignments/${params.id}`);
        }, 1500);
      },
      onError: (error: Error) => {
        setError(error.message || 'Failed to update assignment');
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    updateMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <SkeletonLoader type="card" />
      </div>
    );
  }

  if (fetchError || !assignment) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert type="error" title="Unable to load assignment">
          <p className="mt-2">The assignment could not be loaded. It may have been deleted or is no longer available.</p>
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/${locale}/admin/surveys/assignments/${params.id}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Assignment
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Assignment</h1>
            <p className="mt-1 text-sm text-gray-500">
              Update survey assignment details
            </p>
          </div>
        </div>
      </div>

      {/* Assignment Info Card */}
      <Card>
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Assignment Details</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Survey</p>
                <p className="mt-1 text-sm text-gray-900">{assignment.survey_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Type</p>
                <p className="mt-1 text-sm text-gray-900 capitalize">
                  {assignment.survey_type} • {assignment.survey_period.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Assigned To</p>
                <p className="mt-1 text-sm text-gray-900">
                  {assignment.volunteer_name || assignment.pilot_name}
                  <span className="text-gray-500 ml-2">
                    ({assignment.volunteer_name ? 'Volunteer' : 'Pilot'})
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Current Status</p>
                <span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
                  assignment.status === 'overdue' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {assignment.status}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert type="error" title="Error">
                <p className="mt-2">{error}</p>
              </Alert>
            )}

            {success && (
              <Alert type="success" title="Success">
                <p className="mt-2">Assignment updated successfully! Redirecting...</p>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Due Date */}
              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                    Due Date
                  </div>
                </label>
                <input
                  type="date"
                  id="due_date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                  <option value="locked">Locked</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/${locale}/admin/surveys/assignments/${params.id}`)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Updating...' : 'Update Assignment'}
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Delete this assignment permanently. This action cannot be undone.
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
                  // Add delete mutation here
                }
              }}
            >
              Delete Assignment
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
