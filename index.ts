import { 
    SelectionOptions, 
    ProcessedFile, 
    UnProcessedFile,
    FileError,
    RuleInfo,
    ExportedFile
} from './src/types/common';

/**
 * MediaHelper class with native file selection and processing
 */
export class MediaHelper {
    /**
     * Detect file type based on MIME type and extension
     */
    private static detectFileType(file: File): string {
        const mimeType = file.type.toLowerCase();
        const extension = file.name.split('.').pop()?.toLowerCase() || '';

        // Check by MIME type first
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        if (mimeType.startsWith('application/pdf') || 
            mimeType.startsWith('application/msword') ||
            mimeType.startsWith('application/vnd.') ||
            mimeType.startsWith('text/')) return 'document';
        
        // Check by extension as fallback
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'avif', 'heic', 'heif'].includes(extension)) {
            return 'image';
        }
        if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'm4v', 'mpg', 'mpeg', '3gp'].includes(extension)) {
            return 'video';
        }
        if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'wma', 'm4a', 'opus', 'aiff'].includes(extension)) {
            return 'audio';
        }
        if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt'].includes(extension)) {
            return 'document';
        }
        if (['zip', 'rar', 'tar', 'gz', '7z'].includes(extension)) {
            return 'archive';
        }

        return 'unknown';
    }

    /**
     * Check if MIME type matches the allowed patterns (supports wildcards like image/*)
     */
    private static matchesMimeType(fileMimeType: string, allowedMimeTypes: string[]): boolean {
        return allowedMimeTypes.some(allowed => {
            if (allowed.endsWith('/*')) {
                const prefix = allowed.slice(0, -2);
                return fileMimeType.startsWith(prefix + '/');
            }
            return fileMimeType === allowed;
        });
    }

    /**
     * Validate a single file against rules
     */
    private static validateFile(file: File, rules?: RuleInfo): FileError | null {
        if (!rules) return null;

        // Check MIME type
        if (rules.allowedMimeTypes && !this.matchesMimeType(file.type, rules.allowedMimeTypes)) {
            return {
                fileName: file.name,
                errorCode: 'file-invalid-type',
                message: `File type ${file.type} is not allowed`
            };
        }

        // Check file size
        if (rules.minFileSize && file.size < rules.minFileSize) {
            return {
                fileName: file.name,
                errorCode: 'file-too-small',
                message: `File is too small. Minimum size: ${(rules.minFileSize / 1024 / 1024).toFixed(2)} MB`
            };
        }

        if (rules.maxFileSize && file.size > rules.maxFileSize) {
            return {
                fileName: file.name,
                errorCode: 'file-too-large',
                message: `File is too large. Maximum size: ${(rules.maxFileSize / 1024 / 1024).toFixed(2)} MB`
            };
        }

        return null;
    }

    /**
     * Process a single file
     */
    private static async processFile(
        file: File, 
        rules?: RuleInfo,
        onProgress?: (progress: any) => void,
        currentIndex?: number,
        totalFiles?: number
    ): Promise<ProcessedFile | UnProcessedFile> {
        const extension = '.' + file.name.split('.').pop()!.toLowerCase();
        const fileType = this.detectFileType(file);
        
        // Create meta object
        const meta = {
            name: file.name,
            size: file.size,
            type: fileType,
            extension,
            mimeType: file.type
        };

        // Validate file
        const validationError = this.validateFile(file, rules);
        if (validationError) {
            return {
                processType: 'unprocessed',
                meta,
                originalFile: file,
                reason: validationError
            };
        }

        try {
            // Report progress - processing stage
            if (onProgress && currentIndex !== undefined && totalFiles !== undefined) {
                onProgress({
                    currentFile: currentIndex + 1,
                    totalFiles,
                    fileName: file.name,
                    stage: 'processing',
                    percentage: Math.round(((currentIndex + 0.5) / totalFiles) * 100)
                });
            }

            // Process the file based on type
            let processed: ExportedFile = {
                name: file.name,
                size: file.size,
                type: fileType,
                extension,
                mimeType: file.type
            };

            let thumbnail: ExportedFile | undefined;

            // Generate base64 if requested
            if (rules?.willGenerateBase64) {
                processed.base64 = await this.fileToBase64(file);
            }

            // Generate blob if requested
            if (rules?.willGenerateBlob) {
                processed.blob = new Blob([file], { type: file.type });
            }

            // Always include the file
            processed.file = file;

            // Generate URL if we have blob or file
            if (processed.blob || processed.file) {
                processed.url = URL.createObjectURL(processed.blob || processed.file);
            }

            // Generate thumbnail for images and videos
            if (fileType === 'image' || fileType === 'video') {
                // Simple thumbnail generation (you can enhance this)
                thumbnail = {
                    name: `thumb_${file.name}`,
                    size: 0,
                    type: fileType,
                    extension,
                    mimeType: file.type
                };
                
                // For images, we can use the same file as thumbnail for now
                if (fileType === 'image') {
                    thumbnail.file = file;
                    thumbnail.url = URL.createObjectURL(file);
                }
            }

            // Report progress - completed stage
            if (onProgress && currentIndex !== undefined && totalFiles !== undefined) {
                onProgress({
                    currentFile: currentIndex + 1,
                    totalFiles,
                    fileName: file.name,
                    stage: 'completed',
                    percentage: Math.round(((currentIndex + 1) / totalFiles) * 100)
                });
            }

            return {
                processType: 'processed',
                meta,
                originalFile: file,
                processed,
                thumbnail
            };
        } catch (error) {
            return {
                processType: 'unprocessed',
                meta,
                originalFile: file,
                reason: {
                    fileName: file.name,
                    errorCode: 'processing-error',
                    message: error instanceof Error ? error.message : 'Unknown error during processing'
                }
            };
        }
    }

    /**
     * Convert file to base64
     */
    private static fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    }

    /**
     * Process files and return array of ProcessedFile and UnProcessedFile
     */
    static async processFiles(
        files: File[], 
        options?: SelectionOptions
    ): Promise<(ProcessedFile | UnProcessedFile)[]> {
        if (!files || files.length === 0) {
            return [];
        }

        const rules = options?.rules?.[0]; // For now, use first rule for all files
        const results: (ProcessedFile | UnProcessedFile)[] = [];

        // Check selection count constraints
        if (rules?.minSelectionCount && files.length < rules.minSelectionCount) {
            // Return all files as unprocessed with error
            return files.map(file => {
                const extension = '.' + file.name.split('.').pop()!.toLowerCase();
                const fileType = this.detectFileType(file);
                
                return {
                    processType: 'unprocessed' as const,
                    meta: {
                        name: file.name,
                        size: file.size,
                        type: fileType,
                        extension,
                        mimeType: file.type
                    },
                    originalFile: file,
                    reason: {
                        fileName: file.name,
                        errorCode: 'too-few-files',
                        message: `Minimum ${rules.minSelectionCount} file(s) required`
                    }
                };
            });
        }

        if (rules?.maxSelectionCount && files.length > rules.maxSelectionCount) {
            // Process only up to max count
            files = files.slice(0, rules.maxSelectionCount);
        }

        // Process each file
        for (let i = 0; i < files.length; i++) {
            const result = await this.processFile(
                files[i], 
                rules, 
                options?.onProgress,
                i,
                files.length
            );
            results.push(result);
        }

        return results;
    }

    /**
     * Open native file picker and process files
     */
    static async pickMixed(options?: SelectionOptions): Promise<(ProcessedFile | UnProcessedFile)[]> {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            
            // Set accept attribute based on rules
            if (options?.rules?.[0]?.allowedMimeTypes) {
                input.accept = options.rules[0].allowedMimeTypes.join(',');
            }

            input.onchange = async (e) => {
                const target = e.target as HTMLInputElement;
                const files = Array.from(target.files || []);
                const results = await this.processFiles(files, options);
                resolve(results);
            };

            input.click();
        });
    }

    /**
     * Process files directly (for dropzone or external use)
     */
    static async processFilesDirectly(
        files: File[], 
        options?: SelectionOptions
    ): Promise<(ProcessedFile | UnProcessedFile)[]> {
        return this.processFiles(files, options);
    }

    /**
     * Pick with dropzone modal
     */
    static async pickWithDropzone(options?: SelectionOptions & { 
        dropzoneText?: string;
        dropzoneClassName?: string;
    }): Promise<(ProcessedFile | UnProcessedFile)[]> {
        // Create and show dropzone modal
        const { createDropzoneModal } = await import('./src/utils/dropzone.utils');
        return createDropzoneModal(options);
    }
}

// Export types
export * from './src/types/common';
export * from './src/types/image';
export * from './src/types/video';
export * from './src/types/audio';
export * from './src/types/document';
export * from './src/types/archive';

// Export component
export { MediaDropzone } from './src/components/MediaDropzone';
export type { MediaDropzoneProps } from './src/components/MediaDropzone';

// Export as default
export default MediaHelper;