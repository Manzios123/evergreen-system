'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface DragDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  showPreview?: boolean;
}

export const DragDropZone: React.FC<DragDropZoneProps> = ({
  onFilesSelected,
  accept = {
    'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.heic'],
  },
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 10,
  disabled = false,
  className = '',
  showPreview = true,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);

    // Check max files limit
    if (files.length + acceptedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const firstRejection = rejectedFiles[0].errors[0];
      if (firstRejection.code === 'file-too-large') {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        setError(`File too large. Maximum size is ${maxSizeMB}MB`);
      } else if (firstRejection.code === 'file-invalid-type') {
        setError('Invalid file type. Please upload images only.');
      }
      return;
    }

    // Add new files
    const newFiles = [...files, ...acceptedFiles];
    setFiles(newFiles);
    onFilesSelected(newFiles);
  }, [files, maxFiles, maxSize, onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: maxFiles > 1,
    disabled,
  });

  const removeFile = useCallback((index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesSelected(newFiles);
  }, [files, onFilesSelected]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 transition-all
          ${isDragActive 
            ? 'border-green-500 bg-green-50 scale-[1.02]' 
            : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className={`
              p-4 rounded-full
              ${isDragActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}
            `}>
              <CloudArrowUpIcon className="w-12 h-12" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {isDragActive ? 'Drop files here' : 'Upload photos'}
            </h3>
            <p className="text-sm text-gray-600">
              Drag & drop files or click to browse
            </p>
            <p className="text-xs text-gray-500">
              Supports JPG, PNG, GIF, WebP • Max {Math.round(maxSize / (1024 * 1024))}MB per file
            </p>
          </div>
          
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            disabled={disabled}
          >
            Select Files
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Selected Files Preview */}
      {showPreview && files.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium text-gray-900">
              Selected Files ({files.length})
            </h4>
            <button
              type="button"
              onClick={() => {
                setFiles([]);
                onFilesSelected([]);
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
              disabled={disabled}
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="relative group rounded-lg overflow-hidden border border-gray-200"
              >
                {/* Image Preview */}
                <div className="aspect-square bg-gray-100">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* File Info Overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-2">
                  <p className="text-xs text-white truncate">{file.name}</p>
                  <p className="text-xs text-gray-300">{formatFileSize(file.size)}</p>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={disabled}
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};