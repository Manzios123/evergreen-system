// app/[locale]/coordinator/activities/page.tsx

'use client'

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button'; // Changed to default import
import DataTable from '@/components/ui/data-table'; // Changed to default import
import StatusBadge from '@/components/ui/status-badge'; // Changed to default import
import SearchFilter from '@/components/ui/search-filter'; // Changed to default import
import ConfirmationDialog from '@/components/ui/confirmation-dialog'; // Changed to default import
import EmptyState from '@/components/ui/empty-state'; // Changed to default import
import SkeletonLoader from '@/components/ui/skeleton-loader'; // Changed to default import
import Alert from '@/components/ui/alert'; // Changed to default import
import { useApiQuery, useApiMutation } from '@/lib/hooks/use-api';
import { Activity, ActivityFilters, ActivityStatus } from '@/lib/types';
import { api } from '@/lib/api/api'; // Added missing api import
import {
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  FunnelIcon, // Changed from FilterIcon to FunnelIcon
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { useState, useMemo } from 'react';
import Link from 'next/link';

export default function CoordinatorActivitiesPage() {
  const [filters, setFilters] = useState<ActivityFilters>({});
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // Fetch activities with filters
  const { 
    data: activitiesData, 
    isLoading, 
    error, 
    refetch 
  } = useApiQuery<{ data: Activity[]; count: number }>(
    ['activities', filters],
    () => api.get<{ data: Activity[]; count: number }>('/activities', filters) // Fixed API call
  );

  // Delete mutation
  const deleteMutation = useApiMutation(
    (id: string) => api.delete(`/activities/${id}`) // Fixed API call
  );

  // Submit for approval mutation
  const submitMutation = useApiMutation(
    (id: string) => api.patch(`/activities/${id}/submit`) // Fixed API call
  );

  const handleDelete = async () => {
    if (!selectedActivity) return;
    
    try {
      await deleteMutation.mutateAsync(selectedActivity.id);
      refetch();
      setShowDeleteDialog(false);
      setSelectedActivity(null);
    } catch (error) {
      console.error('Failed to delete activity:', error);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!selectedActivity) return;
    
    try {
      await submitMutation.mutateAsync(selectedActivity.id);
      refetch();
      setShowSubmitDialog(false);
      setSelectedActivity(null);
    } catch (error) {
      console.error('Failed to submit activity:', error);
    }
  };

  // Filter options - adjusted to match ActivityStatus type
  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_edit', label: 'In Edit' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  // Note: DataTable expects 'header' not 'label' for columns
  const columns = [
    {
      key: 'title',
      header: 'Activity', // Changed from 'label' to 'header'
      render: (activity: Activity) => (
        <div>
          <p className="font-medium text-gray-900">{activity.title}</p>
          <p className="text-sm text-gray-500 truncate">
            {activity.description}
          </p>
        </div>
      ),
    },
    {
      key: 'volunteer',
      header: 'Volunteer', // Changed from 'label' to 'header'
      render: (activity: Activity) => (
        <div className="flex items-center">
          <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
          <span>{activity.volunteer?.full_name || 'Unassigned'}</span> {/* Changed from 'name' to 'full_name' */}
        </div>
      ),
    },
    {
      key: 'school',
      header: 'School', // Changed from 'label' to 'header'
      render: (activity: Activity) => (
        <div className="flex items-center">
          <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
          <span>{activity.school?.name}</span>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date', // Changed from 'label' to 'header'
      render: (activity: Activity) => (
        <div className="flex items-center">
          <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
          <span>{new Date(activity.scheduled_date).toLocaleDateString()}</span> {/* Changed from 'date' to 'scheduled_date' */}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status', // Changed from 'label' to 'header'
      render: (activity: Activity) => <StatusBadge status={activity.status} />,
    },
    {
      key: 'actions',
      header: 'Actions', // Changed from 'label' to 'header'
      render: (activity: Activity) => (
        <div className="flex space-x-2">
          <Link href={`/coordinator/activities/${activity.id}`}>
            <Button
              size="sm"
              variant="ghost"
              icon={<EyeIcon className="h-4 w-4" />}
            >
              View
            </Button>
          </Link>
          
          {(activity.status === 'draft') && ( // Removed 'scheduled' as it's not in ActivityStatus
            <Link href={`/coordinator/activities/${activity.id}/edit`}>
              <Button
                size="sm"
                variant="ghost"
                icon={<PencilIcon className="h-4 w-4" />}
              >
                Edit
              </Button>
            </Link>
          )}

          {activity.status === 'draft' && (
            <Button
              size="sm"
              variant="default"
              icon={<DocumentCheckIcon className="h-4 w-4" />}
              onClick={() => {
                setSelectedActivity(activity);
                setShowSubmitDialog(true);
              }}
            >
              Submit
            </Button>
          )}

          {(activity.status === 'draft' || activity.status === 'cancelled') && (
            <Button
              size="sm"
              variant="default"
              icon={<TrashIcon className="h-4 w-4" />}
              onClick={() => {
                setSelectedActivity(activity);
                setShowDeleteDialog(true);
              }}
            >
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Apply filters to data
  const filteredActivities = useMemo(() => {
    return activitiesData?.data || [];
  }, [activitiesData]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-2"></div>
          </div>
          <div className="h-10 w-36 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <SkeletonLoader type="card" />
        <SkeletonLoader type="table" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert 
          type="error" 
          title="Unable to load activities"
        >
          <p className="text-sm text-red-700 mt-1">
            There was an error loading activities. Please try again.
          </p>
          <div className="mt-4">
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all activities in your pilot program
          </p>
        </div>
        <div className="flex space-x-3">
          <Link href="/coordinator/activities/new">
            <Button
              variant="default"
              icon={<PlusIcon className="h-5 w-5" />}
            >
              Assign Activity
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Activities</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {activitiesData?.count || 0}
              </p>
            </div>
            <CalendarIcon className="h-8 w-8 text-gray-300" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {filteredActivities.filter(a => a.status === 'pending' || a.status === 'in_edit').length}
              </p>
            </div>
            <StatusBadge status="pending" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Upcoming</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {filteredActivities.filter(a => 
                  a.status === 'approved'
                ).length}
              </p>
            </div>
            <StatusBadge status="approved" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {filteredActivities.filter(a => a.status === 'completed').length}
              </p>
            </div>
            <StatusBadge status="completed" />
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="p-4">
          <SearchFilter
            placeholder="Search activities by title, volunteer, or school..."
            onSearch={(query: string) => setFilters({ ...filters, search: query })}
            onFilterChange={(activeFilters: Record<string, any>) => {
              // Map the filters to match the ActivityFilters type
              const newFilters: ActivityFilters = {
                ...filters,
                status: activeFilters.status ? [activeFilters.status] : undefined,
                search: activeFilters.search || filters.search,
              };
              setFilters(newFilters);
            }}
            filters={[
              {
                key: 'status',
                label: 'Status',
                type: 'select',
                options: statusOptions,
              },
            ]}
          />
        </div>
      </Card>

      {/* Activities Table */}
      {filteredActivities.length > 0 ? (
        <Card>
          <DataTable
            data={filteredActivities}
            columns={columns}
            emptyMessage="No activities found"
          />
        </Card>
      ) : (
        <EmptyState
          icon={<CalendarIcon className="h-12 w-12 text-gray-400" />}
          title="No activities found"
          description={
            filters.search || filters.status
              ? 'Try adjusting your filters to find activities.'
              : 'No activities have been assigned in your pilot program yet.'
          }
          action={
            !filters.search && !filters.status
              ? {
                  label: 'Assign First Activity',
                  onClick: () => window.location.href = '/coordinator/activities/new',
                }
              : {
                  label: 'Clear Filters',
                  onClick: () => setFilters({}),
                }
          }
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedActivity(null);
        }}
        onConfirm={handleDelete}
        title="Delete Activity"
        message={`Are you sure you want to delete "${selectedActivity?.title}"? This action cannot be undone.`}
        confirmText="Delete Activity"
        cancelText="Cancel"
        type="danger"
        loading={deleteMutation.isPending} // Changed from isLoading to isPending
      />

      {/* Submit for Approval Dialog */}
      <ConfirmationDialog
        open={showSubmitDialog}
        onClose={() => {
          setShowSubmitDialog(false);
          setSelectedActivity(null);
        }}
        onConfirm={handleSubmitForApproval}
        title="Submit Activity for Approval"
        message={`Submit "${selectedActivity?.title}" for approval? Once submitted, the volunteer can no longer edit it.`}
        confirmText="Submit for Approval"
        cancelText="Cancel"
        type="warning"
        loading={submitMutation.isPending} // Changed from isLoading to isPending
      />
    </div>
  );
}