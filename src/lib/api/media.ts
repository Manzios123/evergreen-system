// lib/api/media.ts - NEW FILE
import { apiRequest } from './api';

export interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl: string;
  filename: string;
  caption?: string;
  uploadedAt: string;
  size: number;
  displayOrder: number;
  mediaType: 'photo' | 'video' | 'document';
  duration?: number;
  width?: number;
  height?: number;
  compressionProfile?: 'low' | 'medium' | 'high';
}

export interface MediaReviewItem {
  id: string;
  activityId: string;
  url: string;
  filename: string;
  caption?: string | null;
  mediaType: 'photo' | 'video' | 'document';
  fileType?: string | null;
  size: number;
  uploadedAt: string;
  status: string;
  activityTitle?: string | null;
  activityDescription?: string | null;
  schoolName?: string | null;
  pilotId?: string | null;
  pilotName?: string | null;
  uploadedByName?: string | null;
  uploadedByEmail?: string | null;
}

export const mediaApi = {
  // Upload media for an activity
  upload: (activityId: string, file: File, mediaType: 'photo' | 'video', caption?: string) => {
    const formData = new FormData();
    formData.append('media', file);
    formData.append('media_type', mediaType);
    if (caption) {
      formData.append('caption', caption);
    }
    
    return apiRequest<MediaItem>(`/activities/${activityId}/media`, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type, let browser set it with boundary
      },
    });
  },

  // Delete media
  delete: (mediaId: string) => apiRequest<{ 
    success: boolean; 
    message: string;
  }>(`/media/${mediaId}`, {
    method: 'DELETE',
  }),

  // List media for an activity
  list: async (activityId: string): Promise<MediaItem[]> => {
    const response = await apiRequest<{ data?: MediaItem[] } | MediaItem[]>(`/activities/${activityId}/media`);
    return Array.isArray(response) ? response : response.data || [];
  },

  reviewList: async (params?: { media_type?: 'photo' | 'video'; pilot_id?: string; school_id?: string; limit?: number }): Promise<MediaReviewItem[]> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await apiRequest<{ data?: MediaReviewItem[] } | MediaReviewItem[]>(`/media/review${query}`);
    return Array.isArray(response) ? response : response.data || [];
  },
};
