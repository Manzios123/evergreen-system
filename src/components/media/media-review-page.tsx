'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';
import SkeletonLoader from '@/components/ui/skeleton-loader';
import { useApiQuery } from '@/lib/hooks/use-api';
import { mediaApi, MediaReviewItem, MediaReviewParams } from '@/lib/api/media';

interface MediaReviewPageProps {
  locale: string;
  role: 'admin' | 'coordinator';
}

const PAGE_SIZE = 15;

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function ownerLabel(item: MediaReviewItem): string {
  return item.uploadedByName || item.uploadedByEmail || 'Unknown user';
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function SecureMediaPreview({ item, className = 'h-20 w-24' }: { item: MediaReviewItem; className?: string }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let nextUrl: string | null = null;

    mediaApi.download(item.id, 'inline')
      .then((blob) => {
        if (!active) return;
        nextUrl = window.URL.createObjectURL(blob);
        setObjectUrl(nextUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      if (nextUrl) window.URL.revokeObjectURL(nextUrl);
    };
  }, [item.id]);

  if (failed) {
    return (
      <div className={`${className} flex items-center justify-center rounded border bg-gray-50 text-xs text-gray-500`}>
        Preview unavailable
      </div>
    );
  }

  if (!objectUrl) {
    return <div className={`${className} animate-pulse rounded border bg-gray-100`} />;
  }

  return (
    <div className={`${className} overflow-hidden rounded border bg-gray-50`}>
      {item.mediaType === 'video' ? (
        <video src={objectUrl} className="h-full w-full object-cover" muted preload="metadata" controls={className.includes('max-h')} />
      ) : (
        <img src={objectUrl} alt={item.caption || item.filename} className="h-full w-full object-cover" />
      )}
    </div>
  );
}

export function MediaReviewPage({ locale, role }: MediaReviewPageProps) {
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<MediaReviewItem | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    media_type: '',
    school: '',
    uploaded_by: '',
    activity: '',
    start_date: '',
    end_date: '',
  });

  const queryParams = useMemo<MediaReviewParams>(() => ({
    ...filters,
    media_type: filters.media_type as MediaReviewParams['media_type'],
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  }), [filters, page]);

  const { data, isLoading, error, refetch } = useApiQuery(
    ['media-review', role, queryParams],
    () => mediaApi.reviewList(queryParams)
  );

  const media = data?.data || [];
  const stats = data?.stats;
  const pagination = data?.pagination;
  const totalPages = Math.max(1, Math.ceil((pagination?.total || 0) / PAGE_SIZE));

  const updateFilter = (name: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ media_type: '', school: '', uploaded_by: '', activity: '', start_date: '', end_date: '' });
    setPage(1);
  };

  const handleDownload = async (item: MediaReviewItem) => {
    setErrorMessage(null);
    try {
      const blob = await mediaApi.download(item.id);
      downloadBlob(blob, item.filename || `${item.id}`);
    } catch (error: any) {
      setErrorMessage(error.message || 'Download failed');
    }
  };

  const handleDelete = async (item: MediaReviewItem) => {
    const confirmed = window.confirm(
      `Permanently delete "${item.filename}"?\n\nThis will remove the media from storage and the database. This cannot be undone.`
    );
    if (!confirmed) return;

    setErrorMessage(null);
    setMessage(null);

    try {
      await mediaApi.delete(item.id);
      setMessage('Media permanently deleted.');
      setSelectedItem(null);
      refetch();
    } catch (error: any) {
      setErrorMessage(error.message || 'Delete failed');
    }
  };

  const handleManifestDownload = async (format: 'csv' | 'json') => {
    setErrorMessage(null);
    try {
      const blob = await mediaApi.downloadManifest({ ...filters, media_type: filters.media_type as any, format });
      downloadBlob(blob, `media-manifest-${new Date().toISOString().slice(0, 10)}.${format}`);
    } catch (error: any) {
      setErrorMessage(error.message || 'Manifest download failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media Review</h1>
          <p className="mt-1 text-sm text-gray-600">
            Review uploaded activity images and videos. Counts and storage are scoped to the current filters.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => handleManifestDownload('csv')}>
            Download CSV Manifest
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleManifestDownload('json')}>
            Download JSON Manifest
          </Button>
        </div>
      </div>

      {message && <Alert type="success">{message}</Alert>}
      {errorMessage && <Alert type="error">{errorMessage}</Alert>}
      {error && (
        <Alert type="error" title="Unable to load media">
          Media review data could not be loaded. Please try again.
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm font-medium text-gray-500">Total media files</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{stats?.totalFiles ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-gray-500">Total images</p>
          <p className="mt-2 text-2xl font-bold text-blue-700">{stats?.totalImages ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-gray-500">Total videos</p>
          <p className="mt-2 text-2xl font-bold text-purple-700">{stats?.totalVideos ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-gray-500">Storage used</p>
          <p className="mt-2 text-2xl font-bold text-green-700">{formatBytes(stats?.storageUsed ?? 0)}</p>
          {!!stats?.missingSizeCount && (
            <p className="mt-1 text-xs text-amber-700">{stats.missingSizeCount} file size value(s) unavailable</p>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Type</span>
            <select
              value={filters.media_type}
              onChange={(event) => updateFilter('media_type', event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="photo">Images</option>
              <option value="video">Videos</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">School</span>
            <input value={filters.school} onChange={(event) => updateFilter('school', event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="School name" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Uploaded by</span>
            <input value={filters.uploaded_by} onChange={(event) => updateFilter('uploaded_by', event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Name or email" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Activity</span>
            <input value={filters.activity} onChange={(event) => updateFilter('activity', event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Activity title" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">From</span>
            <input type="date" value={filters.start_date} onChange={(event) => updateFilter('start_date', event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">To</span>
            <input type="date" value={filters.end_date} onChange={(event) => updateFilter('end_date', event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </label>
        </div>
        <div className="mt-3 flex justify-end">
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      </Card>

      {isLoading && <SkeletonLoader type="table" />}

      {!isLoading && !error && media.length === 0 && (
        <Card>
          <div className="py-10 text-center">
            <h2 className="text-lg font-semibold text-gray-900">No media found</h2>
            <p className="mt-2 text-sm text-gray-600">Try clearing filters or checking another date range.</p>
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
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {media.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 align-top">
                      <SecureMediaPreview item={item} />
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
                    <td className="px-4 py-3 align-top">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedItem(item)}>View</Button>
                        <Button variant="outline" size="sm" onClick={() => handleDownload(item)}>Download</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(item)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
              Page {page} of {totalPages} · {pagination?.total || 0} filtered file{pagination?.total === 1 ? '' : 's'}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={!pagination?.hasPrevious} onClick={() => setPage((current) => Math.max(current - 1, 1))}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={!pagination?.hasNext} onClick={() => setPage((current) => current + 1)}>
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedItem.filename}</h2>
                <p className="mt-1 text-sm text-gray-600">{selectedItem.activityTitle || 'Activity report'}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedItem(null)}>Close</Button>
            </div>
            <div className="mt-4">
              <SecureMediaPreview item={selectedItem} className="max-h-[55vh] w-full" />
            </div>
            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div><dt className="font-medium text-gray-500">School</dt><dd>{selectedItem.schoolName || 'Unknown school'}</dd></div>
              <div><dt className="font-medium text-gray-500">Pilot</dt><dd>{selectedItem.pilotName || 'Unknown pilot'}</dd></div>
              <div><dt className="font-medium text-gray-500">Uploaded by</dt><dd>{ownerLabel(selectedItem)}</dd></div>
              <div><dt className="font-medium text-gray-500">Uploaded</dt><dd>{selectedItem.uploadedAt ? new Date(selectedItem.uploadedAt).toLocaleString() : 'Unknown'}</dd></div>
              <div><dt className="font-medium text-gray-500">Type</dt><dd className="capitalize">{selectedItem.mediaType}</dd></div>
              <div><dt className="font-medium text-gray-500">Size</dt><dd>{formatBytes(selectedItem.size)}</dd></div>
            </dl>
            {selectedItem.caption && <p className="mt-4 rounded bg-gray-50 p-3 text-sm text-gray-700">{selectedItem.caption}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleDownload(selectedItem)}>Download</Button>
              <Button variant="destructive" onClick={() => handleDelete(selectedItem)}>Delete Permanently</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
