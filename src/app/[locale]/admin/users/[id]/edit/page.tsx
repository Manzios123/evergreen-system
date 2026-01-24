'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import { useApiQuery, useApiMutation } from '@/lib/hooks/use-api';
import { api } from '@/lib/api';
import { User } from '@/lib/types';
import { ArrowLeftIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

// Extended User type for API response and form
interface ExtendedUser extends User {
  pilot_names?: string[];
  pilot_ids?: string[];
  school_names?: string[];
  school_ids?: string[];
  status?: 'active' | 'inactive' | 'pending';
  phone?: string;
}

interface UserApiResponse {
  user: ExtendedUser;
}

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'volunteer' as 'admin' | 'coordinator' | 'volunteer',
    status: 'active' as 'active' | 'inactive' | 'pending',
    pilot_id: '',
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch user data
  const {
    data: response,
    isLoading,
    error: fetchError,
  } = useApiQuery<UserApiResponse>(
    ['user', id, 'edit'],
    () => api.get(`/users/${id}`)
  );

  const user = response?.user;

  // Mutation for updating
  const updateUserMutation = useApiMutation(
    (data: Partial<User>) => api.put(`/users/${id}`, data)
  );

  const { mutate: updateUser } = updateUserMutation;
  const isSubmitting = updateUserMutation.isPending;
  const submitError = updateUserMutation.error;

  // Prefill form when data loads
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        role: (user.role as 'admin' | 'coordinator' | 'volunteer') || 'volunteer',
        status: (user.status as 'active' | 'inactive' | 'pending') || 'active',
        pilot_id: user.pilot_id || '',
      });
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      errors.full_name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!formData.email.includes('@')) {
      errors.email = 'Email must be valid';
    }

    if (!formData.role) {
      errors.role = 'Role is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Prepare payload - only send fields we're editing
    const payload: Partial<User> = {
      full_name: formData.full_name,
      email: formData.email,
      role: formData.role,
    };

    // Only include pilot_id if not admin
    if (formData.role !== 'admin' && formData.pilot_id) {
      payload.pilot_id = formData.pilot_id;
    } else if (formData.role === 'admin') {
      // Clear pilot_id for admins
      payload.pilot_id = '';
    }

    // Note: We cannot include 'status' in payload as it's not in the User type
    // If backend supports status updates, we would need a different endpoint or payload structure

    updateUser(payload, {
      onSuccess: () => {
        alert('User updated successfully!');
        router.push(`/admin/users/${id}`);
      },
    });
  };

  const handleCancel = () => {
    router.push(`/admin/users/${id}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <Card className="p-6">
          <SkeletonLoader type="form" rows={4} />
        </Card>
      </div>
    );
  }

  if (fetchError || !user) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/users/${id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to User
          </Link>
        </div>
        <Alert type="error" title="Failed to load user">
          {fetchError?.message || 'User not found'}
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/users/${id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to User
          </Link>
          <div className="h-6 w-px bg-gray-300 hidden sm:block" />
          <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
        </div>
      </div>

      {/* Submit error */}
      {submitError && (
        <Alert type="error" title="Failed to update user">
          {submitError.message}
        </Alert>
      )}

      {/* Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                formErrors.full_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter full name"
            />
            {formErrors.full_name && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <ExclamationCircleIcon className="h-4 w-4" />
                {formErrors.full_name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                formErrors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter email address"
            />
            {formErrors.email && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <ExclamationCircleIcon className="h-4 w-4" />
                {formErrors.email}
              </p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="admin">Administrator</option>
              <option value="coordinator">Coordinator</option>
              <option value="volunteer">Volunteer</option>
            </select>
            {formErrors.role && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <ExclamationCircleIcon className="h-4 w-4" />
                {formErrors.role}
              </p>
            )}
          </div>

          {/* Status (only if exists in original user) - Read only display */}
          {user.status !== undefined && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status (Read-only)
              </label>
              <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                <span className="capitalize">{user.status}</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Status cannot be edited through this form. Contact system administrator to change user status.
              </p>
            </div>
          )}

          {/* Pilot ID (only for non-admins) */}
          {formData.role !== 'admin' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilot ID (Optional)
              </label>
              <input
                type="text"
                name="pilot_id"
                value={formData.pilot_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter pilot ID"
              />
              <p className="mt-1 text-sm text-gray-500">
                Assign this user to a specific pilot. Leave empty for no pilot assignment.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> Administrators are not assigned to specific pilots and have system-wide access.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}