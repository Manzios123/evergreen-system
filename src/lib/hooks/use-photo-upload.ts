import { useState, useCallback, useRef } from 'react';
import { photosApi } from '@/lib/api/photos';
import { Photo } from '@/lib/types';

interface UsePhotoUploadOptions {
  activityId: string;
  onProgress?: (progress: number, fileId: string) => void;
  onComplete?: (photos: Photo[]) => void;
  onError?: (error: Error, fileId?: string) => void;
  maxConcurrentUploads?: number;
  usePresignedUrl?: boolean;
}

interface UploadState {
  files: Map<string, {
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    error?: string;
    photoId?: string;
  }>;
  isUploading: boolean;
  overallProgress: number;
}

export const usePhotoUpload = (options: UsePhotoUploadOptions) => {
  const {
    activityId,
    onProgress,
    onComplete,
    onError,
    maxConcurrentUploads = 3,
    usePresignedUrl = true,
  } = options;

  const [state, setState] = useState<UploadState>({
    files: new Map(),
    isUploading: false,
    overallProgress: 0,
  });

  const activeUploads = useRef<Map<string, XMLHttpRequest>>(new Map());
  const uploadQueue = useRef<string[]>([]);

  // Add files to upload queue
  const addFiles = useCallback((files: File[]) => {
    setState(prev => {
      const newFiles = new Map(prev.files);
      
      files.forEach(file => {
        const fileId = Math.random().toString(36).substr(2, 9);
        newFiles.set(fileId, {
          file,
          progress: 0,
          status: 'pending',
        });
        uploadQueue.current.push(fileId);
      });

      return {
        ...prev,
        files: newFiles,
      };
    });
  }, []);

  // Remove file from upload list
  const removeFile = useCallback((fileId: string) => {
    const xhr = activeUploads.current.get(fileId);
    if (xhr) {
      xhr.abort();
      activeUploads.current.delete(fileId);
    }

    setState(prev => {
      const newFiles = new Map(prev.files);
      newFiles.delete(fileId);
      
      // Remove from queue
      uploadQueue.current = uploadQueue.current.filter(id => id !== fileId);
      
      return {
        ...prev,
        files: newFiles,
      };
    });
  }, []);

  // Upload a single file
  const uploadFile = useCallback(async (fileId: string) => {
    const fileData = state.files.get(fileId);
    if (!fileData) return;

    try {
      // Update status to uploading
      setState(prev => {
        const newFiles = new Map(prev.files);
        const existing = newFiles.get(fileId);
        if (existing) {
          newFiles.set(fileId, { ...existing, status: 'uploading' });
        }
        return { ...prev, files: newFiles };
      });

      let photoId: string;

      if (usePresignedUrl) {
        // Get presigned URL
        const presignedResponse = await photosApi.getPresignedUrl({
          filename: fileData.file.name,
          contentType: fileData.file.type,
          activityId,
          description: '',
          tags: [],
        });

        const { url, fields, fileId: photoIdFromServer } = presignedResponse.data;

        // Upload to R2 - Fix for Error 1: Cast value to string
        photoId = await new Promise((resolve, reject) => {
          const formData = new FormData();
          Object.entries(fields).forEach(([key, value]) => {
            // Convert value to string to fix TypeScript error
            formData.append(key, String(value));
          });
          formData.append('file', fileData.file);

          const xhr = new XMLHttpRequest();
          
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              
              setState(prev => {
                const newFiles = new Map(prev.files);
                const existing = newFiles.get(fileId);
                if (existing) {
                  newFiles.set(fileId, { ...existing, progress });
                }
                
                // Calculate overall progress
                const totalProgress = Array.from(newFiles.values())
                  .reduce((sum, file) => sum + file.progress, 0);
                const avgProgress = newFiles.size > 0 
                  ? Math.round(totalProgress / newFiles.size)
                  : 0;
                
                return { 
                  ...prev, 
                  files: newFiles,
                  overallProgress: avgProgress,
                };
              });

              if (onProgress) {
                onProgress(progress, fileId);
              }
            }
          });

          xhr.addEventListener('load', () => {
            activeUploads.current.delete(fileId);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(photoIdFromServer);
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });

          xhr.addEventListener('error', () => {
            activeUploads.current.delete(fileId);
            reject(new Error('Network error during upload'));
          });

          xhr.addEventListener('abort', () => {
            activeUploads.current.delete(fileId);
            reject(new Error('Upload cancelled'));
          });

          xhr.open('POST', url);
          xhr.send(formData);
          
          activeUploads.current.set(fileId, xhr);
        });
      } else {
        // Upload via server - FIX: Pass both formData and activityId
        const formData = new FormData();
        formData.append('photo', fileData.file);
        // Note: The API function already includes activityId in the URL, 
        // so we don't need to append it to formData for this endpoint
        const response = await photosApi.uploadPhoto(formData, activityId);
        photoId = response.data.id;
      }

      // Mark as completed
      setState(prev => {
        const newFiles = new Map(prev.files);
        const existing = newFiles.get(fileId);
        if (existing) {
          newFiles.set(fileId, { 
            ...existing, 
            status: 'completed', 
            progress: 100,
            photoId,
          });
        }
        return { ...prev, files: newFiles };
      });

      return photoId;
    } catch (error) {
      console.error('Upload failed:', error);
      
      setState(prev => {
        const newFiles = new Map(prev.files);
        const existing = newFiles.get(fileId);
        if (existing) {
          newFiles.set(fileId, { 
            ...existing, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Upload failed',
          });
        }
        return { ...prev, files: newFiles };
      });

      if (onError) {
        onError(error as Error, fileId);
      }

      throw error;
    }
  }, [activityId, usePresignedUrl, onProgress, onError, state.files]);

  // Process upload queue
  const processQueue = useCallback(async () => {
    if (uploadQueue.current.length === 0) {
      setState(prev => ({ ...prev, isUploading: false }));
      
      // Get completed uploads
      const completedEntries = Array.from(state.files.entries())
        .filter(([_, file]) => file.status === 'completed' && file.photoId);
      
      if (completedEntries.length > 0 && onComplete) {
        try {
          const uploadedPhotos = await Promise.all(
            completedEntries.map(([_, file]) => 
              photosApi.getPhoto(file.photoId!)
            )
          );
          // Add type annotation for res
          onComplete(uploadedPhotos.map((res: { data: Photo }) => res.data));
        } catch (err) {
          console.error('Failed to fetch uploaded photo details:', err);
        }
      }
      
      return;
    }

    // Take next batch of files from queue
    const batch = uploadQueue.current.splice(0, maxConcurrentUploads);
    
    // Upload batch concurrently
    await Promise.allSettled(
      batch.map(fileId => uploadFile(fileId))
    );

    // Process next batch
    processQueue();
  }, [uploadFile, onComplete, state.files, maxConcurrentUploads]);

  // Start uploading
  const startUpload = useCallback(async () => {
    if (state.isUploading || uploadQueue.current.length === 0) return;

    setState(prev => ({ ...prev, isUploading: true }));
    processQueue();
  }, [state.isUploading, processQueue]);

  // Cancel all uploads
  const cancelAll = useCallback(() => {
    // Abort all active uploads
    activeUploads.current.forEach(xhr => {
      xhr.abort();
    });
    activeUploads.current.clear();

    // Reset state for uploading files
    setState(prev => {
      const newFiles = new Map(prev.files);
      newFiles.forEach((file, fileId) => {
        if (file.status === 'uploading') {
          newFiles.set(fileId, { 
            ...file, 
            status: 'pending', 
            progress: 0,
            error: undefined,
          });
        }
      });

      return {
        files: newFiles,
        isUploading: false,
        overallProgress: 0,
      };
    });

    // Clear queue
    uploadQueue.current = [];
  }, []);

  // Get upload statistics
  const getStats = useCallback(() => {
    const filesArray = Array.from(state.files.values());
    const total = filesArray.length;
    const completed = filesArray.filter(f => f.status === 'completed').length;
    const uploading = filesArray.filter(f => f.status === 'uploading').length;
    const pending = filesArray.filter(f => f.status === 'pending').length;
    const errors = filesArray.filter(f => f.status === 'error').length;

    return {
      total,
      completed,
      uploading,
      pending,
      errors,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [state.files]);

  return {
    // State
    files: state.files,
    isUploading: state.isUploading,
    overallProgress: state.overallProgress,
    
    // Actions
    addFiles,
    removeFile,
    startUpload,
    cancelAll,
    
    // Stats
    getStats,
    
    // Reset
    reset: () => {
      cancelAll();
      setState({
        files: new Map(),
        isUploading: false,
        overallProgress: 0,
      });
      uploadQueue.current = [];
    },
  };
};