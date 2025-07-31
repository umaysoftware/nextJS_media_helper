// import { ProcessedFile, SelectionFile } from '../types';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

/**
 * Video MIME types
 */
export const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-ms-wmv',
  'video/webm',
  'video/ogg',
  'video/3gpp',
  'video/3gpp2'
];

/**
 * Check if file is a video
 */
export const isVideoFile = (mimeType: string): boolean => {
  return VIDEO_MIME_TYPES.includes(mimeType);
};

/**
 * Get video duration from file
 */
export const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };

    video.src = URL.createObjectURL(file);
  });
};

/**
 * Get video dimensions
 */
export const getVideoDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve({
        width: video.videoWidth,
        height: video.videoHeight
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video dimensions'));
    };

    video.src = URL.createObjectURL(file);
  });
};

/**
 * Generate video thumbnail
 */
export const generateVideoThumbnail = (file: File, time: number = 1): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(time, video.duration);
    };

    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        URL.revokeObjectURL(video.src);
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to generate thumbnail'));
        }
      }, 'image/jpeg', 0.8);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video'));
    };

    video.src = URL.createObjectURL(file);
  });
};

/**
 * Compress video using FFmpeg
 */
export const compressVideo = async (
  file: File,
  compression: 'low' | 'medium' | 'high' = 'medium'
): Promise<Blob> => {
  const ffmpeg = new FFmpeg();
  
  try {
    // Load FFmpeg
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    // Write input file
    await ffmpeg.writeFile('input.mp4', await fetchFile(file));

    // Compression settings
    const compressionSettings = {
      low: '-crf 35 -preset fast -vf scale=1280:-2',
      medium: '-crf 28 -preset medium -vf scale=1280:-2',
      high: '-crf 23 -preset slow -vf scale=1920:-2'
    };

    // Execute compression
    await ffmpeg.exec([
      '-i', 'input.mp4',
      ...compressionSettings[compression].split(' '),
      '-c:a', 'aac',
      '-b:a', '128k',
      'output.mp4'
    ]);

    // Read output file
    const data = await ffmpeg.readFile('output.mp4');
    const blob = new Blob([data], { type: 'video/mp4' });
    
    return blob;
  } catch (error) {
    console.error('Video compression failed:', error);
    // Fallback to original file
    return file;
  }
};

/**
 * Validate video file
 */
export const validateVideoFile = async (
  file: File,
  options?: {
    maxDuration?: number;
    maxWidth?: number;
    maxHeight?: number;
    minWidth?: number;
    minHeight?: number;
  }
): Promise<{ valid: boolean; errors: string[] }> => {
  const errors: string[] = [];

  if (!isVideoFile(file.type)) {
    errors.push('Invalid video file type');
    return { valid: false, errors };
  }

  try {
    if (options?.maxDuration) {
      const duration = await getVideoDuration(file);
      if (duration > options.maxDuration) {
        errors.push(`Video duration exceeds ${options.maxDuration} seconds`);
      }
    }

    if (options?.maxWidth || options?.maxHeight || options?.minWidth || options?.minHeight) {
      const dimensions = await getVideoDimensions(file);

      if (options.maxWidth && dimensions.width > options.maxWidth) {
        errors.push(`Video width exceeds ${options.maxWidth}px`);
      }

      if (options.maxHeight && dimensions.height > options.maxHeight) {
        errors.push(`Video height exceeds ${options.maxHeight}px`);
      }

      if (options.minWidth && dimensions.width < options.minWidth) {
        errors.push(`Video width is less than ${options.minWidth}px`);
      }

      if (options.minHeight && dimensions.height < options.minHeight) {
        errors.push(`Video height is less than ${options.minHeight}px`);
      }
    }
  } catch (error) {
    errors.push('Failed to validate video file');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};