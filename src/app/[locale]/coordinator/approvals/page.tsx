// app/[locale]/coordinator/approvals/page.tsx
'use client';

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import DataTable from '@/components/ui/data-table';
import { Tabs } from '@/components/ui/tabs';
import StatusBadge from '@/components/ui/status-badge';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import SearchFilter from '@/components/ui/search-filter';
import EmptyState from '@/components/ui/empty-state';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import Alert from '@/components/ui/alert';
import { useApiQuery, useApiMutation } from '@/lib/hooks/use-api';
import { Activity } from '@/lib/types';
import {
  Check,
  X,
  Pencil,
  Image as MediaIcon,
  Video,
  Calendar,
  Building,
  User,
  Filter,
  Clock,
} from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import { api } from '@/lib/api/api';

// Define Media type locally since it's not in @/lib/types
interface Media {
  id: string;
  activityId: string | null;
  volunteerId: string;
  filename?: string;
  url: string;
  thumbnailUrl: string | null;
  caption?: string;
  status: string;
  mediaType: string;
  fileType?: string;
  uploadedAt: string;
  activity?: {
    id: string;
    title: string;
    status: string;
    school: {
      id: string;
      name: string;
    } | null;
  } | null;
  volunteer: {
    id: string;
    full_name: string;
  };
}

