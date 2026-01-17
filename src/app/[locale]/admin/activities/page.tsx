// app/[locale]/admin/activities/page.tsx - UPDATED VERSION
'use client';

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import DataTable from '@/components/ui/data-table';
import StatusBadge from '@/components/ui/status-badge';
import SearchFilter from '@/components/ui/search-filter';
import EmptyState from '@/components/ui/empty-state';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import Alert from '@/components/ui/alert';
import { useApiQuery } from '@/lib/hooks/use-api';
import { Activity, Pilot, User } from '@/lib/types';
import {
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  FunnelIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function AdminActivitiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pilotFilter, setPilotFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});

  // Fetch activities
  const { 
    data: activitiesData, 
    isLoading, 
    error, 
    refetch 
  } = useApiQuery<{ data: Activity[]; count: number }>(
    ['admin-activities', searchTerm, statusFilter, pilotFilter, dateRange],
    () => api.get<{ data: Activity[]; count: number }>('/admin/activities', {
      search: searchTerm,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      pilotId: pilotFilter !== 'all' ? pilotFilter : undefined,
      startDate: dateRange.start,
      endDate: dateRange.end,
    })
  );

  // Fetch pilots for filter
  const { data: pilots } = useApiQuery<{ data: Pilot[]; count: number }>(
    ['pilots-for-filter'],
    () => api.get<{ data: Pilot[]; count: number }>('/pilots', { limit: 100 })
  );

  const columns = [
    {
      key: 'activity',
      header: 'Activity',
      sortable: true,
      render: (activity: Activity) => (
        <div className="flex items-start">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 shrink-0">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{activity.title}</p>
            <div className="flex flex-wrap gap-2 mt-1">
              <div className="flex items-center text-xs text-gray-500">
                <ChartBarIcon className="h-3 w-3 mr-1" />
                {activity.pilot?.name}
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'school',
      header: 'School',
      sortable: true,
      render: (activity: Activity) => (
        <div className="flex items-center">
          <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900">{activity.school?.name}</span>
        </div>
      ),
    },
    {
      key: 'volunteer',
      header: 'Volunteer',
      sortable: true,
      render: (activity: Activity) => (
        <div className="flex items-center">
          <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900">{activity.volunteer?.full_name}</span>
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
      render: (activity: Activity) => <StatusBadge status={activity.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (activity: Activity) => (
        <div className="flex space-x-2">
          <Link
            href={`/admin/activities/${activity.id}`}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500 h-8 px-3"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            View
          </Link>
          <Link
            href={`/coordinator/activities/${activity.id}`}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500 h-8 px-3"
          >
            Coordinator View
          </Link>
        </div>
      ),
    },
  ];

  const filteredActivities = useMemo(() => {
    return activitiesData?.data || [];
  }, [activitiesData]);

  // Status options - UPDATED: removed 'in_edit'
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  // Pilot options
  const pilotOptions = [
    { value: 'all', label: 'All Pilots' },
    ...((pilots?.data?.map((pilot: Pilot) => ({
      value: pilot.id,
      label: pilot.name,
    })) || [])),
  ];

  // Stats - UPDATED: removed inEditActivities, added approvedActivities
  const stats = useMemo(() => {
    if (!filteredActivities) return null;

    const totalActivities = filteredActivities.length;
    const completedActivities = filteredActivities.filter(a => a.status === 'completed').length;
    const pendingActivities = filteredActivities.filter(a => a.status === 'pending').length;
    const approvedActivities = filteredActivities.filter(a => a.status === 'approved').length;
    
    const currentMonth = new Date().getMonth();
    const currentMonthActivities = filteredActivities.filter(a => 
      new Date(a.scheduled_date).getMonth() === currentMonth
    ).length;

    return {
      totalActivities,
      completedActivities,
      pendingActivities,
      approvedActivities,
      currentMonthActivities,
    };
  }, [filteredActivities]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <SkeletonLoader type="card" />
            <SkeletonLoader type="card" />
          </div>
          <div className="h-8 w-36 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <SkeletonLoader type="card" />
        <SkeletonLoader type="table" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        title="Unable to load activities"
        onClose={() => refetch()}
      >
        There was an error loading activities. Please try again.
      </Alert>
    );
  }

  const handleSearch = (query: string) => {
    setSearchTerm(query);
  };

  const handleFilterChange = (filters: Record<string, any>) => {
    if (filters.status) setStatusFilter(filters.status);
    if (filters.pilot) setPilotFilter(filters.pilot);
    if (filters.dateRange) setDateRange(filters.dateRange);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Activities</h1>
          <p className="mt-1 text-sm text-gray-500">
            View all activities across all pilot programs
          </p>
        </div>
        <Button
          variant="outline"
          icon={<FunnelIcon className="h-5 w-5" />}
          onClick={() => {/* TODO: Implement advanced filters */}}
        >
          Advanced Filters
        </Button>
      </div>

      {/* Stats Cards - UPDATED: Changed "In Edit" to "Approved" */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Activities</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalActivities}
                </p>
              </div>
              <CalendarIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {stats.completedActivities}
                </p>
              </div>
              <StatusBadge status="completed" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {stats.pendingActivities}
                </p>
              </div>
              <StatusBadge status="pending" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Approved</p> {/* CHANGED */}
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {stats.approvedActivities} {/* CHANGED */}
                </p>
              </div>
              <StatusBadge status="approved" /> {/* CHANGED */}
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">This Month</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {stats.currentMonthActivities}
                </p>
              </div>
              <CalendarIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
        </div>
      )}

      {/* Rest of the code remains the same */}
      {/* Search and Filters */}
      <Card>
        <div className="p-4">
          <SearchFilter
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            filters={[
              {
                key: 'status',
                label: 'Status',
                type: 'select',
                options: statusOptions,
              },
              {
                key: 'pilot',
                label: 'Pilot Program',
                type: 'select',
                options: pilotOptions,
              },
              {
                key: 'dateRange',
                label: 'Date Range',
                type: 'date',
              },
            ]}
            placeholder="Search activities by title, volunteer, or school..."
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
          title={searchTerm || statusFilter !== 'all' || pilotFilter !== 'all' ? "No activities found" : "No activities yet"}
          description={
            searchTerm || statusFilter !== 'all' || pilotFilter !== 'all'
              ? "Try adjusting your filters to find activities."
              : "No activities have been created in the system yet."
          }
          action={
            searchTerm || statusFilter !== 'all' || pilotFilter !== 'all'
              ? {
                  label: 'Clear Filters',
                  onClick: () => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setPilotFilter('all');
                    setDateRange({});
                  },
                }
              : undefined
          }
        />
      )}
    </div>
  );
}