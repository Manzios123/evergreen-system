'use client';

import React, { useState, useEffect } from 'react';
import { usePhotos, useDeletePhoto } from '@/lib/hooks/use-photos';
import Button from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  MagnifyingGlassIcon,
  TrashIcon,
  MapPinIcon,
  CalendarIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { Download } from 'lucide-react'; // Changed from DownloadIcon
import { Photo } from '@/lib/types';
import Image from 'next/image';

interface PhotoGalleryProps {
  activityId?: string;
  volunteerId?: string;
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  className?: string;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  activityId,
  volunteerId,
  selectable = false,
  onSelectionChange,
  className = '',
}) => {
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<string>('all'); // all, approved, pending, rejected
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const { data: photosData, isLoading, error } = usePhotos({
    activityId,
    volunteerId,
    status: filter !== 'all' ? filter as 'approved' | 'pending' | 'rejected' : undefined,
  });

  const deletePhoto = useDeletePhoto();

  const photos = photosData?.data || [];

  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedPhotos);
    }
  }, [selectedPhotos, onSelectionChange]);

  const handleSelectPhoto = (photoId: string) => {
    if (selectable) {
      setSelectedPhotos(prev =>
        prev.includes(photoId)
          ? prev.filter(id => id !== photoId)
          : [...prev, photoId]
      );
    }
  };

  const handleSelectAll = () => {
    if (selectable) {
      if (selectedPhotos.length === photos.length) {
        setSelectedPhotos([]);
      } else {
        setSelectedPhotos(photos.map((photo: { id: any; }) => photo.id));
      }
    }
  };

  const handleDeleteSelected = () => {
    if (window.confirm(`Delete ${selectedPhotos.length} selected photos?`)) {
      selectedPhotos.forEach(id => deletePhoto.mutate(id));
      setSelectedPhotos([]);
    }
  };

  const openLightbox = (index: number) => {
    setCurrentPhotoIndex(index);
    setLightboxOpen(true);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentPhotoIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1));
    } else {
      setCurrentPhotoIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0));
    }
  };

  const downloadPhoto = async (photo: Photo) => {
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = photo.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const getStatusColor = (status: Photo['status']) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Simple date formatting function since date-fns is not installed
  const formatDate = (dateString: string, formatType: 'short' | 'long' = 'short') => {
    const date = new Date(dateString);
    
    if (formatType === 'short') {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load photos</p>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <MagnifyingGlassIcon className="w-12 h-12 mx-auto" />
        </div>
        <p className="text-gray-600">No photos found</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Gallery Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          {selectable && (
            <>
              <Checkbox
                checked={selectedPhotos.length === photos.length && photos.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm">
                {selectedPhotos.length} selected
              </span>
              {selectedPhotos.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                  disabled={deletePhoto.isPending}
                >
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              )}
            </>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex space-x-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border rounded-md px-3 py-2"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Photo Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {photos.map((photo: Photo, index: number) => (
            <div
              key={photo.id}
              className="group relative aspect-square rounded-lg overflow-hidden border hover:border-green-400 transition-all"
            >
              {selectable && (
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox
                    checked={selectedPhotos.includes(photo.id)}
                    onCheckedChange={() => handleSelectPhoto(photo.id)}
                  />
                </div>
              )}
              
              <div className="absolute top-2 right-2 z-10">
                <Badge className={getStatusColor(photo.status)}>
                  {photo.status}
                </Badge>
              </div>

              <img
                src={photo.thumbnailUrl || photo.url}
                alt={photo.description || photo.filename}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => openLightbox(index)}
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openLightbox(index)}
                  >
                    <EyeIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => downloadPhoto(photo)}
                  >
                    <Download className="w-4 h-4" /> {/* Changed to Download from lucide-react */}
                  </Button>
                </div>
              </div>

              {/* Caption */}
              <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-3 text-white text-sm">
                <p className="truncate">{photo.description || photo.filename}</p>
                {photo.metadata?.location && (
                  <div className="flex items-center mt-1 text-xs">
                    <MapPinIcon className="w-3 h-3 mr-1" />
                    <span>Location available</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {photos.map((photo: Photo) => (
            <div
              key={photo.id}
              className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50"
            >
              {selectable && (
                <Checkbox
                  checked={selectedPhotos.includes(photo.id)}
                  onCheckedChange={() => handleSelectPhoto(photo.id)}
                />
              )}

              <div className="shrink-0"> {/* Changed from flex-shrink-0 */}
                <img
                  src={photo.thumbnailUrl || photo.url}
                  alt={photo.description || photo.filename}
                  className="w-20 h-20 object-cover rounded"
                />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{photo.filename}</h4>
                    <p className="text-sm text-gray-600">
                      {photo.description}
                    </p>
                  </div>
                  <Badge className={getStatusColor(photo.status)}>
                    {photo.status}
                  </Badge>
                </div>

                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  {photo.metadata?.location && (
                    <div className="flex items-center">
                      <MapPinIcon className="w-4 h-4 mr-1" />
                      <span>Has location</span>
                    </div>
                  )}
                  {photo.uploadedAt && (
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      <span>{formatDate(photo.uploadedAt, 'short')}</span>
                    </div>
                  )}
                  <span>{(photo.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const index = photos.findIndex((p: Photo) => p.id === photo.id);
                    openLightbox(index);
                  }}
                >
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadPhoto(photo)}
                >
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && photos[currentPhotoIndex] && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-white text-2xl z-50"
              onClick={() => setLightboxOpen(false)}
            >
              ✕
            </button>

            {/* Navigation Buttons */}
            <button
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-2xl z-50"
              onClick={() => navigateLightbox('prev')}
            >
              ←
            </button>
            <button
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-2xl z-50"
              onClick={() => navigateLightbox('next')}
            >
              →
            </button>

            {/* Photo */}
            <div className="max-w-4xl max-h-[80vh]">
              <img
                src={photos[currentPhotoIndex].url}
                alt={photos[currentPhotoIndex].description || photos[currentPhotoIndex].filename}
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>

            {/* Photo Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">
                    {photos[currentPhotoIndex].filename}
                  </h3>
                  <p className="text-sm text-gray-300">
                    {photos[currentPhotoIndex].description}
                  </p>
                </div>
                <div className="text-sm">
                  {currentPhotoIndex + 1} of {photos.length}
                </div>
              </div>
              
              <div className="flex items-center space-x-4 mt-2 text-sm">
                {photos[currentPhotoIndex].metadata?.location && (
                  <div className="flex items-center">
                    <MapPinIcon className="w-4 h-4 mr-1" />
                    <span>Location recorded</span>
                  </div>
                )}
                {photos[currentPhotoIndex].uploadedAt && (
                  <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    <span>
                      {formatDate(photos[currentPhotoIndex].uploadedAt, 'long')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};