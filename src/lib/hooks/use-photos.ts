// apps/evergreen-web/src/lib/hooks/use-photos.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { photosApi } from '@/lib/api/photos';
import { Photo } from '@/lib/types';
import { useCallback } from 'react';

// Hook for getting photos
export const usePhotos = (params?: {
  activityId?: string;
  volunteerId?: string;
  status?: 'approved' | 'pending' | 'rejected';
  limit?: number;
  offset?: number;
  tags?: string[];
  dateRange?: { start: string; end: string };
}) => {
  return useQuery({
    queryKey: ['photos', params],
    queryFn: async () => {
      const response = await photosApi.getPhotos({
        activityId: params?.activityId,
        volunteerId: params?.volunteerId,
        status: params?.status,
        limit: params?.limit,
        offset: params?.offset,
        tags: params?.tags,
        dateRange: params?.dateRange,
      });
      return response.data?.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};

// Hook for getting a single photo
export const usePhoto = (id: string) => {
  return useQuery({
    queryKey: ['photo', id],
    queryFn: async () => {
      const response = await photosApi.getPhoto(id);
      return response.data;
    },
    enabled: !!id,
  });
};

// Hook for deleting a photo
export const useDeletePhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photoId: string) => photosApi.deletePhoto(photoId),
    onMutate: async (photoId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['photos'] });
      
      // Snapshot previous value
      const previousPhotos = queryClient.getQueryData(['photos']);
      
      // Optimistically update cache
      queryClient.setQueryData(['photos'], (old: any) => 
        old ? old.filter((photo: Photo) => photo.id !== photoId) : []
      );
      
      return { previousPhotos };
    },
    onError: (err, photoId, context) => {
      // Rollback on error
      if (context?.previousPhotos) {
        queryClient.setQueryData(['photos'], context.previousPhotos);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['photos'] });
    },
  });
};

// Hook for updating photo metadata
export const useUpdatePhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { 
      id: string; 
      data: { 
        description?: string; 
        tags?: string[]; 
        metadata?: Photo['metadata']; 
      } 
    }) => photosApi.updatePhoto(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['photo', id] });
      await queryClient.cancelQueries({ queryKey: ['photos'] });
      
      const previousPhoto = queryClient.getQueryData(['photo', id]);
      const previousPhotos = queryClient.getQueryData(['photos']);
      
      // Optimistically update single photo
      queryClient.setQueryData(['photo', id], (old: any) => 
        old ? { ...old, ...data } : null
      );
      
      // Optimistically update in photos list
      queryClient.setQueryData(['photos'], (old: any) =>
        old ? old.map((photo: Photo) => 
          photo.id === id ? { ...photo, ...data } : photo
        ) : []
      );
      
      return { previousPhoto, previousPhotos };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPhoto) {
        queryClient.setQueryData(['photo', variables.id], context.previousPhoto);
      }
      if (context?.previousPhotos) {
        queryClient.setQueryData(['photos'], context.previousPhotos);
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['photo', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['photos'] });
    },
  });
};

// Hook for reviewing photos
export const useReviewPhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      id, 
      action, 
      rejectionReason 
    }: { 
      id: string; 
      action: 'approve' | 'reject'; 
      rejectionReason?: string;
    }) => photosApi.reviewPhoto(id, action, rejectionReason),
    onSuccess: (data, variables) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      queryClient.invalidateQueries({ queryKey: ['photo', variables.id] });
    },
  });
};

// Hook for uploading multiple photos
export const useUploadMultiplePhotos = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      files, 
      activityId, 
      description 
    }: { 
      files: File[]; 
      activityId: string; 
      description?: string;
    }) => photosApi.uploadMultiple(files, activityId, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
    },
  });
};

