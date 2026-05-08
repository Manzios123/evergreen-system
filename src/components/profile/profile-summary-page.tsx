'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Button from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import { usersApi } from '@/lib/api/users';
import { useApiQuery } from '@/lib/hooks/use-api';
import { useAuth } from '@/components/providers/AuthProvider';
import { UserCircleIcon } from '@heroicons/react/24/outline';

type ProfileRole = 'admin' | 'coordinator' | 'volunteer' | 'facilitator';

interface ProfileSummaryPageProps {
  role: ProfileRole;
}

function formatList(value?: string[]) {
  return value && value.length > 0 ? value.join(', ') : 'Not assigned';
}

function formatStatus(value?: boolean) {
  if (value === undefined) return 'Unknown';
  return value ? 'Active' : 'Inactive';
}

export default function ProfileSummaryPage({ role }: ProfileSummaryPageProps) {
  const { refreshUser } = useAuth();
  const { data, isLoading, error, refetch } = useApiQuery(
    ['profile', role],
    () => usersApi.getMe()
  );

  const user = data?.user;
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  if (isLoading) {
    return <SkeletonLoader type="form" rows={5} />;
  }

  if (error || !user) {
    return (
      <EmptyState
        icon={<UserCircleIcon className="h-12 w-12 text-gray-400" />}
        title="Unable to load profile"
        description="There was a problem loading your profile. Please try again."
        action={{
          label: 'Retry',
          onClick: () => window.location.reload(),
        }}
      />
    );
  }

  const displayRole = user.role || role;

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileError(null);
    setProfileMessage(null);

    if (!profileForm.full_name.trim()) {
      setProfileError('Full name is required.');
      return;
    }

    if (!profileForm.email.trim() || !profileForm.email.includes('@')) {
      setProfileError('A valid email address is required.');
      return;
    }

    setIsSavingProfile(true);
    try {
      await usersApi.updateMe({
        full_name: profileForm.full_name.trim(),
        email: profileForm.email.trim(),
      });
      setProfileMessage('Profile updated successfully.');
      refetch();
      refreshUser();
    } catch (err: any) {
      setProfileError(err?.message || 'Unable to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (!passwordForm.current_password) {
      setPasswordError('Current password is required.');
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await usersApi.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordMessage('Password changed successfully.');
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (err: any) {
      setPasswordError(err?.message || 'Unable to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          View your account details and current assignments.
        </p>
      </div>

      <Card>
        <CardHeader
          title={user.full_name || 'Unnamed user'}
          subtitle={user.email || 'No email available'}
        />
        <CardContent>
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.full_name || 'Not provided'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.email || 'Not provided'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.phone || 'Not provided'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">{displayRole}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Account status</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatStatus(user.is_active)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Pilots</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatList(user.pilot_names)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Schools</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatList(user.school_names)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Update Profile"
          subtitle="Edit safe account details. Role and assignments are managed separately."
        />
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {profileError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{profileError}</div>
            )}
            {profileMessage && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{profileMessage}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full name
              </label>
              <input
                type="text"
                value={profileForm.full_name}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, full_name: event.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <Button type="submit" variant="default" disabled={isSavingProfile}>
              {isSavingProfile ? 'Saving...' : 'Save Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Change Password"
          subtitle="Use your current password to choose a new one."
        />
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {passwordError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{passwordError}</div>
            )}
            {passwordMessage && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{passwordMessage}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current password
              </label>
              <input
                type="password"
                value={passwordForm.current_password}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, current_password: event.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New password
              </label>
              <input
                type="password"
                value={passwordForm.new_password}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, new_password: event.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm new password
              </label>
              <input
                type="password"
                value={passwordForm.confirm_password}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirm_password: event.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <Button type="submit" variant="default" disabled={isChangingPassword}>
              {isChangingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
