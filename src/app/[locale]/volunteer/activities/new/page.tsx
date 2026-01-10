// app/[locale]/volunteer/activities/new/page.tsx
'use client';

import { ActivityForm } from '@/components/activities/activity-form';
import { Card } from '@/components/ui/card';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewActivityPage() {
  const router = useRouter();

  const handleSubmitSuccess = () => {
    router.push('/volunteer/activities');
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/volunteer/activities"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Activities
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Report New Activity</h1>
        <p className="mt-1 text-sm text-gray-500">
          Document a new volunteering activity you have completed
        </p>
      </div>

      <ActivityForm onSubmitSuccess={handleSubmitSuccess} />
    </div>
  );
}