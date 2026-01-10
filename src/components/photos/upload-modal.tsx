'use client';

import React, { useState, useRef } from 'react';
import Modal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import { FileUpload } from './file-upload';
import { Photo } from '@/lib/types';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface PhotoUploadModalProps {
  activityId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: (photos: Photo[]) => void;
  title?: string;
  description?: string;
  maxFiles?: number;
}

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  activityId,
  open,
  onClose,
  onSuccess,
  title = 'Upload Photos',
  description = 'Upload photos for this activity',
  maxFiles = 10,
}) => {
  const [uploadedPhotos, setUploadedPhotos] = useState<Photo[]>([]);
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileUploadRef = useRef<{ handleUpload?: () => void }>(null);

  const handleUploadComplete = (photos: Photo[]) => {
    setUploadedPhotos(photos);
    setUploadComplete(true);
    
    if (onSuccess) {
      onSuccess(photos);
    }
  };

  const handleClose = () => {
    setUploadedPhotos([]);
    setUploadComplete(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      size="xl"
    >
      <div className="space-y-6">
        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 mb-4">
            {description}
          </p>
        )}
        
        {!uploadComplete ? (
          <>
            <FileUpload
              activityId={activityId}
              onUploadComplete={handleUploadComplete}
              maxFiles={maxFiles}
              showPreview={true}
              directUpload={true}
            />
            
            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
              <CheckCircleIcon className="w-10 h-10 text-green-600" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Upload Complete!
              </h3>
              <p className="text-gray-600">
                Successfully uploaded {uploadedPhotos.length} photo{uploadedPhotos.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Uploaded Photos Preview */}
            {uploadedPhotos.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Uploaded Photos
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {uploadedPhotos.slice(0, 6).map((photo) => (
                    <div
                      key={photo.id}
                      className="aspect-square rounded-lg overflow-hidden border border-gray-200"
                    >
                      <img
                        src={photo.thumbnailUrl || photo.url}
                        alt={photo.description || 'Uploaded photo'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {uploadedPhotos.length > 6 && (
                    <div className="aspect-square rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50">
                      <span className="text-sm text-gray-500">
                        +{uploadedPhotos.length - 6} more
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4">
              <Button onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};