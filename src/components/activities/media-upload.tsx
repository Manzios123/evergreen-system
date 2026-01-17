// components/activities/media-upload.tsx - UPDATED VERSION
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Alert from '@/components/ui/alert';
import { 
  PhotoIcon, 
  VideoCameraIcon,
  TrashIcon, 
  XMarkIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/solid';
import imageCompression from 'browser-image-compression';
import { api } from '@/lib/api'; // FIXED: Changed import path

export interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl: string;
  filename: string;
  caption?: string;
  uploadedAt: string;
  size: number;
  displayOrder: number;
  isNew?: boolean;
  file?: File;
  mediaType: 'photo' | 'video' | 'document';
  duration?: number;
  width?: number;
  height?: number;
  compressionProfile?: 'low' | 'medium' | 'high';
}

interface MediaUploadProps {
  activityId: string;
  maxItems?: number;
  maxSizeMB?: number;
  allowedTypes?: ('photo' | 'video' | 'document')[];
  onMediaChange?: (media: MediaItem[]) => void;
  disabled?: boolean;
  compressionLevel?: 'low' | 'medium' | 'high';
}

export function MediaUpload({ 
  activityId, 
  maxItems = 15, 
  maxSizeMB = 50,
  allowedTypes = ['photo', 'video'],
  onMediaChange,
  disabled = false,
  compressionLevel = 'medium'
}: MediaUploadProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState<string[]>([]);
  const [compressing, setCompressing] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  // Image compression options
  const getImageCompressionOptions = () => {
    const baseOptions = {
      maxSizeMB: maxSizeMB,
      useWebWorker: true,
    };

    switch (compressionLevel) {
      case 'low':
        return { ...baseOptions, maxWidthOrHeight: 1024, initialQuality: 0.8 };
      case 'medium':
        return { ...baseOptions, maxWidthOrHeight: 1920, initialQuality: 0.7 };
      case 'high':
        return { ...baseOptions, maxWidthOrHeight: 3840, initialQuality: 0.6 };
      default:
        return { ...baseOptions, maxWidthOrHeight: 1920, initialQuality: 0.7 };
    }
  };

  // Compress image
  const compressImage = async (file: File): Promise<File> => {
    const options = getImageCompressionOptions();
    
    try {
      const compressedFile = await imageCompression(file, options as any);
      
      return new File([compressedFile], file.name, {
        type: file.type,
        lastModified: Date.now(),
      });
    } catch (error) {
      console.error('Image compression error:', error);
      throw new Error('Failed to compress image');
    }
  };

  // Simple video validation (we'll use server-side compression for now)
  const validateVideo = async (file: File): Promise<{ valid: boolean; error?: string }> => {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    
    if (file.size > maxSize) {
      return { valid: false, error: 'Video file too large (max 100MB)' };
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid video format. Allowed: MP4, WebM, MOV, AVI' };
    }
    
    return { valid: true };
  };

  // Upload media to server using api utility
  const uploadMedia = async (file: File, mediaType: 'photo' | 'video', caption?: string): Promise<MediaItem> => {
    const formData = new FormData();
    formData.append('media', file);
    formData.append('media_type', mediaType);
    if (caption) {
      formData.append('caption', caption);
    }
    formData.append('compression_profile', compressionLevel);

    // Use the api utility for consistent error handling
    return await api.upload<MediaItem>(`/activities/${activityId}/media`, formData);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled) return;
    
    setError(null);
    setSuccess(null);

    // Check if adding these files would exceed maximum
    if (mediaItems.length + acceptedFiles.length > maxItems) {
      setError(`Maximum ${maxItems} media items allowed. You can upload ${maxItems - mediaItems.length} more.`);
      return;
    }

    // Process files
    for (const file of acceptedFiles) {
      try {
        // Determine media type
        let mediaType: 'photo' | 'video' = 'photo';
        if (file.type.startsWith('video/')) {
          if (!allowedTypes.includes('video')) {
            setError(`Video uploads are not allowed for this activity`);
            continue;
          }
          mediaType = 'video';
        } else if (file.type.startsWith('image/')) {
          if (!allowedTypes.includes('photo')) {
            setError(`Photo uploads are not allowed for this activity`);
            continue;
          }
          mediaType = 'photo';
        } else {
          setError(`Unsupported file type: ${file.type}`);
          continue;
        }

        // Add to uploading list
        setUploading(prev => [...prev, file.name]);

        // Create preview
        const previewUrl = URL.createObjectURL(file);
        const previewItem: MediaItem = {
          id: `preview-${Date.now()}-${file.name}`,
          url: previewUrl,
          thumbnailUrl: mediaType === 'video' ? '' : previewUrl,
          filename: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          displayOrder: mediaItems.length + 1,
          isNew: true,
          file: file,
          mediaType: mediaType,
        };

        setMediaItems(prev => [...prev, previewItem]);

        // Validate video
        if (mediaType === 'video') {
          const validation = await validateVideo(file);
          if (!validation.valid) {
            throw new Error(validation.error);
          }
        }

        // Compress image if photo
        let fileToUpload = file;
        if (mediaType === 'photo') {
          setCompressing(prev => [...prev, file.name]);
          fileToUpload = await compressImage(file);
          setCompressing(prev => prev.filter(name => name !== file.name));
        }

        // Upload file using api utility
        const uploadedItem = await uploadMedia(fileToUpload, mediaType);
        
        // Update item with server response
        setMediaItems(prev => prev.map(item => 
          item.id === previewItem.id 
            ? { 
                ...uploadedItem, 
                url: uploadedItem.url, 
                thumbnailUrl: uploadedItem.thumbnailUrl || previewUrl,
                mediaType 
              }
            : item
        ));

        setSuccess(`"${file.name}" uploaded successfully`);
      } catch (error: any) {
        setError(`Failed to upload "${file.name}": ${error.message || error.error || 'Unknown error'}`);
        // Remove failed preview
        setMediaItems(prev => prev.filter(item => 
          !item.filename.includes(file.name) || item.id.startsWith('preview-')
        ));
      } finally {
        setUploading(prev => prev.filter(name => name !== file.name));
      }
    }

    if (onMediaChange) {
      onMediaChange(mediaItems);
    }
  }, [activityId, maxItems, mediaItems, disabled, onMediaChange, allowedTypes, compressionLevel]);

  // Delete media using api utility
  const deleteMedia = async (mediaId: string) => {
    if (disabled) return;
    
    try {
      setError(null);
      
      // Use the api utility for consistent error handling
      const result = await api.delete<{ 
        success: boolean; 
        message: string; 
        storageFreed: number 
      }>(`/media/${mediaId}`);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete media');
      }

      // Remove from local state
      setMediaItems(prev => prev.filter(item => item.id !== mediaId));
      setSuccess('Media deleted successfully');
      
      if (onMediaChange) {
        onMediaChange(mediaItems.filter(item => item.id !== mediaId));
      }
    } catch (error: any) {
      setError(error.message || error.error || 'Failed to delete media');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.heic'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv']
    },
    maxSize: maxSizeMB * 1024 * 1024,
    disabled: disabled || mediaItems.length >= maxItems,
    multiple: true,
  });

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      mediaItems.forEach(item => {
        if (item.url && item.url.startsWith('blob:')) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, [mediaItems]);

  const remainingSlots = maxItems - mediaItems.length;

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Format duration for videos
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Activity Media</h3>
            <p className="text-sm text-gray-500">
              Upload photos and videos from your activity {mediaItems.length > 0 && `(${mediaItems.length}/${maxItems})`}
            </p>
          </div>
          {mediaItems.length > 0 && (
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
        {mediaItems.length < maxItems && !disabled && (
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
            <div className="flex flex-col items-center">
              <div className="flex items-center space-x-2 mb-4">
                <PhotoIcon className="h-12 w-12 text-gray-400" />
                <VideoCameraIcon className="h-12 w-12 text-gray-400" />
              </div>
              <p className="mt-2 text-sm font-medium text-gray-900">
                {isDragActive ? 'Drop media here' : 'Drag & drop photos/videos or click to browse'}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Upload up to {remainingSlots} item{remainingSlots !== 1 ? 's' : ''} (max {maxSizeMB}MB each)
              </p>
              <p className="mt-2 text-xs text-gray-400">
                Photos: JPG, PNG, GIF, WebP, HEIC | Videos: MP4, MOV, AVI, WebM
              </p>
              <div className="mt-4">
                <Button variant="outline" size="sm">
                  <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                  Select Media
                </Button>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Compression: {compressionLevel} quality
              </div>
            </div>
          </div>
        )}

        {/* Media Grid */}
        {mediaItems.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {mediaItems.map((item) => (
                <div key={item.id} className="relative group">
                  {/* Media Preview */}
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative">
                    {item.mediaType === 'photo' ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.caption || item.filename}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                        }}
                      />
                    ) : (
                      <div className="relative w-full h-full">
                        <video
                          ref={el => {
                            videoRefs.current[item.id] = el;
                          }}
                          src={item.url}
                          className="w-full h-full object-cover"
                          muted
                          preload="metadata"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                          <PlayIcon className="h-8 w-8 text-white" />
                        </div>
                        {item.duration && (
                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                            {formatDuration(item.duration)}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Uploading/Compressing Overlay */}
                    {(uploading.includes(item.filename) || compressing.includes(item.filename)) && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="text-white text-sm font-medium text-center">
                          {compressing.includes(item.filename) ? (
                            <>
                              <ClockIcon className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                              Compressing...
                            </>
                          ) : (
                            'Uploading...'
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Delete Button */}
                    {!disabled && (
                      <button
                        onClick={() => deleteMedia(item.id)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full 
                                 opacity-0 group-hover:opacity-100 transition-opacity duration-200
                                 hover:bg-red-600"
                        aria-label="Delete media"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                    
                    {/* Media Type Badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.mediaType === 'photo' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {item.mediaType === 'photo' ? 'Photo' : 'Video'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Caption/Filename */}
                  <div className="mt-1">
                    <div className="text-xs truncate" title={item.caption || item.filename}>
                      {item.caption || item.filename}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{formatFileSize(item.size)}</span>
                      {item.compressionProfile && (
                        <span className="text-xs px-1 bg-gray-100 rounded">
                          {item.compressionProfile}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Media Count Warning */}
            {mediaItems.length >= maxItems && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
                  <p className="text-sm text-yellow-800">
                    Maximum of {maxItems} media items reached. Delete some to add more.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help Text */}
        {mediaItems.length === 0 && !disabled && (
          <div className="text-center py-8">
            <div className="flex justify-center space-x-2 mb-4">
              <PhotoIcon className="h-12 w-12 text-gray-300" />
              <VideoCameraIcon className="h-12 w-12 text-gray-300" />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              No media uploaded yet. Upload photos and videos to document your activity.
            </p>
          </div>
        )}

        {/* Disabled State */}
        {disabled && (
          <div className="text-center py-8">
            <XMarkIcon className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">
              Media upload is not available for this activity status.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}