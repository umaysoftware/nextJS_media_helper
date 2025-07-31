import { SelectionOptions, ProcessedFile, RuleInfo } from '../types';
import { 
  selectFiles, 
  validateFileSize, 
  validateMimeType, 
  createProcessedFile,
  isBrowser,
  getMatchingRule,
  mergeRules
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

    // Get merged rules if array, or single rule
    let globalRules: RuleInfo | undefined;
    if (Array.isArray(options.rules)) {
      globalRules = mergeRules(options.rules);
    } else {
      globalRules = options.rules;
    }

    // Validate selection count using global rules
    if (globalRules?.minSelectionCount && fileArray.length < globalRules.minSelectionCount) {
      throw new Error(`Minimum ${globalRules.minSelectionCount} files must be selected`);
    }

    if (globalRules?.maxSelectionCount && fileArray.length > globalRules.maxSelectionCount) {
      throw new Error(`Maximum ${globalRules.maxSelectionCount} files can be selected`);
    }

    // Process each file
    for (const file of fileArray) {
      try {
        // Get matching rule for this specific file
        const fileRule = getMatchingRule(file, options.rules) || globalRules;

        // Validate file size
        const sizeValidation = validateFileSize(
          file,
          fileRule?.minFileSize,
          fileRule?.maxFileSize
        );

        if (!sizeValidation.valid) {
          errors.push(`${file.name}: ${sizeValidation.error}`);
          continue;
        }

        // Validate MIME type
        const mimeValidation = validateMimeType(
          file.type,
          fileRule?.allowedMimeTypes
        );

        if (!mimeValidation.valid) {
          errors.push(`${file.name}: ${mimeValidation.error}`);
          continue;
        }

        // Create processed file
        const processedFile = await createProcessedFile(file, fileRule);
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
    // Get max selection count from rules
    let maxSelectionCount: number | undefined;
    if (Array.isArray(options.rules)) {
      const merged = mergeRules(options.rules);
      maxSelectionCount = merged.maxSelectionCount;
    } else {
      maxSelectionCount = options.rules?.maxSelectionCount;
    }

    const files = await selectFiles(
      accept,
      maxSelectionCount !== 1
    );

    if (!files) {
      throw new Error('No files selected');
    }

    return FileProcessor.processFiles(files, options);
  }
}