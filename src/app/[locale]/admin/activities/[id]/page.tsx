'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';
import EmptyState from '@/components/ui/empty-state';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import { useApiQuery } from '@/lib/hooks/use-api';
import { api } from '@/lib/api';
import { Activity, Photo, ApiResponse } from '@/lib/types';
import {
  ArrowLeftIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  UsersIcon,
  DocumentTextIcon,
  PhotoIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface ActivityApiResponse {
  data: Activity;
}

interface PhotosApiResponse {
  data: Photo[];
  count: number;
}

interface PhotoApiItem extends Omit<Photo, 'uploadedAt'> {
  thumbnailUrl?: string;
  caption?: string;
  uploadedAt?: string;
  displayOrder?: number;
}

export default function ActivityReportPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  // Fetch activity details
  const {
    data: activityResponse,
    isLoading: isLoadingActivity,
    error: activityError,
    refetch: refetchActivity,
  } = useApiQuery<ApiResponse<Activity>>(
    ['activity', id],
    () => api.get(`/activities/${id}`)
  );

  // Fetch photos for this activity
  const {
    data: photosResponse,
    isLoading: isLoadingPhotos,
    error: photosError,
    refetch: refetchPhotos,
  } = useApiQuery<ApiResponse<PhotoApiItem[]>>(
    ['activity-photos', id],
    () => api.get(`/activities/${id}/media`)
  );

  const activity = activityResponse?.data;
  const photos: PhotoApiItem[] = photosResponse?.data || [];
  const photosCount = photosResponse?.count || 0;

  const handlePreviousPhoto = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };

  const handleNextPhoto = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex < photos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  };

  if (isLoadingActivity) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <SkeletonLoader type="card" />
        </div>
        <Card className="p-6">
          <SkeletonLoader type="form" rows={6} />
        </Card>
      </div>
    );
  }

  if (activityError || !activity) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/activities"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Activities
          </Link>
        </div>
        <Alert type="error" title="Failed to load activity">
          {activityError?.message || 'Activity not found'}
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => refetchActivity()}
            >
              Try Again
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/activities"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Activities
          </Link>
          <div className="h-6 w-px bg-gray-300 hidden sm:block" />
          <h1 className="text-2xl font-bold text-gray-900">Activity Report</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            activity.status === 'approved' ? 'bg-green-100 text-green-800' :
            activity.status === 'completed' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {activity.status?.charAt(0).toUpperCase() + activity.status?.slice(1)}
          </span>
        </div>
      </div>

      {/* Activity Details */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Title and Description */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-900">{activity.title}</h2>
            <p className="mt-2 text-gray-600">{activity.description}</p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Volunteer */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Volunteer
              </h3>
              <p className="text-gray-900">
                {activity.volunteer_name || activity.volunteer?.full_name || activity.volunteer_id || '—'}
              </p>
              {activity.volunteer?.email && (
                <p className="text-sm text-gray-500 mt-1">{activity.volunteer.email}</p>
              )}
            </div>

            {/* School */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <BuildingOfficeIcon className="h-4 w-4" />
                School
              </h3>
              <p className="text-gray-900">
                {activity.school_name || activity.school?.name || activity.school_id || '—'}
              </p>
            </div>

            {/* Pilot */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <ChartBarIcon className="h-4 w-4" />
                Pilot
              </h3>
              <p className="text-gray-900">
                {activity.pilot_name || activity.pilot?.name || activity.pilot_id || '—'}
              </p>
            </div>

            {/* Dates */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Scheduled Date
              </h3>
              <p className="text-gray-900">
                {new Date(activity.scheduled_date).toLocaleDateString()}
              </p>
              {activity.actual_date && (
                <div className="mt-2">
                  <h4 className="text-xs font-medium text-gray-500">Actual Date</h4>
                  <p className="text-sm text-gray-900">
                    {new Date(activity.actual_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Participants */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <UsersIcon className="h-4 w-4" />
                Participants
              </h3>
              <p className="text-gray-900">
                {activity.number_of_participants || '—'}
              </p>
            </div>

            {/* Engagement Level */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Engagement Level
              </h3>
              {activity.engagement_level ? (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  activity.engagement_level === 'high' || activity.engagement_level === 3 ? 'bg-green-100 text-green-800' :
                  activity.engagement_level === 'medium' || activity.engagement_level === 2 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {activity.engagement_level === 'high' ? 'High' :
                   activity.engagement_level === 'medium' ? 'Medium' :
                   activity.engagement_level === 'low' ? 'Low' :
                   activity.engagement_level}
                </span>
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </div>
          </div>

          {/* Narrative Sections */}
          {(activity.volunteer_notes || activity.student_quotes || activity.coordinator_feedback) && (
            <div className="pt-6 border-t space-y-6">
              {activity.volunteer_notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Volunteer Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{activity.volunteer_notes}</p>
                  </div>
                </div>
              )}

              {activity.student_quotes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Student Quotes</h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{activity.student_quotes}</p>
                  </div>
                </div>
              )}

              {activity.coordinator_feedback && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Coordinator Feedback</h3>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{activity.coordinator_feedback}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Photos Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Photos ({photosCount})</h2>
          {isLoadingPhotos && (
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          )}
        </div>

        {isLoadingPhotos ? (
          <Card className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </Card>
        ) : photosError ? (
          <Alert type="error" title="Failed to load photos">
            {photosError.message}
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => refetchPhotos()}
              >
                Try Again
              </Button>
            </div>
          </Alert>
        ) : photosCount === 0 ? (
          <EmptyState
            icon={<PhotoIcon className="h-12 w-12 text-gray-400" />}
            title="No photos uploaded for this activity"
            description="The volunteer didn't upload any photos for this activity report."
          />
        ) : (
          <Card className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhotoIndex(index)}
                  className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <img
                    src={photo.thumbnailUrl || photo.url}
                    alt={photo.caption || `Photo ${index + 1}`}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  {photo.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent p-2">
                      <p className="text-xs text-white truncate">{photo.caption}</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Lightbox Overlay */}
      {selectedPhotoIndex !== null && photos[selectedPhotoIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button
            onClick={() => setSelectedPhotoIndex(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <XMarkIcon className="h-8 w-8" />
          </button>

          <button
            onClick={handlePreviousPhoto}
            disabled={selectedPhotoIndex === 0}
            className="absolute left-4 text-white hover:text-gray-300 disabled:opacity-50"
          >
            <ChevronLeftIcon className="h-8 w-8" />
          </button>

          <button
            onClick={handleNextPhoto}
            disabled={selectedPhotoIndex === photos.length - 1}
            className="absolute right-4 text-white hover:text-gray-300 disabled:opacity-50"
          >
            <ChevronRightIcon className="h-8 w-8" />
          </button>

          <div className="max-w-4xl max-h-[80vh]">
            <img
              src={photos[selectedPhotoIndex].url}
              alt={photos[selectedPhotoIndex].caption || `Photo ${selectedPhotoIndex + 1}`}
              className="max-h-full max-w-full object-contain"
            />
            {photos[selectedPhotoIndex].caption && (
              <div className="mt-4 text-center text-white">
                <p className="text-lg">{photos[selectedPhotoIndex].caption}</p>
              </div>
            )}
          </div>

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white">
            {selectedPhotoIndex + 1} of {photos.length}
          </div>
        </div>
      )}
    </div>
  );
}