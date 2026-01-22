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
import { School, SchoolContact } from '@/lib/types';
import { schoolsApi } from '@/lib/api/schools';
import {
  BuildingOfficeIcon,
  MapPinIcon,
  UsersIcon,
  CalendarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider'; // Fixed import path

export default function AdminSchoolsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('active');
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [primaryContacts, setPrimaryContacts] = useState<Record<string, SchoolContact | null>>({});

  const { user } = useAuth();

  // Fix: Update the useApiQuery to return the correct type
  const { 
    data: schoolsResponse, 
    isLoading, 
    error, 
    refetch 
  } = useApiQuery<{ data: School[]; count: number }>(
    ['schools', searchTerm, activeFilter],
    async () => {
      const response = await schoolsApi.getSchools({
        search: searchTerm,
        isActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
        limit: 100
      });
      
      // Transform the response to match the expected type
      return {
        data: response.data || [],
        count: response.data?.length || 0
      };
    }
  );

  // Delete school mutation
  const deleteMutation = useApiMutation(
    (id: string) => schoolsApi.deleteSchool(id)
  );

  // Fetch primary contacts for each school
  useEffect(() => {
    const fetchContacts = async () => {
      if (!schoolsResponse?.data) return;
      
      const contacts: Record<string, SchoolContact | null> = {};
      for (const school of schoolsResponse.data) {
        try {
          const primaryContact = await schoolsApi.getPrimaryContact(school.id);
          contacts[school.id] = primaryContact;
        } catch (error) {
          contacts[school.id] = null;
        }
      }
      setPrimaryContacts(contacts);
    };

    fetchContacts();
  }, [schoolsResponse]);

  const handleDelete = async () => {
    if (!selectedSchool || !selectedSchool.id) return;
    
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
      render: (school: School) => (
        <div className="flex items-start">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 shrink-0">
            <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 truncate">{school.name}</p>
            {school.address && (
              <div className="flex items-center mt-1 text-sm text-gray-500">
                <MapPinIcon className="h-3 w-3 mr-1" />
                <span className="truncate">{school.address}</span>
              </div>
            )}
            {(school.province || school.district) && (
              <p className="text-xs text-gray-500 mt-1">
                {[school.district, school.province].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Primary Contact',
      render: (school: School) => {
        const contact = primaryContacts[school.id];
        if (!contact) {
          return <span className="text-sm text-gray-400">No contact</span>;
        }
        return (
          <div className="space-y-1">
            <p className="text-sm text-gray-900">{contact.name}</p>
            {contact.email && (
              <div className="flex items-center text-xs text-gray-500">
                <EnvelopeIcon className="h-3 w-3 mr-1" />
                <span className="truncate">{contact.email}</span>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center text-xs text-gray-500">
                <PhoneIcon className="h-3 w-3 mr-1" />
                <span>{contact.phone}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (school: School) => (
        <div className="flex items-center">
          {school.is_active ? (
            <>
              <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-700">Active</span>
            </>
          ) : (
            <>
              <XCircleIcon className="h-4 w-4 text-gray-400 mr-1" />
              <span className="text-sm text-gray-500">Inactive</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (school: School) => (
        <div className="flex space-x-1">
          <Link href={`/admin/schools/${school.id}`} className="inline-flex">
            <Button
              size="sm"
              variant="ghost"
              icon={<EyeIcon className="h-4 w-4" />}
              title="View details"
            />
          </Link>
          <Link href={`/admin/schools/${school.id}/edit`} className="inline-flex">
            <Button
              size="sm"
              variant="ghost"
              icon={<PencilIcon className="h-4 w-4" />}
              title="Edit school"
            />
          </Link>
          <Button
            size="sm"
            variant="destructive"
            icon={<TrashIcon className="h-4 w-4" />}
            onClick={() => {
              setSelectedSchool(school);
              setShowDeleteDialog(true);
            }}
            title="Delete school"
          />
        </div>
      ),
    },
  ];

  const schools = useMemo(() => {
    return schoolsResponse?.data || [];
  }, [schoolsResponse]);

  // Status options - simplified to use actual schema
  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'all', label: 'All' },
  ];

  // Stats based on actual data
  const stats = useMemo(() => {
    if (!schools) return null;

    const totalSchools = schools.length;
    const activeSchools = schools.filter(s => s.is_active).length;
    const schoolsWithContacts = schools.filter(s => primaryContacts[s.id]).length;
    
    // Count by province
    const provinces = schools.reduce((acc, school) => {
      const province = school.province || 'Unknown';
      acc[province] = (acc[province] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topProvince = Object.entries(provinces).sort((a, b) => b[1] - a[1])[0] || ['None', 0];

    return {
      totalSchools,
      activeSchools,
      inactiveSchools: totalSchools - activeSchools,
      schoolsWithContacts,
      topProvince: topProvince[1],
      topProvinceName: topProvince[0],
    };
  }, [schools, primaryContacts]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
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
        <Link href="/en/admin/schools/new">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <CheckCircleIcon className="h-8 w-8 text-green-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">With Contacts</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {stats.schoolsWithContacts}
                </p>
              </div>
              <UsersIcon className="h-8 w-8 text-blue-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Top Province</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {stats.topProvince}
                </p>
                <p className="text-xs text-gray-500 truncate">{stats.topProvinceName}</p>
              </div>
              <MapPinIcon className="h-8 w-8 text-purple-300" />
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
                  placeholder="Search schools by name, address, province, or district..."
                  className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <Button onClick={() => refetch()}>Search</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setActiveFilter('active');
                }}
              >
                Clear
              </Button>
            </div>

            {/* Filter Dropdown */}
            <div className="flex gap-4">
              <div className="w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:border-green-500 focus:ring-green-500"
                >
                  {statusOptions.map((option) => (
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
      {schools.length > 0 ? (
        <Card>
          <DataTable
            data={schools}
            columns={columns}
            emptyMessage="No schools found"
          />
        </Card>
      ) : (
        <EmptyState
          icon={<BuildingOfficeIcon className="h-12 w-12 text-gray-400" />}
          title={searchTerm || activeFilter !== 'all' ? "No schools found" : "No schools yet"}
          description={
            searchTerm || activeFilter !== 'all'
              ? "Try adjusting your search or filters to find schools."
              : "You haven't added any schools to the system yet."
          }
          action={
            !searchTerm && activeFilter === 'active'
              ? {
                  label: 'Add Your First School',
                  onClick: () => window.location.href = '/admin/schools/new',
                }
              : {
                  label: 'Clear Filters',
                  onClick: () => {
                    setSearchTerm('');
                    setActiveFilter('active');
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
        title="Archive School"
        message={`Are you sure you want to archive "${selectedSchool?.name}"? This will mark it as inactive but preserve all data.`}
        confirmText="Archive School"
        cancelText="Cancel"
        type="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}