// app/[locale]/coordinator/schools/page.tsx
'use client';

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import DataTable from '@/components/ui/data-table';
import SearchFilter from '@/components/ui/search-filter';
import EmptyState from '@/components/ui/empty-state';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import Alert from '@/components/ui/alert';
import { useApiQuery } from '@/lib/hooks/use-api';
import { School } from '@/lib/types';
import {
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  AcademicCapIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  CalendarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Import the API
import { api } from '@/lib/api/api';

export default function CoordinatorSchoolsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  
  const { data: schoolsData, isLoading, error, refetch } = useApiQuery<{
    data: School[];
    count: number;
  }>(
    ['schools', searchTerm],
    () => api.get('/schools', { search: searchTerm })
  );

  const handleSearch = (query: string) => {
    setSearchTerm(query);
  };

  const columns = [
    {
      key: 'name',
      header: 'School',
      render: (school: School) => {
        // Cast to any to access potentially missing properties
        const schoolAny = school as any;
        
        return (
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <AcademicCapIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{school.name}</p>
              {schoolAny.type && (
                <p className="text-sm text-gray-500">{schoolAny.type}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'address',
      header: 'Address',
      render: (school: School) => (
        <div className="flex items-center">
          <MapPinIcon className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
          <span className="text-sm">
            {school.address || 'No address provided'}
          </span>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (school: School) => {
        const schoolAny = school as any;
        
        return (
          <div>
            {schoolAny.contactPerson && (
              <p className="text-sm text-gray-900">{schoolAny.contactPerson}</p>
            )}
            {schoolAny.phone && (
              <div className="flex items-center mt-1">
                <PhoneIcon className="h-3 w-3 text-gray-400 mr-1" />
                <span className="text-sm text-gray-500">{schoolAny.phone}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'activities',
      header: 'Activities',
      render: (school: School) => {
        const schoolAny = school as any;
        
        return (
          <div>
            <p className="font-medium text-gray-900">{schoolAny.activityCount || 0}</p>
            <p className="text-sm text-gray-500">activities</p>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (school: School) => {
        const schoolAny = school as any;
        const status = schoolAny.status || 'active';
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {status === 'active' ? 'Active' : 'Inactive'}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (school: School) => (
        <div className="flex space-x-2">
          <Link href={`/coordinator/schools/${school.id}`}>
            <Button
              size="sm"
              variant="ghost"
              icon={<EyeIcon className="h-4 w-4" />}
            >
              View
            </Button>
          </Link>
          <Link href={`/coordinator/schools/${school.id}/edit`}>
            <Button
              size="sm"
              variant="ghost"
              icon={<PencilIcon className="h-4 w-4" />}
            >
              Edit
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-64 mt-2 animate-pulse" />
          </div>
          <div className="h-10 bg-gray-200 rounded w-36 animate-pulse" />
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
        title="Unable to load schools"
      >
        <p className="mb-2">There was an error loading schools. Please try again.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
        >
          Try Again
        </Button>
      </Alert>
    );
  }

  const schools = schoolsData?.data || [];

  // Calculate statistics
  const activeSchools = schools.filter(s => {
    const schoolAny = s as any;
    return (schoolAny.status || 'active') === 'active';
  }).length;

  const totalActivities = schools.reduce((sum, school) => {
    const schoolAny = school as any;
    return sum + (schoolAny.activityCount || 0);
  }, 0);

  const avgVolunteers = schools.length > 0
    ? Math.round(
        schools.reduce((sum, school) => {
          const schoolAny = school as any;
          return sum + (schoolAny.volunteerCount || 0);
        }, 0) / schools.length
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schools</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage schools in your pilot program
          </p>
        </div>
        <Link href="/coordinator/schools/new">
          <Button
            variant="default"
            icon={<PlusIcon className="h-5 w-5" />}
          >
            Add School
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Schools</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {schoolsData?.count || 0}
              </p>
            </div>
            <BuildingOfficeIcon className="h-8 w-8 text-gray-300" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {activeSchools}
              </p>
            </div>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <AcademicCapIcon className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Activities This Month</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {totalActivities}
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
              <p className="text-sm font-medium text-gray-500">Avg. Volunteers</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {avgVolunteers}
              </p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-gray-300" />
          </div>
        </Card>
      </div>

      {/* Search - Just use a simple input since SearchFilter doesn't have showFilters */}
      <Card>
        <div className="p-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search schools by name, address, or contact..."
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              />
            </div>
            <Button onClick={() => handleSearch(searchTerm)}>
              Search
            </Button>
          </div>
        </div>
      </Card>

      {/* Schools Table */}
      {schools.length > 0 ? (
        <Card>
          <DataTable
            data={schools}
            columns={columns}
          />
        </Card>
      ) : (
        <EmptyState
          icon={<BuildingOfficeIcon className="h-12 w-12 text-gray-400" />}
          title={searchTerm ? "No schools found" : "No schools yet"}
          description={
            searchTerm
              ? "Try adjusting your search to find schools."
              : "You haven't added any schools to your pilot program yet."
          }
          action={
            !searchTerm
              ? {
                  label: 'Add Your First School',
                  onClick: () => router.push('/coordinator/schools/new'),
                }
              : {
                  label: 'Clear Search',
                  onClick: () => setSearchTerm(''),
                }
          }
        />
      )}
    </div>
  );
}