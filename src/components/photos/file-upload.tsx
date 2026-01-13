'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { XMarkIcon, PhotoIcon, CloudArrowUpIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';
import { Progress } from '@/components/ui/proggress';
import { photosApi } from '@/lib/api/photos';
import { Photo } from '@/lib/types';

interface FileUploadProps {
  activityId: string;
  onUploadComplete?: (photos: Photo[]) => void;
  onUploadError?: (error: Error) => void;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in MB
  allowedTypes?: string[];
  directUpload?: boolean; // Use presigned URL for R2
  showPreview?: boolean;
  className?: string;
  disabled?: boolean;
}

interface UploadFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  photoId?: string;
  presignedUrl?: string;
  uploadFields?: Record<string, string>;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  activityId,
  onUploadComplete,
  onUploadError,
  multiple = true,
  maxFiles = 10,
  maxSize = 10, // 10MB default
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic'],
  directUpload = true,
  showPreview = true,
  className = '',
  disabled = false,
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploadConfig, setUploadConfig] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const uploadQueue = useRef<UploadFile[]>([]);
  const activeUploads = useRef<Map<string, XMLHttpRequest>>(new Map());

  // Fetch upload configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await photosApi.getUploadConfig();
        setUploadConfig(response.data);
      } catch (err) {
        // Use defaults if config fetch fails
        setUploadConfig({
          maxSize: maxSize * 1024 * 1024,
          allowedTypes,
          maxFiles,
        });
      }
    };
    fetchConfig();
  }, [maxSize, allowedTypes, maxFiles]);

  // Handle file drop/selection
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    
    // Check max files limit
    if (files.length + acceptedFiles.length > maxFiles) {
      setError(`Cannot upload more than ${maxFiles} files`);
      return;
    }

    // Process rejected files
    if (rejectedFiles.length > 0) {
      const firstRejection = rejectedFiles[0].errors[0];
      if (firstRejection.code === 'file-too-large') {
        setError(`File too large. Maximum size is ${maxSize}MB`);
      } else if (firstRejection.code === 'file-invalid-type') {
        setError('Invalid file type. Allowed types: JPEG, PNG, GIF, WebP, HEIC');
      }
    }

    // Process accepted files
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'pending',
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, [files.length, maxFiles, maxSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: allowedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxSize * 1024 * 1024,
    multiple,
    disabled: disabled || isUploading,
  });

  // Clean up preview URLs
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  // Process upload queue
  const processQueue = useCallback(async () => {
    if (uploadQueue.current.length === 0) {
      setIsUploading(false);
      
      // Get all completed files
      const completedFiles = files.filter(f => f.status === 'completed');
      if (completedFiles.length > 0 && onUploadComplete) {
        try {
          // Fetch updated photos list for the activity
          const response = await photosApi.getActivityPhotos(activityId);
          onUploadComplete(response.data.data || []);
        } catch (err) {
          console.error('Failed to fetch uploaded photo details:', err);
        }
      }
      return;
    }

    const file = uploadQueue.current[0];
    await uploadFile(file);
    uploadQueue.current = uploadQueue.current.slice(1);
    processQueue();
  }, [files, onUploadComplete, activityId]);

  // Upload a single file
  const uploadFile = async (uploadFile: UploadFile) => {
    const { id, file } = uploadFile;
    
    try {
      setFiles(prev => prev.map(f => 
        f.id === id ? { ...f, status: 'uploading' } : f
      ));

      let photoId: string;

      if (directUpload) {
        // Direct upload to R2 using presigned URL
        photoId = await uploadViaPresignedUrl(uploadFile);
      } else {
        // Server upload for smaller files
        photoId = await uploadViaServer(uploadFile);
      }

      // Mark as completed
      setFiles(prev => prev.map(f => 
        f.id === id 
          ? { ...f, status: 'completed', progress: 100, photoId }
          : f
      ));

      // Update overall progress
      const completedCount = files.filter(f => f.status === 'completed').length + 1;
      setOverallProgress(Math.round((completedCount / files.length) * 100));

    } catch (error) {
      console.error('Upload failed:', error);
      setFiles(prev => prev.map(f => 
        f.id === id 
          ? { 
              ...f, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Upload failed' 
            }
          : f
      ));
      
      if (onUploadError) {
        onUploadError(error as Error);
      }
    }
  };

  // Direct upload to R2 with presigned URL
  const uploadViaPresignedUrl = async (uploadFile: UploadFile): Promise<string> => {
    const { file } = uploadFile;
    
    try {
      // Get presigned URL from server
      const presignedResponse = await photosApi.getPresignedUrl({
        filename: file.name,
        contentType: file.type,
        activityId,
        description: '',
        tags: [],
      });

      const { url, fields, fileId } = presignedResponse.data;
      
      // Create FormData for R2 upload
      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        // Convert the value to string since FormData.append expects string or Blob
        formData.append(key, String(value));
      });
      formData.append('file', file);

      // Upload to R2 with progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setFiles(prev => prev.map(f => 
              f.id === uploadFile.id ? { ...f, progress } : f
            ));
          }
        });

        xhr.addEventListener('load', () => {
          activeUploads.current.delete(uploadFile.id);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(fileId);
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          activeUploads.current.delete(uploadFile.id);
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
          activeUploads.current.delete(uploadFile.id);
          reject(new Error('Upload cancelled'));
        });

        xhr.open('POST', url);
        xhr.send(formData);
        
        activeUploads.current.set(uploadFile.id, xhr);
      });
    } catch (error) {
      console.error('Failed to get presigned URL:', error);
      throw error;
    }
  };

  // Upload via server (for smaller files)
  const uploadViaServer = async (uploadFile: UploadFile): Promise<string> => {
    const formData = new FormData();
    formData.append('photo', uploadFile.file);
    formData.append('activityId', activityId);

    try {
      const response = await photosApi.uploadPhoto(formData, activityId);
      return response.data.id;
    } catch (error) {
      console.error('Server upload failed:', error);
      throw error;
    }
  };

  // Start upload process
  const handleUpload = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);
    setError(null);
    setOverallProgress(0);
    
    // Add to queue
    uploadQueue.current = [...pendingFiles];
    
    // Update status
    setFiles(prev => prev.map(f => 
      f.status === 'pending' ? { ...f, status: 'uploading' } : f
    ));

    // Start processing
    processQueue();
  };

  // Cancel upload
  const handleCancel = () => {
    // Cancel all active uploads
    activeUploads.current.forEach(xhr => {
      xhr.abort();
    });
    activeUploads.current.clear();
    
    // Reset state
    setIsUploading(false);
    uploadQueue.current = [];
    
    // Update file statuses
    setFiles(prev => prev.map(f => 
      f.status === 'uploading' ? { ...f, status: 'pending', progress: 0 } : f
    ));
  };

  // Remove file
  const handleRemove = (id: string) => {
    // Cancel if uploading
    const xhr = activeUploads.current.get(id);
    if (xhr) {
      xhr.abort();
      activeUploads.current.delete(id);
    }

    // Remove from files
    setFiles(prev => {
      const newFiles = prev.filter(f => f.id !== id);
      
      // Revoke preview URL
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }

      // Update overall progress
      const completedCount = newFiles.filter(f => f.status === 'completed').length;
      const totalCount = newFiles.length;
      setOverallProgress(totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0);

      return newFiles;
    });
  };

  // Retry failed upload
  const handleRetry = (id: string) => {
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, status: 'pending', progress: 0, error: undefined } : f
    ));
  };

  // Get status badge
  const getStatusBadge = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Pending</span>;
      case 'uploading':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <CloudArrowUpIcon className="w-3 h-3 mr-1 animate-pulse" />
          Uploading
        </span>;
      case 'completed':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="w-3 h-3 mr-1" />
          Completed
        </span>;
      case 'error':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <ExclamationCircleIcon className="w-3 h-3 mr-1" />
          Error
        </span>;
      default:
        return null;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${isDragActive 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'
          }
          ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <input {...getInputProps()} />
        <div className="space-y-3">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="text-gray-600">
            {isDragActive ? (
              <p className="font-medium">Drop the files here...</p>
            ) : (
              <>
                <p className="font-medium">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Supports {allowedTypes.join(', ')} • Max {maxSize}MB per file • Up to {maxFiles} files
                </p>
              </>
            )}
          </div>
          <Button 
            type="button" 
            variant="outline"
            disabled={disabled || isUploading}
          >
            Select Files
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert type="error">
          {error}
        </Alert>
      )}

      {/* Overall Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-900">
              Selected Files ({files.length}/{maxFiles})
            </h3>
            <div className="flex space-x-2">
              {isUploading ? (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={!isUploading}
                >
                  Cancel All
                </Button>
              ) : (
                <Button 
                  type="button" 
                  onClick={handleUpload}
                  disabled={files.every(f => f.status !== 'pending') || disabled}
                >
                  Upload All
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center space-x-4 p-3 bg-white border rounded-lg hover:bg-gray-50"
              >
                {/* Preview */}
                {showPreview && file.preview && (
                  <div className="shrink-0">
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100">
                      <img
                        src={file.preview}
                        alt={file.file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.file.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleRemove(file.id)}
                      disabled={isUploading && file.status === 'uploading'}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-gray-500">
                      {formatFileSize(file.file.size)}
                    </span>
                    {getStatusBadge(file.status)}
                  </div>

                  {/* Progress Bar */}
                  {file.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Uploading...</span>
                        <span>{file.progress}%</span>
                      </div>
                      <Progress value={file.progress} className="h-1.5" />
                    </div>
                  )}

                  {/* Error Message */}
                  {file.status === 'error' && file.error && (
                    <div className="mt-2">
                      <p className="text-xs text-red-600">{file.error}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetry(file.id)}
                        className="mt-1"
                      >
                        Retry
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Method Info */}
      <div className="text-xs text-gray-500 pt-2 border-t">
        <p>
          {directUpload 
            ? 'Files are uploaded directly to secure cloud storage for better performance.'
            : 'Files are uploaded through our servers for processing.'
          }
        </p>
      </div>
    </div>
  );
};