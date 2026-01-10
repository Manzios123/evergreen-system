// app/[locale]/volunteer/activities/[id]/edit/page.tsx
'use client';

import { ActivityForm } from '@/components/activities/activity-form';
import { Card } from '@/components/ui/card';
import Alert from '@/components/ui/alert';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import { useApiQuery } from '@/lib/hooks/use-api';
import { Activity } from '@/lib/types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/api'; // Added import

interface ActivityEditPageProps {
  params: {
    id: string;
  };
}

export default function ActivityEditPage({ params }: ActivityEditPageProps) {
  const router = useRouter();
  
  const { data: activity, isLoading, error } = useApiQuery<Activity>(
    ['activity', params.id],
    () => api.get(`/activities/${params.id}`), // Fixed API call
    {
      enabled: !!params.id,
    }
  );

  const handleSubmitSuccess = () => {
    router.push(`/volunteer/activities/${params.id}`);
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <SkeletonLoader type="card" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert
          type="error"
          title="Unable to load activity"
        >
          <p className="mt-2">The activity could not be loaded. You may not have permission to edit it, or it may have been deleted.</p>
          <div className="mt-4">
            <Link href="/volunteer/activities" className="inline-flex items-center text-sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Activities
            </Link>
          </div>
        </Alert>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert
          type="error"
          title="Activity not found"
        >
          <p className="mt-2">The requested activity does not exist.</p>
          <div className="mt-4">
            <Link href="/volunteer/activities" className="inline-flex items-center text-sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Activities
            </Link>
          </div>
        </Alert>
      </div>
    );
  }

  if (activity.status !== 'draft') {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert
          type="warning"
          title="Cannot edit activity"
        >
          <p className="mt-2">Only activities in 'draft' status can be edited. Please contact your coordinator if you need to make changes.</p>
          <div className="mt-4">
            <Link href={`/volunteer/activities/${activity.id}`} className="inline-flex items-center text-sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              View Activity
            </Link>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/volunteer/activities/${activity.id}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Activity
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Activity</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update the details of your volunteering activity
        </p>
      </div>

      <ActivityForm
        activity={activity}
        onSubmitSuccess={handleSubmitSuccess}
      />
    </div>
  );
}