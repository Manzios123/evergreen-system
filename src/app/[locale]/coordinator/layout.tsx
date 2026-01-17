// app/[locale]/coordinator/layout.tsx
'use client'; // Add this

import { useAuth } from '@/components/providers/AuthProvider';
import RoleLayout from '@/components/layout/RoleLayout';

export default function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Check if user has the correct role
  if (!user || user.role !== 'coordinator') {
    // The RoleLayout will handle redirection
    return <RoleLayout role="coordinator">{children}</RoleLayout>;
  }

  return <RoleLayout role="coordinator">{children}</RoleLayout>;
}