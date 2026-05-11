// components/activities/photo-upload.tsx
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Alert from '@/components/ui/alert';
import { 
  PhotoIcon, 
  TrashIcon, 
  XMarkIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import imageCompression from 'browser-image-compression';
import { api } from '@/lib/api';

interface Photo {
  id: string;
  url: string;
  thumbnailUrl: string;
  filename: string;
  caption?: string;
  uploadedAt: string;
  size: number;
  displayOrder: number;
  isNew?: boolean;
  file?: File; // For new uploads before they're saved
}

interface PhotoUploadProps {
  activityId: string;
  maxPhotos?: number;
  maxSizeMB?: number;
  onPhotosChange?: (photos: Photo[]) => void;
  disabled?: boolean;
}

export function PhotoUpload({
  activityId,
  maxPhotos = 3,
  maxSizeMB = 5,
  onPhotosChange,
  disabled = false
}: PhotoUploadProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Compress image before upload
  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: maxSizeMB,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: file.type,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      
      // Create a new File object with the compressed blob
      return new File([compressedFile], file.name, {
        type: file.type,
        lastModified: Date.now(),
      });
    } catch (error) {
      console.error('Image compression error:', error);
      throw new Error('Failed to compress image');
    }
  };

  // Upload photo to server
  const uploadPhoto = async (file: File, caption?: string): Promise<Photo> => {
    const formData = new FormData();
    formData.append('photo', file);
    if (caption) {
      formData.append('caption', caption);
    }

    return api.upload<Photo>(`/activities/${activityId}/photos`, formData);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled) return;
    
    setError(null);
    setSuccess(null);

    // Check if adding these files would exceed maximum
    if (photos.length + acceptedFiles.length > maxPhotos) {
      setError(`Maximum ${maxPhotos} photos allowed. You can upload ${maxPhotos - photos.length} more.`);
      return;
    }

    // Process files
    for (const file of acceptedFiles) {
      try {
        // Add to uploading list
        setUploading(prev => [...prev, file.name]);

        // Create preview object
        const previewUrl = URL.createObjectURL(file);
        const previewPhoto: Photo = {
          id: `preview-${Date.now()}-${file.name}`,
          url: previewUrl,
          thumbnailUrl: previewUrl,
          filename: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          displayOrder: photos.length + 1,
          isNew: true,
          file: file,
        };

        setPhotos(prev => [...prev, previewPhoto]);

        // Compress and upload
        const compressedFile = await compressImage(file);
        const uploadedPhoto = await uploadPhoto(compressedFile);
        
        // Update photo with server response
        setPhotos(prev => prev.map(p => 
          p.id === previewPhoto.id 
            ? { ...uploadedPhoto, url: uploadedPhoto.url, thumbnailUrl: uploadedPhoto.thumbnailUrl }
            : p
        ));

        setSuccess(`"${file.name}" uploaded successfully`);
      } catch (error: any) {
        setError(`Failed to upload "${file.name}": ${error.message}`);
        // Remove failed preview
        setPhotos(prev => prev.filter(p => !(p.filename.includes(file.name) && p.id.startsWith('preview-'))));
      } finally {
        setUploading(prev => prev.filter(name => name !== file.name));
      }
    }

    if (onPhotosChange) {
      const currentPhotos = photos.filter(p => !p.id.startsWith('preview-'));
      onPhotosChange([...currentPhotos, ...acceptedFiles.map((_, i) => {
        // This will be updated by the real upload
        return {} as Photo;
      })]);
    }
  }, [activityId, maxPhotos, photos, disabled, onPhotosChange]);

  const deletePhoto = async (photoId: string) => {
    if (disabled) return;
    
    try {
      setError(null);
      
      await api.delete(`/photos/${photoId}`);

      // Remove from local state
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      setSuccess('Photo deleted successfully');
      
      if (onPhotosChange) {
        onPhotosChange(photos.filter(p => p.id !== photoId));
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxSize: maxSizeMB * 1024 * 1024,
    disabled: disabled || photos.length >= maxPhotos,
  });

  const remainingSlots = maxPhotos - photos.length;

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Activity Photos</h3>
            <p className="text-sm text-gray-500">
              Upload photos from your activity {photos.length > 0 && `(${photos.length}/${maxPhotos})`}
            </p>
          </div>
          {photos.length > 0 && (
            <div className="text-sm">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                {remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} remaining
              </span>
            </div>
          )}
        </div>

        {/* Error/Success Messages */}
        <div className="space-y-4">
          {error && (
            <Alert type="error">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                {error}
              </div>
            </Alert>
          )}

          {success && (
            <Alert type="success">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                {success}
              </div>
            </Alert>
          )}
        </div>

        {/* Upload Zone */}
        {photos.length < maxPhotos && !disabled && (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${isDragActive 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm font-medium text-gray-900">
              {isDragActive ? 'Drop photos here' : 'Drag & drop photos or click to browse'}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Upload up to {remainingSlots} photo{remainingSlots !== 1 ? 's' : ''} (max {maxSizeMB}MB each)
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Supported: JPG, PNG, GIF, WebP
            </p>
            <div className="mt-4">
              <Button variant="outline" size="sm">
                <PhotoIcon className="h-4 w-4 mr-2" />
                Select Photos
              </Button>
            </div>
          </div>
        )}

        {/* Photo Grid */}
        {photos.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  {/* Photo */}
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={photo.thumbnailUrl}
                      alt={photo.caption || photo.filename}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Uploading Overlay */}
                    {uploading.includes(photo.filename) && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="text-white text-sm font-medium">
                          Uploading...
                        </div>
                      </div>
                    )}
                    
                    {/* Delete Button */}
                    {!disabled && (
                      <button
                        onClick={() => deletePhoto(photo.id)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full 
                                 opacity-0 group-hover:opacity-100 transition-opacity duration-200
                                 hover:bg-red-600"
                        aria-label="Delete photo"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Caption/Filename */}
                  <div className="mt-1 text-xs truncate">
                    {photo.caption || photo.filename}
                  </div>
                  
                  {/* Size Info */}
                  <div className="text-xs text-gray-500">
                    {(photo.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              ))}
            </div>

            {/* Photo Count Warning */}
            {photos.length >= maxPhotos && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
                  <p className="text-sm text-yellow-800">
                    Maximum of {maxPhotos} photos reached. Delete some to add more.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help Text */}
        {photos.length === 0 && !disabled && (
          <div className="text-center py-8">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">
              No photos uploaded yet. Upload photos to document your activity.
            </p>
          </div>
        )}

        {/* Disabled State */}
        {disabled && (
          <div className="text-center py-8">
            <XMarkIcon className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">
              Photo upload is not available for this activity status.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
