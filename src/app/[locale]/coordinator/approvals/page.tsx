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
import { Activity, Photo } from '@/lib/types';
import {
  Check,
  X,
  Pencil,
  Image as PhotoIcon,
  Calendar,
  Building,
  User,
  Filter,
  Clock,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { api } from '@/lib/api/api';

export default function CoordinatorApprovalsPage() {
  const [selectedTab, setSelectedTab] = useState<'activities' | 'photos'>('activities');
  const [searchTerm, setSearchTerm] = useState('');
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean;
    type: 'activity' | 'photo';
    id: string;
    action: 'approve' | 'reject' | 'request-edit';
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
    () => api.get<Activity[]>('/activities', { status: 'pending_approval' })
  );

  // Fetch pending photos
  const { 
    data: pendingPhotos, 
    isLoading: photosLoading, 
    error: photosError,
    refetch: refetchPhotos 
  } = useApiQuery<Photo[]>(
    ['photos', 'pending'],
    () => api.get<Photo[]>('/photos', { status: 'pending' })
  );

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

  const approvePhotoMutation = useApiMutation(
    (id: string) => api.post(`/photos/${id}/approve`)
  );

  const rejectPhotoMutation = useApiMutation(
    (data: { id: string; feedback: string }) => 
      api.post(`/photos/${data.id}/reject`, { feedback: data.feedback })
  );

  const handleApproval = async (feedback?: string) => {
    if (!approvalDialog) return;

    try {
      if (approvalDialog.type === 'activity') {
        if (approvalDialog.action === 'approve') {
          await approveActivityMutation.mutateAsync(approvalDialog.id);
        } else if (approvalDialog.action === 'reject') {
          await rejectActivityMutation.mutateAsync({ 
            id: approvalDialog.id, 
            feedback: feedback || 'No feedback provided' 
          });
        } else if (approvalDialog.action === 'request-edit') {
          await requestEditActivityMutation.mutateAsync({ 
            id: approvalDialog.id, 
            feedback: feedback || 'Please make the requested edits' 
          });
        }
        refetchActivities();
      } else {
        if (approvalDialog.action === 'approve') {
          await approvePhotoMutation.mutateAsync(approvalDialog.id);
        } else if (approvalDialog.action === 'reject') {
          await rejectPhotoMutation.mutateAsync({ 
            id: approvalDialog.id, 
            feedback: feedback || 'No feedback provided' 
          });
        }
        refetchPhotos();
      }
      
      setApprovalDialog(null);
    } catch (error) {
      console.error('Failed to process approval:', error);
    }
  };

  // Filter activities and photos based on search
  const filteredActivities = useMemo(() => {
    if (!pendingActivities) return [];
    if (!searchTerm) return pendingActivities;
    
    return pendingActivities.filter(activity =>
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.school?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.volunteer?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pendingActivities, searchTerm]);

  const filteredPhotos = useMemo(() => {
    if (!pendingPhotos) return [];
    if (!searchTerm) return pendingPhotos;
    
    return pendingPhotos.filter(photo =>
      photo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      photo.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pendingPhotos, searchTerm]);

  const activityColumns = [
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
              setApprovalDialog({
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
              setApprovalDialog({
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
              setApprovalDialog({
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
  ];

  const photoColumns = [
    {
      key: 'photo',
      header: 'Photo',
      render: (photo: Photo) => (
        <div className="flex items-start space-x-3">
          <div className="shrink-0">
            <img
              src={photo.thumbnailUrl || photo.url}
              alt={photo.description || 'Activity photo'}
              className="h-12 w-12 rounded object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 truncate">
              {photo.filename}
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              {photo.description && (
                <p className="text-sm text-gray-500 truncate">
                  {photo.description}
                </p>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'activityId',
      header: 'Activity ID',
      render: (photo: Photo) => (
        <div className="text-sm text-gray-900">
          {photo.activityId || 'Not linked to activity'}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (photo: Photo) => (
        <StatusBadge status={photo.status} />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (photo: Photo) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(photo.url, '_blank')}
          >
            View
          </Button>
          <Button
            size="sm"
            variant="default"
            className="bg-green-600 hover:bg-green-700 text-white"
            icon={<Check className="h-4 w-4" />}
            onClick={() =>
              setApprovalDialog({
                open: true,
                type: 'photo',
                id: photo.id,
                action: 'approve',
                title: 'Photo',
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
              setApprovalDialog({
                open: true,
                type: 'photo',
                id: photo.id,
                action: 'reject',
                title: 'Photo',
              })
            }
          >
            Reject
          </Button>
        </div>
      ),
    },
  ];

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
    {
      id: 'photos',
      label: 'Photos',
      icon: <PhotoIcon className="h-5 w-5" />,
      count: filteredPhotos.length,
      content: (
        <div className="space-y-4">
          {filteredPhotos.length > 0 ? (
            <Card>
              <DataTable
                data={filteredPhotos}
                columns={photoColumns}
              />
            </Card>
          ) : (
            <EmptyState
              icon={<PhotoIcon className="h-12 w-12 text-gray-400" />}
              title={
                searchTerm ? "No matching photos found" : "No photos pending approval"
              }
              description={
                searchTerm
                  ? "Try adjusting your search to find pending photos."
                  : "All photos have been reviewed and approved."
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

  const isLoading = activitiesLoading || photosLoading;
  const error = activitiesError || photosError;

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

  const totalPending = (pendingActivities?.length || 0) + (pendingPhotos?.length || 0);

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
              placeholder="Search activities, photos, volunteers..."
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
                {pendingActivities?.length || 0}
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
              <p className="text-sm font-medium text-gray-500">Pending Photos</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {pendingPhotos?.length || 0}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <PhotoIcon className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Urgent</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {(pendingActivities?.filter(a => {
                  const daysAgo = Math.floor(
                    (new Date().getTime() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return daysAgo > 7;
                }).length || 0)}
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
        onTabChange={(tabId) => setSelectedTab(tabId as 'activities' | 'photos')}
        variant="underline"
      />

      {/* Confirmation Dialog */}
      {approvalDialog && (
        <ConfirmationDialog
          open={approvalDialog.open}
          onClose={() => setApprovalDialog(null)}
          onConfirm={() => handleApproval()}
          title={
            approvalDialog.action === 'approve'
              ? `Approve ${approvalDialog.type}`
              : approvalDialog.action === 'reject'
              ? `Reject ${approvalDialog.type}`
              : `Request Edit for ${approvalDialog.type}`
          }
          message={
            approvalDialog.action === 'approve'
              ? `Are you sure you want to approve "${approvalDialog.title}"?`
              : approvalDialog.action === 'reject'
              ? `Please provide feedback for rejecting "${approvalDialog.title}":`
              : `Please provide feedback for requested edits to "${approvalDialog.title}":`
          }
          confirmText={
            approvalDialog.action === 'approve'
              ? 'Approve'
              : approvalDialog.action === 'reject'
              ? 'Reject'
              : 'Request Edit'
          }
          type={
            approvalDialog.action === 'approve'
              ? 'info'
              : approvalDialog.action === 'reject'
              ? 'danger'
              : 'warning'
          }
          loading={
            approveActivityMutation.isPending ||
            rejectActivityMutation.isPending ||
            requestEditActivityMutation.isPending ||
            approvePhotoMutation.isPending ||
            rejectPhotoMutation.isPending
          }
        />
      )}
    </div>
  );
}