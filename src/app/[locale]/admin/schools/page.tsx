// app/[locale]/admin/schools/page.tsx
'use client';

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import DataTable from '@/components/ui/data-table';
import StatusBadge from '@/components/ui/status-badge';
import SearchFilter from '@/components/ui/search-filter';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import EmptyState from '@/components/ui/empty-state';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import Alert from '@/components/ui/alert';
import { useApiQuery, useApiMutation } from '@/lib/hooks/use-api';
import { School, ActivityStatus } from '@/lib/types';
import { api } from '@/lib/api';
import {
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  UserGroupIcon,
  CalendarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { useState, useMemo } from 'react';
import Link from 'next/link';

// Create an extended School type since the current one is missing properties
interface ExtendedSchool extends Omit<School, 'status'> {
  type?: string;
  contactPerson?: string;
  phone?: string;
  status?: 'active' | 'inactive' | string;
  pilotCount?: number;
  activityCount?: number;
}

export default function AdminSchoolsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedSchool, setSelectedSchool] = useState<ExtendedSchool | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch schools
  const { 
    data: schoolsData, 
    isLoading, 
    error, 
    refetch 
  } = useApiQuery<{ data: ExtendedSchool[]; count: number }>(
    ['schools', searchTerm, statusFilter, typeFilter],
    () => api.get('/schools', {
      search: searchTerm,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
    })
  );

  // Delete school mutation
  const deleteMutation = useApiMutation(
    (id: string) => api.delete(`/schools/${id}`)
  );

  const handleDelete = async () => {
    if (!selectedSchool) return;
    
    try {
      await deleteMutation.mutateAsync(selectedSchool.id);
      refetch();
      setShowDeleteDialog(false);
      setSelectedSchool(null);
    } catch (error) {
      console.error('Failed to delete school:', error);
    }
  };

  const columns = [
    {
      key: 'school',
      header: 'School',
      sortable: true,
      render: (school: ExtendedSchool) => (
        <div className="flex items-start">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 shrink-0">
            <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{school.name}</p>
            <p className="text-sm text-gray-500 mt-1">{school.address}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (school: ExtendedSchool) => (
        <div className="text-sm text-gray-900 capitalize">
          {school.type || 'Unknown'}
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (school: ExtendedSchool) => (
        <div>
          {school.contactPerson && (
            <p className="text-sm text-gray-900">{school.contactPerson}</p>
          )}
          {school.phone && (
            <div className="flex items-center mt-1">
              <PhoneIcon className="h-3 w-3 text-gray-400 mr-1" />
              <span className="text-sm text-gray-500">{school.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'stats',
      header: 'Statistics',
      render: (school: ExtendedSchool) => (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-sm font-medium text-gray-900">{school.pilotCount || 0}</p>
            <p className="text-xs text-gray-500">Pilots</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{school.activityCount || 0}</p>
            <p className="text-xs text-gray-500">Activities</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (school: ExtendedSchool) => {
        if (school.status === 'active') {
          return (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
              Active
            </span>
          );
        }
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            {school.status || 'Unknown'}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (school: ExtendedSchool) => (
        <div className="flex space-x-2">
          <Link href={`/admin/schools/${school.id}`} className="inline-flex">
            <Button
              size="sm"
              variant="ghost"
              icon={<EyeIcon className="h-4 w-4" />}
            >
              View
            </Button>
          </Link>
          <Link href={`/admin/schools/${school.id}/edit`} className="inline-flex">
            <Button
              size="sm"
              variant="ghost"
              icon={<PencilIcon className="h-4 w-4" />}
            >
              Edit
            </Button>
          </Link>
          <Button
            size="sm"
            variant="destructive"
            icon={<TrashIcon className="h-4 w-4" />}
            onClick={() => {
              setSelectedSchool(school);
              setShowDeleteDialog(true);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const filteredSchools = useMemo(() => {
    return schoolsData?.data || [];
  }, [schoolsData]);

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  // Type options
  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'elementary', label: 'Elementary School' },
    { value: 'middle', label: 'Middle School' },
    { value: 'high', label: 'High School' },
    { value: 'private', label: 'Private School' },
    { value: 'charter', label: 'Charter School' },
  ];

  // Stats
  const stats = useMemo(() => {
    if (!filteredSchools) return null;

    const totalSchools = filteredSchools.length;
    const activeSchools = filteredSchools.filter(s => s.status === 'active').length;
    const totalActivities = filteredSchools.reduce((sum, s) => sum + (s.activityCount || 0), 0);
    const totalPilots = filteredSchools.reduce((sum, s) => sum + (s.pilotCount || 0), 0);
    
    // Count by type
    const elementaryCount = filteredSchools.filter(s => s.type === 'elementary').length;
    const middleCount = filteredSchools.filter(s => s.type === 'middle').length;
    const highCount = filteredSchools.filter(s => s.type === 'high').length;

    return {
      totalSchools,
      activeSchools,
      totalActivities,
      totalPilots,
      elementaryCount,
      middleCount,
      highCount,
    };
  }, [filteredSchools]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mt-2 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-36 animate-pulse"></div>
        </div>
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        title="Unable to load schools"
      >
        <div className="space-y-2">
          <p>There was an error loading schools. Please try again.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            Try Again
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schools</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all schools in the system
          </p>
        </div>
        <Link href="/admin/schools/new">
          <Button
            variant="default"
            icon={<PlusIcon className="h-5 w-5" />}
          >
            Add School
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Schools</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalSchools}
                </p>
              </div>
              <BuildingOfficeIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Schools</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {stats.activeSchools}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                Active
              </span>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Activities</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {stats.totalActivities}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <CalendarIcon className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Elementary</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {stats.elementaryCount}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <BuildingOfficeIcon className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">High Schools</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {stats.highCount}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <BuildingOfficeIcon className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <div className="p-4">
          <div className="space-y-4">
            {/* Search Input */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search schools by name, address, or contact..."
                  className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <Button onClick={() => {}}>Search</Button>
            </div>

            {/* Filter Dropdowns */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:border-green-500 focus:ring-green-500"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:border-green-500 focus:ring-green-500"
                >
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Schools Table */}
      {filteredSchools.length > 0 ? (
        <Card>
          <DataTable
            data={filteredSchools}
            columns={columns}
            emptyMessage="No schools found"
          />
        </Card>
      ) : (
        <EmptyState
          icon={<BuildingOfficeIcon className="h-12 w-12 text-gray-400" />}
          title={searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? "No schools found" : "No schools yet"}
          description={
            searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? "Try adjusting your filters to find schools."
              : "You haven't added any schools to the system yet."
          }
          action={
            !searchTerm && statusFilter === 'all' && typeFilter === 'all'
              ? {
                  label: 'Add Your First School',
                  onClick: () => window.location.href = '/admin/schools/new',
                }
              : {
                  label: 'Clear Filters',
                  onClick: () => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setTypeFilter('all');
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
          setSelectedSchool(null);
        }}
        onConfirm={handleDelete}
        title="Delete School"
        message={`Are you sure you want to delete "${selectedSchool?.name}"? This action cannot be undone.`}
        confirmText="Delete School"
        cancelText="Cancel"
        type="danger"
        loading={deleteMutation.isPending} // Changed from isLoading to isPending
      />
    </div>
  );
}