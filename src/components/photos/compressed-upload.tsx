'use client';

import React, { useState, useCallback } from 'react';
import { useImageCompression } from '@/lib/utils/image-compression';
import  Button  from '@/components/ui/button';
import { Progress } from '@/components/ui/proggress';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  ArrowDownTrayIcon,
  PhotoIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface CompressedUploadProps {
  onCompressedFiles: (files: File[]) => void;
  autoCompress?: boolean;
  maxSizeBeforeCompress?: number; // in MB
}

export const CompressedUpload: React.FC<CompressedUploadProps> = ({
  onCompressedFiles,
  autoCompress = true,
  maxSizeBeforeCompress = 2,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [compressedFiles, setCompressedFiles] = useState<File[]>([]);
  const [compressionStats, setCompressionStats] = useState<
    Array<{
      originalSize: number;
      compressedSize: number;
      reductionPercent: number;
      previewUrl?: string;
    }>
  >([]);
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [enableCompression, setEnableCompression] = useState(autoCompress);
  
  const {
    compressImages,
    getCompressionSuggestion,
    formatBytes,
  } = useImageCompression();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(selectedFiles);

    if (enableCompression) {
      await compressSelectedFiles(selectedFiles);
    } else {
      setCompressedFiles(selectedFiles);
      onCompressedFiles(selectedFiles);
    }
  };

  const compressSelectedFiles = useCallback(async (filesToCompress: File[]) => {
    setCompressing(true);
    setProgress(0);

    try {
      const compressed = await compressImages(
        filesToCompress,
        {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          initialQuality: 0.8,
        },
        (progress, index) => {
          setProgress(progress);
        }
      );

      // Calculate stats
      const stats = filesToCompress.map((file, index) => {
        const compressedFile = compressed[index];
        const originalSize = file.size;
        const compressedSize = compressedFile.size;
        const reductionPercent = Math.round(
          ((originalSize - compressedSize) / originalSize) * 100
        );

        return {
          originalSize,
          compressedSize,
          reductionPercent,
        };
      });

      setCompressedFiles(compressed);
      setCompressionStats(stats);
      onCompressedFiles(compressed);
    } catch (error) {
      console.error('Compression failed:', error);
      // Fallback to original files
      setCompressedFiles(filesToCompress);
      onCompressedFiles(filesToCompress);
    } finally {
      setCompressing(false);
      setProgress(0);
    }
  }, [compressImages, onCompressedFiles]);

  const toggleCompression = async (checked: boolean) => {
    setEnableCompression(checked);
    
    if (checked && files.length > 0) {
      await compressSelectedFiles(files);
    } else if (!checked && files.length > 0) {
      setCompressedFiles(files);
      onCompressedFiles(files);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);

    const newCompressed = [...compressedFiles];
    newCompressed.splice(index, 1);
    setCompressedFiles(newCompressed);

    const newStats = [...compressionStats];
    newStats.splice(index, 1);
    setCompressionStats(newStats);

    onCompressedFiles(newCompressed);
  };

  const calculateTotalSavings = () => {
    if (compressionStats.length === 0) return { saved: 0, percent: 0 };
    
    const totalOriginal = compressionStats.reduce(
      (sum, stat) => sum + stat.originalSize, 0
    );
    const totalCompressed = compressionStats.reduce(
      (sum, stat) => sum + stat.compressedSize, 0
    );
    
    const saved = totalOriginal - totalCompressed;
    const percent = Math.round((saved / totalOriginal) * 100);
    
    return { saved, percent };
  };

  const totalSavings = calculateTotalSavings();

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Smart Image Upload</h3>
          <p className="text-sm text-gray-600">
            Automatic compression to save bandwidth
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={enableCompression}
            onCheckedChange={toggleCompression}
            disabled={compressing}
          />
          <span className="text-sm">Compress Images</span>
        </div>
      </div>

      {/* File Input */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="compressed-upload"
        />
        <label htmlFor="compressed-upload" className="cursor-pointer">
          <div className="space-y-3">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div>
              <p className="font-medium">
                {enableCompression ? 'Upload & Compress' : 'Upload Images'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {enableCompression
                  ? 'Images will be automatically compressed'
                  : 'Upload original quality images'}
              </p>
            </div>
            <Button type="button" variant="outline">
              Select Images
            </Button>
          </div>
        </label>
      </div>

      {/* Compression Progress */}
      {compressing && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Compressing images...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">
              {enableCompression ? 'Compressed Images' : 'Selected Images'} ({files.length})
            </h4>
            {enableCompression && totalSavings.saved > 0 && (
              <Badge variant="success" className="text-sm">
                <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                Saved {formatBytes(totalSavings.saved)} ({totalSavings.percent}%)
              </Badge>
            )}
          </div>

          <div className="space-y-3">
            {files.map((file, index) => {
              const stat = compressionStats[index];
              const suggestion = getCompressionSuggestion(file);
              
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      {enableCompression && stat && stat.reductionPercent > 0 && (
                        <div className="absolute -top-1 -right-1">
                          <Badge className="bg-green-500 text-white text-xs">
                            -{stat.reductionPercent}%
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm truncate max-w-xs">
                        {file.name}
                      </p>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span>Original: {formatBytes(file.size)}</span>
                        {enableCompression && stat && (
                          <span>Compressed: {formatBytes(stat.compressedSize)}</span>
                        )}
                      </div>
                      {!enableCompression && suggestion.shouldCompress && (
                        <p className="text-xs text-amber-600 mt-1">
                          Suggestion: Enable compression to save{' '}
                          {formatBytes(file.size - suggestion.estimatedSize)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {enableCompression && stat && (
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          {enableCompression && compressionStats.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h5 className="font-medium text-blue-800 mb-2">
                Compression Summary
              </h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Files:</span>
                  <span className="font-medium ml-2">{files.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Original Size:</span>
                  <span className="font-medium ml-2">
                    {formatBytes(
                      compressionStats.reduce((sum, stat) => sum + stat.originalSize, 0)
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Total Compressed:</span>
                  <span className="font-medium ml-2">
                    {formatBytes(
                      compressionStats.reduce((sum, stat) => sum + stat.compressedSize, 0)
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Total Saved:</span>
                  <span className="font-medium ml-2">
                    {formatBytes(totalSavings.saved)} ({totalSavings.percent}%)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};