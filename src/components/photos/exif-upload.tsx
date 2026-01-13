'use client';

import React, { useState } from 'react';
import { useEXIFExtraction } from '@/lib/utils/exif';
import Button from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { MapPinIcon, CalendarIcon, CameraIcon } from '@heroicons/react/24/outline';
import { photosApi } from '@/lib/api/photos';

interface EXIFUploadProps {
  activityId: string;
  onUploadComplete?: () => void;
}

export const EXIFUpload: React.FC<EXIFUploadProps> = ({ 
  activityId,
  onUploadComplete 
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [extractEXIF, setExtractEXIF] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [exifResults, setExifResults] = useState<any[]>([]);
  const { extractFromFiles } = useEXIFExtraction();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(selectedFiles);

    if (extractEXIF && selectedFiles.length > 0) {
      setExtracting(true);
      try {
        const results = await extractFromFiles(selectedFiles);
        setExifResults(results);
        
        // Automatically upload files with EXIF data
        await uploadFilesWithEXIF(selectedFiles, results);
      } catch (error) {
        console.error('EXIF extraction failed:', error);
        // Upload without EXIF
        await uploadFilesWithoutEXIF(selectedFiles);
      } finally {
        setExtracting(false);
      }
    } else if (selectedFiles.length > 0) {
      // Upload without EXIF extraction
      await uploadFilesWithoutEXIF(selectedFiles);
    }
  };

  const uploadFilesWithEXIF = async (files: File[], exifResults: any[]) => {
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const exifData = exifResults[i]?.exif;
        
        // First upload the file
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('activityId', activityId);
        
        const uploadResponse = await photosApi.uploadPhoto(formData, activityId);
        const photoId = uploadResponse.data.id;
        
        // Then process EXIF data if available
        if (exifData) {
          await photosApi.processEXIF(photoId, exifData);
        }
        
        console.log(`Uploaded ${file.name} with EXIF data`);
      }
      
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Failed to upload files with EXIF:', error);
    } finally {
      setUploading(false);
    }
  };

  const uploadFilesWithoutEXIF = async (files: File[]) => {
    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('activityId', activityId);
        
        await photosApi.uploadPhoto(formData, activityId);
        console.log(`Uploaded ${file.name} without EXIF data`);
      }
      
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Failed to upload files:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    
    const newResults = [...exifResults];
    newResults.splice(index, 1);
    setExifResults(newResults);
  };

  const hasEXIFData = (index: number) => {
    const result = exifResults[index];
    return result && (result.exif.metadata || result.exif.location);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Upload Photos with EXIF</h3>
          <p className="text-sm text-gray-600">
            Extract location and camera data from photos
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={extractEXIF}
            onCheckedChange={setExtractEXIF}
            disabled={extracting || uploading}
          />
          <span className="text-sm">Extract EXIF Data</span>
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
          id="exif-upload"
          disabled={extracting || uploading}
        />
        <label htmlFor="exif-upload" className="cursor-pointer">
          <div className="space-y-3">
            <CameraIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div>
              <p className="font-medium">Select photos with EXIF data</p>
              <p className="text-sm text-gray-500 mt-1">
                Location and camera information will be extracted automatically
              </p>
            </div>
            <Button 
              type="button" 
              variant="outline"
              disabled={extracting || uploading}
            >
              Browse Photos
            </Button>
          </div>
        </label>
      </div>

      {/* Status Indicators */}
      {(extracting || uploading) && (
        <div className="space-y-2">
          {extracting && (
            <div className="text-center py-4">
              <div className="inline-flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                <span className="text-sm text-gray-600">
                  Extracting EXIF data...
                </span>
              </div>
            </div>
          )}
          
          {uploading && (
            <div className="text-center py-4">
              <div className="inline-flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm text-gray-600">
                  Uploading photos...
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Selected Photos ({files.length})</h4>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {exifResults[index] && (
                        <>
                          {exifResults[index]?.exif?.location && (
                            <Badge variant="outline" className="text-xs">
                              <MapPinIcon className="w-3 h-3 mr-1" />
                              Location
                            </Badge>
                          )}
                          {exifResults[index]?.exif?.takenAt && (
                            <Badge variant="outline" className="text-xs">
                              <CalendarIcon className="w-3 h-3 mr-1" />
                              Date
                            </Badge>
                          )}
                        </>
                      )}
                      <span className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={extracting || uploading}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          {/* EXIF Summary */}
          {exifResults.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h5 className="font-medium text-blue-800 mb-2">
                EXIF Data Summary
              </h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Photos with location:</span>
                  <span className="font-medium ml-2">
                    {exifResults.filter(r => r.exif.location).length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Photos with date:</span>
                  <span className="font-medium ml-2">
                    {exifResults.filter(r => r.exif.takenAt).length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Photos with camera info:</span>
                  <span className="font-medium ml-2">
                    {exifResults.filter(r => r.exif.metadata?.make || r.exif.metadata?.model).length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Total photos processed:</span>
                  <span className="font-medium ml-2">{exifResults.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};