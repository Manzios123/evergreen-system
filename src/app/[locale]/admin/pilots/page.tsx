// app/[locale]/admin/pilots/page.tsx
'use client';

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import DataTable from '@/components/ui/data-table';
import SearchFilter from '@/components/ui/search-filter';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import EmptyState from '@/components/ui/empty-state';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import Alert from '@/components/ui/alert';
import { useApiQuery, useApiMutation } from '@/lib/hooks/use-api';
import { Pilot, ApiResponse, PaginationParams } from '@/lib/types';
import {
  ChartBarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { pilotsApi } from '@/lib/api/pilots';

// Define extended Pilot type with stats
interface PilotWithStats extends Pilot {
  volunteerCount?: number;
  schoolCount?: number;
  activityCount?: number;
  completionRate?: number;
}

// Custom StatusBadge for Pilot status
interface PilotStatusBadgeProps {
  status: 'active' | 'completed' | 'cancelled';
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

function PilotStatusBadge({ status, showIcon = false, size = 'md' }: PilotStatusBadgeProps) {
  const statusConfig = {
    active: {
      label: 'Active',
      color: 'bg-green-100 text-green-800 ring-green-600/20',
    },
    completed: {
      label: 'Completed',
      color: 'bg-blue-100 text-blue-800 ring-blue-600/20',
    },
    cancelled: {
      label: 'Cancelled',
      color: 'bg-red-100 text-red-800 ring-red-600/20',
    },
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const config = statusConfig[status];
  
  return (
    <span className={`inline-flex items-center rounded-full ring-1 ring-inset font-medium ${config.color} ${sizeClasses[size]}`}>
      {config.label}
    </span>
  );
}

export default function AdminPilotsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPilot, setSelectedPilot] = useState<PilotWithStats | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch pilots with search and filter - note: we'll handle search client-side
  const { 
    data: pilotsData, 
    isLoading, 
    error, 
    refetch 
  } = useApiQuery<ApiResponse<PilotWithStats[]>>(
    ['pilots', statusFilter],
    () => pilotsApi.getPilots({
      // Note: pilotsApi.getPilots doesn't accept 'search' parameter in type
      // We'll filter client-side for search
      isActive: statusFilter !== 'all' ? statusFilter === 'active' : undefined,
    })
  );

  // Delete pilot mutation
  const deleteMutation = useApiMutation(
    (id: string) => pilotsApi.deletePilot(id),
    {
      invalidateQueries: [['pilots']],
    }
  );

  // Clone pilot mutation
  const cloneMutation = useApiMutation(
    (id: string) => pilotsApi.getPilot(id).then((response) => {
      // Create a new pilot based on the existing one
      const { id: _, created_at: __, updated_at: ___, ...pilotData } = response.data;
      return pilotsApi.createPilot({
        ...pilotData,
        name: `${pilotData.name} (Copy)`,
        status: 'active' as const,
        created_at: '',
        updated_at: ''
      });
    }),
    {
      invalidateQueries: [['pilots']],
    }
  );

  const handleDelete = async () => {
    if (!selectedPilot) return;
    
    try {
      await deleteMutation.mutateAsync(selectedPilot.id);
      setShowDeleteDialog(false);
      setSelectedPilot(null);
    } catch (error) {
      console.error('Failed to delete pilot:', error);
    }
  };

  const handleClone = async (pilotId: string) => {
    try {
      await cloneMutation.mutateAsync(pilotId);
      alert('Pilot program cloned successfully');
    } catch (error) {
      console.error('Failed to clone pilot:', error);
    }
  };

  const columns = [
    {
      key: 'pilot',
      header: 'Pilot Program',
      sortable: true,
      render: (pilot: PilotWithStats) => (
        <div className="flex items-start">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 shrink-0">
            <ChartBarIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{pilot.name}</p>
            <p className="text-sm text-gray-500 mt-1">{pilot.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'stats',
      header: 'Statistics',
      render: (pilot: PilotWithStats) => (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-sm font-medium text-gray-900">{pilot.volunteerCount || 0}</p>
            <p className="text-xs text-gray-500">Volunteers</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{pilot.schoolCount || 0}</p>
            <p className="text-xs text-gray-500">Schools</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{pilot.activityCount || 0}</p>
            <p className="text-xs text-gray-500">Activities</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{pilot.completionRate || 0}%</p>
            <p className="text-xs text-gray-500">Complete</p>
          </div>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Dates',
      render: (pilot: PilotWithStats) => (
        <div className="text-sm">
          <div className="flex items-center">
            <CalendarIcon className="h-3 w-3 text-gray-400 mr-1" />
            <span className="text-gray-900">
              {new Date(pilot.start_date).toLocaleDateString()}
            </span>
          </div>
          {pilot.end_date && (
            <div className="flex items-center mt-1">
              <span className="text-gray-500">to</span>
              <span className="text-gray-900 ml-1">
                {new Date(pilot.end_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (pilot: PilotWithStats) => <PilotStatusBadge status={pilot.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (pilot: PilotWithStats) => (
        <div className="flex space-x-2">
          <Link
            href={`/admin/pilots/${pilot.id}`}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500 h-8 px-3"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            View
          </Link>
          <Link
            href={`/admin/pilots/${pilot.id}/edit`}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500 h-8 px-3"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Edit
          </Link>
          <button
            onClick={() => handleClone(pilot.id)}
            disabled={cloneMutation.status === 'pending'}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500 h-8 px-3"
          >
            <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
            {cloneMutation.status === 'pending' ? 'Cloning...' : 'Clone'}
          </button>
          <button
            onClick={() => {
              setSelectedPilot(pilot);
              setShowDeleteDialog(true);
            }}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none hover:bg-red-50 hover:text-red-700 focus-visible:ring-red-500 h-8 px-3"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Delete
          </button>
        </div>
      ),
    },
  ];

  const filteredPilots = useMemo(() => {
    let result = pilotsData?.data || [];
    
    // Apply client-side search filter
    if (searchTerm) {
      result = result.filter(pilot => 
        pilot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pilot.description && pilot.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply client-side status filter
    if (statusFilter !== 'all') {
      result = result.filter(pilot => pilot.status === statusFilter);
    }
    
    return result;
  }, [pilotsData, searchTerm, statusFilter]);

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  // Stats
  const stats = useMemo(() => {
    if (!filteredPilots) return null;

    const totalPilots = filteredPilots.length;
    const activePilots = filteredPilots.filter(p => p.status === 'active').length;
    const totalVolunteers = filteredPilots.reduce((sum, p) => sum + (p.volunteerCount || 0), 0);
    const totalActivities = filteredPilots.reduce((sum, p) => sum + (p.activityCount || 0), 0);
    const totalSchools = filteredPilots.reduce((sum, p) => sum + (p.schoolCount || 0), 0);

    return {
      totalPilots,
      activePilots,
      totalVolunteers,
      totalActivities,
      totalSchools,
    };
  }, [filteredPilots]);

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
        title="Unable to load pilot programs"
        onClose={() => refetch()}
      >
        There was an error loading pilot programs. Please try again.
      </Alert>
    );
  }

  const handleSearch = (query: string) => {
    setSearchTerm(query);
  };

  const handleFilterChange = (filters: Record<string, any>) => {
    if (filters.status) setStatusFilter(filters.status);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pilot Programs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all pilot programs in the system
          </p>
        </div>
        <Link
          href="/admin/pilots/new"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500 h-10 px-4 py-2"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Pilot
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Pilots</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalPilots}
                </p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Pilots</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {stats.activePilots}
                </p>
              </div>
              <PilotStatusBadge status="active" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Volunteers</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {stats.totalVolunteers}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <UserGroupIcon className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Activities</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {stats.totalActivities}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                <CalendarIcon className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Schools</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {stats.totalSchools}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                <BuildingOfficeIcon className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

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
            ]}
            placeholder="Search pilot programs by name or description..."
          />
        </div>
      </Card>

      {/* Pilots Table */}
      {filteredPilots.length > 0 ? (
        <Card>
          <DataTable
            data={filteredPilots}
            columns={columns}
            emptyMessage="No pilot programs found"
          />
        </Card>
      ) : (
        <EmptyState
          icon={<ChartBarIcon className="h-12 w-12 text-gray-400" />}
          title={searchTerm || statusFilter !== 'all' ? "No pilot programs found" : "No pilot programs yet"}
          description={
            searchTerm || statusFilter !== 'all'
              ? "Try adjusting your filters to find pilot programs."
              : "You haven't created any pilot programs yet."
          }
          action={
            !searchTerm && statusFilter === 'all'
              ? {
                  label: 'Create First Pilot',
                  onClick: () => window.location.href = '/admin/pilots/new',
                }
              : {
                  label: 'Clear Filters',
                  onClick: () => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  },
                }
          }
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedPilot(null);
        }}
        title="Delete Pilot Program"
        message={`Are you sure you want to delete "${selectedPilot?.name}"? This will also delete all associated data.`}
        confirmText="Delete Pilot"
        type="danger"
        onConfirm={handleDelete}
        loading={deleteMutation.status === 'pending'}
      />
    </div>
  );
}