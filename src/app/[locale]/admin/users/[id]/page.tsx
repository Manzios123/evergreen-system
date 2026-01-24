'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import { useApiQuery } from '@/lib/hooks/use-api';
import { api } from '@/lib/api';
import { User } from '@/lib/types';
import {
  ArrowLeftIcon,
  PencilIcon,
  UserIcon,
  EnvelopeIcon,
  UserGroupIcon,
  CalendarIcon,
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

// Extend User type for API response
interface UserApiResponse {
  user: User & {
    pilot_names?: string[];
    pilot_ids?: string[];
    school_names?: string[];
    school_ids?: string[];
    status?: 'active' | 'inactive' | 'pending';
    phone?: string;
  };
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [retryCount, setRetryCount] = useState(0);

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useApiQuery<UserApiResponse>(
    ['user', id, retryCount],
    () => api.get(`/users/${id}`)
  );

  const user = response?.user;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <Card className="p-6">
          <SkeletonLoader type="card" />
        </Card>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Users
          </Link>
        </div>
        <Alert type="error" title="Failed to load user">
          {error?.message || 'User not found'}
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setRetryCount((prev) => prev + 1);
                refetch();
              }}
            >
              Retry
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  const getStatusDisplay = (status?: string) => {
    if (!status || status === 'active') {
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
          <CheckCircleIcon className="h-4 w-4 mr-1.5" />
          Active
        </span>
      );
    }
    if (status === 'inactive') {
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
          <XCircleIcon className="h-4 w-4 mr-1.5" />
          Inactive
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
        <ClockIcon className="h-4 w-4 mr-1.5" />
        Pending
      </span>
    );
  };

  const getRoleDisplay = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getPilotDisplay = () => {
    if (user.role === 'admin') {
      return 'System Admin';
    }
    
    // Check if pilot name is available (from extended properties)
    if ((user as any).pilot_names && (user as any).pilot_names.length > 0) {
      return (user as any).pilot_names.join(', ');
    }
    
    // Check for pilot_id from base User type
    if (user.pilot_id) {
      return `Pilot ID: ${user.pilot_id}`;
    }
    
    // Check for pilot_ids from extended properties
    if ((user as any).pilot_ids && (user as any).pilot_ids.length > 0) {
      return `Pilot ID(s): ${(user as any).pilot_ids.join(', ')}`;
    }
    
    return '—';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Users
          </Link>
          <div className="h-6 w-px bg-gray-300 hidden sm:block" />
          <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/admin/users/${id}/edit`}>
            <Button variant="default" className="inline-flex items-center gap-2">
              <PencilIcon className="h-4 w-4" />
              Edit User
            </Button>
          </Link>
        </div>
      </div>

      {/* User Info Card */}
      <Card className="overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Header with name and status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-gray-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {user.full_name || (user as any).name || '—'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">ID: {user.id}</p>
              </div>
            </div>
            {getStatusDisplay((user as any).status)}
          </div>

          {/* User Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <EnvelopeIcon className="h-4 w-4" />
                Email
              </h3>
              <p className="text-gray-900">{user.email}</p>
            </div>

            {/* Role */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <UserGroupIcon className="h-4 w-4" />
                Role
              </h3>
              <p className="text-gray-900">{getRoleDisplay(user.role)}</p>
            </div>

            {/* Pilot */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <BuildingOfficeIcon className="h-4 w-4" />
                Pilot Assignment
              </h3>
              <p className="text-gray-900">{getPilotDisplay()}</p>
            </div>

            {/* Joined Date */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Joined
              </h3>
              <p className="text-gray-900">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(user.created_at).toLocaleTimeString()}
              </p>
            </div>

            {/* Updated Date */}
            {user.updated_at && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Last Updated
                </h3>
                <p className="text-gray-900">
                  {new Date(user.updated_at).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(user.updated_at).toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>

          {/* Additional Info (if available) */}
          {((user as any).phone || (user as any).school_names) && (
            <div className="pt-6 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(user as any).phone && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Phone
                    </h3>
                    <p className="text-gray-900">{(user as any).phone}</p>
                  </div>
                )}
                {(user as any).school_names && (user as any).school_names.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Schools
                    </h3>
                    <p className="text-gray-900">{(user as any).school_names.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}