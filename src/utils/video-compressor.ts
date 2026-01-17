// apps/evergreen-web/src/utils/video-compressor.ts

interface VideoCompressionOptions {
  maxSizeMB?: number;
  maxWidth?: number;
  maxHeight?: number;
  bitrate?: string;
  fps?: number;
  codec?: 'libx264' | 'libvpx-vp9' | 'libaom-av1';
  preset?: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow';
  profile?: 'low' | 'medium' | 'high';
}

interface CompressionResult {
  compressedBlob: Blob;
  compressedSize: number;
  originalSize: number;
  compressionRatio: number;
  duration?: number;
  width?: number;
  height?: number;
}

export class VideoCompressor {
  private ffmpeg: any = null;
  private loaded = false;

  constructor() {
    // Lazy load ffmpeg
  }

  private async loadFFmpeg(): Promise<void> {
    if (this.loaded) return;

    if (typeof window !== 'undefined') {
      try {
        // Dynamic import for client-side only
        const ffmpegModule = await import('@ffmpeg/ffmpeg');
        // @ts-ignore - Handle module structure differences
        const createFFmpeg = ffmpegModule.createFFmpeg || ffmpegModule.default?.createFFmpeg;
        
        if (!createFFmpeg) {
          throw new Error('FFmpeg module not found');
        }
        
        this.ffmpeg = createFFmpeg({
          log: process.env.NODE_ENV === 'development',
          corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
        });
        await this.ffmpeg.load();
      } catch (error) {
        console.error('Failed to load FFmpeg:', error);
        throw new Error('Video compression requires FFmpeg library');
      }
    }
    this.loaded = true;
  }

  /**
   * Compress video in browser using ffmpeg.wasm
   */
  async compressVideoBrowser(
    file: File,
    options: VideoCompressionOptions = {}
  ): Promise<CompressionResult> {
    try {
      await this.loadFFmpeg();

      const {
        maxSizeMB = 10,
        maxWidth = 1280,
        maxHeight = 720,
        bitrate = '1M',
        fps = 30,
        codec = 'libx264',
        preset = 'medium',
        profile = 'medium'
      } = options;

      // Read file
      const fileBuffer = await file.arrayBuffer();
      
      // Write input file to FFmpeg
      this.ffmpeg.FS('writeFile', 'input.mp4', new Uint8Array(fileBuffer));

      // Build FFmpeg command
      const command = [
        '-i', 'input.mp4',
        '-vf', `scale='min(${maxWidth},iw)':'min(${maxHeight},ih)':force_original_aspect_ratio=decrease`,
        '-c:v', codec,
        '-preset', preset,
        '-b:v', bitrate,
        '-maxrate', bitrate,
        '-bufsize', '2M',
        '-r', fps.toString(),
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        'output.mp4'
      ];

      // Run compression
      await this.ffmpeg.run(...command);

      // Read output file
      const outputData = this.ffmpeg.FS('readFile', 'output.mp4');
      const compressedBlob = new Blob([outputData.buffer], { type: 'video/mp4' });

      // Cleanup
      try {
        this.ffmpeg.FS('unlink', 'input.mp4');
        this.ffmpeg.FS('unlink', 'output.mp4');
      } catch (e) {
        // Ignore cleanup errors
      }

      return {
        compressedBlob,
        compressedSize: compressedBlob.size,
        originalSize: file.size,
        compressionRatio: file.size > 0 ? (file.size - compressedBlob.size) / file.size : 0
      };
    } catch (error: any) {
      console.error('Video compression error:', error);
      throw new Error(`Video compression failed: ${error.message}`);
    }
  }

  /**
   * Generate thumbnail from video
   */
  async generateThumbnail(file: File, timeSeconds: number = 1): Promise<Blob> {
    try {
      await this.loadFFmpeg();

      const fileBuffer = await file.arrayBuffer();
      this.ffmpeg.FS('writeFile', 'input.mp4', new Uint8Array(fileBuffer));

      // Extract frame at specific time
      await this.ffmpeg.run(
        '-i', 'input.mp4',
        '-ss', timeSeconds.toString(),
        '-vframes', '1',
        '-vf', 'scale=320:-1',
        'thumbnail.jpg'
      );

      const thumbnailData = this.ffmpeg.FS('readFile', 'thumbnail.jpg');
      const thumbnailBlob = new Blob([thumbnailData.buffer], { type: 'image/jpeg' });

      // Cleanup
      try {
        this.ffmpeg.FS('unlink', 'input.mp4');
        this.ffmpeg.FS('unlink', 'thumbnail.jpg');
      } catch (e) {
        // Ignore cleanup errors
      }

      return thumbnailBlob;
    } catch (error: any) {
      console.error('Thumbnail generation error:', error);
      // Return a placeholder if thumbnail generation fails
      return new Blob([], { type: 'image/jpeg' });
    }
  }

  /**
   * Get video metadata (duration, dimensions)
   */
  async getVideoMetadata(file: File): Promise<{ duration: number; width: number; height: number }> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Video metadata can only be extracted in browser'));
        return;
      }

      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight
        });
      };
      
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video metadata'));
      };
      
      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Validate video file
   */
  async validateVideo(file: File): Promise<{ valid: boolean; error?: string }> {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    
    if (file.size > maxSize) {
      return { valid: false, error: 'Video file too large (max 100MB)' };
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid video format. Allowed: MP4, WebM, MOV, AVI' };
    }
    
    return { valid: true };
  }
}

export const videoCompressor = new VideoCompressor();