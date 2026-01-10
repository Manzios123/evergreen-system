'use client';

import React, { useState } from 'react';
import { useEXIFExtraction } from '@/lib/utils/exif';
import Button from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { MapPinIcon, CalendarIcon, CameraIcon } from '@heroicons/react/24/outline';

interface EXIFUploadProps {
  onFilesWithEXIF: (files: Array<{ file: File; exif: any }>) => void;
}

export const EXIFUpload: React.FC<EXIFUploadProps> = ({ onFilesWithEXIF }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [extractEXIF, setExtractEXIF] = useState(true);
  const [extracting, setExtracting] = useState(false);
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
        onFilesWithEXIF(results);
      } catch (error) {
        console.error('EXIF extraction failed:', error);
      } finally {
        setExtracting(false);
      }
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
            disabled={extracting}
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
            <Button type="button" variant="outline">
              Browse Photos
            </Button>
          </div>
        </label>
      </div>

      {/* Extracting Indicator */}
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
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};