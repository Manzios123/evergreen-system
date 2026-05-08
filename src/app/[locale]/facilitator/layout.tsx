'use client';

import RoleLayout from '@/components/layout/RoleLayout';

export default function FacilitatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleLayout role="facilitator">{children}</RoleLayout>;
}
