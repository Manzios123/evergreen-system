// app/[locale]/coordinator/activities/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { activitiesApi } from '@/lib/api/activities';
import { ActivityStatus } from '@/lib/types';

interface CoordinatorEditFormData {
  status: ActivityStatus;
  coordinator_feedback: string;
  actual_date: string;
  number_of_participants: string;
  number_of_boys: string;
  number_of_girls: string;
  engagement_level: 'low' | 'medium' | 'high' | '';
  volunteer_notes: string;
  student_quotes: string;
}

const emptyForm: CoordinatorEditFormData = {
  status: 'pending',
  coordinator_feedback: '',
  actual_date: '',
  number_of_participants: '',
  number_of_boys: '',
  number_of_girls: '',
  engagement_level: '',
  volunteer_notes: '',
  student_quotes: '',
};

export default function ActivityEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const locale = params.locale as string;

  const [formData, setFormData] = useState<CoordinatorEditFormData>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activityTitle, setActivityTitle] = useState('');

  useEffect(() => {
    async function fetchActivity() {
      try {
        setLoading(true);
        const response = await activitiesApi.get(id);
        if (!response.success) {
          throw new Error('Failed to fetch activity');
        }
        const activity = response.data as any;
        setActivityTitle(activity.title);
        setFormData({
          status: activity.status as ActivityStatus,
          coordinator_feedback: activity.coordinator_feedback || '',
          actual_date: activity.actual_date ? String(activity.actual_date).slice(0, 10) : '',
          number_of_participants:
            activity.number_of_participants !== undefined && activity.number_of_participants !== null
              ? String(activity.number_of_participants)
              : '',
          number_of_boys:
            activity.number_of_boys !== undefined && activity.number_of_boys !== null
              ? String(activity.number_of_boys)
              : '',
          number_of_girls:
            activity.number_of_girls !== undefined && activity.number_of_girls !== null
              ? String(activity.number_of_girls)
              : '',
          engagement_level: (activity.engagement_level as 'low' | 'medium' | 'high') || '',
          volunteer_notes: activity.volunteer_notes || '',
          student_quotes: activity.student_quotes || '',
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load activity');
      } finally {
        setLoading(false);
      }
    }

    fetchActivity();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const toNullableNumber = (value: string): number | null =>
        value.trim() === '' ? null : Number(value);

      const response = await activitiesApi.update(id, {
        status: formData.status,
        coordinator_feedback: formData.coordinator_feedback,
        actual_date: formData.actual_date || undefined,
        number_of_participants:
          formData.number_of_participants.trim() === ''
            ? undefined
            : Number(formData.number_of_participants),
        number_of_boys: toNullableNumber(formData.number_of_boys),
        number_of_girls: toNullableNumber(formData.number_of_girls),
        engagement_level: formData.engagement_level || undefined,
        volunteer_notes: formData.volunteer_notes,
        student_quotes: formData.student_quotes,
      });

      if (!response.success) {
        throw new Error(response.message || 'Update failed');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/${locale}/coordinator/activities/${id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred during update');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg font-medium text-gray-700">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href={`/${locale}/coordinator/activities/${id}`}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Activity
          </Link>
        </div>

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Edit Activity: {activityTitle}
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              As a coordinator, you can correct anything the facilitator submitted, not just the status and your feedback.
            </p>

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex">
                  <div className="shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Activity updated successfully! Redirecting...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <div className="shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  required
                >
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="in_edit">Edits Requested</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label htmlFor="coordinator_feedback" className="block text-sm font-medium text-gray-700">
                  Coordinator Feedback
                </label>
                <div className="mt-1">
                  <textarea
                    id="coordinator_feedback"
                    name="coordinator_feedback"
                    rows={4}
                    value={formData.coordinator_feedback}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                    placeholder="Provide your feedback, observations, or notes about this activity..."
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  This feedback will be visible to the facilitator.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">
                  Facilitator's Report (editable by coordinators)
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="actual_date" className="block text-sm font-medium text-gray-700">
                      Actual Date
                    </label>
                    <input
                      type="date"
                      id="actual_date"
                      name="actual_date"
                      value={formData.actual_date}
                      onChange={handleChange}
                      className="mt-1 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border border-gray-300 rounded-md py-2 px-3"
                    />
                  </div>

                  <div>
                    <label htmlFor="engagement_level" className="block text-sm font-medium text-gray-700">
                      Engagement Level
                    </label>
                    <select
                      id="engagement_level"
                      name="engagement_level"
                      value={formData.engagement_level}
                      onChange={handleChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="">Not set</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label htmlFor="number_of_participants" className="block text-sm font-medium text-gray-700">
                      Total Participants
                    </label>
                    <input
                      type="number"
                      min={0}
                      id="number_of_participants"
                      name="number_of_participants"
                      value={formData.number_of_participants}
                      onChange={handleChange}
                      className="mt-1 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border border-gray-300 rounded-md py-2 px-3"
                    />
                  </div>
                  <div>
                    <label htmlFor="number_of_boys" className="block text-sm font-medium text-gray-700">
                      Boys
                    </label>
                    <input
                      type="number"
                      min={0}
                      id="number_of_boys"
                      name="number_of_boys"
                      value={formData.number_of_boys}
                      onChange={handleChange}
                      className="mt-1 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border border-gray-300 rounded-md py-2 px-3"
                    />
                  </div>
                  <div>
                    <label htmlFor="number_of_girls" className="block text-sm font-medium text-gray-700">
                      Girls
                    </label>
                    <input
                      type="number"
                      min={0}
                      id="number_of_girls"
                      name="number_of_girls"
                      value={formData.number_of_girls}
                      onChange={handleChange}
                      className="mt-1 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border border-gray-300 rounded-md py-2 px-3"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor="volunteer_notes" className="block text-sm font-medium text-gray-700">
                    Activity Report
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="volunteer_notes"
                      name="volunteer_notes"
                      rows={6}
                      value={formData.volunteer_notes}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                      placeholder="The facilitator's activity report..."
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor="student_quotes" className="block text-sm font-medium text-gray-700">
                    Student Quotes &amp; Feedback
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="student_quotes"
                      name="student_quotes"
                      rows={4}
                      value={formData.student_quotes}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                      placeholder="Quotes or feedback from students..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Link
                  href={`/${locale}/coordinator/activities/${id}`}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Note for Coordinators</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  You now have full rights to correct anything the facilitator reported here - dates, participant
                  counts, engagement level, the activity report text, and student quotes - in addition to status and
                  your own feedback. The activity's title, description, school, and pilot assignment are still managed
                  elsewhere (activity setup), not on this page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
