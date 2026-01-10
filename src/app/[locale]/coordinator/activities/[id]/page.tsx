// app/[locale]/coordinator/activities/[id]/page.tsx

'use client'

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button'; // Changed to default import
import StatusBadge from '@/components/ui/status-badge'; // Changed to default import
import Alert from '@/components/ui/alert'; // Changed to default import
import Tabs from '@/components/ui/tabs'; // Changed to default import
import SkeletonLoader from '@/components/ui/skeleton-loader'; // Changed to default import
import ConfirmationDialog from '@/components/ui/confirmation-dialog'; // Changed to default import
import { useApiQuery, useApiMutation } from '@/lib/hooks/use-api';
import { Activity, Photo, Survey, ActivityStatus } from '@/lib/types'; // Fixed import path
import { api } from '@/lib/api/api'; // Added missing api import
import {
  ArrowLeftIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  PhotoIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  ClockIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useState } from 'react';

interface ActivityDetailPageProps {
  params: {
    id: string;
  };
}

export default function CoordinatorActivityDetailPage({ params }: ActivityDetailPageProps) {
  const [activeTab, setActiveTab] = useState<string>('details'); // Changed to string to match Tabs component
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectFeedback, setRejectFeedback] = useState('');

  const { data: activity, isLoading, error, refetch } = useApiQuery<Activity>(
    ['activity', params.id],
    () => api.get<Activity>(`/activities/${params.id}`) // Fixed API call
  );

  const { data: photos } = useApiQuery<Photo[]>(
    ['activity-photos', params.id],
    () => api.get<Photo[]>('/photos', { activityId: params.id }) // Fixed API call
  );

  const { data: surveys } = useApiQuery<Survey[]>(
    ['activity-surveys', params.id],
    () => api.get<Survey[]>('/surveys', { activityId: params.id }) // Fixed API call
  );

  const approveMutation = useApiMutation(
    () => api.patch<Activity>(`/activities/${params.id}/approve`) // Fixed API call
  );

  const rejectMutation = useApiMutation(
    (feedback: string) => api.patch<Activity>(`/activities/${params.id}/reject`, { feedback }) // Fixed API call
  );

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync({} as any); // Need to pass empty object since mutation expects variables
      refetch();
      setShowApproveDialog(false);
    } catch (error) {
      console.error('Failed to approve activity:', error);
    }
  };

  const handleReject = async () => {
    try {
      await rejectMutation.mutateAsync(rejectFeedback);
      refetch();
      setShowRejectDialog(false);
      setRejectFeedback('');
    } catch (error) {
      console.error('Failed to reject activity:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="card" />
        <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert 
          type="error" 
          title="Activity not found"
        >
          <p className="text-sm text-red-700 mt-1">
            The requested activity could not be loaded.
          </p>
          <div className="mt-4">
            <Link href="/coordinator/activities">
              <Button variant="outline">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Activities
              </Button>
            </Link>
          </div>
        </Alert>
      </div>
    );
  }

  // Fix status checks based on actual ActivityStatus type
  const canApprove = activity.status === 'pending' || activity.status === 'in_edit';
  const canEdit = ['draft', 'pending', 'in_edit'].includes(activity.status);

  const tabs = [
    {
      id: 'details',
      label: 'Activity Details',
      icon: <DocumentTextIcon className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Activity Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Title</h4>
                <p className="text-gray-900">{activity.title}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Status</h4>
                <StatusBadge status={activity.status} />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                <p className="text-gray-900">{activity.description}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Type</h4>
                <p className="text-gray-900">{activity.type || 'Not specified'}</p>
              </div>
            </div>
          </Card>

          {/* Schedule & Location */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Schedule & Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center mb-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <h4 className="text-sm font-medium text-gray-500">Date</h4>
                </div>
                <p className="text-gray-900">
                  {new Date(activity.scheduled_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <div className="flex items-center mb-3">
                  <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <h4 className="text-sm font-medium text-gray-500">Duration</h4>
                </div>
                <p className="text-gray-900">{activity.engagement_level || 'N/A'} hours</p>
              </div>
              <div>
                <div className="flex items-center mb-3">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <h4 className="text-sm font-medium text-gray-500">School</h4>
                </div>
                <p className="text-gray-900">{activity.school?.name}</p>
                {activity.school?.address && (
                  <p className="text-sm text-gray-500">{activity.school.address}</p>
                )}
              </div>
              <div>
                <div className="flex items-center mb-3">
                  <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <h4 className="text-sm font-medium text-gray-500">Participants</h4>
                </div>
                <p className="text-gray-900">
                  {activity.number_of_participants || 0} participants
                </p>
              </div>
            </div>
          </Card>

          {/* Volunteer Information */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Volunteer Information
            </h3>
            <div className="flex items-start space-x-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 font-semibold">
                  {activity.volunteer?.full_name?.charAt(0) || 'V'}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  {activity.volunteer?.full_name || 'Unassigned'}
                </h4>
                <p className="text-sm text-gray-500">
                  {activity.volunteer?.email || 'No email available'}
                </p>
                <p className="text-sm text-gray-500">
                  Joined {activity.volunteer?.created_at 
                    ? new Date(activity.volunteer.created_at).toLocaleDateString()
                    : 'Unknown date'}
                </p>
              </div>
            </div>
          </Card>

          {/* Notes & Feedback */}
          {(activity.volunteer_notes || activity.coordinator_feedback) && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Additional Information
              </h3>
              {activity.volunteer_notes && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    Volunteer Notes
                  </h4>
                  <p className="text-gray-900">{activity.volunteer_notes}</p>
                </div>
              )}
              {activity.coordinator_feedback && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    Coordinator Feedback
                  </h4>
                  <p className="text-gray-900">{activity.coordinator_feedback}</p>
                </div>
              )}
            </Card>
          )}
        </div>
      ),
    },
    {
      id: 'photos',
      label: 'Photos',
      icon: <PhotoIcon className="h-5 w-5" />,
      count: photos?.length || 0,
      content: (
        <div>
          {photos && photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.thumbnailUrl || photo.url}
                    alt={photo.description || 'Activity photo'}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(photo.url, '_blank')}
                      className="bg-white"
                    >
                      View
                    </Button>
                  </div>
                  {photo.description && (
                    <p className="text-sm text-gray-500 mt-2 truncate">
                      {photo.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <PhotoIcon className="h-12 w-12 text-gray-300 mx-auto" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">
                No photos yet
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Photos will appear here once uploaded by the volunteer
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'surveys',
      label: 'Surveys',
      icon: <DocumentTextIcon className="h-5 w-5" />,
      count: surveys?.length || 0,
      content: (
        <div>
          {surveys && surveys.length > 0 ? (
            <div className="space-y-4">
              {surveys.map((survey) => (
                <Card key={survey.id}>
                  <div className="flex items-center justify-between p-4">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {survey.title || `${survey.template?.type || 'Activity'} Survey`}
                      </h4>
                      <div className="flex items-center mt-1 space-x-4">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          {survey.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {survey.template?.type === 'activity' ? 'Activity Survey' : 'Volunteer Feedback'}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {survey.status === 'completed' && (
                        <Link href={`/coordinator/surveys/${survey.id}`}>
                          <Button size="sm" variant="outline">
                            View Responses
                          </Button>
                        </Link>
                      )}
                      {survey.status === 'pending' && (
                        <Button size="sm" variant="outline" disabled>
                          Awaiting Completion
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">
                No surveys yet
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Surveys will appear here once completed by the volunteer
              </p>
            </div>
          )}
        </div>
      ),
    },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <Link
            href="/coordinator/activities"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Activities
          </Link>
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
            <Link href={`/coordinator/activities/${activity.id}/edit`}>
              <Button
                variant="outline"
                icon={<PencilIcon className="h-4 w-4" />}
              >
                Edit
              </Button>
            </Link>
          )}
          
          {canApprove && (
            <>
              <Button
                variant="default"
                icon={<CheckCircleIcon className="h-4 w-4" />}
                onClick={() => setShowApproveDialog(true)}
                loading={approveMutation.isPending} // Changed from isLoading to isPending
              >
                Approve
              </Button>
              <Button
                variant="default"
                icon={<XCircleIcon className="h-4 w-4" />}
                onClick={() => setShowRejectDialog(true)}
                loading={rejectMutation.isPending} // Changed from isLoading to isPending
              >
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange} // Fixed: using wrapper function
        variant="underline"
      />

      {/* Approval Dialog */}
      <ConfirmationDialog
        open={showApproveDialog}
        onClose={() => setShowApproveDialog(false)}
        onConfirm={handleApprove}
        title="Approve Activity"
        message="Are you sure you want to approve this activity? This will mark it as completed and notify the volunteer."
        confirmText="Approve Activity"
        cancelText="Cancel"
        type="info"
        loading={approveMutation.isPending} // Changed from isLoading to isPending
      />

      {/* Reject Dialog - Custom implementation */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <XCircleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 className="text-base font-semibold leading-6 text-gray-900">
                    Reject Activity
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Please provide feedback for why you are rejecting this activity:
                    </p>
                    <textarea
                      value={rejectFeedback}
                      onChange={(e) => setRejectFeedback(e.target.value)}
                      placeholder="Provide constructive feedback for the volunteer..."
                      className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
                      rows={4}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <Button
                  onClick={handleReject}
                  loading={rejectMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 sm:ml-3 sm:w-auto"
                >
                  Reject Activity
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectDialog(false);
                    setRejectFeedback('');
                  }}
                  disabled={rejectMutation.isPending}
                  className="mt-3 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}