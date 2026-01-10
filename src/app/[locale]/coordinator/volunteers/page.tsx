// app/[locale]/coordinator/volunteers/page.tsx

'use client'

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import DataTable from '@/components/ui/data-table';
import StatusBadge from '@/components/ui/status-badge';
import SearchFilter from '@/components/ui/search-filter';
import EmptyState from '@/components/ui/empty-state';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import Alert from '@/components/ui/alert';
import { useApiQuery } from '@/lib/hooks/use-api';
import { User } from '@/lib/types';
import { api } from '@/lib/api/api';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ChartBarIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CoordinatorVolunteersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // 添加防抖效果
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms 防抖

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: volunteersData, isLoading, error, refetch } = useApiQuery<{
    data: User[];
    count: number;
  }>(
    ['volunteers', debouncedSearchTerm],
    () => api.get('/users', { role: 'volunteer', search: debouncedSearchTerm })
  );

  const columns = [
    {
      key: 'name',
      header: 'Volunteer',
      sortable: true,
      render: (volunteer: User) => (
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
            <span className="text-green-600 font-semibold">
              {volunteer.full_name?.charAt(0) || 'V'}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{volunteer.full_name}</p>
            <p className="text-sm text-gray-500">{volunteer.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (volunteer: User) => (
        <div>
          <div className="flex items-center">
            <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm">{volunteer.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      sortable: true,
      render: (volunteer: User) => (
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
          <span>
            {volunteer.created_at
              ? new Date(volunteer.created_at).toLocaleDateString()
              : 'Unknown'}
          </span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (volunteer: User) => (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
          {volunteer.role}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (volunteer: User) => (
        <div className="flex space-x-2">
          <Link href={`/coordinator/volunteers/${volunteer.id}`}>
            <Button size="sm" variant="outline">
              View Profile
            </Button>
          </Link>
          <Link href={`/coordinator/volunteers/${volunteer.id}/activities`}>
            <Button size="sm" variant="outline">
              View Activities
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

  if (error) {
    return (
      <Alert
        title="Unable to load volunteers"
        type="error"
      >
        There was an error loading volunteers. Please try again.
        <div className="mt-4">
          <Button variant="outline" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      </Alert>
    );
  }

  const volunteers = volunteersData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Volunteers</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage volunteers in your pilot program
          </p>
        </div>
        <Link href="/coordinator/volunteers/invite">
          <Button
            variant="default"
            icon={<UserPlusIcon className="h-5 w-5" />}
          >
            Invite Volunteer
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Volunteers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {volunteersData?.count || 0}
              </p>
            </div>
            <UserIcon className="h-8 w-8 text-gray-300" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Volunteers</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {volunteers.filter(v => v.role === 'volunteer').length}
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
              Volunteer
            </span>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Coordinators</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {volunteers.filter(v => v.role === 'coordinator').length}
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              Coordinator
            </span>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Admins</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {volunteers.filter(v => v.role === 'admin').length}
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
              Admin
            </span>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="p-4">
          <SearchFilter
            placeholder="Search volunteers by name or email..."
            onSearch={(query) => setSearchTerm(query)}
          />
        </div>
      </Card>

      {/* Volunteers Table */}
      {volunteers.length > 0 ? (
        <Card>
          <DataTable
            data={volunteers}
            columns={columns}
            onRowClick={(volunteer) => window.location.href = `/coordinator/volunteers/${volunteer.id}`}
          />
        </Card>
      ) : (
        <EmptyState
          icon={<UserIcon className="h-12 w-12 text-gray-400" />}
          title={searchTerm ? "No volunteers found" : "No volunteers yet"}
          description={
            searchTerm
              ? "Try adjusting your search to find volunteers."
              : "You haven't added any volunteers to your pilot program yet."
          }
          action={
            !searchTerm
              ? {
                  label: 'Invite Your First Volunteer',
                  onClick: () => window.location.href = '/coordinator/volunteers/invite',
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