// Hook for activity photos
export const useActivityPhotos = (activityId: string, params?: {
  status?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: ['activity-photos', activityId, params],
    queryFn: async () => {
      const response = await photosApi.getActivityPhotos(activityId, params);
      return response.data?.data || [];
    },
    enabled: !!activityId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// Hook for volunteer photos
export const useVolunteerPhotos = (volunteerId: string, params?: {
  limit?: number;
  offset?: number;
  status?: string;
}) => {
  return useQuery({
    queryKey: ['volunteer-photos', volunteerId, params],
    queryFn: async () => {
      const response = await photosApi.getVolunteerPhotos(volunteerId, params);
      return response.data?.data || [];
    },
    enabled: !!volunteerId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// Hook for chunked upload
export const useChunkedUpload = () => {
  const queryClient = useQueryClient();

  const startChunkedUploadMutation = useMutation({
    mutationFn: photosApi.startChunkedUpload,
  });

  const uploadChunkMutation = useMutation({
    mutationFn: ({ sessionId, formData }: { 
      sessionId: string; 
      formData: FormData;
    }) => photosApi.uploadChunk(sessionId, formData),
  });

  const completeChunkedUploadMutation = useMutation({
    mutationFn: photosApi.completeChunkedUpload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
    },
  });

  const startChunkedUpload = useCallback(
    (data: Parameters<typeof photosApi.startChunkedUpload>[0]) =>
      startChunkedUploadMutation.mutateAsync(data),
    [startChunkedUploadMutation]
  );

  const uploadChunk = useCallback(
    (sessionId: string, formData: FormData) =>
      uploadChunkMutation.mutateAsync({ sessionId, formData }),
    [uploadChunkMutation]
  );

  const completeChunkedUpload = useCallback(
    (sessionId: string) =>
      completeChunkedUploadMutation.mutateAsync(sessionId),
    [completeChunkedUploadMutation]
  );

  const isLoading = 
    startChunkedUploadMutation.isPending || 
    uploadChunkMutation.isPending || 
    completeChunkedUploadMutation.isPending;

  return {
    startChunkedUpload,
    uploadChunk,
    completeChunkedUpload,
    isLoading,
    error: startChunkedUploadMutation.error || uploadChunkMutation.error || completeChunkedUploadMutation.error,
  };
};

// Hook for generating thumbnails
export const useGenerateThumbnail = () => {
  return useMutation({
    mutationFn: ({ 
      id, 
      size 
    }: { 
      id: string; 
      size?: { width: number; height: number };
    }) => photosApi.generateThumbnail(id, size),
  });
};

// Hook for getting upload configuration
export const useUploadConfig = () => {
  return useQuery({
    queryKey: ['upload-config'],
    queryFn: async () => {
      const response = await photosApi.getUploadConfig();
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
};

// Hook for presigned URL upload
export const usePresignedUrlUpload = () => {
  return useMutation({
    mutationFn: (data: Parameters<typeof photosApi.getPresignedUrl>[0]) =>
      photosApi.getPresignedUrl(data),
  });
};

// Hook for direct upload
export const useDirectUpload = () => {
  return useMutation({
    mutationFn: ({ 
      photoId, 
      file 
    }: { 
      photoId: string; 
      file: File;
    }) => photosApi.uploadDirect(photoId, file),
  });
};

// NEW: Hook for batch photo operations
export const useBatchPhotoOperations = () => {
  const queryClient = useQueryClient();
  
  const deletePhotos = useMutation({
    mutationFn: (photoIds: string[]) => {
      // Delete photos one by one if API doesn't support batch delete
      return Promise.all(photoIds.map(id => photosApi.deletePhoto(id)));
    },
    onMutate: async (photoIds) => {
      await queryClient.cancelQueries({ queryKey: ['photos'] });
      const previousPhotos = queryClient.getQueryData(['photos']);
      
      queryClient.setQueryData(['photos'], (old: any) => 
        old ? old.filter((photo: Photo) => !photoIds.includes(photo.id)) : []
      );
      
      return { previousPhotos };
    },
    onError: (err, photoIds, context) => {
      if (context?.previousPhotos) {
        queryClient.setQueryData(['photos'], context.previousPhotos);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
    },
  });

  return {
    deletePhotos,
  };
};