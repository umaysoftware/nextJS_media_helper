import { 
    SelectionOptions, 
    ProcessedFile, 
    UnProcessedFile,
    FileError,
    RuleInfo
} from './src/types/common';

import { ImageRuleInfo } from './src/types/image';
import { VideoRuleInfo } from './src/types/video';
import { AudioRuleInfo } from './src/types/audio';
import { DocumentRuleInfo } from './src/types/document';
import { ArchiveRuleInfo } from './src/types/archive';

import { processImageFile } from './src/utils/image.utils';
import { processVideoFile } from './src/utils/video.utils';
import { processAudioFile } from './src/utils/audio.utils';
import { processDocumentFile } from './src/utils/document.utils';
import { processArchiveFile } from './src/utils/archive.utils';

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
     * Process a single file with type-specific rules
     */
    private static async processFile(
        file: File, 
        rules?: RuleInfo | AudioRuleInfo | DocumentRuleInfo | ImageRuleInfo | VideoRuleInfo | ArchiveRuleInfo,
        onProgress?: (progress: any) => void,
        currentIndex?: number,
        totalFiles?: number
    ): Promise<ProcessedFile | UnProcessedFile> {
        const fileType = this.detectFileType(file);
        const extension = '.' + file.name.split('.').pop()!.toLowerCase();
        
        // Create meta object
        const meta = {
            name: file.name,
            size: file.size,
            type: fileType,
            extension,
            mimeType: file.type
        };

        // Validate file
        const validationError = this.validateFile(file, rules as RuleInfo);
        if (validationError) {
            return {
                processType: 'unprocessed',
                meta,
                originalFile: file,
                reason: validationError
            };
        }

        // Process based on file type with specific rules
        switch (fileType) {
            case 'image':
                return processImageFile(file, rules as ImageRuleInfo, onProgress, currentIndex, totalFiles);
            
            case 'video':
                return processVideoFile(file, rules as VideoRuleInfo, onProgress, currentIndex, totalFiles);
            
            case 'audio':
                return processAudioFile(file, rules as AudioRuleInfo, onProgress, currentIndex, totalFiles);
            
            case 'document':
                return processDocumentFile(file, rules as DocumentRuleInfo, onProgress, currentIndex, totalFiles);
            
            case 'archive':
                return processArchiveFile(file, rules as ArchiveRuleInfo, onProgress, currentIndex, totalFiles);
            
            default:
                // Unknown file type
                return {
                    processType: 'unprocessed',
                    meta,
                    originalFile: file,
                    reason: {
                        fileName: file.name,
                        errorCode: 'unknown-file-type',
                        message: `Unknown file type: ${fileType}`
                    }
                };
        }
    }

    /**
     * Find the appropriate rule for a file based on its type
     */
    private static findRuleForFile(
        file: File, 
        rules?: (RuleInfo | AudioRuleInfo | DocumentRuleInfo | ImageRuleInfo | VideoRuleInfo | ArchiveRuleInfo)[]
    ): RuleInfo | AudioRuleInfo | DocumentRuleInfo | ImageRuleInfo | VideoRuleInfo | ArchiveRuleInfo | undefined {
        if (!rules || rules.length === 0) return undefined;
        
        // Find a rule that matches this file's type
        for (const rule of rules) {
            // Check if rule's allowedMimeTypes match this file
            if (rule.allowedMimeTypes) {
                if (this.matchesMimeType(file.type, rule.allowedMimeTypes)) {
                    return rule;
                }
            } else {
                // If no specific mime types, use the first rule as default
                return rule;
            }
        }
        
        // If no specific rule found, return first rule as fallback
        return rules[0];
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

        const results: (ProcessedFile | UnProcessedFile)[] = [];

        // Check selection count constraints using first rule if available
        const firstRule = options?.rules?.[0];
        if (firstRule?.minSelectionCount && files.length < firstRule.minSelectionCount) {
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
                        message: `Minimum ${firstRule.minSelectionCount} file(s) required`
                    }
                };
            });
        }

        if (firstRule?.maxSelectionCount && files.length > firstRule.maxSelectionCount) {
            // Process only up to max count
            files = files.slice(0, firstRule.maxSelectionCount);
        }

        // Process each file with appropriate rule
        for (let i = 0; i < files.length; i++) {
            const rule = this.findRuleForFile(files[i], options?.rules);
            const result = await this.processFile(
                files[i], 
                rule, 
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
            
            // Collect all allowed mime types from all rules
            if (options?.rules && options.rules.length > 0) {
                const allMimeTypes: string[] = [];
                for (const rule of options.rules) {
                    if (rule.allowedMimeTypes) {
                        allMimeTypes.push(...rule.allowedMimeTypes);
                    }
                }
                if (allMimeTypes.length > 0) {
                    // Remove duplicates and set accept attribute
                    input.accept = Array.from(new Set(allMimeTypes)).join(',');
                }
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