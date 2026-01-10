'use client';

import React, { useState, useEffect } from 'react';
import { useUploadResume } from '@/lib/utils/upload-resume';
import  Button  from '@/components/ui/button';
import { Progress } from '@/components/ui/proggress';
import { Badge } from '@/components/ui/badge';
import {
  ArrowPathIcon,
  PauseIcon,
  PlayIcon,
  TrashIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';

interface ResumeUploadProps {
  activityId: string;
  onUploadComplete?: (fileId: string) => void;
  onUploadStart?: (file: File) => void;
}

export const ResumeUpload: React.FC<ResumeUploadProps> = ({
  activityId,
  onUploadComplete,
  onUploadStart,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const {
    findResumableSession,
    createSession,
    resumeSession,
    pauseSession,
    getActivitySessions,
    removeSession,
    cleanupOldSessions,
    formatBytes,
  } = useUploadResume();

  // Load existing sessions
  useEffect(() => {
    const existingSessions = getActivitySessions(activityId);
    setSessions(existingSessions);
    cleanupOldSessions();
  }, [activityId, getActivitySessions, cleanupOldSessions]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    selectedFiles.forEach(file => {
      // Check for resumable session
      const existingSession = findResumableSession(file, activityId);
      
      if (existingSession) {
        // Show resume option
        setSessions(prev => {
          const exists = prev.some(s => s.id === existingSession.id);
          return exists ? prev : [...prev, existingSession];
        });
      } else {
        // Create new session
        const session = createSession(file, activityId);
        setSessions(prev => [...prev, session]);
        setFiles(prev => [...prev, file]);
      }
    });
  };

  const startOrResumeUpload = async (session: any, file: File) => {
    if (onUploadStart) {
      onUploadStart(file);
    }

    setUploading(true);
    
    try {
      const uploadUrl = `/api/upload/resume?activityId=${activityId}`;
      
      const fileId = await resumeSession(
        session.id,
        file,
        uploadUrl,
        (progress) => {
          // Progress callback
          console.log(`Upload progress: ${progress}%`);
        },
        (chunkNumber) => {
          // Chunk complete callback
          console.log(`Chunk ${chunkNumber} completed`);
        }
      );

      if (onUploadComplete) {
        onUploadComplete(fileId);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handlePause = (sessionId: string) => {
    pauseSession(sessionId);
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, status: 'paused' } : s
    ));
  };

  const handleRemove = (sessionId: string) => {
    removeSession(sessionId);
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const getResumeStats = (session: any) => {
    const uploadedSize = session.uploadedChunks.length * session.chunkSize;
    const remainingSize = session.fileSize - uploadedSize;
    const resumePercent = Math.round((uploadedSize / session.fileSize) * 100);
    
    return {
      uploadedChunks: session.uploadedChunks.length,
      totalChunks: session.totalChunks,
      uploadedSize,
      remainingSize,
      resumePercent,
    };
  };

  return (
    <div className="space-y-6">
      {/* File Input */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="resume-upload"
        />
        <label htmlFor="resume-upload" className="cursor-pointer">
          <div className="space-y-3">
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div>
              <p className="font-medium">Upload with Resume Support</p>
              <p className="text-sm text-gray-500 mt-1">
                Uploads can be paused and resumed later
              </p>
            </div>
            <Button type="button" variant="outline">
              Select Files
            </Button>
          </div>
        </label>
      </div>

      {/* Resume Sessions */}
      {sessions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Upload Sessions</h3>
            <Badge variant="outline">
              {sessions.filter(s => s.status === 'paused').length} paused
            </Badge>
          </div>

          <div className="space-y-3">
            {sessions.map((session) => {
              const stats = getResumeStats(session);
              const file = files.find(f => 
                f.name === session.fileName && 
                f.size === session.fileSize
              );

              return (
                <div
                  key={session.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {session.fileName}
                      </p>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                        <span>{formatBytes(session.fileSize)}</span>
                        <span>{stats.uploadedChunks}/{stats.totalChunks} chunks</span>
                        <Badge className={session.status === 'paused' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-blue-100 text-blue-800'
                        }>
                          {session.status === 'paused' ? 'Paused' : 'Active'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {session.status === 'paused' && file && (
                        <Button
                          size="sm"
                          onClick={() => startOrResumeUpload(session, file)}
                          disabled={uploading}
                        >
                          <PlayIcon className="w-4 h-4 mr-2" />
                          Resume
                        </Button>
                      )}
                      
                      {session.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePause(session.id)}
                        >
                          <PauseIcon className="w-4 h-4 mr-2" />
                          Pause
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemove(session.id)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress */}
                  {session.status !== 'paused' && stats.resumePercent > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>
                          {session.status === 'active' ? 'Uploading' : 'Resume from'} {stats.resumePercent}%
                        </span>
                        <span>
                          {formatBytes(stats.uploadedSize)} of {formatBytes(session.fileSize)}
                        </span>
                      </div>
                      <Progress value={stats.resumePercent} />
                    </div>
                  )}

                  {/* Resume Info */}
                  {session.status === 'paused' && stats.uploadedChunks > 0 && (
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center">
                        <ArrowPathIcon className="w-5 h-5 text-yellow-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">
                            Upload can be resumed
                          </p>
                          <p className="text-xs text-yellow-700">
                            {stats.uploadedChunks} chunks already uploaded ({stats.resumePercent}%)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Sessions:</span>
                <span className="font-medium ml-2">{sessions.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Active:</span>
                <span className="font-medium ml-2">
                  {sessions.filter(s => s.status === 'active').length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Paused:</span>
                <span className="font-medium ml-2">
                  {sessions.filter(s => s.status === 'paused').length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Total Size:</span>
                <span className="font-medium ml-2">
                  {formatBytes(sessions.reduce((sum, s) => sum + s.fileSize, 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};