import { ChunkedUploader, ChunkedFile } from './chunked-upload';

export interface UploadSession {
  id: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  activityId: string;
  uploadedChunks: number[];
  totalChunks: number;
  chunkSize: number;
  status: 'active' | 'paused' | 'completed' | 'failed';
  progress: number;
  createdAt: number;
  lastUpdated: number;
  error?: string;
  metadata?: {
    type: string;
    lastModified: number;
    checksum?: string;
  };
}

export class UploadResumeManager {
  private static STORAGE_KEY = 'evergreen_upload_sessions';
  private uploader: ChunkedUploader;

  constructor(uploader?: ChunkedUploader) {
    this.uploader = uploader || new ChunkedUploader();
  }

  // Save session to localStorage
  static saveSession(session: UploadSession): void {
    try {
      const sessions = this.getSessions();
      const existingIndex = sessions.findIndex(s => s.id === session.id);
      
      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.push(session);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save upload session:', error);
    }
  }

  // Get all sessions
  static getSessions(): UploadSession[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get upload sessions:', error);
      return [];
    }
  }

  // Get session by ID
  static getSession(id: string): UploadSession | null {
    const sessions = this.getSessions();
    return sessions.find(s => s.id === id) || null;
  }

  // Get active sessions for activity
  static getActivitySessions(activityId: string): UploadSession[] {
    const sessions = this.getSessions();
    return sessions.filter(s => 
      s.activityId === activityId && 
      (s.status === 'active' || s.status === 'paused')
    );
  }

  // Update session
  static updateSession(id: string, updates: Partial<UploadSession>): void {
    const session = this.getSession(id);
    if (session) {
      const updated = {
        ...session,
        ...updates,
        lastUpdated: Date.now(),
      };
      this.saveSession(updated);
    }
  }

  // Remove session
  static removeSession(id: string): void {
    try {
      const sessions = this.getSessions();
      const filtered = sessions.filter(s => s.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove session:', error);
    }
  }

  // Clean up old sessions (older than 7 days)
  static cleanupOldSessions(): void {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const sessions = this.getSessions();
    const activeSessions = sessions.filter(s => 
      s.lastUpdated > sevenDaysAgo || 
      s.status === 'active' || 
      s.status === 'paused'
    );
    
    if (activeSessions.length !== sessions.length) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(activeSessions));
    }
  }

  // Create new session
  createSession(
    file: File,
    activityId: string,
    fileId?: string
  ): UploadSession {
    const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const totalChunks = Math.ceil(file.size / this.uploader.config.chunkSize);
    
    const session: UploadSession = {
      id,
      fileId: fileId || id,
      fileName: file.name,
      fileSize: file.size,
      activityId,
      uploadedChunks: [],
      totalChunks,
      chunkSize: this.uploader.config.chunkSize,
      status: 'active',
      progress: 0,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      metadata: {
        type: file.type,
        lastModified: file.lastModified,
      },
    };

    UploadResumeManager.saveSession(session);
    return session;
  }

  // Update chunk progress
  updateChunkProgress(sessionId: string, chunkNumber: number): void {
    const session = UploadResumeManager.getSession(sessionId);
    if (session && !session.uploadedChunks.includes(chunkNumber)) {
      const uploadedChunks = [...session.uploadedChunks, chunkNumber];
      const progress = Math.round((uploadedChunks.length / session.totalChunks) * 100);
      
      UploadResumeManager.updateSession(sessionId, {
        uploadedChunks,
        progress,
        status: progress === 100 ? 'completed' : 'active',
      });
    }
  }

  // Pause session
  pauseSession(sessionId: string): void {
    const session = UploadResumeManager.getSession(sessionId);
    if (session && session.status === 'active') {
      UploadResumeManager.updateSession(sessionId, {
        status: 'paused',
      });
    }
  }

  // Resume session
  async resumeSession(
    sessionId: string,
    file: File,
    uploadUrl: string,
    onProgress?: (progress: number) => void,
    onChunkComplete?: (chunkNumber: number) => void
  ): Promise<string> {
    const session = UploadResumeManager.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Update status
    UploadResumeManager.updateSession(sessionId, {
      status: 'active',
    });

    try {
      const fileId = await this.uploader.resumeUpload(
        session.fileId,
        session.uploadedChunks,
        uploadUrl,
        file,
        {
          onProgress: (progress) => {
            if (onProgress) onProgress(progress);
            UploadResumeManager.updateSession(sessionId, { progress });
          },
          onChunkComplete: (chunkNumber) => {
            if (onChunkComplete) onChunkComplete(chunkNumber);
            this.updateChunkProgress(sessionId, chunkNumber);
          },
        }
      );

      // Mark as completed
      UploadResumeManager.updateSession(sessionId, {
        status: 'completed',
        progress: 100,
      });

      return fileId;
    } catch (error) {
      UploadResumeManager.updateSession(sessionId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Upload failed',
      });
      throw error;
    }
  }

  // Check if file can be resumed
  canResume(file: File, session: UploadSession): boolean {
    return (
      session.fileName === file.name &&
      session.fileSize === file.size &&
      session.metadata?.lastModified === file.lastModified &&
      session.uploadedChunks.length > 0 &&
      session.status === 'paused'
    );
  }

  // Find resumable session for file
  findResumableSession(file: File, activityId: string): UploadSession | null {
    const sessions = UploadResumeManager.getActivitySessions(activityId);
    return sessions.find(s => this.canResume(file, s)) || null;
  }

  // Get resume stats
  getResumeStats(session: UploadSession) {
    const uploadedSize = session.uploadedChunks.length * session.chunkSize;
    const remainingSize = session.fileSize - uploadedSize;
    const resumePercent = Math.round((uploadedSize / session.fileSize) * 100);
    
    return {
      uploadedChunks: session.uploadedChunks.length,
      totalChunks: session.totalChunks,
      uploadedSize,
      remainingSize,
      resumePercent,
      canResume: session.status === 'paused',
    };
  }
}

// React Hook for upload resume
export const useUploadResume = () => {
  const manager = new UploadResumeManager();
  
  const createSession = (
    file: File,
    activityId: string,
    fileId?: string
  ) => {
    return manager.createSession(file, activityId, fileId);
  };

  const findResumableSession = (file: File, activityId: string) => {
    return manager.findResumableSession(file, activityId);
  };

  const resumeSession = async (
    sessionId: string,
    file: File,
    uploadUrl: string,
    onProgress?: (progress: number) => void,
    onChunkComplete?: (chunkNumber: number) => void
  ) => {
    return await manager.resumeSession(
      sessionId,
      file,
      uploadUrl,
      onProgress,
      onChunkComplete
    );
  };

  const pauseSession = (sessionId: string) => {
    manager.pauseSession(sessionId);
  };

  const updateChunkProgress = (sessionId: string, chunkNumber: number) => {
    manager.updateChunkProgress(sessionId, chunkNumber);
  };

  const getActivitySessions = (activityId: string) => {
    return UploadResumeManager.getActivitySessions(activityId);
  };

  const removeSession = (sessionId: string) => {
    UploadResumeManager.removeSession(sessionId);
  };

  const cleanupOldSessions = () => {
    UploadResumeManager.cleanupOldSessions();
  };

  return {
    createSession,
    findResumableSession,
    resumeSession,
    pauseSession,
    updateChunkProgress,
    getActivitySessions,
    removeSession,
    cleanupOldSessions,
    formatBytes: (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
  };
};