// Create a separate FeedbackModal component to isolate its Hooks
const FeedbackModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title, 
  action,
  loading 
}: { 
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: string) => void;
  title: string;
  action: 'reject' | 'request-edit';
  loading: boolean;
}) => {
  const [feedback, setFeedback] = useState('');

  const handleSubmit = useCallback(() => {
    onSubmit(feedback);
    setFeedback('');
  }, [feedback, onSubmit]);

  const handleClose = useCallback(() => {
    onClose();
    setFeedback('');
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" aria-hidden="true"></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  {action === 'reject' ? 'Reject' : 'Request Edit'} Feedback
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-4">
                    Please provide feedback for {action === 'reject' ? 'rejecting' : 'requesting edits to'} "{title}":
                  </p>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Enter your feedback here..."
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={loading}
            >
              {action === 'reject' ? 'Reject' : 'Request Edit'}
            </button>
            <button
              type="button"
              className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function CoordinatorApprovalsPage() {
  const [selectedTab, setSelectedTab] = useState<'activities' | 'media'>('activities');
  const [searchTerm, setSearchTerm] = useState('');
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean;
    type: 'activity' | 'media';
    id: string;
    action: 'approve' | 'reject' | 'request-edit';
    title: string;
  } | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [pendingFeedbackAction, setPendingFeedbackAction] = useState<{
    type: 'activity' | 'media';
    id: string;
    action: 'reject' | 'request-edit';
    title: string;
  } | null>(null);

  // Fetch pending activities
  const { 
    data: pendingActivities, 
    isLoading: activitiesLoading, 
    error: activitiesError,
    refetch: refetchActivities 
  } = useApiQuery<Activity[]>(
    ['activities', 'pending'],
    () => api.get<Activity[]>('/activities', { params: { status: 'pending_approval' } })
  );

  // Fetch pending media (photos + videos)
  const { 
    data: pendingMediaResponse, 
    isLoading: mediaLoading, 
    error: mediaError,
    refetch: refetchMedia 
  } = useApiQuery<{ success: boolean; data: Media[] }>(
    ['media', 'pending'],
    () => api.get<{ success: boolean; data: Media[] }>('/approvals/media', { params: { status: 'pending' } })
  );

  // Get pending media data from response
  const pendingMedia = pendingMediaResponse?.data || [];

  // Approval mutations
  const approveActivityMutation = useApiMutation(
    (id: string) => api.post(`/activities/${id}/approve`)
  );

  const rejectActivityMutation = useApiMutation(
    (data: { id: string; feedback: string }) => 
      api.post(`/activities/${data.id}/reject`, { feedback: data.feedback })
  );

  const requestEditActivityMutation = useApiMutation(
    (data: { id: string; feedback: string }) => 
      api.post(`/activities/${data.id}/request-edit`, { feedback: data.feedback })
  );

  const approveMediaMutation = useApiMutation(
    (id: string) => api.post(`/approvals/media/${id}/approve`)
  );

  const rejectMediaMutation = useApiMutation(
    (data: { id: string; feedback: string }) => 
      api.post(`/approvals/media/${data.id}/reject`, { feedback: data.feedback })
  );

  const handleApproval = useCallback(async (feedback?: string) => {
    if (!pendingFeedbackAction && !approvalDialog) return;

    const actionData = pendingFeedbackAction || approvalDialog;
    if (!actionData) return;

    try {
      if (actionData.type === 'activity') {
        if (actionData.action === 'approve') {
          await approveActivityMutation.mutateAsync(actionData.id);
        } else if (actionData.action === 'reject') {
          await rejectActivityMutation.mutateAsync({ 
            id: actionData.id, 
            feedback: feedback || 'No feedback provided' 
          });
        } else if (actionData.action === 'request-edit') {
          await requestEditActivityMutation.mutateAsync({ 
            id: actionData.id, 
            feedback: feedback || 'Please make the requested edits' 
          });
        }
        refetchActivities();
      } else {
        if (actionData.action === 'approve') {
          await approveMediaMutation.mutateAsync(actionData.id);
        } else if (actionData.action === 'reject') {
          await rejectMediaMutation.mutateAsync({ 
            id: actionData.id, 
            feedback: feedback || 'No feedback provided' 
          });
        }
        refetchMedia();
      }
      
      setApprovalDialog(null);
      setPendingFeedbackAction(null);
      setShowFeedbackModal(false);
    } catch (error) {
      console.error('Failed to process approval:', error);
    }
  }, [
    pendingFeedbackAction, 
    approvalDialog, 
    approveActivityMutation, 
    rejectActivityMutation, 
    requestEditActivityMutation,
    approveMediaMutation,
    rejectMediaMutation,
    refetchActivities,
    refetchMedia
  ]);

  const handleApprovalAction = useCallback((dialog: {
    open: boolean;
    type: 'activity' | 'media';
    id: string;
    action: 'approve' | 'reject' | 'request-edit';
    title: string;
  }) => {
    if (dialog.action === 'approve') {
      setApprovalDialog(dialog);
    } else {
      setPendingFeedbackAction({
        type: dialog.type,
        id: dialog.id,
        action: dialog.action,
        title: dialog.title
      });
      setShowFeedbackModal(true);
    }
  }, []);

  const handleConfirmationDialogConfirm = useCallback(() => {
    if (approvalDialog?.action === 'approve') {
      handleApproval();
    }
  }, [approvalDialog, handleApproval]);

  // Filter activities and media based on search
  const filteredActivities = useMemo(() => {
    const activities = Array.isArray(pendingActivities) ? pendingActivities : [];
    if (!searchTerm) return activities;
    
    return activities.filter(activity =>
      activity.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.school?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.volunteer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pendingActivities, searchTerm]);

  const filteredMedia = useMemo(() => {
    const media = Array.isArray(pendingMedia) ? pendingMedia : [];
    if (!searchTerm) return media;
    
    return media.filter(mediaItem =>
      mediaItem.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mediaItem.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mediaItem.activity?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mediaItem.volunteer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pendingMedia, searchTerm]);

  const activityColumns = useMemo(() => [
    {
      key: 'activity',
      header: 'Activity',
      sortable: true,
      render: (activity: Activity) => (
        <div className="flex items-start space-x-3">
          <div className="shrink-0">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 truncate">{activity.title}</p>
            <div className="flex flex-wrap gap-2 mt-1">
              <div className="flex items-center text-sm text-gray-500">
                <Building className="h-3 w-3 mr-1" />
                {activity.school?.name}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <User className="h-3 w-3 mr-1" />
                {activity.volunteer?.full_name}
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (activity: Activity) => (
        <div className="text-sm text-gray-900">
          {new Date(activity.scheduled_date).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (activity: Activity) => (
        <StatusBadge status={activity.status} />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (activity: Activity) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(`/coordinator/activities/${activity.id}`, '_blank')}
          >
            Review
          </Button>
          <Button
            size="sm"
            variant="default"
            className="bg-green-600 hover:bg-green-700 text-white"
            icon={<Check className="h-4 w-4" />}
            onClick={() =>
              handleApprovalAction({
                open: true,
                type: 'activity',
                id: activity.id,
                action: 'approve',
                title: activity.title,
              })
            }
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
            icon={<Pencil className="h-4 w-4" />}
            onClick={() =>
              handleApprovalAction({
                open: true,
                type: 'activity',
                id: activity.id,
                action: 'request-edit',
                title: activity.title,
              })
            }
          >
            Request Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            icon={<X className="h-4 w-4" />}
            onClick={() =>
              handleApprovalAction({
                open: true,
                type: 'activity',
                id: activity.id,
                action: 'reject',
                title: activity.title,
              })
            }
          >
            Reject
          </Button>
        </div>
      ),
    },
  ], [handleApprovalAction]);

  const mediaColumns = useMemo(() => [
    {
      key: 'media',
      header: 'Media',
      render: (media: Media) => (
        <div className="flex items-start space-x-3">
          <div className="shrink-0">
            <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
              {media.mediaType === 'video' ? (
                <Video className="h-6 w-6 text-red-500" />
              ) : (
                <MediaIcon className="h-6 w-6 text-blue-500" />
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900 truncate">
                {media.filename || `media_${media.id.substring(0, 8)}`}
              </p>
              <span className={`px-2 py-1 text-xs rounded-full ${
                media.mediaType === 'video' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {media.mediaType}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              {media.caption && (
                <p className="text-sm text-gray-500 truncate">
                  {media.caption}
                </p>
              )}
              {media.activity && (
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  {media.activity.title}
                </div>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'activity',
      header: 'Activity',
      render: (media: Media) => (
        <div className="text-sm text-gray-900">
          {media.activity?.title || 'Not linked to activity'}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (media: Media) => (
        <StatusBadge status={media.status} />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (media: Media) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(media.url, '_blank')}
          >
            View
          </Button>
          <Button
            size="sm"
            variant="default"
            className="bg-green-600 hover:bg-green-700 text-white"
            icon={<Check className="h-4 w-4" />}
            onClick={() =>
              handleApprovalAction({
                open: true,
                type: 'media',
                id: media.id,
                action: 'approve',
                title: 'Media',
              })
            }
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            icon={<X className="h-4 w-4" />}
            onClick={() =>
              handleApprovalAction({
                open: true,
                type: 'media',
                id: media.id,
                action: 'reject',
                title: 'Media',
              })
            }
          >
            Reject
          </Button>
        </div>
      ),
    },
  ], [handleApprovalAction]);

  const tabs = useMemo(() => [
    {
      id: 'activities',
      label: 'Activities',
      icon: <Calendar className="h-5 w-5" />,
      count: filteredActivities.length,
      content: (
        <div className="space-y-4">
          {filteredActivities.length > 0 ? (
            <Card>
              <DataTable
                data={filteredActivities}
                columns={activityColumns}
              />
            </Card>
          ) : (
            <EmptyState
              icon={<Calendar className="h-12 w-12 text-gray-400" />}
              title={
                searchTerm ? "No matching activities found" : "No activities pending approval"
              }
              description={
                searchTerm
                  ? "Try adjusting your search to find pending activities."
                  : "All activities have been reviewed and approved."
              }
              action={
                searchTerm
                  ? {
                      label: 'Clear Search',
                      onClick: () => setSearchTerm(''),
                    }
                  : undefined
              }
            />
          )}
        </div>
      ),
    },
    {
      id: 'media',
      label: 'Media',
      icon: <MediaIcon className="h-5 w-5" />,
      count: filteredMedia.length,
      content: (
        <div className="space-y-4">
          {filteredMedia.length > 0 ? (
            <Card>
              <DataTable
                data={filteredMedia}
                columns={mediaColumns}
              />
            </Card>
          ) : (
            <EmptyState
              icon={<MediaIcon className="h-12 w-12 text-gray-400" />}
              title={
                searchTerm ? "No matching media found" : "No media pending approval"
              }
              description={
                searchTerm
                  ? "Try adjusting your search to find pending media."
                  : "All media have been reviewed and approved."
              }
              action={
                searchTerm
                  ? {
                      label: 'Clear Search',
                      onClick: () => setSearchTerm(''),
                    }
                  : undefined
              }
            />
          )}
        </div>
      ),
    },
  ], [filteredActivities, filteredMedia, searchTerm, activityColumns, mediaColumns]);

  const isLoading = activitiesLoading || mediaLoading;
  const error = activitiesError || mediaError;

  // Calculate urgent count safely
  const urgentCount = useMemo(() => {
    const activities = Array.isArray(pendingActivities) ? pendingActivities : [];
    return activities.filter(a => {
      if (!a?.created_at) return false;
      const daysAgo = Math.floor(
        (new Date().getTime() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysAgo > 7;
    }).length;
  }, [pendingActivities]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="card" />
        <SkeletonLoader type="dashboard" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        title="Unable to load approvals"
      >
        There was an error loading pending items. Please try again.
      </Alert>
    );
  }

  const totalPending = (Array.isArray(pendingActivities) ? pendingActivities.length : 0) + filteredMedia.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review and approve volunteer submissions
            {totalPending > 0 && (
              <span className="ml-2 font-medium text-green-600">
                ({totalPending} pending)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-full sm:w-64">
            <SearchFilter
              onSearch={setSearchTerm}
              placeholder="Search activities, media, volunteers..."
            />
          </div>
          <Button
            variant="outline"
            icon={<Filter className="h-5 w-5" />}
            onClick={() => {/* TODO: Implement advanced filters */}}
          >
            Filters
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Activities</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {Array.isArray(pendingActivities) ? pendingActivities.length : 0}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Media</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {filteredMedia.length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <MediaIcon className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Urgent</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {urgentCount}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={selectedTab}
        onTabChange={(tabId) => setSelectedTab(tabId as 'activities' | 'media')}
        variant="underline"
      />

      {/* Confirmation Dialog for Approve actions */}
      {approvalDialog && (
        <ConfirmationDialog
          open={approvalDialog.open}
          onClose={() => setApprovalDialog(null)}
          onConfirm={handleConfirmationDialogConfirm}
          title={`Approve ${approvalDialog.type}`}
          message={`Are you sure you want to approve "${approvalDialog.title}"?`}
          confirmText="Approve"
          type="info"
          loading={
            approveActivityMutation.isPending ||
            rejectActivityMutation.isPending ||
            requestEditActivityMutation.isPending ||
            approveMediaMutation.isPending ||
            rejectMediaMutation.isPending
          }
        />
      )}

      {/* Feedback Modal for Reject/Request Edit actions */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setPendingFeedbackAction(null);
        }}
        onSubmit={handleApproval}
        title={pendingFeedbackAction?.title || ''}
        action={pendingFeedbackAction?.action || 'reject'}
        loading={
          rejectActivityMutation.isPending ||
          requestEditActivityMutation.isPending ||
          rejectMediaMutation.isPending
        }
      />
    </div>
  );
}