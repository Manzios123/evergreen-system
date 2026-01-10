export interface ChunkedUploadConfig {
    chunkSize: number; // in bytes
    maxRetries: number;
    parallelUploads: number;
  }
  
  export interface UploadChunk {
    chunkNumber: number;
    totalChunks: number;
    chunkSize: number;
    totalSize: number;
    file: Blob;
    checksum?: string;
  }
  
  export interface ChunkedFile {
    file: File;
    fileId: string;
    uploadId: string;
    chunkSize: number;
    totalChunks: number;
    uploadedChunks: number[];
    failedChunks: number[];
  }
  
  export class ChunkedUploader {
    private config: ChunkedUploadConfig = {
      chunkSize: 5 * 1024 * 1024, // 5MB chunks
      maxRetries: 3,
      parallelUploads: 3,
    };
  
    private activeUploads: Map<string, AbortController[]> = new Map();
  
    constructor(config?: Partial<ChunkedUploadConfig>) {
      if (config) {
        this.config = { ...this.config, ...config };
      }
    }
  
    // Calculate file chunks
    calculateChunks(file: File): Blob[] {
      const chunks: Blob[] = [];
      let start = 0;
      
      while (start < file.size) {
        const end = Math.min(start + this.config.chunkSize, file.size);
        const chunk = file.slice(start, end);
        chunks.push(chunk);
        start = end;
      }
      
      return chunks;
    }
  
    // Generate checksum for chunk (simple implementation)
    async generateChecksum(chunk: Blob): Promise<string> {
      const buffer = await chunk.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  
    // Upload single chunk
    async uploadChunk(
      fileId: string,
      chunk: UploadChunk,
      uploadUrl: string,
      onProgress?: (chunkNumber: number, progress: number) => void,
      signal?: AbortSignal
    ): Promise<void> {
      const formData = new FormData();
      formData.append('fileId', fileId);
      formData.append('chunkNumber', chunk.chunkNumber.toString());
      formData.append('totalChunks', chunk.totalChunks.toString());
      formData.append('chunkSize', chunk.chunkSize.toString());
      formData.append('totalSize', chunk.totalSize.toString());
      formData.append('file', chunk.file);
  
      if (chunk.checksum) {
        formData.append('checksum', chunk.checksum);
      }
  
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(chunk.chunkNumber, progress);
          }
        });
  
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Chunk upload failed: ${xhr.status}`));
          }
        });
  
        xhr.addEventListener('error', () => {
          reject(new Error('Network error during chunk upload'));
        });
  
        xhr.addEventListener('abort', () => {
          reject(new Error('Chunk upload aborted'));
        });
  
        if (signal) {
          signal.addEventListener('abort', () => {
            xhr.abort();
          });
        }
  
        xhr.open('POST', uploadUrl);
        xhr.send(formData);
      });
    }
  
    // Upload file with chunking
    async uploadFile(
      file: File,
      uploadUrl: string,
      options?: {
        onProgress?: (progress: number) => void;
        onChunkProgress?: (chunkNumber: number, progress: number) => void;
        onChunkComplete?: (chunkNumber: number) => void;
        onError?: (error: Error, chunkNumber?: number) => void;
      }
    ): Promise<string> {
      const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const chunks = this.calculateChunks(file);
      const totalChunks = chunks.length;
      
      const abortControllers: AbortController[] = [];
      this.activeUploads.set(fileId, abortControllers);
  
      let uploadedChunks = 0;
      let failedChunks: number[] = [];
      
      // Upload chunks in parallel batches
      for (let i = 0; i < totalChunks; i += this.config.parallelUploads) {
        const chunkBatch = chunks.slice(i, i + this.config.parallelUploads);
        
        const uploadPromises = chunkBatch.map(async (chunkBlob, batchIndex) => {
          const chunkNumber = i + batchIndex + 1;
          
          for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
              const checksum = await this.generateChecksum(chunkBlob);
              const chunk: UploadChunk = {
                chunkNumber,
                totalChunks,
                chunkSize: chunkBlob.size,
                totalSize: file.size,
                file: chunkBlob,
                checksum,
              };
  
              const abortController = new AbortController();
              abortControllers.push(abortController);
  
              await this.uploadChunk(
                fileId,
                chunk,
                uploadUrl,
                (chunkNum, progress) => {
                  options?.onChunkProgress?.(chunkNum, progress);
                },
                abortController.signal
              );
  
              uploadedChunks++;
              options?.onChunkComplete?.(chunkNumber);
              
              // Update overall progress
              const overallProgress = Math.round((uploadedChunks / totalChunks) * 100);
              options?.onProgress?.(overallProgress);
              
              break; // Success, break retry loop
            } catch (error) {
              if (attempt === this.config.maxRetries) {
                failedChunks.push(chunkNumber);
                options?.onError?.(error as Error, chunkNumber);
                throw error;
              }
              // Wait before retry (exponential backoff)
              await new Promise(resolve => 
                setTimeout(resolve, Math.pow(2, attempt) * 1000)
              );
            }
          }
        });
  
        try {
          await Promise.all(uploadPromises);
        } catch (error) {
          // Continue with next batch even if some chunks fail
          console.error('Batch upload failed:', error);
        }
      }
  
      // Remove from active uploads
      this.activeUploads.delete(fileId);
  
      // Check if all chunks uploaded successfully
      if (failedChunks.length > 0) {
        throw new Error(`Failed to upload chunks: ${failedChunks.join(', ')}`);
      }
  
      // Complete multipart upload
      try {
        const completeResponse = await fetch(`${uploadUrl}/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileId,
            filename: file.name,
            totalChunks,
            totalSize: file.size,
          }),
        });
  
        if (!completeResponse.ok) {
          throw new Error('Failed to complete upload');
        }
  
        const result = await completeResponse.json();
        return result.data.fileId;
      } catch (error) {
        throw new Error(`Failed to complete upload: ${error}`);
      }
    }
  
    // Abort all uploads for a file
    abortUpload(fileId: string): void {
      const controllers = this.activeUploads.get(fileId);
      if (controllers) {
        controllers.forEach(controller => controller.abort());
        this.activeUploads.delete(fileId);
      }
    }
  
    // Resume upload
    async resumeUpload(
      fileId: string,
      uploadedChunks: number[],
      uploadUrl: string,
      file: File,
      options?: {
        onProgress?: (progress: number) => void;
        onChunkComplete?: (chunkNumber: number) => void;
      }
    ): Promise<string> {
      const chunks = this.calculateChunks(file);
      const totalChunks = chunks.length;
      
      // Find missing chunks
      const missingChunks = Array.from({ length: totalChunks }, (_, i) => i + 1)
        .filter(chunkNumber => !uploadedChunks.includes(chunkNumber));
      
      let uploadedCount = uploadedChunks.length;
      
      for (const chunkNumber of missingChunks) {
        const chunkIndex = chunkNumber - 1;
        const chunkBlob = chunks[chunkIndex];
        
        try {
          const checksum = await this.generateChecksum(chunkBlob);
          const chunk: UploadChunk = {
            chunkNumber,
            totalChunks,
            chunkSize: chunkBlob.size,
            totalSize: file.size,
            file: chunkBlob,
            checksum,
          };
  
          const abortController = new AbortController();
          
          await this.uploadChunk(
            fileId,
            chunk,
            uploadUrl,
            undefined,
            abortController.signal
          );
  
          uploadedCount++;
          options?.onChunkComplete?.(chunkNumber);
          
          // Update progress
          const progress = Math.round((uploadedCount / totalChunks) * 100);
          options?.onProgress?.(progress);
        } catch (error) {
          throw new Error(`Failed to resume chunk ${chunkNumber}: ${error}`);
        }
      }
  
      // Complete upload
      const completeResponse = await fetch(`${uploadUrl}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId,
          filename: file.name,
          totalChunks,
          totalSize: file.size,
        }),
      });
  
      if (!completeResponse.ok) {
        throw new Error('Failed to complete resumed upload');
      }
  
      const result = await completeResponse.json();
      return result.data.fileId;
    }
  }
  
  // Helper to check if file needs chunking
  export const needsChunking = (file: File, threshold: number = 10 * 1024 * 1024): boolean => {
    return file.size > threshold; // 10MB threshold
  };