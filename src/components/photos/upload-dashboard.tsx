'use client';

import React, { useState } from 'react';
import { Tabs } from '@/components/ui/tabs';
import { FileUpload } from './file-upload';
import { ChunkedFileUpload } from './chunked-upload';
import { EXIFUpload } from './exif-upload';
import { CompressedUpload } from './compressed-upload';
import { ResumeUpload } from './resume-upload';
import { PhotoGallery } from './photo-gallery';
import { Photo } from '@/lib/types';

interface UploadDashboardProps {
  activityId: string;
}

export const UploadDashboard: React.FC<UploadDashboardProps> = ({
  activityId,
}) => {
  const [activeTab, setActiveTab] = useState('standard');
  const [recentUploads, setRecentUploads] = useState<Photo[]>([]);

  const handleUploadComplete = (photos: Photo[]) => {
    setRecentUploads(prev => [...photos, ...prev].slice(0, 10));
  };

  const handleCompressedFiles = async (files: File[]) => {
    console.log('Compressed files ready:', files);
    
    // Upload each compressed file
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('activityId', activityId);
        
        const response = await fetch(`/api/activities/${activityId}/photos`, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
        
        return response.json();
      });
      
      await Promise.all(uploadPromises);
      console.log('All compressed files uploaded successfully');
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleEXIFFiles = (filesWithEXIF: Array<{ file: File; exif: any }>) => {
    console.log('Files with EXIF:', filesWithEXIF);
    
    // Upload files with EXIF data
    filesWithEXIF.forEach(async ({ file, exif }) => {
      try {
        // First upload the file
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('activityId', activityId);
        
        const uploadResponse = await fetch(`/api/activities/${activityId}/photos`, {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
        
        const uploadResult = await uploadResponse.json();
        
        // Then process EXIF data if available
        if (exif && uploadResult.id) {
          await fetch('/api/photos/process-exif', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              photoId: uploadResult.id,
              exifData: exif
            }),
          });
        }
        
        console.log(`Uploaded ${file.name} with EXIF data`);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
      }
    });
  };

  const handleResumeComplete = (fileId: string) => {
    console.log('Resume upload complete:', fileId);
    // Refresh the gallery or show success message
  };

  // Create tabs array for the custom Tabs component
  const tabs = [
    {
      id: 'standard',
      label: 'Standard Upload',
      content: (
        <div className="bg-white p-6 rounded-lg border">
          <FileUpload
            activityId={activityId}
            onUploadComplete={handleUploadComplete}
            maxFiles={20}
            showPreview={true}
          />
        </div>
      )
    },
    {
      id: 'large',
      label: 'Large Files',
      content: (
        <div className="bg-white p-6 rounded-lg border">
          <ChunkedFileUpload
            activityId={activityId}
            onComplete={handleResumeComplete}
            chunkSize={10} // 10MB chunks
          />
        </div>
      )
    },
    {
      id: 'smart',
      label: 'Smart Upload',
      content: (
        <div className="bg-white p-6 rounded-lg border">
          <CompressedUpload
            activityId={activityId}
            onUploadComplete={() => {
              console.log('Compressed upload complete');
              // Refresh gallery
            }}
            autoCompress={true}
            maxSizeBeforeCompress={2}
          />
        </div>
      )
    },
    {
      id: 'exif',
      label: 'EXIF Data',
      content: (
        <div className="bg-white p-6 rounded-lg border">
          <EXIFUpload 
            activityId={activityId}
            onUploadComplete={() => {
              console.log('EXIF upload complete');
              // Refresh gallery
            }}
          />
        </div>
      )
    },
    {
      id: 'resume',
      label: 'Resume Upload',
      content: (
        <div className="bg-white p-6 rounded-lg border">
          <ResumeUpload
            activityId={activityId}
            onUploadComplete={handleResumeComplete}
          />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Photo Upload Center</h1>
        <p className="text-gray-600">
          Choose the upload method that fits your needs
        </p>
      </div>

      {/* Main Tabs - Using custom Tabs component */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="underline"
        className="w-full"
      />

      {/* Recent Uploads Section */}
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">Recent Uploads</h2>
        <PhotoGallery
          activityId={activityId}
          selectable={true}
          onSelectionChange={(selectedIds) => {
            console.log('Selected photo IDs:', selectedIds);
          }}
        />
      </div>

      {/* Upload Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-semibold text-gray-700">Total Photos</h3>
          <p className="text-3xl font-bold mt-2">42</p>
          <p className="text-sm text-gray-500">Across all activities</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-semibold text-gray-700">Storage Used</h3>
          <p className="text-3xl font-bold mt-2">156 MB</p>
          <p className="text-sm text-gray-500">25% of quota</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-semibold text-gray-700">Approval Rate</h3>
          <p className="text-3xl font-bold mt-2">92%</p>
          <p className="text-sm text-gray-500">38 approved, 3 pending</p>
        </div>
      </div>
    </div>
  );
};