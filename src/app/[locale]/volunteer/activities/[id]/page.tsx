// app/[locale]/volunteer/activities/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import StatusBadge from '@/components/ui/status-badge';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import Alert from '@/components/ui/alert';
import { useApiQuery } from '@/lib/hooks/use-api';
import {
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  DocumentTextIcon,
  UserIcon,
  AcademicCapIcon,
  ClockIcon,
  PencilIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { activitiesApi } from '@/lib/api/activities';
import { ActivitySubmissionForm } from '@/components/activities/activity-submission-form';

interface ActivityDetailPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

// Interface based on the actual API response from the update request
interface ApiActivity {
  id: string;
  title: string;
  description: string;
  status: string;
  scheduled_date: string;
  actual_date?: string;
  volunteer_id: string;
  volunteer_name?: string;
  school_id: string;
  school_name?: string;
  pilot_id: string;
  pilot_name?: string;
  activity_template_id?: string;
  activity_template_name?: string;
  number_of_participants?: number;
  engagement_level?: string | number;
  volunteer_notes?: string;
  coordinator_feedback?: string;
  assigned_by?: string;
  assigned_by_name?: string;
  assignment_notes?: string;
  assigned_at?: string;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

interface ActivityApiResponse {
  success: boolean;
  data: ApiActivity;
  message?: string;
}

// Type guard to check if the status is valid
function isValidActivityStatus(status: string): status is 'draft' | 'pending' | 'in_edit' | 'approved' | 'rejected' | 'completed' | 'cancelled' {
  return ['draft', 'pending', 'in_edit', 'approved', 'rejected', 'completed', 'cancelled'].includes(status);
}

export default function ActivityDetailPage({ params }: ActivityDetailPageProps) {
  const router = useRouter();
  const [unwrappedParams, setUnwrappedParams] = useState<{ id: string; locale: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);

  // Unwrap params for Next.js 15+
  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params;
      setUnwrappedParams(resolvedParams);
    };
    unwrapParams();
  }, [params]);

  const { 
    data: apiResponse, 
    isLoading, 
    error,
    refetch 
  } = useApiQuery<ActivityApiResponse>(
    ['activity', unwrappedParams?.id],
    () => {
      if (!unwrappedParams?.id) {
        return Promise.reject(new Error('No activity ID'));
      }
      return activitiesApi.get(unwrappedParams.id) as Promise<ActivityApiResponse>;
    },
    {
      enabled: !!unwrappedParams?.id,
    }
  );

  const rawActivity = apiResponse?.data;
  
  // Transform the API activity
  const activity = rawActivity ? {
    ...rawActivity,
    // Ensure status is valid, default to 'draft' if not
    status: isValidActivityStatus(rawActivity.status) ? rawActivity.status : 'draft',
  } : undefined;

  const handleSubmitReport = async () => {
    if (!activity || !unwrappedParams) return;
    
    if (activity.status === 'draft' && !activity.volunteer_notes) {
      // Show submission form for draft activities without notes
      setShowSubmissionForm(true);
    } else if (activity.status === 'draft') {
      // Submit directly if already has notes
      try {
        setIsSubmitting(true);
        await activitiesApi.submit(activity.id);
        refetch();
      } catch (error) {
        console.error('Failed to submit activity:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSubmissionSuccess = () => {
    setShowSubmissionForm(false);
    refetch();
    router.refresh();
  };

  if (!unwrappedParams) {
    return (
      <div className="max-w-4xl mx-auto">
        <SkeletonLoader type="card" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <SkeletonLoader type="card" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert
          type="error"
          title="Activity not found"
        >
          <p className="mt-2">The requested activity could not be loaded.</p>
          <div className="mt-4">
            <Link href={`/${unwrappedParams.locale}/volunteer/activities`}>
              <Button variant="outline">
                Back to Activities
              </Button>
            </Link>
          </div>
        </Alert>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert
          type="warning"
          title="Activity not found"
        >
          <p className="mt-2">The requested activity does not exist or you don't have permission to view it.</p>
          <div className="mt-4">
            <Link href={`/${unwrappedParams.locale}/volunteer/activities`}>
              <Button variant="outline">
                Back to Activities
              </Button>
            </Link>
          </div>
        </Alert>
      </div>
    );
  }

  const canEdit = activity.status === 'draft';
  const canSubmit = activity.status === 'draft';

  // Helper function to get engagement level as string
  const getEngagementLevel = (level?: string | number): string => {
    if (!level) return 'Not specified';
    if (level === 1 || level === 'low' || level === 'Low') return 'Low';
    if (level === 2 || level === 'medium' || level === 'Medium') return 'Medium';
    if (level === 3 || level === 'high' || level === 'High') return 'High';
    return `Level ${level}`;
  };

  // Helper function to get engagement color
  const getEngagementColor = (level?: string | number): string => {
    if (!level) return 'bg-gray-100 text-gray-800';
    if (level === 1 || level === 'low' || level === 'Low') return 'bg-red-100 text-red-800';
    if (level === 2 || level === 'medium' || level === 'Medium') return 'bg-yellow-100 text-yellow-800';
    if (level === 3 || level === 'high' || level === 'High') return 'bg-green-100 text-green-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {activity.title}
            </h1>
            <StatusBadge status={activity.status} />
          </div>
          <p className="text-gray-600">{activity.description}</p>
        </div>
        
        <div className="flex space-x-3">
          <Link href={`/${unwrappedParams.locale}/volunteer/activities`}>
            <Button variant="outline" size="sm">
              Back to Activities
            </Button>
          </Link>
          
          {canEdit && (
            <Link href={`/${unwrappedParams.locale}/volunteer/activities/${activity.id}/edit`}>
              <Button variant="outline" size="sm">
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
          
          {canSubmit && (
            <Button 
              variant="default" 
              size="sm"
              onClick={handleSubmitReport}
              loading={isSubmitting}
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              {activity.volunteer_notes ? 'Submit for Approval' : 'Complete Report'}
            </Button>
          )}
        </div>
      </div>

      {showSubmissionForm ? (
        <ActivitySubmissionForm
          activity={activity}
          onSubmitSuccess={handleSubmissionSuccess}
          onCancel={() => setShowSubmissionForm(false)}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Activity Information Card */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Activity Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Scheduled Date</p>
                      <p className="text-sm text-gray-900">
                        {new Date(activity.scheduled_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  {activity.actual_date && (
                    <div className="flex items-start">
                      <ClockIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Actual Date</p>
                        <p className="text-sm text-gray-900">
                          {new Date(activity.actual_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {activity.assigned_by_name && (
                    <div className="flex items-start">
                      <UserIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Assigned By</p>
                        <p className="text-sm text-gray-900">
                          {activity.assigned_by_name}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">School</p>
                      <p className="text-sm text-gray-900">
                        {activity.school_name || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <AcademicCapIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Pilot Program</p>
                      <p className="text-sm text-gray-900">
                        {activity.pilot_name || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  {activity.number_of_participants !== undefined && (
                    <div className="flex items-start">
                      <UserGroupIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Participants</p>
                        <p className="text-sm text-gray-900">
                          {activity.number_of_participants} students
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Volunteer Notes Card */}
            {(activity.volunteer_notes || activity.assignment_notes) && (
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Notes & Details
                </h2>
                
                {activity.assignment_notes && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Assignment Notes</h3>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-700">{activity.assignment_notes}</p>
                    </div>
                  </div>
                )}

                {activity.volunteer_notes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Your Report</h3>
                    <div className="bg-green-50 p-3 rounded">
                      <p className="text-sm text-gray-700">{activity.volunteer_notes}</p>
                      {activity.engagement_level !== undefined && (
                        <div className="mt-2 flex items-center">
                          <span className="text-xs font-medium text-gray-500 mr-2">Engagement:</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEngagementColor(activity.engagement_level)}`}>
                            {getEngagementLevel(activity.engagement_level)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Submission Instructions */}
            {canSubmit && !activity.volunteer_notes && (
              <Card className="bg-blue-50 border-blue-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Ready to Submit Your Report?
                </h2>
                <p className="text-sm text-gray-700 mb-4">
                  Please complete the activity report by providing details about:
                </p>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                  <li>The actual date the activity took place</li>
                  <li>Number of participants</li>
                  <li>Engagement level of students (1=Low, 2=Medium, 3=High)</li>
                  <li>Detailed notes about what happened</li>
                  <li>Any observations or challenges</li>
                </ul>
                <div className="mt-4">
                  <Button
                    variant="default"
                    onClick={() => setShowSubmissionForm(true)}
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Complete Activity Report
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Information */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Status Information
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Current Status</p>
                  <div className="mt-1">
                    <StatusBadge status={activity.status} />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Created</p>
                  <p className="text-sm text-gray-900">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Last Updated</p>
                  <p className="text-sm text-gray-900">
                    {new Date(activity.updated_at).toLocaleDateString()}
                  </p>
                </div>

                {activity.assigned_at && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Assigned On</p>
                    <p className="text-sm text-gray-900">
                      {new Date(activity.assigned_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Coordinator Feedback */}
            {activity.coordinator_feedback && (
              <Card className="bg-yellow-50 border-yellow-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Coordinator Feedback
                </h2>
                <div className="p-3 bg-yellow-100 rounded">
                  <p className="text-sm text-gray-700">{activity.coordinator_feedback}</p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  This feedback was provided by your coordinator
                </p>
              </Card>
            )}

            {/* Next Steps */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Next Steps
              </h2>
              <div className="space-y-3">
                {activity.status === 'draft' && (
                  <div className="flex items-start">
                    <div className="shrink-0">
                      <div className="h-2 w-2 bg-blue-500 rounded-full mt-1.5" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        Complete your report
                      </p>
                      <p className="text-sm text-gray-500">
                        Fill in activity details and submit for approval
                      </p>
                    </div>
                  </div>
                )}

                {activity.status === 'pending' && (
                  <div className="flex items-start">
                    <div className="shrink-0">
                      <div className="h-2 w-2 bg-yellow-500 rounded-full mt-1.5" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        Awaiting coordinator review
                      </p>
                      <p className="text-sm text-gray-500">
                        Your coordinator will review and approve your report
                      </p>
                    </div>
                  </div>
                )}

                {activity.status === 'approved' && (
                  <div className="flex items-start">
                    <div className="shrink-0">
                      <div className="h-2 w-2 bg-green-500 rounded-full mt-1.5" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        Report approved
                      </p>
                      <p className="text-sm text-gray-500">
                        Your activity report has been approved
                      </p>
                    </div>
                  </div>
                )}

                {activity.status === 'rejected' && (
                  <div className="flex items-start">
                    <div className="shrink-0">
                      <div className="h-2 w-2 bg-red-500 rounded-full mt-1.5" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        Report needs revision
                      </p>
                      <p className="text-sm text-gray-500">
                        Check coordinator feedback and update your report
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}