// lib/api/media.ts - NEW FILE
import { apiRequest } from './api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

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

export interface MediaReviewStats {
  totalFiles: number;
  totalImages: number;
  totalVideos: number;
  storageUsed: number;
  missingSizeCount: number;
}

export interface MediaReviewPagination {
  limit: number;
  offset: number;
  total: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface MediaReviewParams {
  media_type?: 'photo' | 'video' | '';
  school?: string;
  school_id?: string;
  uploaded_by?: string;
  activity?: string;
  activity_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface MediaReviewResponse {
  data: MediaReviewItem[];
  count: number;
  pagination: MediaReviewPagination;
  stats: MediaReviewStats;
}

function buildQuery(params?: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

async function fetchBlob(endpoint: string): Promise<Blob> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'omit',
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    const errorData = contentType.includes('application/json')
      ? await response.json()
      : { error: await response.text() };
    throw new Error(errorData.error || errorData.message || 'Download failed');
  }

  return response.blob();
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

  // List media for an activity
  list: async (activityId: string): Promise<MediaItem[]> => {
    const response = await apiRequest<{ data?: MediaItem[] } | MediaItem[]>(`/activities/${activityId}/media`);
    return Array.isArray(response) ? response : response.data || [];
  },

  reviewList: async (params?: MediaReviewParams): Promise<MediaReviewResponse> => {
    const response = await apiRequest<MediaReviewResponse | MediaReviewItem[]>(`/media/review${buildQuery(params)}`);
    if (Array.isArray(response)) {
      return {
        data: response,
        count: response.length,
        pagination: {
          limit: params?.limit || 15,
          offset: params?.offset || 0,
          total: response.length,
          hasNext: false,
          hasPrevious: false,
        },
        stats: {
          totalFiles: response.length,
          totalImages: response.filter((item) => item.mediaType === 'photo').length,
          totalVideos: response.filter((item) => item.mediaType === 'video').length,
          storageUsed: response.reduce((sum, item) => sum + (item.size || 0), 0),
          missingSizeCount: 0,
        },
      };
    }
    return response;
  },

  download: (mediaId: string, disposition: 'attachment' | 'inline' = 'attachment') =>
    fetchBlob(`/media/${mediaId}/download${buildQuery({ disposition })}`),

  delete: (mediaId: string) => apiRequest<{
    success: boolean;
    message: string;
    hardDeleted?: boolean;
    storageFreed?: number;
  }>(`/media/${mediaId}`, {
    method: 'DELETE',
  }),

  downloadManifest: (params?: MediaReviewParams & { format?: 'csv' | 'json' }) =>
    fetchBlob(`/media/review/manifest${buildQuery(params)}`),
};
