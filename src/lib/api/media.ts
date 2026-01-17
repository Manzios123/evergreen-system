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
  list: (activityId: string) => apiRequest<MediaItem[]>(`/activities/${activityId}/media`),
};