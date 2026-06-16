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
  PhotoIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { activitiesApi } from '@/lib/api/activities';
import { mediaApi, MediaItem } from '@/lib/api/media';
import { ActivitySubmissionFormV2 } from '@/components/activities/activity-submission-form-v2';
import { Activity, ActivityStatus } from '@/lib/types'; // ADDED: Import types

interface ActivityDetailPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

interface ApiActivity extends Activity { // CHANGED: Extend base Activity type
  volunteer_name?: string;
  school_name?: string;
  pilot_name?: string;
  activity_template_name?: string;
  assigned_by_name?: string;
  assigned_at?: string;
  deleted_at?: string;
}

interface ActivityApiResponse {
  success: boolean;
  data: ApiActivity;
  message?: string;
}

function isValidActivityStatus(status: string): status is ActivityStatus {
  return ['draft', 'pending', 'approved', 'rejected', 'completed', 'cancelled'].includes(status);
}

export default function ActivityDetailPage({ params }: ActivityDetailPageProps) {
  const router = useRouter();
  const [unwrappedParams, setUnwrappedParams] = useState<{ id: string; locale: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  
  // In a real app, you would get this from your authentication context
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

  // Mock current user ID - replace with actual auth logic
  useEffect(() => {
    // This is a placeholder - in reality, get from auth context/session
    const mockCurrentUserId = 'user-123'; // Replace with actual user ID
    setCurrentUserId(mockCurrentUserId);
  }, []);

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

  const {
    data: mediaItems = [],
    isLoading: isLoadingMedia,
    error: mediaError,
  } = useApiQuery<MediaItem[]>(
    ['activity-media', unwrappedParams?.id],
    () => mediaApi.list(unwrappedParams!.id),
    {
      enabled: !!unwrappedParams?.id,
    }
  );

  const rawActivity = apiResponse?.data;
  
  // Transform the API activity to match the beautified form's interface
  const activity = rawActivity ? {
    ...rawActivity,
    status: isValidActivityStatus(rawActivity.status) ? rawActivity.status : 'draft',
  } : undefined;

  const handleSubmitReport = async () => {
    if (!activity || !unwrappedParams) return;
    
    if (activity.status === 'draft') {
      // Always show the beautified submission form for draft activities
      setShowSubmissionForm(true);
    } else if (activity.status === 'pending' || activity.status === 'rejected') {
      // For pending or rejected activities, allow editing via the form
      setShowSubmissionForm(true);
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

  const canEdit = activity.status === 'draft' || activity.status === 'rejected' || activity.status === 'pending';
  const canSubmit = activity.status === 'draft' || activity.status === 'rejected';

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

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
                Edit Details
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
              Complete Activity Report
            </Button>
          )}
          
          {(activity.status === 'pending' || activity.status === 'rejected') && (
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setShowSubmissionForm(true)}
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Update Report
            </Button>
          )}
        </div>
      </div>

      {showSubmissionForm ? (
        <ActivitySubmissionFormV2
          activity={{
            id: activity.id,
            title: activity.title,
            description: activity.description,
            status: activity.status,
            scheduled_date: activity.scheduled_date,
            actual_date: activity.actual_date,
            volunteer_notes: activity.volunteer_notes,
            student_quotes: activity.student_quotes,
            number_of_participants: activity.number_of_participants,
            number_of_boys: activity.number_of_boys,
            number_of_girls: activity.number_of_girls,
            engagement_level: activity.engagement_level as string,
            school_name: activity.school_name,
            pilot_name: activity.pilot_name,
            assigned_by_name: activity.assigned_by_name,
            assigned_at: activity.assigned_at,
            assignment_notes: activity.assignment_notes,
            coordinator_feedback: activity.coordinator_feedback,
            created_at: activity.created_at,
            updated_at: activity.updated_at,
            volunteer_id: activity.volunteer_id,
          }}
          currentUserId={currentUserId}
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
                        {formatDate(activity.scheduled_date)}
                      </p>
                    </div>
                  </div>

                  {activity.actual_date && (
                    <div className="flex items-start">
                      <ClockIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Actual Date</p>
                        <p className="text-sm text-gray-900">
                          {formatDate(activity.actual_date)}
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
                          {activity.number_of_participants} student{activity.number_of_participants !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-gray-500">
                          Boys: {activity.number_of_boys ?? 'Not recorded'} | Girls: {activity.number_of_girls ?? 'Not recorded'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Volunteer Notes & Quotes Card */}
            {(activity.volunteer_notes || activity.student_quotes || activity.assignment_notes) && (
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Notes & Details
                </h2>
                
                {activity.assignment_notes && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Assignment Notes</h3>
                    <div className="bg-gray-50 p-4 rounded border">
                      <p className="text-sm text-gray-700">{activity.assignment_notes}</p>
                    </div>
                  </div>
                )}

                {activity.volunteer_notes && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <DocumentTextIcon className="h-4 w-4 mr-2" />
                      Activity Report
                    </h3>
                    <div className="bg-green-50 p-4 rounded border border-green-200">
                      <p className="text-sm text-gray-700 whitespace-pre-line">{activity.volunteer_notes}</p>
                      {activity.engagement_level !== undefined && (
                        <div className="mt-3 flex items-center">
                          <span className="text-xs font-medium text-gray-500 mr-2">Engagement Level:</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEngagementColor(activity.engagement_level)}`}>
                            {getEngagementLevel(activity.engagement_level)}
                          </span>
                        </div>
                      )}
                      {activity.number_of_participants !== undefined && (
                        <div className="mt-2 text-xs text-gray-500">
                          <span className="font-medium">Participants:</span> {activity.number_of_participants}
                          <span className="ml-2">
                            Boys: {activity.number_of_boys ?? 'Not recorded'} | Girls: {activity.number_of_girls ?? 'Not recorded'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activity.student_quotes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                      Student Quotes & Feedback
                    </h3>
                    <div className="bg-purple-50 p-4 rounded border border-purple-200">
                      <p className="text-sm text-gray-700 whitespace-pre-line italic">{activity.student_quotes}</p>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Media Gallery */}
            {(mediaItems.length > 0 || isLoadingMedia || mediaError) && (
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Activity Media
                </h2>
                {isLoadingMedia && <SkeletonLoader type="card" />}
                {mediaError && (
                  <Alert type="error" title="Unable to load media">
                    Your uploaded media could not be loaded right now.
                  </Alert>
                )}
                {!isLoadingMedia && !mediaError && mediaItems.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {mediaItems.map((item) => (
                      <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group block overflow-hidden rounded-lg border bg-gray-50"
                      >
                        <div className="aspect-square">
                          {item.mediaType === 'video' ? (
                            <video src={item.url} className="h-full w-full object-cover" muted preload="metadata" />
                          ) : (
                            <img src={item.thumbnailUrl || item.url} alt={item.caption || item.filename} className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 p-2 text-xs text-gray-600">
                          {item.mediaType === 'video' ? (
                            <VideoCameraIcon className="h-4 w-4 shrink-0" />
                          ) : (
                            <PhotoIcon className="h-4 w-4 shrink-0" />
                          )}
                          <span className="truncate">{item.caption || item.filename}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Submission Instructions */}
            {canSubmit && !activity.volunteer_notes && (
              <Card className="bg-blue-50 border-blue-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Ready to Complete Your Activity Report?
                </h2>
                <p className="text-sm text-gray-700 mb-4">
                  The multi-step submission form helps you provide comprehensive details about your activity:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-lg mr-3">
                      <CalendarIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Activity Details</h4>
                      <p className="text-xs text-gray-600">Date, participants, engagement level</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-lg mr-3">
                      <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Notes & Quotes</h4>
                      <p className="text-xs text-gray-600">Observations and student feedback</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-lg mr-3">
                      <PhotoIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Media Upload</h4>
                      <p className="text-xs text-gray-600">Photos and videos from the activity</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-lg mr-3">
                      <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Review & Submit</h4>
                      <p className="text-xs text-gray-600">Final review before submission</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    variant="default"
                    onClick={() => setShowSubmissionForm(true)}
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Start Activity Report
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
                        Use the multi-step form to provide activity details
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

            {/* Action Buttons */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Actions
              </h2>
              <div className="space-y-2">
                {canSubmit && (
                  <Button
                    variant="default"
                    className="w-full justify-center"
                    onClick={() => setShowSubmissionForm(true)}
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Complete Report
                  </Button>
                )}
                
                {(activity.status === 'pending' || activity.status === 'rejected') && (
                  <Button
                    variant="secondary"
                    className="w-full justify-center"
                    onClick={() => setShowSubmissionForm(true)}
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Update Report
                  </Button>
                )}
                
                <Link href={`/${unwrappedParams.locale}/volunteer/activities`}>
                  <Button
                    variant="outline"
                    className="w-full justify-center"
                  >
                    Back to Activities
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
