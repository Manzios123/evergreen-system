// app/[locale]/volunteer/photos/page.tsx
'use client'

import { UploadDashboard } from '@/components/photos/upload-dashboard';
import { PhotoGallery } from '@/components/photos/photo-gallery';
import { Card } from '@/components/ui/card';
import { Tabs } from '@/components/ui/tabs';
import { PhotoIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function VolunteerPhotosPage() {
  const [activeTab, setActiveTab] = useState<string>('gallery'); // Changed to string type

  const tabs = [
    {
      id: 'gallery',
      label: 'Photo Gallery',
      icon: <PhotoIcon className="h-5 w-5" />,
      content: (
        <PhotoGallery />
      ),
    },
    {
      id: 'upload',
      label: 'Upload Photos',
      icon: <CloudArrowUpIcon className="h-5 w-5" />,
      content: <UploadDashboard activityId="" />, // Pass empty string or get activityId from context
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Photo Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload and manage photos for your activities
        </p>
      </div>

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="underline"
      />
    </div>
  );
}