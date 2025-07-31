import { SelectionFile, ProcessedFile, SelectionOptions } from '../types';

/**
 * Convert File to SelectionFile
 */
export const fileToSelectionFile = (file: File): SelectionFile => {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase() || '';
  const type = file.type.split('/')[0] || 'unknown';

  return {
    name: file.name,
    size: file.size,
    type,
    extension,
    mimeType: file.type
  };
};

/**
 * Convert bytes to human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? '.' + parts.pop()!.toLowerCase() : '';
};

/**
 * Get file type from MIME type
 */
export const getFileType = (mimeType: string): string => {
  return mimeType.split('/')[0] || 'unknown';
};

/**
 * File to Base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * File to Blob
 */
export const fileToBlob = async (file: File): Promise<Blob> => {
  const arrayBuffer = await file.arrayBuffer();
  return new Blob([arrayBuffer], { type: file.type });
};

/**
 * Validate file size
 */
export const validateFileSize = (
  file: File,
  minSize?: number,
  maxSize?: number
): { valid: boolean; error?: string } => {
  if (minSize && file.size < minSize) {
    return {
      valid: false,
      error: `File size is less than ${formatFileSize(minSize)}`
    };
  }

  if (maxSize && file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${formatFileSize(maxSize)}`
    };
  }

  return { valid: true };
};

/**
 * Validate MIME type
 */
export const validateMimeType = (
  mimeType: string,
  allowedTypes?: string[]
): { valid: boolean; error?: string } => {
  if (!allowedTypes || allowedTypes.length === 0) {
    return { valid: true };
  }

  if (!allowedTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `File type '${mimeType}' is not allowed`
    };
  }

  return { valid: true };
};

/**
 * Create processed file
 */
export const createProcessedFile = async (
  file: File,
  options: SelectionOptions,
  thumbnail?: ProcessedFile
): Promise<ProcessedFile> => {
  const selectionFile = fileToSelectionFile(file);

  const processedFile: ProcessedFile = {
    name: selectionFile.name,
    size: selectionFile.size,
    type: selectionFile.type,
    extension: selectionFile.extension,
    mimeType: selectionFile.mimeType,
    file: file
  };

  // Generate base64 if requested
  if (options.willGenerateBase64) {
    processedFile.base64 = await fileToBase64(file);
  }

  // Generate blob if requested
  if (options.willGenerateBlob) {
    processedFile.blob = await fileToBlob(file);
  }

  // Add thumbnail if provided
  if (thumbnail) {
    processedFile.thumbnail = thumbnail;
  }

  return processedFile;
};

/**
 * Create file input element
 */
export const createFileInput = (
  accept?: string,
  multiple: boolean = false
): HTMLInputElement => {
  const input = document.createElement('input');
  input.type = 'file';
  input.style.display = 'none';

  if (accept) {
    input.accept = accept;
  }

  input.multiple = multiple;

  return input;
};

/**
 * Trigger file selection dialog
 */
export const selectFiles = (
  accept?: string,
  multiple: boolean = false
): Promise<FileList | null> => {
  return new Promise((resolve) => {
    const input = createFileInput(accept, multiple);

    input.onchange = () => {
      resolve(input.files);
      document.body.removeChild(input);
    };

    document.body.appendChild(input);
    input.click();
  });
};

/**
 * Check if running in browser environment
 */
export const isBrowser = (): boolean => {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
};