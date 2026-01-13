import { api } from './api';
import { Photo, ApiResponse, PaginationParams } from '@/lib/types';

// Direct R2 upload (if using presigned URLs)
export interface UploadConfig {
  maxSize: number; // in bytes
  allowedTypes: string[];
  maxFiles: number;
  chunkSize: number;
  parallelUploads: number;
  maxRetries: number;
}

export interface PresignedUrlResponse {
  url: string;
  fields: Record<string, string>;
  fileId: string;
  uploadUrl: string;
}

export interface ChunkedUploadStartResponse {
  sessionId: string;
  fileId: string;
  chunkSize: number;
  uploadUrl: string;
}

export interface ChunkedUploadCompleteResponse {
  success: boolean;
  fileId: string;
  photo: Photo;
}

export interface PhotoListResponse {
  data: Photo[];
  count: number;
  hasMore: boolean;
}

export const photosApi = {
  // Get all photos with filters
  getPhotos: (params?: {
    activityId?: string;
    volunteerId?: string;
    status?: string;
    tags?: string[];
    dateRange?: { start: string; end: string };
    limit?: number;
    offset?: number;
  }) => {
    const queryParams: Record<string, any> = {};
    
    if (params?.activityId) {
      // For activity photos, use the activity-specific endpoint
      return photosApi.getActivityPhotos(params.activityId, {
        status: params.status,
        limit: params.limit,
        offset: params.offset
      });
    }
    
    if (params?.volunteerId) queryParams.volunteerId = params.volunteerId;
    if (params?.status && params.status !== 'all') queryParams.status = params.status;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.offset) queryParams.offset = params.offset;
    
    return api.get<ApiResponse<PhotoListResponse>>('/photos', queryParams);
  },

  // Get single photo
  getPhoto: (id: string) => {
    // Note: This endpoint doesn't exist in backend yet
    // We'll need to create it or fetch from activity list
    return api.get<ApiResponse<Photo>>(`/photos/${id}`);
  },

  // Get presigned URL for direct upload to R2
  getPresignedUrl: (data: {
    filename: string;
    contentType: string;
    activityId: string;
    description?: string;
    tags?: string[];
  }) => {
    return api.post<ApiResponse<PresignedUrlResponse>>('/photos/upload/url', data);
  },

  // Upload via server (multipart form)
  uploadPhoto: (formData: FormData, activityId: string) => {
    return api.upload<ApiResponse<Photo>>(`/activities/${activityId}/photos`, formData);
  },

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
  }) => {
    return api.put<ApiResponse<Photo>>(`/photos/${id}`, data);
  },

  // Delete photo
  deletePhoto: (id: string) => {
    return api.delete<ApiResponse<void>>(`/photos/${id}`);
  },

  // Review photo (coordinator/admin)
  reviewPhoto: (id: string, action: 'approve' | 'reject', rejectionReason?: string) => {
    return api.post<ApiResponse<{success: boolean; photoId: string; status: string}>>(
      `/photos/${id}/review`,
      { action, rejectionReason }
    );
  },

  // Get activity photos
  getActivityPhotos: (activityId: string, params?: { 
    status?: string;
    limit?: number;
    offset?: number;
  }) => {
    const queryParams: Record<string, any> = {};
    if (params?.status && params.status !== 'all') queryParams.status = params.status;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.offset) queryParams.offset = params.offset;
    
    return api.get<ApiResponse<PhotoListResponse>>(
      `/api/activities/${activityId}/photos`,
      queryParams
    );
  },

  // Get volunteer photos
  getVolunteerPhotos: (volunteerId: string, params?: PaginationParams) => {
    return api.get<ApiResponse<PhotoListResponse>>('/api/photos', {
      volunteerId,
      limit: params?.limit,
      offset: params?.offset
    });
  },

  // Generate thumbnail
  generateThumbnail: (id: string, size?: { width: number; height: number }) => {
    return api.post<ApiResponse<{ thumbnailUrl: string }>>(
      `/photos/${id}/thumbnail`,
      { size }
    );
  },

  // Get upload configuration
  getUploadConfig: () => {
    return api.get<ApiResponse<UploadConfig>>('/photos/upload/config');
  },

  // ========== CHUNKED UPLOAD ENDPOINTS ==========
  
  // Start chunked upload session
  startChunkedUpload: (data: {
    filename: string;
    totalSize: number;
    totalChunks: number;
    activityId: string;
    fileType?: string;
  }) => {
    return api.post<ApiResponse<ChunkedUploadStartResponse>>(
      '/api/upload/chunked',
      data
    );
  },

  // Upload a chunk - FIXED: Using api.patch instead of api.upload with 3 params
  uploadChunk: (sessionId: string, formData: FormData) => {
    return api.patch<ApiResponse<{
      success: boolean;
      chunkNumber: number;
      uploadedChunks: number[];
    }>>(`/api/upload/chunked/${sessionId}`, formData);
  },

  // Complete chunked upload
  completeChunkedUpload: (sessionId: string) => {
    return api.post<ApiResponse<ChunkedUploadCompleteResponse>>(
      `/api/upload/chunked/${sessionId}/complete`,
      {}
    );
  },

  // ========== DIRECT UPLOAD ENDPOINTS ==========

  // Direct upload to R2 - FIXED: Using api.put instead of api.upload with 3 params
  uploadDirect: (photoId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.put<ApiResponse<{ success: boolean; fileId: string; url: string }>>(
      `/photos/upload/direct/${photoId}`,
      formData
    );
  },

  // ========== EXIF PROCESSING ==========

  // Process EXIF data
  processEXIF: (photoId: string, exifData: any) => {
    return api.post<ApiResponse<{ success: boolean; photoId: string; exifData: any }>>(
      '/photos/process-exif',
      { photoId, exifData }
    );
  },
};