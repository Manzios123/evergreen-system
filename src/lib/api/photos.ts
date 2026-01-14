import { apiRequest } from "./api";

// lib/api/photos.ts
export interface Photo {
  id: string;
  activityId: string;
  volunteerId: string;
  url: string;
  thumbnailUrl: string;
  filename: string;
  caption?: string;
  uploadedAt: string;
  size: number;
  displayOrder: number;
  volunteerName?: string;
}

export interface PhotosResponse {
  data: Photo[];
  count: number;
}

export const photosApi = {
  // Upload photo to activity
  upload: (activityId: string, file: File, caption?: string): Promise<Photo> => {
    const formData = new FormData();
    formData.append('photo', file);
    if (caption) {
      formData.append('caption', caption);
    }

    return apiRequest<Photo>(`/activities/${activityId}/photos`, {
      method: 'POST',
      body: formData,
    });
  },

  // Get photos for activity
  list: (activityId: string): Promise<PhotosResponse> => 
    apiRequest<PhotosResponse>(`/activities/${activityId}/photos`),

  // Delete photo
  delete: (photoId: string): Promise<{ success: boolean; message: string }> => 
    apiRequest<{ success: boolean; message: string }>(`/photos/${photoId}`, {
      method: 'DELETE',
    }),
};