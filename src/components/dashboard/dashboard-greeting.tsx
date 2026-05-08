'use client';

interface DashboardGreetingProps {
  name?: string | null;
  fallback: string;
  className?: string;
}

function getDisplayName(name: string | null | undefined, fallback: string) {
  const trimmed = name?.trim();
  if (!trimmed) return fallback;
  return trimmed.split(/\s+/)[0] || fallback;
}

function getGreeting(date = new Date()) {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardGreeting({ name, fallback, className }: DashboardGreetingProps) {
  return (
    <h1 className={className || 'text-2xl font-bold text-gray-900'}>
      {getGreeting()}, {getDisplayName(name, fallback)}
    </h1>
  );
}
