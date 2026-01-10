import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB: number; // Max file size in MB
  maxWidthOrHeight: number; // Max width or height
  useWebWorker: boolean; // Use web worker for better performance
  maxIteration: number; // Max iteration to compress
  exifOrientation: number; // Preserve EXIF orientation
  fileType: string; // Output file type
  initialQuality: number; // Initial quality (0-1)
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  maxIteration: 10,
  exifOrientation: 1,
  fileType: 'image/jpeg',
  initialQuality: 0.8,
};

export class ImageCompressor {
  static async compress(
    file: File,
    options?: Partial<CompressionOptions>
  ): Promise<File> {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    
    try {
      const compressedFile = await imageCompression(file, mergedOptions);
      
      // Create new file with original name and compressed data
      const newFile = new File(
        [compressedFile],
        file.name.replace(/\.[^/.]+$/, '') + '_compressed.jpg',
        {
          type: 'image/jpeg',
          lastModified: Date.now(),
        }
      );
      
      return newFile;
    } catch (error) {
      console.error('Image compression failed:', error);
      throw error;
    }
  }

  static async compressWithPreview(
    file: File,
    options?: Partial<CompressionOptions>
  ): Promise<{
    compressedFile: File;
    originalSize: number;
    compressedSize: number;
    reductionPercent: number;
    previewUrl: string;
  }> {
    const originalSize = file.size;
    
    try {
      const compressedFile = await this.compress(file, options);
      const compressedSize = compressedFile.size;
      const reductionPercent = Math.round(
        ((originalSize - compressedSize) / originalSize) * 100
      );
      
      // Create preview URL
      const previewUrl = await imageCompression.getDataUrlFromFile(compressedFile);
      
      return {
        compressedFile,
        originalSize,
        compressedSize,
        reductionPercent,
        previewUrl,
      };
    } catch (error) {
      throw new Error(`Compression failed: ${error}`);
    }
  }

  static async compressMultiple(
    files: File[],
    options?: Partial<CompressionOptions>,
    onProgress?: (progress: number, index: number) => void
  ): Promise<File[]> {
    const compressedFiles: File[] = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        const compressedFile = await this.compress(files[i], options);
        compressedFiles.push(compressedFile);
        
        if (onProgress) {
          onProgress(Math.round(((i + 1) / files.length) * 100), i);
        }
      } catch (error) {
        console.error(`Failed to compress file ${files[i].name}:`, error);
        // Fallback to original file
        compressedFiles.push(files[i]);
      }
    }
    
    return compressedFiles;
  }

  static getCompressionSuggestion(file: File): {
    shouldCompress: boolean;
    suggestedOptions: Partial<CompressionOptions>;
    estimatedSize: number;
  } {
    const shouldCompress = file.size > 1 * 1024 * 1024; // Compress if > 1MB
    
    let maxSizeMB = 1;
    let maxWidthOrHeight = 1920;
    
    if (file.size > 5 * 1024 * 1024) {
      maxSizeMB = 0.5;
      maxWidthOrHeight = 1280;
    } else if (file.size > 10 * 1024 * 1024) {
      maxSizeMB = 0.3;
      maxWidthOrHeight = 1024;
    }
    
    const estimatedSize = Math.min(
      file.size,
      maxSizeMB * 1024 * 1024
    );
    
    return {
      shouldCompress,
      suggestedOptions: {
        maxSizeMB,
        maxWidthOrHeight,
        initialQuality: shouldCompress ? 0.7 : 0.9,
      },
      estimatedSize,
    };
  }

  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// React Hook for compression
export const useImageCompression = () => {
  const compressImage = async (
    file: File,
    options?: Partial<CompressionOptions>
  ) => {
    return await ImageCompressor.compress(file, options);
  };

  const compressImages = async (
    files: File[],
    options?: Partial<CompressionOptions>,
    onProgress?: (progress: number, index: number) => void
  ) => {
    return await ImageCompressor.compressMultiple(files, options, onProgress);
  };

  const compressWithPreview = async (
    file: File,
    options?: Partial<CompressionOptions>
  ) => {
    return await ImageCompressor.compressWithPreview(file, options);
  };

  const getCompressionSuggestion = (file: File) => {
    return ImageCompressor.getCompressionSuggestion(file);
  };

  return {
    compressImage,
    compressImages,
    compressWithPreview,
    getCompressionSuggestion,
    formatBytes: ImageCompressor.formatBytes,
  };
};