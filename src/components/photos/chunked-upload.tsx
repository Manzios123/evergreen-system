'use client';

import React, { useState, useCallback, useRef } from 'react';
import { ChunkedUploader, needsChunking } from '@/lib/utils/chunked-upload';
import { Progress } from '@/components/ui/proggress';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';
import { 
  CloudArrowUpIcon, 
  CheckCircleIcon, 
  XMarkIcon,
  PauseIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { photosApi } from '@/lib/api/photos';
import { useChunkedUpload } from '@/lib/hooks/use-photos';

interface ChunkedFileUploadProps {
  activityId: string;
  chunkSize?: number; // in MB
  onComplete?: (fileId: string) => void;
  className?: string;
}

interface UploadSession {
  fileId: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'error';
  uploadedChunks: number[];
  totalChunks: number;
  error?: string;
}

export const ChunkedFileUpload: React.FC<ChunkedFileUploadProps> = ({
  activityId,
  chunkSize = 5,
  onComplete,
  className,
}) => {
  const [sessions, setSessions] = useState<UploadSession[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const uploaderRef = useRef<ChunkedUploader | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { startChunkedUpload, uploadChunk, completeChunkedUpload, isLoading } = useChunkedUpload();

  const initUploader = () => {
    if (!uploaderRef.current) {
      uploaderRef.current = new ChunkedUploader({
        chunkSize: chunkSize * 1024 * 1024,
        parallelUploads: 3,
        maxRetries: 3,
      });
    }
    return uploaderRef.current;
  };

  const calculateChunks = (file: File): Blob[] => {
    const uploader = initUploader();
    return uploader.calculateChunks(file);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (needsChunking(file, chunkSize * 1024 * 1024)) {
        const chunks = calculateChunks(file);
        const session: UploadSession = {
          fileId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          file,
          progress: 0,
          status: 'pending',
          uploadedChunks: [],
          totalChunks: chunks.length,
        };
        setSessions(prev => [...prev, session]);
      }
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startUpload = useCallback(async (session: UploadSession) => {
    const uploader = initUploader();
    
    setSessions(prev => prev.map(s => 
      s.fileId === session.fileId ? { ...s, status: 'uploading' } : s
    ));

    setIsUploading(true);

    try {
      // Start chunked upload session with backend
      const startResponse = await photosApi.startChunkedUpload({
        filename: session.file.name,
        totalSize: session.file.size,
        totalChunks: session.totalChunks,
        activityId: activityId,
        fileType: session.file.type
      });

      const { sessionId, uploadUrl } = startResponse.data;
      
      // Upload file using the session
      const fileId = await uploader.uploadFile(
        session.file,
        uploadUrl,
        {
          onProgress: (progress) => {
            setSessions(prev => prev.map(s => 
              s.fileId === session.fileId ? { ...s, progress } : s
            ));
          },
          onChunkComplete: (chunkNumber) => {
            setSessions(prev => prev.map(s => {
              if (s.fileId === session.fileId) {
                const updatedChunks = [...s.uploadedChunks, chunkNumber];
                return { ...s, uploadedChunks: updatedChunks };
              }
              return s;
            }));
          },
          onError: (error, chunkNumber) => {
            console.error(`Chunk ${chunkNumber} failed:`, error);
          },
        }
      );

      // Complete the upload
      await photosApi.completeChunkedUpload(sessionId);

      setSessions(prev => prev.map(s => 
        s.fileId === session.fileId 
          ? { ...s, status: 'completed', progress: 100 }
          : s
      ));

      onComplete?.(fileId);
    } catch (error) {
      console.error('Upload failed:', error);
      setSessions(prev => prev.map(s => 
        s.fileId === session.fileId 
          ? { 
              ...s, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Upload failed' 
            }
          : s
      ));
    } finally {
      setIsUploading(false);
    }
  }, [activityId, chunkSize, onComplete]);

  const pauseUpload = (fileId: string) => {
    const uploader = initUploader();
    uploader.abortUpload(fileId);
    
    setSessions(prev => prev.map(s => 
      s.fileId === fileId ? { ...s, status: 'paused' } : s
    ));
  };

  const resumeUpload = async (session: UploadSession) => {
    const uploader = initUploader();
    
    setSessions(prev => prev.map(s => 
      s.fileId === session.fileId ? { ...s, status: 'uploading' } : s
    ));

    setIsUploading(true);

    try {
      // Start new session for resume
      const startResponse = await photosApi.startChunkedUpload({
        filename: session.file.name,
        totalSize: session.file.size,
        totalChunks: session.totalChunks,
        activityId: activityId,
        fileType: session.file.type
      });

      const { sessionId, uploadUrl } = startResponse.data;
      
      const fileId = await uploader.resumeUpload(
        sessionId,
        session.uploadedChunks,
        uploadUrl,
        session.file,
        {
          onProgress: (progress) => {
            setSessions(prev => prev.map(s => 
              s.fileId === session.fileId ? { ...s, progress } : s
            ));
          },
          onChunkComplete: (chunkNumber) => {
            setSessions(prev => prev.map(s => {
              if (s.fileId === session.fileId) {
                const updatedChunks = [...s.uploadedChunks, chunkNumber];
                return { ...s, uploadedChunks: updatedChunks };
              }
              return s;
            }));
          },
        }
      );

      // Complete the upload
      await photosApi.completeChunkedUpload(sessionId);

      setSessions(prev => prev.map(s => 
        s.fileId === session.fileId 
          ? { ...s, status: 'completed', progress: 100 }
          : s
      ));

      onComplete?.(fileId);
    } catch (error) {
      console.error('Resume failed:', error);
      setSessions(prev => prev.map(s => 
        s.fileId === session.fileId 
          ? { ...s, status: 'error', error: error instanceof Error ? error.message : 'Resume failed' }
          : s
      ));
    } finally {
      setIsUploading(false);
    }
  };

  const removeSession = (fileId: string) => {
    const uploader = initUploader();
    uploader.abortUpload(fileId);
    setSessions(prev => prev.filter(s => s.fileId !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Button */}
      <div className="text-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          className="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isLoading}
        >
          <CloudArrowUpIcon className="w-4 h-4 mr-2" />
          Select Large Files
        </Button>
        <p className="text-sm text-gray-500 mt-2">
          Supports files larger than {chunkSize}MB using chunked upload
        </p>
      </div>

      {/* Upload Sessions */}
      {sessions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Large File Uploads</h3>
          
          {sessions.map((session) => (
            <div
              key={session.fileId}
              className="border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {session.file.name}
                  </p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-gray-500">
                      {formatFileSize(session.file.size)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {session.uploadedChunks.length}/{session.totalChunks} chunks
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      session.status === 'completed' ? 'bg-green-100 text-green-800' :
                      session.status === 'uploading' ? 'bg-blue-100 text-blue-800' :
                      session.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                      session.status === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {session.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => startUpload(session)}
                      disabled={isUploading || isLoading}
                    >
                      Start
                    </Button>
                  )}
                  
                  {session.status === 'uploading' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => pauseUpload(session.fileId)}
                    >
                      <PauseIcon className="w-4 h-4 mr-1" />
                      Pause
                    </Button>
                  )}
                  
                  {session.status === 'paused' && (
                    <Button
                      size="sm"
                      onClick={() => resumeUpload(session)}
                      disabled={isUploading || isLoading}
                    >
                      <PlayIcon className="w-4 h-4 mr-1" />
                      Resume
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeSession(session.fileId)}
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Progress */}
              {session.status !== 'pending' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{session.progress}%</span>
                  </div>
                  <Progress value={session.progress} />
                </div>
              )}

              {/* Error Message */}
              {session.status === 'error' && session.error && (
                <Alert type="error">
                  {session.error}
                </Alert>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};