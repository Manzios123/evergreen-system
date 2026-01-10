import { useQueryClient } from '@tanstack/react-query';
import { photosApi } from '@/lib/api/photos';
import { Photo } from '@/lib/types';
import { 
  useApiQuery, 
  useApiMutation, 
  queryConfigs 
} from './use-api';

// Get photos with filters
export const usePhotos = (params?: {
  activityId?: string;
  volunteerId?: string;
  status?: string;
  page?: number;
  limit?: number;
  tags?: string[];
  dateRange?: { start: string; end: string };
}) => {
  return useApiQuery(
    ['photos', params],
    () => photosApi.getPhotos(params).then(res => res.data),
    {
      staleTime: queryConfigs.default.staleTime,
      gcTime: queryConfigs.default.gcTime,
    }
  );
};

// Get activity photos with caching
export const useActivityPhotos = (activityId: string, params?: { status?: string }) => {
  return useApiQuery(
    ['photos', 'activity', activityId, params],
    () => photosApi.getActivityPhotos(activityId, params).then(res => res.data),
    {
      enabled: !!activityId,
      staleTime: queryConfigs.default.staleTime,
      gcTime: queryConfigs.default.gcTime,
    }
  );
};

// Get single photo
export const usePhoto = (id: string) => {
  return useApiQuery(
    ['photo', id],
    () => photosApi.getPhoto(id).then(res => res.data),
    {
      enabled: !!id,
      staleTime: queryConfigs.static.staleTime,
      gcTime: queryConfigs.static.gcTime,
    }
  );
};

// Get volunteer photos
export const useVolunteerPhotos = (volunteerId: string, params?: { 
  page?: number; 
  limit?: number;
  status?: string;
}) => {
  return useApiQuery(
    ['photos', 'volunteer', volunteerId, params],
    () => photosApi.getVolunteerPhotos(volunteerId, params).then(res => res.data),
    {
      enabled: !!volunteerId,
      staleTime: queryConfigs.default.staleTime,
      gcTime: queryConfigs.default.gcTime,
    }
  );
};

// Get upload configuration
export const useUploadConfig = () => {
  return useApiQuery(
    ['upload-config'],
    () => photosApi.getUploadConfig().then(res => res.data),
    {
      staleTime: queryConfigs.static.staleTime,
      gcTime: queryConfigs.static.gcTime,
    }
  );
};

// Upload photo via server
export const useUploadPhoto = () => {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    (data: { activityId: string; file: File; description?: string; tags?: string[] }) => {
      const formData = new FormData();
      formData.append('photo', data.file);
      formData.append('activityId', data.activityId);
      if (data.description) {
        formData.append('description', data.description);
      }
      if (data.tags) {
        formData.append('tags', JSON.stringify(data.tags));
      }
      return photosApi.uploadPhoto(formData).then(res => res.data);
    },
    {
      invalidateQueries: [['photos']],
      onSuccess: (data, variables) => {
        // Also invalidate activity-specific photos
        queryClient.invalidateQueries({ 
          queryKey: ['photos', 'activity', variables.activityId] 
        });
      },
    }
  );
};

// Delete photo
export const useDeletePhoto = () => {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    (id: string) => photosApi.deletePhoto(id).then(res => res.data),
    {
      invalidateQueries: [['photos']],
    }
  );
};

// Update photo metadata
export const useUpdatePhoto = () => {
  return useApiMutation(
    ({ id, ...data }: { id: string } & Partial<Photo>) => 
      photosApi.updatePhoto(id, data).then(res => res.data),
    {
      invalidateQueries: [['photos']],
    }
  );
};

// Review photo (coordinator/admin)
export const useReviewPhoto = () => {
  return useApiMutation(
    ({ id, action, rejectionReason }: { 
      id: string; 
      action: 'approve' | 'reject'; 
      rejectionReason?: string 
    }) => photosApi.reviewPhoto(id, action, rejectionReason).then(res => res.data),
    {
      invalidateQueries: [['photos']],
    }
  );
};

// Generate thumbnail
export const useGenerateThumbnail = () => {
  return useApiMutation(
    ({ id, size }: { id: string; size?: { width: number; height: number } }) =>
      photosApi.generateThumbnail(id, size).then(res => res.data),
    {
      invalidateQueries: [['photos']],
    }
  );
};

// Batch operations
export const useBatchPhotoOperations = () => {
  const approvePhotos = useApiMutation(
    (ids: string[]) => Promise.all(
      ids.map(id => photosApi.reviewPhoto(id, 'approve').then(res => res.data))
    ),
    {
      invalidateQueries: [['photos']],
    }
  );
  
  const rejectPhotos = useApiMutation(
    (data: { ids: string[]; reason?: string }) => Promise.all(
      data.ids.map(id => photosApi.reviewPhoto(id, 'reject', data.reason).then(res => res.data))
    ),
    {
      invalidateQueries: [['photos']],
    }
  );
  
  const deletePhotos = useApiMutation(
    (ids: string[]) => Promise.all(
      ids.map(id => photosApi.deletePhoto(id).then(res => res.data))
    ),
    {
      invalidateQueries: [['photos']],
    }
  );
  
  return {
    approvePhotos,
    rejectPhotos,
    deletePhotos,
  };
};

// Pre-signed URL upload for direct R2 upload
export const usePresignedUpload = () => {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    async (data: {
      file: File;
      activityId: string;
      onProgress?: (progress: number) => void;
    }) => {
      // Get presigned URL
      const presignedResponse = await photosApi.getPresignedUrl({
        filename: data.file.name,
        contentType: data.file.type,
        activityId: data.activityId,
      });
      
      const { url, fields, fileId } = presignedResponse.data;
      
      // Upload to R2
      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      formData.append('file', data.file);
      
      return new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && data.onProgress) {
            const progress = Math.round((event.loaded / event.total) * 100);
            data.onProgress(progress);
          }
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(fileId);
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });
        
        xhr.open('POST', url);
        xhr.send(formData);
      });
    },
    {
      onSuccess: (fileId) => {
        // Invalidate photos query to refetch with new photo
        queryClient.invalidateQueries({ queryKey: ['photos'] });
        return fileId;
      },
    }
  );
};

// Export types for convenience
export type { Photo };