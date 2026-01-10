
import exifr from 'exifr';

export interface EXIFData {
  make?: string;
  model?: string;
  software?: string;
  dateTime?: string;
  dateTimeOriginal?: string;
  dateTimeDigitized?: string;
  gps?: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
    latitudeRef?: 'N' | 'S';
    longitudeRef?: 'E' | 'W';
  };
  exposureTime?: string;
  fNumber?: number;
  iso?: number;
  focalLength?: number;
  lensModel?: string;
  orientation?: number;
  resolution?: {
    width: number;
    height: number;
  };
}

export class EXIFExtractor {
  static async extract(file: File): Promise<EXIFData | null> {
    try {
      // Only process image files
      if (!file.type.startsWith('image/')) {
        return null;
      }

      // Extract EXIF data
      const exif = await exifr.parse(file, {
        gps: true,
        tiff: true,
        exif: true,
        ifd1: true,
        interop: true,
        translateValues: true,
        reviveValues: true,
      });

      if (!exif) {
        return null;
      }

      // Format GPS data
      let gpsData;
      if (exif.latitude && exif.longitude) {
        gpsData = {
          latitude: exif.latitude,
          longitude: exif.longitude,
          altitude: exif.altitude,
          latitudeRef: exif.latitudeRef,
          longitudeRef: exif.longitudeRef,
        };
      }

      // Get image dimensions
      const image = new Image();
      const url = URL.createObjectURL(file);
      
      const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
        image.onload = () => {
          resolve({
            width: image.width,
            height: image.height,
          });
          URL.revokeObjectURL(url);
        };
        image.src = url;
      });

      return {
        make: exif.Make,
        model: exif.Model,
        software: exif.Software,
        dateTime: exif.DateTime,
        dateTimeOriginal: exif.DateTimeOriginal,
        dateTimeDigitized: exif.DateTimeDigitized,
        gps: gpsData,
        exposureTime: exif.ExposureTime,
        fNumber: exif.FNumber,
        iso: exif.ISO,
        focalLength: exif.FocalLength,
        lensModel: exif.LensModel,
        orientation: exif.Orientation,
        resolution: dimensions,
      };
    } catch (error) {
      console.warn('Failed to extract EXIF data:', error);
      return null;
    }
  }

  static formatGPS(gps: EXIFData['gps']): { lat: number; lng: number } | undefined {
    if (!gps || gps.latitude === undefined || gps.longitude === undefined) {
      return undefined;
    }

    let lat = gps.latitude;
    let lng = gps.longitude;

    // Apply reference directions
    if (gps.latitudeRef === 'S') lat = -lat;
    if (gps.longitudeRef === 'W') lng = -lng;

    return { lat, lng };
  }

  static formatDateTime(dateTime?: string): string | undefined {
    if (!dateTime) return undefined;
    
    try {
      // Convert EXIF date format to ISO string
      const date = new Date(dateTime);
      if (isNaN(date.getTime())) return undefined;
      
      return date.toISOString();
    } catch {
      return undefined;
    }
  }

  static async extractAndFormat(file: File): Promise<{
    metadata?: EXIFData;
    location?: { lat: number; lng: number };
    takenAt?: string;
  }> {
    const exifData = await this.extract(file);
    
    if (!exifData) {
      return {};
    }

    const location = this.formatGPS(exifData.gps);
    const takenAt = this.formatDateTime(
      exifData.dateTimeOriginal || exifData.dateTime
    );

    return {
      metadata: exifData,
      location,
      takenAt,
    };
  }
}

// Hook for EXIF extraction
export const useEXIFExtraction = () => {
  const extractFromFiles = async (files: File[]) => {
    const results = await Promise.all(
      files.map(async (file) => {
        const exif = await EXIFExtractor.extractAndFormat(file);
        return {
          file,
          exif,
        };
      })
    );
    
    return results.filter(result => result.exif.metadata || result.exif.location);
  };

  const extractSingle = async (file: File) => {
    return await EXIFExtractor.extractAndFormat(file);
  };

  return {
    extractFromFiles,
    extractSingle,
  };
};
