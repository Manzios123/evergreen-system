'use client';

interface DashboardGreetingProps {
  name?: string | null;
  email?: string | null;
  role?: string | null;
  fallback?: string;
  className?: string;
}

function getRoleLabel(role?: string | null) {
  if (!role) return '';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function getDisplayName(
  name: string | null | undefined,
  email: string | null | undefined,
  role: string | null | undefined,
  fallback?: string
) {
  const trimmed = name?.trim();
  if (trimmed) return trimmed.split(/\s+/)[0] || trimmed;

  const emailValue = email?.trim();
  if (emailValue) return emailValue;

  return getRoleLabel(role) || fallback || 'User';
}

function getGreeting(date = new Date()) {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardGreeting({ name, email, role, fallback, className }: DashboardGreetingProps) {
  return (
    <h1 className={className || 'text-2xl font-bold text-gray-900'}>
      {getGreeting()}, {getDisplayName(name, email, role, fallback)}
    </h1>
  );
}
