import { api } from './api';
import { Photo, ApiResponse, PaginationParams } from '@/lib/types';

// Direct R2 upload (if using presigned URLs)
export interface UploadConfig {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  maxFiles?: number;
}

export interface PresignedUrlResponse {
  url: string;
  fields: Record<string, string>;
  fileId: string;
  uploadUrl: string;
}

export const photosApi = {
  // Get photos with filters
  getPhotos: (params?: PaginationParams & {
    activityId?: string;
    volunteerId?: string;
    status?: string;
    tags?: string[];
    dateRange?: { start: string; end: string };
  }) =>
    api.get<ApiResponse<Photo[]>>('/photos', params),

  // Get single photo
  getPhoto: (id: string) =>
    api.get<ApiResponse<Photo>>(`/photos/${id}`),

  // Get presigned URL for direct upload to R2
  getPresignedUrl: (data: {
    filename: string;
    contentType: string;
    activityId: string;
    description?: string;
    tags?: string[];
  }) =>
    api.post<ApiResponse<PresignedUrlResponse>>('/photos/upload/url', data),

  // Upload via server (for smaller files or if R2 direct not available)
  uploadPhoto: (formData: FormData) =>
    api.upload<ApiResponse<Photo>>('/photos/upload', formData),

  // Upload multiple photos
  uploadMultiple: (files: File[], activityId: string, description?: string) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('photos', file);
    });
    formData.append('activityId', activityId);
    if (description) {
      formData.append('description', description);
    }
    return api.upload<ApiResponse<Photo[]>>('/photos/upload/multiple', formData);
  },

  // Update photo metadata
  updatePhoto: (id: string, data: {
    description?: string;
    tags?: string[];
    metadata?: Photo['metadata'];
  }) =>
    api.put<ApiResponse<Photo>>(`/photos/${id}`, data),

  // Delete photo
  deletePhoto: (id: string) =>
    api.delete<ApiResponse<void>>(`/photos/${id}`),

  // Review photo (coordinator/admin)
  reviewPhoto: (id: string, action: 'approve' | 'reject', rejectionReason?: string) =>
    api.post<ApiResponse<Photo>>(`/photos/${id}/review`, { action, rejectionReason }),

  // Get activity photos
  getActivityPhotos: (activityId: string, params?: { status?: string }) =>
    api.get<ApiResponse<Photo[]>>(`/photos/activity/${activityId}`, params),

  // Get volunteer photos
  getVolunteerPhotos: (volunteerId: string, params?: PaginationParams) =>
    api.get<ApiResponse<Photo[]>>(`/photos/volunteer/${volunteerId}`, params),

  // Generate thumbnail
  generateThumbnail: (id: string, size?: { width: number; height: number }) =>
    api.post<ApiResponse<{ thumbnailUrl: string }>>(`/photos/${id}/thumbnail`, { size }),

  // Get upload configuration
  getUploadConfig: () =>
    api.get<ApiResponse<UploadConfig>>('/photos/upload/config'),
};