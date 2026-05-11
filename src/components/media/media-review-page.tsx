'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import Alert from '@/components/ui/alert';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import { useApiQuery } from '@/lib/hooks/use-api';
import { mediaApi, MediaReviewItem } from '@/lib/api/media';

interface MediaReviewPageProps {
  locale: string;
  role: 'admin' | 'coordinator';
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ownerLabel(item: MediaReviewItem): string {
  return item.uploadedByName || item.uploadedByEmail || 'Unknown user';
}

export function MediaReviewPage({ locale, role }: MediaReviewPageProps) {
  const { data, isLoading, error } = useApiQuery<MediaReviewItem[]>(
    ['media-review', role],
    () => mediaApi.reviewList({ limit: 100 })
  );

  const media = data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Media Review</h1>
        <p className="mt-1 text-sm text-gray-600">
          Review uploaded activity images and videos. Cleanup actions are intentionally not enabled yet.
        </p>
      </div>

      {isLoading && <SkeletonLoader type="table" />}

      {error && (
        <Alert type="error" title="Unable to load media">
          Media review data could not be loaded. Please try again.
        </Alert>
      )}

      {!isLoading && !error && media.length === 0 && (
        <Card>
          <div className="py-10 text-center">
            <h2 className="text-lg font-semibold text-gray-900">No media found</h2>
            <p className="mt-2 text-sm text-gray-600">Uploaded activity media will appear here.</p>
          </div>
        </Card>
      )}

      {!isLoading && !error && media.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Preview</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Context</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">School/Pilot</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Uploaded By</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Uploaded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {media.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 align-top">
                      <a href={item.url} target="_blank" rel="noreferrer" className="block h-20 w-24 overflow-hidden rounded border bg-gray-50">
                        {item.mediaType === 'video' ? (
                          <video src={item.url} className="h-full w-full object-cover" muted preload="metadata" />
                        ) : (
                          <img src={item.url} alt={item.caption || item.filename} className="h-full w-full object-cover" />
                        )}
                      </a>
                      <div className="mt-1 text-xs capitalize text-gray-500">{item.mediaType} · {formatBytes(item.size)}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Link href={`/${locale}/${role}/activities/${item.activityId}`} className="text-sm font-medium text-green-700 hover:text-green-800">
                        {item.activityTitle || 'Activity report'}
                      </Link>
                      <p className="mt-1 max-w-xs truncate text-xs text-gray-500" title={item.caption || item.activityDescription || item.filename}>
                        {item.caption || item.activityDescription || item.filename}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-gray-700">
                      <div>{item.schoolName || 'Unknown school'}</div>
                      <div className="text-xs text-gray-500">{item.pilotName || 'Unknown pilot'}</div>
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-gray-700">
                      <div>{ownerLabel(item)}</div>
                      {item.uploadedByEmail && item.uploadedByName && (
                        <div className="text-xs text-gray-500">{item.uploadedByEmail}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-gray-700">
                      {item.uploadedAt ? new Date(item.uploadedAt).toLocaleDateString() : 'Unknown'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
