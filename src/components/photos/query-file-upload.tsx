'use client';

import React from 'react';
import { usePhotos, usePresignedUpload, useBatchPhotoOperations } from '@/lib/hooks/use-photos';
import { FileUpload } from './file-upload';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';
import { Photo } from '@/lib/types';

interface QueryFileUploadProps {
  activityId: string;
  onUploadComplete?: (photos: Photo[]) => void;
  className?: string;
}

export const QueryFileUpload: React.FC<QueryFileUploadProps> = ({
  activityId,
  onUploadComplete,
  className,
}) => {
  const { data: photosData, isLoading, error } = usePhotos({ activityId });
  const { mutate: uploadFile, isPending: isUploading } = usePresignedUpload();
  const { deletePhotos } = useBatchPhotoOperations();
  
  const handleUploadComplete = async (uploadedFiles: { id: string; file: File }[]) => {
    try {
      const uploadPromises = uploadedFiles.map(({ file }) =>
        uploadFile(
          { file, activityId },
          {
            onSuccess: (fileId) => {
              console.log('Uploaded file ID:', fileId);
            },
          }
        )
      );
      
      await Promise.all(uploadPromises);
      
      if (onUploadComplete) {
        // Fetch updated photos list
        // This would ideally be handled by React Query automatically
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };
  
  const handleDeleteSelected = (photoIds: string[]) => {
    deletePhotos.mutate(photoIds);
  };
  
  if (isLoading) {
    return <div className="text-center py-8">Loading photos...</div>;
  }
  
  if (error) {
    return (
      <Alert type="error">
        Failed to load photos: {error.message}
      </Alert>
    );
  }
  
  const photos = photosData || [];
  
  return (
    <div className={className}>
      <div className="mb-6">
        <FileUpload
          activityId={activityId}
          onUploadComplete={() => {
            // React Query will automatically refetch
          }}
          disabled={isUploading}
        />
      </div>
      
      {/* Photo Stats */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Activity Photos ({photos.length})
          </h3>
          {photos.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allIds = photos.map((p: Photo) => p.id);
                handleDeleteSelected(allIds);
              }}
              disabled={deletePhotos.isPending}
            >
              Delete All
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};