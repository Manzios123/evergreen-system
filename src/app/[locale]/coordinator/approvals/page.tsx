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
  Calendar,
  Building,
  User,
  Filter,
  Clock,
} from 'lucide-react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { api } from '@/lib/api/api';

// Define the response structure for activities
interface ActivitiesResponse {
  success: boolean;
  data: Activity[];
  count: number;
  message: string;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean;
    type: 'activity';
    id: string;
    action: 'approve' | 'reject' | 'request-edit';
    title: string;
  } | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [pendingFeedbackAction, setPendingFeedbackAction] = useState<{
    type: 'activity';
    id: string;
    action: 'reject' | 'request-edit';
    title: string;
  } | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
    title: string;
  } | null>(null);

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Fetch pending activities - status is 'pending' (not 'pending_approval')
  const { 
    data: activitiesResponse, 
    isLoading: activitiesLoading, 
    error: activitiesError,
    refetch: refetchActivities 
  } = useApiQuery<ActivitiesResponse>(
    ['activities', 'pending'],
    () => api.get<ActivitiesResponse>('/activities', { params: { status: 'pending' } })
  );

  // Extract activities from response
  const pendingActivities = activitiesResponse?.data || [];

  // Approval mutations for activities
  const approveActivityMutation = useApiMutation(
    (id: string) => api.post(`/approvals/${id}/approve`)
  );

  const rejectActivityMutation = useApiMutation(
    (data: { id: string; feedback: string }) => 
      api.post(`/approvals/${data.id}/reject`, { feedback: data.feedback })
  );

  const requestEditActivityMutation = useApiMutation(
    (data: { id: string; feedback: string }) => 
      api.post(`/approvals/${data.id}/request-edit`, { feedback: data.feedback })
  );

  const handleApproval = useCallback(async (feedback?: string) => {
    if (!pendingFeedbackAction && !approvalDialog) return;

    const actionData = pendingFeedbackAction || approvalDialog;
    if (!actionData) return;

    try {
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
      
      // Show success notification
      setNotification({
        type: 'success',
        title: 'Success',
        message: `Activity ${actionData.action === 'approve' ? 'approved' : actionData.action === 'reject' ? 'rejected' : 'edit requested'} successfully`
      });
      
      setApprovalDialog(null);
      setPendingFeedbackAction(null);
      setShowFeedbackModal(false);
    } catch (error: any) {
      console.error('Failed to process approval:', error);
      
      // Show error notification
      setNotification({
        type: 'error',
        title: 'Error',
        message: error.message || "Failed to process approval"
      });
    }
  }, [
    pendingFeedbackAction, 
    approvalDialog, 
    approveActivityMutation, 
    rejectActivityMutation, 
    requestEditActivityMutation,
    refetchActivities
  ]);

  const handleApprovalAction = useCallback((dialog: {
    open: boolean;
    type: 'activity';
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

  // Filter activities based on search
  const filteredActivities = useMemo(() => {
    const activities = Array.isArray(pendingActivities) ? pendingActivities : [];
    if (!searchTerm) return activities;
    
    return activities.filter(activity =>
      activity.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.school_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.volunteer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.school?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.volunteer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pendingActivities, searchTerm]);

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
                {activity.school_name || activity.school?.name}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <User className="h-3 w-3 mr-1" />
                {activity.volunteer_name || activity.volunteer?.full_name}
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
          {activity.actual_date 
            ? new Date(activity.actual_date).toLocaleDateString() 
            : activity.scheduled_date 
              ? new Date(activity.scheduled_date).toLocaleDateString()
              : 'No date'}
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

  const tabs = [
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
  ];

  const isLoading = activitiesLoading;
  const error = activitiesError;

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

  const totalPending = pendingActivities.length;

  return (
    <div className="space-y-6">
      {/* Notification Alert */}
      {notification && (
        <Alert
          type={notification.type}
          title={notification.title}
          onClose={() => setNotification(null)}
        >
          {notification.message}
        </Alert>
      )}

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
              placeholder="Search activities, volunteers, schools..."
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Activities</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {pendingActivities.length}
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

      {/* Tabs - Only activities */}
      <Tabs
        tabs={tabs}
        activeTab="activities"
        onTabChange={() => {}} // No-op since only one tab
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
            requestEditActivityMutation.isPending
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
          requestEditActivityMutation.isPending
        }
      />
    </div>
  );
}