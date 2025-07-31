// import { ProcessedFile, SelectionFile } from '../types';
import imageCompression from 'browser-image-compression';

/**
 * Image MIME types
 */
export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff'
];

/**
 * Check if file is an image
 */
export const isImageFile = (mimeType: string): boolean => {
  return IMAGE_MIME_TYPES.includes(mimeType);
};

/**
 * Get image dimensions
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Get image aspect ratio
 */
export const getImageAspectRatio = async (file: File): Promise<'square' | 'landscape' | 'portrait'> => {
  const { width, height } = await getImageDimensions(file);
  const ratio = width / height;

  if (Math.abs(ratio - 1) < 0.1) {
    return 'square';
  } else if (ratio > 1) {
    return 'landscape';
  } else {
    return 'portrait';
  }
};

/**
 * Resize image
 */
export const resizeImage = (
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.8,
  format?: string
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(img.src);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Calculate new dimensions maintaining aspect ratio
      let newWidth = img.naturalWidth;
      let newHeight = img.naturalHeight;

      if (newWidth > maxWidth || newHeight > maxHeight) {
        const widthRatio = maxWidth / newWidth;
        const heightRatio = maxHeight / newHeight;
        const ratio = Math.min(widthRatio, heightRatio);

        newWidth = Math.round(newWidth * ratio);
        newHeight = Math.round(newHeight * ratio);
      }

      canvas.width = newWidth;
      canvas.height = newHeight;

      // Use better image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to resize image'));
        }
      }, format || (file.type === 'image/png' ? 'image/png' : 'image/jpeg'), quality);
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Generate image thumbnail
 */
export const generateImageThumbnail = async (
  file: File,
  size: 'small' | 'medium' | 'large' = 'medium',
  format: 'jpeg' | 'png' | 'webp' = 'jpeg',
  quality: 'low' | 'medium' | 'high' = 'medium'
): Promise<Blob> => {
  const sizes = {
    small: { width: 150, height: 150 },
    medium: { width: 300, height: 300 },
    large: { width: 500, height: 500 }
  };

  const qualities = {
    low: 0.6,
    medium: 0.8,
    high: 0.95
  };

  const { width, height } = sizes[size];
  const qualityValue = qualities[quality];
  const mimeType = `image/${format}`;

  return resizeImage(file, width, height, qualityValue, mimeType);
};

/**
 * Convert image to base64
 */
export const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert image to base64'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Compress image
 */
export const compressImage = async (
  file: File,
  compression: 'low' | 'medium' | 'high' = 'medium'
): Promise<Blob> => {
  const compressionOptions = {
    low: { 
      maxSizeMB: 2,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: 0.5
    },
    medium: { 
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: 0.7
    },
    high: { 
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: 0.85
    }
  };

  try {
    const compressedFile = await imageCompression(file, compressionOptions[compression]);
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    // Fallback to original file
    return file;
  }
};

/**
 * Validate image file
 */
export const validateImageFile = async (
  file: File,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    minWidth?: number;
    minHeight?: number;
    allowedAspectRatios?: Array<'square' | 'landscape' | 'portrait'>;
  }
): Promise<{ valid: boolean; errors: string[] }> => {
  const errors: string[] = [];

  if (!isImageFile(file.type)) {
    errors.push('Invalid image file type');
    return { valid: false, errors };
  }

  try {
    const dimensions = await getImageDimensions(file);

    if (options?.maxWidth && dimensions.width > options.maxWidth) {
      errors.push(`Image width exceeds ${options.maxWidth}px`);
    }

    if (options?.maxHeight && dimensions.height > options.maxHeight) {
      errors.push(`Image height exceeds ${options.maxHeight}px`);
    }

    if (options?.minWidth && dimensions.width < options.minWidth) {
      errors.push(`Image width is less than ${options.minWidth}px`);
    }

    if (options?.minHeight && dimensions.height < options.minHeight) {
      errors.push(`Image height is less than ${options.minHeight}px`);
    }

    if (options?.allowedAspectRatios && options.allowedAspectRatios.length > 0) {
      const aspectRatio = await getImageAspectRatio(file);
      if (!options.allowedAspectRatios.includes(aspectRatio)) {
        errors.push(`Image aspect ratio '${aspectRatio}' is not allowed`);
      }
    }
  } catch (error) {
    errors.push('Failed to validate image file');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};