// app/[locale]/volunteer/activities/[id]/page.tsx

'use client'

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import StatusBadge from '@/components/ui/status-badge';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import Alert from '@/components/ui/alert';
import EmptyState from '@/components/ui/empty-state';
import { useApiQuery } from '@/lib/hooks/use-api';
import { Activity, Survey } from '@/lib/types';
import {
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  DocumentTextIcon,
  PhotoIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { api } from '@/lib/api/api';

interface ActivityDetailPageProps {
  params: {
    id: string;
  };
}

export default function ActivityDetailPage({ params }: ActivityDetailPageProps) {
  const { data: activity, isLoading, error } = useApiQuery<Activity>(
    ['activity', params.id],
    () => api.get(`/activities/${params.id}`)
  );

  if (isLoading) {
    return <SkeletonLoader type="card" />;
  }

  if (error) {
    return (
      <Alert
        type="error"
        title="Activity not found"
      >
        <p className="mt-2">The requested activity could not be loaded.</p>
        <div className="mt-4">
          <Link href="/volunteer/activities">
            <Button variant="outline">
              Back to Activities
            </Button>
          </Link>
        </div>
      </Alert>
    );
  }

  if (!activity) {
    return (
      <EmptyState
        title="Activity not found"
        description="The requested activity does not exist or you don't have permission to view it."
        action={{
          label: 'Back to Activities',
          onClick: () => window.location.href = '/volunteer/activities',
        }}
      />
    );
  }

  const canEdit = activity.status === 'draft';
  const canSubmit = activity.status === 'draft';
  const hasPhotos = activity.photos && activity.photos.length > 0;
  const hasSurveys = activity.surveys && activity.surveys.length > 0;

  // Get the survey type - using template type since Survey doesn't have a direct type property
  const getSurveyType = (survey: Survey) => {
    return survey.template?.type || 'general';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {activity.title}
            </h1>
            <StatusBadge status={activity.status} />
          </div>
          <p className="mt-2 text-gray-600">{activity.description}</p>
        </div>
        <div className="flex space-x-3">
          {canEdit && (
            <Link href={`/volunteer/activities/${activity.id}/edit`}>
              <Button variant="outline">
                Edit Activity
              </Button>
            </Link>
          )}
          {canSubmit && (
            <Button variant="default" onClick={() => {/* Submit logic */}}>
              Submit for Approval
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Details Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Activity Details
            </h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
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

              {/* Duration - This field doesn't exist in your Activity type
                  You might want to add it or calculate it differently */}
              <div className="flex items-start">
                <ClockIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Duration</p>
                  <p className="text-sm text-gray-900">
                    {/* If you don't have duration field, you could calculate it or remove this section */}
                    {/* Using scheduled_date and actual_date to calculate duration? */}
                    Duration not specified
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">School</p>
                  <p className="text-sm text-gray-900">
                    {activity.school?.name || 'No school assigned'}
                  </p>
                  {activity.school?.address && (
                    <p className="text-sm text-gray-500">
                      {activity.school.address}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start">
                <UserGroupIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Number of Participants
                  </p>
                  <p className="text-sm text-gray-900">
                    {activity.number_of_participants || 0} participants
                  </p>
                </div>
              </div>

              {/* Volunteer Notes */}
              {activity.volunteer_notes && (
                <div className="flex items-start">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Volunteer Notes
                    </p>
                    <p className="text-sm text-gray-900">
                      {activity.volunteer_notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Photos Section */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Photos</h2>
              <Link href={`/volunteer/photos?activity=${activity.id}`}>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<PhotoIcon className="h-4 w-4" />}
                >
                  Manage Photos
                </Button>
              </Link>
            </div>
            {hasPhotos ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {activity.photos?.slice(0, 6).map((photo) => (
                  <div key={photo.id} className="aspect-square relative">
                    <img
                      src={photo.thumbnailUrl || photo.url}
                      alt={photo.description || 'Activity photo'}
                      className="rounded-lg object-cover w-full h-full"
                    />
                  </div>
                ))}
                {activity.photos && activity.photos.length > 6 && (
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500 font-medium">
                      +{activity.photos.length - 6} more
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <PhotoIcon className="h-12 w-12 text-gray-300 mx-auto" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No photos yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Add photos to document your activity
                </p>
                <Link href={`/volunteer/photos?activity=${activity.id}`}>
                  <Button
                    variant="outline"
                    className="mt-4"
                  >
                    Upload Photos
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Surveys Card */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Surveys</h2>
              <DocumentTextIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {hasSurveys ? (
                activity.surveys?.map((survey) => (
                  <div
                    key={survey.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {getSurveyType(survey) === 'activity'
                          ? 'Activity Survey'
                          : getSurveyType(survey) === 'volunteer'
                          ? 'Volunteer Feedback'
                          : 'General Survey'}
                      </p>
                      {/* Survey status is different from ActivityStatus - we need to handle this */}
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          survey.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : survey.status === 'overdue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {survey.status.charAt(0).toUpperCase() + survey.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    {survey.status === 'pending' && (
                      <Link href={`/volunteer/surveys/${survey.id}`}>
                        <Button size="sm" variant="default">
                          Complete
                        </Button>
                      </Link>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">
                    No surveys required for this activity
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Status Timeline */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Status Timeline
            </h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="shrink-0">
                  <div className="h-2 w-2 bg-green-500 rounded-full mt-1.5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Created</p>
                  <p className="text-sm text-gray-500">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {activity.status === 'pending' && (
                <div className="flex items-start">
                  <div className="shrink-0">
                    <div className="h-2 w-2 bg-yellow-500 rounded-full mt-1.5" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      Submitted for Approval
                    </p>
                    <p className="text-sm text-gray-500">
                      Awaiting coordinator review
                    </p>
                  </div>
                </div>
              )}

              {activity.status === 'approved' && (
                <div className="flex items-start">
                  <div className="shrink-0">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mt-1.5" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      Approved
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(activity.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {activity.status === 'completed' && (
                <div className="flex items-start">
                  <div className="shrink-0">
                    <div className="h-2 w-2 bg-purple-500 rounded-full mt-1.5" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      Completed
                    </p>
                    <p className="text-sm text-gray-500">
                      Activity marked as complete
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Coordinator Feedback */}
          {activity.coordinator_feedback && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Coordinator Feedback
              </h2>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">{activity.coordinator_feedback}</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}