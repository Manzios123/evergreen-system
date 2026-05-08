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
import { Pilot, School, User } from '@/lib/types';
import { pilotsApi } from '@/lib/api/pilots';
import { schoolsApi } from '@/lib/api/schools';
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

interface UpdateUserPayload {
  full_name: string;
  email: string;
  role: 'volunteer' | 'facilitator';
  pilot_ids?: string[];
  school_ids?: string[];
}

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const locale = (params.locale as string) || 'en';

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'volunteer' as 'volunteer' | 'facilitator',
    status: 'active' as 'active' | 'inactive' | 'pending',
    pilot_ids: [] as string[],
    school_ids: [] as string[],
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
  const selectedPilotIds = formData.pilot_ids;

  // Mutation for updating
  const updateUserMutation = useApiMutation(
    (data: UpdateUserPayload) => api.put(`/users/${id}`, data)
  );

  const {
    data: pilotsResponse,
    isLoading: isLoadingPilots,
    error: pilotsError,
  } = useApiQuery(
    ['pilots', 'coordinator-user-edit'],
    () => pilotsApi.getPilots({ isActive: true, limit: 100 })
  );

  const {
    data: schoolsResponse,
    isLoading: isLoadingSchools,
    error: schoolsError,
  } = useApiQuery(
    ['schools', 'coordinator-user-edit'],
    () => schoolsApi.getSchools({ isActive: true, limit: 100 })
  );

  const pilots: Pilot[] = pilotsResponse?.success && pilotsResponse.data ? pilotsResponse.data : [];
  const schools: School[] = schoolsResponse?.success && schoolsResponse.data ? schoolsResponse.data : [];

  const availableSchools = schools.filter((school) =>
    selectedPilotIds.length > 0 && school.pilot_id && selectedPilotIds.includes(String(school.pilot_id))
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
        role: (user.role === 'facilitator' ? 'facilitator' : 'volunteer') as 'volunteer' | 'facilitator',
        status: (user.status as 'active' | 'inactive' | 'pending') || 'active',
        pilot_ids: user.pilot_ids || (user.pilot_id ? [user.pilot_id] : []),
        school_ids: user.school_ids || [],
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

  const handleMultiSelectChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    field: 'pilot_ids' | 'school_ids'
  ) => {
    const values = Array.from(e.target.selectedOptions).map((option) => option.value);

    setFormData((prev) => {
      if (field === 'pilot_ids') {
        const allowedSchoolIds = schools
          .filter((school) => school.pilot_id && values.includes(String(school.pilot_id)))
          .map((school) => school.id);

        return {
          ...prev,
          pilot_ids: values,
          school_ids: prev.school_ids.filter((schoolId) => allowedSchoolIds.includes(schoolId)),
        };
      }

      return { ...prev, school_ids: values };
    });
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
    const payload: UpdateUserPayload = {
      full_name: formData.full_name,
      email: formData.email,
      role: formData.role,
      pilot_ids: formData.pilot_ids,
      school_ids: formData.school_ids,
    };

    // Note: We cannot include 'status' in payload as it's not in the User type
    // If backend supports status updates, we would need a different endpoint or payload structure

    updateUser(payload, {
      onSuccess: () => {
        alert('User updated successfully!');
        router.push(`/${locale}/coordinator/volunteers/${id}`);
      },
    });
  };

  const handleCancel = () => {
    router.push(`/${locale}/coordinator/volunteers/${id}`);
  };

  const displayName = user?.full_name || user?.email || id;

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
            href={`/${locale}/coordinator/volunteers/${id}`}
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
            href={`/${locale}/coordinator/volunteers/${id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to User
          </Link>
          <div className="h-6 w-px bg-gray-300 hidden sm:block" />
          <h1 className="text-2xl font-bold text-gray-900">Edit {displayName}</h1>
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
              <option value="volunteer">Volunteer</option>
              <option value="facilitator">Facilitator</option>
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

          {/* Pilot Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilot Assignment
            </label>
            {pilotsError ? (
              <Alert type="error" title="Unable to load pilots">
                Pilot options could not be loaded. Please try again before saving assignment changes.
              </Alert>
            ) : isLoadingPilots ? (
              <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-500">
                Loading pilots...
              </div>
            ) : pilots.length === 0 ? (
              <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-500">
                No pilots available for assignment.
              </div>
            ) : (
              <select
                multiple
                name="pilot_ids"
                value={formData.pilot_ids}
                onChange={(e) => handleMultiSelectChange(e, 'pilot_ids')}
                className="w-full min-h-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {pilots.map((pilot) => (
                  <option key={pilot.id} value={pilot.id}>
                    {pilot.name}
                  </option>
                ))}
              </select>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Select by pilot name. Use Ctrl or Cmd to select more than one.
            </p>
          </div>

          {/* School Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              School Assignment
            </label>
            {schoolsError ? (
              <Alert type="error" title="Unable to load schools">
                School options could not be loaded. Please try again before saving assignment changes.
              </Alert>
            ) : isLoadingSchools ? (
              <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-500">
                Loading schools...
              </div>
            ) : selectedPilotIds.length === 0 ? (
              <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-500">
                Select a pilot first to see available schools.
              </div>
            ) : availableSchools.length === 0 ? (
              <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-500">
                No schools available for this pilot.
              </div>
            ) : (
              <select
                multiple
                name="school_ids"
                value={formData.school_ids}
                onChange={(e) => handleMultiSelectChange(e, 'school_ids')}
                className="w-full min-h-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {availableSchools.map((school) => {
                  const pilot = pilots.find((item) => item.id === school.pilot_id);

                  return (
                    <option key={school.id} value={school.id}>
                      {school.name}{pilot ? ` (${pilot.name})` : ''}
                    </option>
                  );
                })}
              </select>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Select by school name. Use Ctrl or Cmd to select more than one.
            </p>
          </div>

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
