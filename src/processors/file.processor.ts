import { SelectionOptions, ProcessedFile } from '../types';
import { 
  selectFiles, 
  validateFileSize, 
  validateMimeType, 
  createProcessedFile,
  isBrowser 
} from '../utils/common.utils';

export class FileProcessor {
  /**
   * Process selected files
   */
  static async processFiles(
    files: FileList | File[],
    options: SelectionOptions
  ): Promise<ProcessedFile[]> {
    if (!isBrowser()) {
      throw new Error('File processing is only available in browser environment');
    }

    const fileArray = Array.from(files);
    const processedFiles: ProcessedFile[] = [];
    const errors: string[] = [];

    // Validate selection count
    if (options.rules?.minSelectionCount && fileArray.length < options.rules.minSelectionCount) {
      throw new Error(`Minimum ${options.rules.minSelectionCount} files must be selected`);
    }

    if (options.rules?.maxSelectionCount && fileArray.length > options.rules.maxSelectionCount) {
      throw new Error(`Maximum ${options.rules.maxSelectionCount} files can be selected`);
    }

    // Process each file
    for (const file of fileArray) {
      try {
        // Validate file size
        const sizeValidation = validateFileSize(
          file,
          options.rules?.minFileSize,
          options.rules?.maxFileSize
        );

        if (!sizeValidation.valid) {
          errors.push(`${file.name}: ${sizeValidation.error}`);
          continue;
        }

        // Validate MIME type
        const mimeValidation = validateMimeType(
          file.type,
          options.rules?.allowedMimeTypes
        );

        if (!mimeValidation.valid) {
          errors.push(`${file.name}: ${mimeValidation.error}`);
          continue;
        }

        // Create processed file
        const processedFile = await createProcessedFile(file, options);
        processedFiles.push(processedFile);
      } catch (error) {
        errors.push(`${file.name}: Failed to process file`);
      }
    }

    // If there are errors and no successfully processed files, throw
    if (errors.length > 0 && processedFiles.length === 0) {
      throw new Error(errors.join(', '));
    }

    return processedFiles;
  }

  /**
   * Select and process files
   */
  static async selectAndProcess(
    options: SelectionOptions,
    accept?: string
  ): Promise<ProcessedFile[]> {
    const files = await selectFiles(
      accept,
      options.rules?.maxSelectionCount !== 1
    );

    if (!files) {
      throw new Error('No files selected');
    }

    return FileProcessor.processFiles(files, options);
  }
}