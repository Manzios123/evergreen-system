'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import DataTable from '@/components/ui/data-table';
import Modal from '@/components/ui/modal';
import VideoThumbnail from './video-thumbnail';
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
        className.includes('max-h') ? <video src={objectUrl} className="max-h-[55vh] w-full object-contain" playsInline preload="metadata" controls /> : <VideoThumbnail url={objectUrl} alt={item.caption || item.filename} />
      ) : (
        <img src={objectUrl} alt={item.caption || item.filename} className="h-full w-full object-cover" onError={() => setFailed(true)} />
      )}
    </div>
  );
}

export function MediaReviewPage({ locale, role }: MediaReviewPageProps) {
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<MediaReviewItem[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleting = useRef(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [deleteFailures, setDeleteFailures] = useState<Array<{ name: string; message: string }>>([]);
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

  const media = (data?.data || []).filter(item => !deletedIds.has(item.id));
  const selectedMedia = media.filter(item => selectedIds.has(item.id));
  const allSelected = media.length > 0 && selectedMedia.length === media.length;
  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = selectedMedia.length > 0 && !allSelected;
  }, [selectedMedia.length, allSelected]);
  const toggleSelected = (id: string) => {
    if (deleting.current) return;
    setSelectedIds(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const stats = data?.stats;
  const pagination = data?.pagination;
  const totalPages = Math.max(1, Math.ceil((pagination?.total || 0) / PAGE_SIZE));

  const updateFilter = (name: keyof typeof filters, value: string) => {
    if (deleting.current) return;
    setSelectedIds(new Set());
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    if (deleting.current) return;
    setSelectedIds(new Set());
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

  const handleDelete = (item: MediaReviewItem) => {
    if (!deleting.current) setPendingDelete([item]);
  };

  const refreshMedia = async () => {
    try {
      const result = await refetch();
      setRefreshFailed(Boolean(result.error || result.isError));
    } catch { setRefreshFailed(true); }
  };

  const confirmDelete = async () => {
    if (deleting.current || pendingDelete.length === 0) return;
    deleting.current = true;
    setIsDeleting(true);
    setMessage(null);
    setErrorMessage(null);
    setDeleteFailures([]);
    const items = [...new Map(pendingDelete.map(item => [item.id, item])).values()];
    const removed = new Set<string>();
    const failed = new Set<string>();
    const failures: Array<{ name: string; message: string }> = [];
    for (const item of items) {
      try {
        const response = await mediaApi.delete(item.id);
        if (!response.success) throw new Error(response.message || 'Deletion was not confirmed');
        if (response.hardDeleted !== true) throw new Error('The server did not confirm permanent deletion. Refresh the list and contact support before retrying.');
        removed.add(item.id);
        setDeletedIds(previous => new Set([...previous, item.id]));
      } catch (error: unknown) {
        failed.add(item.id);
        failures.push({ name: item.filename, message: typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string' ? error.message : 'Deletion was not confirmed' });
      }
    }
    setSelectedIds(failed);
    setDeleteFailures(failures);
    if (removed.size) {
      setMessage(`${removed.size} media file${removed.size === 1 ? '' : 's'} permanently deleted.`);
      setSelectedItem(current => current && removed.has(current.id) ? null : current);
    }
    if (failures.length) setErrorMessage(`Deletion was not confirmed for ${failures.length} file${failures.length === 1 ? '' : 's'}. Some storage objects may already have been removed; review the details before retrying.`);
    setPendingDelete([]);
    if (page > 1 && removed.size === media.length && failed.size === 0) setPage(current => Math.max(1, current - 1));
    await refreshMedia();
    deleting.current = false;
    setIsDeleting(false);
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
      {deleteFailures.length > 0 && <ul className="space-y-2 rounded-lg border border-red-200 p-4 text-sm text-red-700 dark:text-red-200" aria-label="Deletion failures">{deleteFailures.map((failure, index) => <li key={index} className="[overflow-wrap:anywhere]"><strong>{failure.name}:</strong> {failure.message}</li>)}</ul>}
      {refreshFailed && <Alert type="warning" title="Media totals could not be refreshed">Confirmed deletions are hidden, but counts may be stale. <Button variant="outline" size="sm" onClick={() => void refreshMedia()}>Retry refresh</Button></Alert>}
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
        <fieldset disabled={isDeleting} className="min-w-0 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
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
        </fieldset>
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
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <label className="flex items-center gap-2 text-sm"><input ref={selectAllRef} type="checkbox" checked={allSelected} disabled={isDeleting} onChange={() => setSelectedIds(allSelected ? new Set() : new Set(media.map(item => item.id)))} /> Select all on this page</label>
            <div className="flex flex-wrap items-center gap-3"><span className="text-sm text-muted-foreground">{selectedMedia.length} selected</span><Button variant="destructive" size="sm" disabled={isDeleting || selectedMedia.length === 0} onClick={() => setPendingDelete(selectedMedia)}>Delete selected ({selectedMedia.length})</Button></div>
          </div>
          <DataTable data={media} columns={[
{ key: 'file', header: 'File', truncate: false, render: (item: MediaReviewItem) => (<div className="min-w-0 space-y-2">
                <label className="flex min-w-0 items-start gap-2"><input type="checkbox" checked={selectedIds.has(item.id)} disabled={isDeleting} onChange={() => toggleSelected(item.id)} aria-label={`Select ${item.filename}`} className="mt-1 shrink-0" /><span className="min-w-0 line-clamp-2 text-sm font-medium [overflow-wrap:anywhere]">{item.filename}</span></label>
                <SecureMediaPreview key={item.id} item={item} className="h-16 w-20 max-w-full" />
                <div className="text-xs capitalize text-gray-500">{item.mediaType} / {formatBytes(item.size)}</div>
              </div>) },
{ key: 'activity', header: 'Activity', render: (item: MediaReviewItem) => <><Link href={`/${locale}/${role}/activities/${item.activityId}`} className="text-sm font-medium text-green-700 hover:text-green-800">
                        {item.activityTitle || 'Activity report'}
                      </Link>
                      <p className="mt-1 min-w-0 break-words text-xs text-gray-500" title={item.caption || item.activityDescription || item.filename}>
                        {item.caption || item.activityDescription || item.filename}
                      </p></> },
{ key: 'school', header: 'School / pilot', render: (item: MediaReviewItem) => <><div>{item.schoolName || 'Unknown school'}</div>
                      <div className="text-xs text-gray-500">{item.pilotName || 'Unknown pilot'}</div></> },
{ key: 'owner', header: 'Uploaded by', render: (item: MediaReviewItem) => <><div>{ownerLabel(item)}</div>
                      {item.uploadedByEmail && item.uploadedByName && (
                        <div className="text-xs text-gray-500">{item.uploadedByEmail}</div>
                      )}</> },
{ key: 'uploaded', header: 'Uploaded', render: (item: MediaReviewItem) => <>{item.uploadedAt ? new Date(item.uploadedAt).toLocaleDateString() : 'Unknown'}</> },
{ key: 'actions', header: 'Actions', render: (item: MediaReviewItem) => <><div className="flex flex-wrap justify-end gap-2">
                        <Button variant="outline" size="sm" disabled={isDeleting} onClick={() => setSelectedItem(item)}>View</Button>
                        <Button variant="outline" size="sm" disabled={isDeleting} onClick={() => handleDownload(item)}>Download</Button>
                        <Button variant="destructive" size="sm" disabled={isDeleting} onClick={() => handleDelete(item)}>Delete</Button>
                      </div></> }
          ]} />
          <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
              Page {page} of {totalPages} · {pagination?.total || 0} filtered file{pagination?.total === 1 ? '' : 's'}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={isDeleting || !pagination?.hasPrevious} onClick={() => { setSelectedIds(new Set()); setPage((current) => Math.max(current - 1, 1)); }}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={isDeleting || !pagination?.hasNext} onClick={() => { setSelectedIds(new Set()); setPage((current) => current + 1); }}>
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
              <SecureMediaPreview key={selectedItem.id} item={selectedItem} className="max-h-[55vh] w-full" />
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
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => handleDownload(selectedItem)}>Download</Button>
              <Button variant="destructive" disabled={isDeleting} onClick={() => handleDelete(selectedItem)}>Delete Permanently</Button>
            </div>
          </div>
        </div>
      )}
      <Modal open={pendingDelete.length > 0} onClose={() => { if (!deleting.current) setPendingDelete([]); }} title={`Permanently delete ${pendingDelete.length} media file${pendingDelete.length === 1 ? '' : 's'}?`} footer={<div className="flex flex-wrap justify-end gap-3"><Button variant="outline" disabled={isDeleting} onClick={() => setPendingDelete([])}>Cancel</Button><Button variant="destructive" loading={isDeleting} onClick={() => void confirmDelete()}>Delete permanently ({pendingDelete.length})</Button></div>}>
        <p className="text-sm text-muted-foreground">This removes the selected files from storage and their media records. It cannot be undone. Only the files listed below are included.</p>
        {isDeleting && <p role="status" className="mt-3 text-sm text-muted-foreground">Deleting the confirmed files. Please wait for the results before leaving this page.</p>}
        <ul className="mt-4 max-h-60 space-y-2 overflow-y-auto text-sm">{pendingDelete.map(item => <li key={item.id} className="[overflow-wrap:anywhere]">{item.filename} / {formatBytes(item.size)}</li>)}</ul>
      </Modal>
    </div>
  );
}
