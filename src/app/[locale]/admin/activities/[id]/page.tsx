'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';
import EmptyState from '@/components/ui/empty-state';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import { useApiQuery } from '@/lib/hooks/use-api';
import { api } from '@/lib/api';
import { Activity, ApiResponse } from '@/lib/types';
import {
  ArrowLeftIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  UsersIcon,
  PhotoIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';

type MediaType = 'photo' | 'video' | 'document' | string;

type MediaApiItem = {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  uploadedAt?: string;
  displayOrder?: number;
  media_type?: MediaType; // backend may return snake_case
  mediaType?: MediaType;  // or camelCase
  file_type?: string;
  fileType?: string;
  original_filename?: string;
  originalFilename?: string;
};

export default function ActivityReportPage() {
  const params = useParams();
  const id = params.id as string;

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Fetch activity details
  const {
    data: activityResponse,
    isLoading: isLoadingActivity,
    error: activityError,
    refetch: refetchActivity,
  } = useApiQuery<ApiResponse<Activity>>(['activity', id], () => api.get(`/activities/${id}`));

  // Fetch media for this activity (photos + videos)
  const {
    data: mediaResponse,
    isLoading: isLoadingMedia,
    error: mediaError,
    refetch: refetchMedia,
  } = useApiQuery<ApiResponse<MediaApiItem[]>>(['activity-media', id], () =>
    api.get(`/activities/${id}/media`)
  );

  const activity = activityResponse?.data;

  const mediaItems: MediaApiItem[] = useMemo(() => {
    const items = mediaResponse?.data || [];
    // Sort by displayOrder if present; otherwise keep backend order
    return [...items].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [mediaResponse]);

  const counts = useMemo(() => {
    const normType = (m: MediaApiItem) => (m.mediaType ?? m.media_type ?? 'photo').toString();
    const photos = mediaItems.filter((m) => normType(m) === 'photo');
    const videos = mediaItems.filter((m) => normType(m) === 'video');
    const docs = mediaItems.filter((m) => normType(m) === 'document');
    return { photos: photos.length, videos: videos.length, docs: docs.length, total: mediaItems.length };
  }, [mediaItems]);

  const handlePrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) setSelectedIndex(selectedIndex - 1);
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < mediaItems.length - 1) setSelectedIndex(selectedIndex + 1);
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
            <Button variant="outline" onClick={() => refetchActivity()}>
              Try Again
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  const getMediaType = (m: MediaApiItem): string => (m.mediaType ?? m.media_type ?? 'photo').toString();

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
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              activity.status === 'approved'
                ? 'bg-green-100 text-green-800'
                : activity.status === 'completed'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
            }`}
          >
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
              {activity.volunteer?.email && <p className="text-sm text-gray-500 mt-1">{activity.volunteer.email}</p>}
            </div>

            {/* School */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <BuildingOfficeIcon className="h-4 w-4" />
                School
              </h3>
              <p className="text-gray-900">{activity.school_name || activity.school?.name || activity.school_id || '—'}</p>
            </div>

            {/* Pilot */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <ChartBarIcon className="h-4 w-4" />
                Pilot
              </h3>
              <p className="text-gray-900">{activity.pilot_name || activity.pilot?.name || activity.pilot_id || '—'}</p>
            </div>

            {/* Dates */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Scheduled Date
              </h3>
              <p className="text-gray-900">{new Date(activity.scheduled_date).toLocaleDateString()}</p>
              {activity.actual_date && (
                <div className="mt-2">
                  <h4 className="text-xs font-medium text-gray-500">Actual Date</h4>
                  <p className="text-sm text-gray-900">{new Date(activity.actual_date).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            {/* Participants */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <UsersIcon className="h-4 w-4" />
                Participants
              </h3>
              <p className="text-gray-900">{activity.number_of_participants || '—'}</p>
            </div>

            {/* Engagement Level */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Engagement Level</h3>
              {activity.engagement_level ? (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    activity.engagement_level === 'high' || activity.engagement_level === 3
                      ? 'bg-green-100 text-green-800'
                      : activity.engagement_level === 'medium' || activity.engagement_level === 2
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }`}
                >
                  {activity.engagement_level === 'high'
                    ? 'High'
                    : activity.engagement_level === 'medium'
                      ? 'Medium'
                      : activity.engagement_level === 'low'
                        ? 'Low'
                        : (activity.engagement_level as any)}
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

      {/* Media Section (photos + videos) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Media ({counts.total})</h2>
            <p className="text-sm text-gray-500">
              Photos: {counts.photos} • Videos: {counts.videos}
              {counts.docs ? ` • Documents: ${counts.docs}` : ''}
            </p>
          </div>
          {isLoadingMedia && <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />}
        </div>

        {isLoadingMedia ? (
          <Card className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          </Card>
        ) : mediaError ? (
          <Alert type="error" title="Failed to load media">
            {mediaError.message}
            <div className="mt-4">
              <Button variant="outline" onClick={() => refetchMedia()}>
                Try Again
              </Button>
            </div>
          </Alert>
        ) : counts.total === 0 ? (
          <EmptyState
            icon={<PhotoIcon className="h-12 w-12 text-gray-400" />}
            title="No media uploaded for this activity"
            description="The volunteer didn't upload any photos or videos for this activity report."
          />
        ) : (
          <Card className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {mediaItems.map((item, index) => {
                const type = getMediaType(item);
                const thumb = item.thumbnailUrl || item.url;

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedIndex(index)}
                    className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title={item.caption || type}
                  >
                    {type === 'video' ? (
                      <>
                        {/* Use thumbnail if available; otherwise still show a video element */}
                        {item.thumbnailUrl ? (
                          <img
                            src={thumb}
                            alt={item.caption || `Video ${index + 1}`}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <video
                            src={item.url}
                            className="h-full w-full object-cover"
                            muted
                            preload="metadata"
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="rounded-full bg-black/50 p-2">
                            <VideoCameraIcon className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      </>
                    ) : type === 'document' ? (
                      <div className="h-full w-full flex flex-col items-center justify-center p-3 text-center">
                        <div className="rounded-full bg-gray-200 p-2 mb-2">
                          <VideoCameraIcon className="h-5 w-5 text-gray-700" />
                        </div>
                        <p className="text-xs text-gray-700 line-clamp-3">
                          {item.caption || item.originalFilename || item.original_filename || 'Open document'}
                        </p>
                      </div>
                    ) : (
                      <img
                        src={thumb}
                        alt={item.caption || `Photo ${index + 1}`}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    )}

                    {item.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent p-2">
                        <p className="text-xs text-white truncate">{item.caption}</p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Lightbox Overlay (photo or video) */}
      {selectedIndex !== null && mediaItems[selectedIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button onClick={() => setSelectedIndex(null)} className="absolute top-4 right-4 text-white hover:text-gray-300">
            <XMarkIcon className="h-8 w-8" />
          </button>

          <button
            onClick={handlePrevious}
            disabled={selectedIndex === 0}
            className="absolute left-4 text-white hover:text-gray-300 disabled:opacity-50"
          >
            <ChevronLeftIcon className="h-8 w-8" />
          </button>

          <button
            onClick={handleNext}
            disabled={selectedIndex === mediaItems.length - 1}
            className="absolute right-4 text-white hover:text-gray-300 disabled:opacity-50"
          >
            <ChevronRightIcon className="h-8 w-8" />
          </button>

          <div className="max-w-4xl w-full max-h-[80vh]">
            {getMediaType(mediaItems[selectedIndex]) === 'video' ? (
              <video
                src={mediaItems[selectedIndex].url}
                controls
                autoPlay
                className="max-h-[80vh] w-full object-contain bg-black rounded"
              />
            ) : getMediaType(mediaItems[selectedIndex]) === 'document' ? (
              <div className="bg-white rounded p-6">
                <p className="text-gray-900 font-medium mb-2">Document</p>
                <a
                  href={mediaItems[selectedIndex].url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Open document in new tab
                </a>
                {mediaItems[selectedIndex].caption && (
                  <p className="mt-3 text-gray-700 whitespace-pre-wrap">{mediaItems[selectedIndex].caption}</p>
                )}
              </div>
            ) : (
              <img
                src={mediaItems[selectedIndex].url}
                alt={mediaItems[selectedIndex].caption || `Media ${selectedIndex + 1}`}
                className="max-h-[80vh] w-full object-contain"
              />
            )}

            {mediaItems[selectedIndex].caption && getMediaType(mediaItems[selectedIndex]) !== 'document' && (
              <div className="mt-4 text-center text-white">
                <p className="text-lg">{mediaItems[selectedIndex].caption}</p>
              </div>
            )}
          </div>

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white">
            {selectedIndex + 1} of {mediaItems.length}
          </div>
        </div>
      )}
    </div>
  );
}
