// app/[locale]/coordinator/users/page.tsx
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
import { User, Pilot } from '@/lib/types';
import { api } from '@/lib/api'; // Add this import
import {
  UserIcon,
  EnvelopeIcon,
  UserGroupIcon,
  CalendarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// Define Column interface for DataTable
interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

// Extended User type with additional properties from API
interface UserWithPilot extends User {
  pilot?: Pilot;
  status?: 'active' | 'inactive' | 'pending';
  name?: string;
}

// Define API response type to match backend
interface UsersApiResponse {
  users: UserWithPilot[];
  total: number;
  page: number;
  limit: number;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithPilot | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch users - Updated to expect UsersApiResponse type
  const { 
    data: usersData, 
    isLoading, 
    error, 
    refetch 
  } = useApiQuery<UsersApiResponse>(
    ['users', searchTerm, roleFilter, statusFilter],
    () => api.get('/users', {
      search: searchTerm,
      role: roleFilter !== 'all' ? roleFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    })
  );

  // Delete user mutation
  const deleteMutation = useApiMutation(
    (id: string) => api.delete(`/users/${id}`)
  );

  // Reset password mutation
  const resetPasswordMutation = useApiMutation(
    (id: string) => api.post(`/users/${id}/reset-password`)
  );

  const handleDelete = async () => {
    if (!selectedUser) return;
    
    try {
      await deleteMutation.mutateAsync(selectedUser.id);
      refetch();
      setShowDeleteDialog(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      await resetPasswordMutation.mutateAsync(userId);
      // Show success message
      alert('Password reset email sent successfully');
    } catch (error) {
      console.error('Failed to reset password:', error);
    }
  };

  const columns: Column<UserWithPilot>[] = [
    {
      key: 'user',
      header: 'User',
      sortable: true,
      render: (user: UserWithPilot) => (
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
            <span className="text-gray-600 font-medium text-sm">
              {(user.name || user.full_name || 'U').charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{user.name || user.full_name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (user: UserWithPilot) => (
        <div className="flex items-center">
          <UserGroupIcon className="h-4 w-4 text-gray-400 mr-2" />
          <span className="capitalize">{user.role}</span>
        </div>
      ),
    },
    {
      key: 'pilot',
      header: 'Pilot',
      render: (user: UserWithPilot) => (
        <div className="text-sm text-gray-900">
          {user.pilot?.name || 'System Admin'}
        </div>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      sortable: true,
      render: (user: UserWithPilot) => (
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm">
            {new Date(user.created_at).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (user: UserWithPilot) => (
        <div className="text-sm">
          {(user.status === 'active' || !user.status) ? (
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-0.5 text-sm font-medium text-green-800">
              Active
            </span>
          ) : user.status === 'inactive' ? (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-0.5 text-sm font-medium text-gray-800">
              Inactive
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-0.5 text-sm font-medium text-yellow-800">
              Pending
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user: UserWithPilot) => (
        <div className="flex space-x-2">
          <button
            onClick={() => router.push(`/coordinator/users/${user.id}`)}
            className="inline-flex items-center justify-center rounded-md h-8 px-3 text-xs hover:bg-gray-100 hover:text-gray-900 text-gray-700"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            View
          </button>
          <button
            onClick={() => router.push(`/coordinator/users/${user.id}/edit`)}
            className="inline-flex items-center justify-center rounded-md h-8 px-3 text-xs hover:bg-gray-100 hover:text-gray-900 text-gray-700"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Edit
          </button>
          <button
            onClick={() => handleResetPassword(user.id)}
            className="inline-flex items-center justify-center rounded-md h-8 px-3 text-xs hover:bg-gray-100 hover:text-gray-900 text-gray-700"
            disabled={resetPasswordMutation.isPending}
          >
            <KeyIcon className="h-4 w-4 mr-1" />
            Reset PW
          </button>
          {user.role !== 'admin' && (
            <button
              onClick={() => {
                setSelectedUser(user);
                setShowDeleteDialog(true);
              }}
              className="inline-flex items-center justify-center rounded-md h-8 px-3 text-xs bg-red-100 text-red-700 hover:bg-red-200"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  // Updated to use usersData?.users instead of usersData?.data
  const filteredUsers = useMemo(() => {
    return usersData?.users || [];
  }, [usersData]);

  // Role options
  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'admin', label: 'Administrator' },
    { value: 'coordinator', label: 'Coordinator' },
    { value: 'volunteer', label: 'Volunteer' },
  ];

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' },
  ];

  // Stats - Updated to use filteredUsers (which now uses usersData?.users)
  const stats = useMemo(() => {
    if (!filteredUsers) return null;

    const totalUsers = filteredUsers.length;
    const activeUsers = filteredUsers.filter(u => u.status === 'active' || !u.status).length;
    const admins = filteredUsers.filter(u => u.role === 'admin').length;
    const coordinators = filteredUsers.filter(u => u.role === 'coordinator').length;
    const volunteers = filteredUsers.filter(u => u.role === 'volunteer').length;

    return {
      totalUsers,
      activeUsers,
      admins,
      coordinators,
      volunteers,
    };
  }, [filteredUsers]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-36"></div>
        </div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Unable to load users</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>There was an error loading users. Please try again.</p>
            </div>
            <div className="mt-4">
              <button
                onClick={() => refetch()}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all system users and permissions
          </p>
        </div>
        <button
          onClick={() => router.push('/coordinator/users/new')}
          className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add User
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalUsers}
                </p>
              </div>
              <UserIcon className="h-8 w-8 text-gray-300" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Admins</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {stats.admins}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <KeyIcon className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Coordinators</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {stats.coordinators}
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
                <p className="text-sm font-medium text-gray-500">Volunteers</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {stats.volunteers}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {stats.activeUsers}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-0.5 text-sm font-medium text-green-800">
                Active
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <div className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search users by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
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
      </Card>

      {/* Users Table */}
      {filteredUsers.length > 0 ? (
        <Card>
          <DataTable
            data={filteredUsers}
            columns={columns}
            emptyMessage="No users found"
          />
        </Card>
      ) : (
        <EmptyState
          icon={<UserIcon className="h-12 w-12 text-gray-400" />}
          title={searchTerm || roleFilter !== 'all' || statusFilter !== 'all' ? "No users found" : "No users yet"}
          description={
            searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
              ? "Try adjusting your filters to find users."
              : "You haven't added any users to the system yet."
          }
          action={
            !searchTerm && roleFilter === 'all' && statusFilter === 'all'
              ? {
                  label: 'Add Your First User',
                  onClick: () => router.push('/coordinator/users/new'),
                }
              : {
                  label: 'Clear Filters',
                  onClick: () => {
                    setSearchTerm('');
                    setRoleFilter('all');
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
          setSelectedUser(null);
        }}
        title="Delete User"
        message={`Are you sure you want to delete "${selectedUser?.name || selectedUser?.full_name}"? This action cannot be undone.`}
        confirmText="Delete User"
        type="danger"
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}