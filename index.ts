import { SelectionOptions, ProcessedFile, RuleType } from './src/types/common';
import { processImageFile } from './src/utils/image.utils';
import { processVideoFiles } from './src/utils/video.utils';
import { processAudioFiles } from './src/utils/audio.utils';
import { processDocumentFiles } from './src/utils/document.utils';
import { processArchiveFiles } from './src/utils/archive.utils';

import { ImageMimeTypes } from './src/types/image';
import { VideoMimeTypes } from './src/types/video';
import { AudioMimeTypes } from './src/types/audio';
import { DocumentMimeTypes } from './src/types/document';
import { AchiveMimeTypes } from './src/types/archive';

/**
 * MediaHelper class with native file selection and processing
 */
export class MediaHelper {
    /**
     * Pre-validate files before processing
     */
    private static validateFiles(files: File[], options?: SelectionOptions): void {
        if (!files || files.length === 0) {
            return;
        }

        // Check GENERIC rule constraints first
        const genericRule = options?.rules?.find(rule => rule.type === RuleType.GENERIC);
        if (genericRule) {
            if (genericRule.minSelectionCount && files.length < genericRule.minSelectionCount) {
                throw new Error(`Minimum ${genericRule.minSelectionCount} file(s) required`);
            }
            if (genericRule.maxSelectionCount && files.length > genericRule.maxSelectionCount) {
                throw new Error(`Maximum ${genericRule.maxSelectionCount} file(s) allowed`);
            }
        }

        // Group files by type for type-specific validation
        const fileGroups = MediaHelper.groupFilesByType(files);

        // Validate each group
        for (const [fileType, groupFiles] of fileGroups) {
            const typeRule = options?.rules?.find(rule => rule.type === fileType) || genericRule;

            if (!typeRule) continue;

            // Check count constraints for this type
            if (typeRule.type !== RuleType.GENERIC) {
                if (typeRule.minSelectionCount && groupFiles.length < typeRule.minSelectionCount) {
                    throw new Error(`Minimum ${typeRule.minSelectionCount} ${fileType} file(s) required`);
                }
                if (typeRule.maxSelectionCount && groupFiles.length > typeRule.maxSelectionCount) {
                    throw new Error(`Maximum ${typeRule.maxSelectionCount} ${fileType} file(s) allowed`);
                }
            }

            // Validate each file
            for (const file of groupFiles) {
                // Check MIME type
                if (typeRule.allowedMimeTypes && !typeRule.allowedMimeTypes.includes(file.type)) {
                    throw new Error(`File type ${file.type} is not allowed for ${file.name}`);
                }

                // Check file size
                if (typeRule.minFileSize && file.size < typeRule.minFileSize) {
                    throw new Error(`File ${file.name} is too small. Minimum size: ${typeRule.minFileSize} bytes`);
                }
                if (typeRule.maxFileSize && file.size > typeRule.maxFileSize) {
                    throw new Error(`File ${file.name} is too large. Maximum size: ${typeRule.maxFileSize} bytes`);
                }
            }
        }
    }

    /**
     * Detects the file type based on MIME type and file extension
     */
    private static detectFileType(file: File): RuleType {
        const mimeType = file.type.toLowerCase();
        const extension = file.name.split('.').pop()?.toLowerCase() || '';

        // Check by MIME type first
        if (mimeType.startsWith('image/') || Object.values(ImageMimeTypes).includes(file.type as ImageMimeTypes)) {
            return RuleType.IMAGE;
        }

        if (mimeType.startsWith('video/') || Object.values(VideoMimeTypes).includes(file.type as VideoMimeTypes)) {
            return RuleType.VIDEO;
        }

        if (mimeType.startsWith('audio/') || Object.values(AudioMimeTypes).includes(file.type as AudioMimeTypes)) {
            return RuleType.AUDIO;
        }

        if (Object.values(DocumentMimeTypes).includes(file.type as DocumentMimeTypes) ||
            mimeType.startsWith('application/pdf') ||
            mimeType.startsWith('application/msword') ||
            mimeType.startsWith('application/vnd.') ||
            mimeType.startsWith('text/')) {
            return RuleType.DOCUMENT;
        }

        if (Object.values(AchiveMimeTypes).includes(file.type as AchiveMimeTypes) ||
            ['zip', 'rar', 'tar', 'gz', '7z'].includes(extension)) {
            return RuleType.ARCHIVE;
        }

        // If no specific type detected, treat as generic
        throw new Error(`Unable to detect file type for ${file.name}`);
    }

    /**
     * Groups files by their detected type
     */
    private static groupFilesByType(files: File[]): Map<RuleType, File[]> {
        const fileGroups = new Map<RuleType, File[]>();

        for (const file of files) {
            try {
                const fileType = MediaHelper.detectFileType(file);
                const group = fileGroups.get(fileType) || [];
                group.push(file);
                fileGroups.set(fileType, group);
            } catch (error) {
                console.error(`Error detecting file type for ${file.name}:`, error);
                throw error;
            }
        }

        return fileGroups;
    }

    /**
     * Process files that are already selected (internal use)
     */
    static async processFiles(files: File[], options?: SelectionOptions): Promise<ProcessedFile[]> {
        if (!files || files.length === 0) {
            throw new Error('No files provided');
        }

        // Validate all files first before processing
        MediaHelper.validateFiles(files, options);

        const allProcessedFiles: ProcessedFile[] = [];
        const fileGroups = MediaHelper.groupFilesByType(files);

        // Process each group of files
        for (const [fileType, groupFiles] of fileGroups) {
            try {
                let processedFiles: ProcessedFile[] = [];

                switch (fileType) {
                    case RuleType.IMAGE:
                        processedFiles = await processImageFile(groupFiles, options);
                        break;

                    case RuleType.VIDEO:
                        processedFiles = await processVideoFiles(groupFiles, options);
                        break;

                    case RuleType.AUDIO:
                        processedFiles = await processAudioFiles(groupFiles, options);
                        break;

                    case RuleType.DOCUMENT:
                        processedFiles = await processDocumentFiles(groupFiles, options);
                        break;

                    case RuleType.ARCHIVE:
                        processedFiles = await processArchiveFiles(groupFiles, options);
                        break;

                    default:
                        throw new Error(`Unsupported file type: ${fileType}`);
                }

                allProcessedFiles.push(...processedFiles);
            } catch (error) {
                console.error(`Error processing ${fileType} files:`, error);
                throw error;
            }
        }

        // No need to check constraints again, already validated in validateFiles

        return allProcessedFiles;
    }

    /**
     * Opens native file picker and processes selected files
     */
    static async pickMixed(options?: SelectionOptions & { accept?: string; multiple?: boolean }): Promise<ProcessedFile[]> {
        return new Promise(async (resolve, reject) => {
            // Create hidden file input
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = options?.multiple !== false;

            // Set accept attribute based on rules
            if (options?.accept) {
                input.accept = options.accept;
            } else if (options?.rules) {
                const acceptTypes: string[] = [];
                options.rules.forEach(rule => {
                    if (rule.allowedMimeTypes) {
                        acceptTypes.push(...rule.allowedMimeTypes);
                    } else {
                        // Add default types based on rule type
                        switch (rule.type) {
                            case RuleType.IMAGE:
                                acceptTypes.push('image/*');
                                break;
                            case RuleType.VIDEO:
                                acceptTypes.push('video/*');
                                break;
                            case RuleType.AUDIO:
                                acceptTypes.push('audio/*');
                                break;
                            case RuleType.DOCUMENT:
                                acceptTypes.push('.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf');
                                break;
                            case RuleType.ARCHIVE:
                                acceptTypes.push('.zip,.rar,.tar,.gz,.7z');
                                break;
                        }
                    }
                });
                if (acceptTypes.length > 0) {
                    input.accept = acceptTypes.join(',');
                }
            }

            // Handle file selection
            input.onchange = async (e) => {
                const files = Array.from((e.target as HTMLInputElement).files || []);
                if (files.length === 0) {
                    resolve([]);
                    return;
                }

                try {
                    const processed = await MediaHelper.processFiles(files, options);
                    resolve(processed);
                } catch (error) {
                    reject(error);
                }
            };

            // Handle cancel
            input.oncancel = () => {
                resolve([]);
            };

            // Trigger file picker
            input.click();
        });
    }

    /**
     * Pick only image files
     */
    static async pickImages(options?: SelectionOptions): Promise<ProcessedFile[]> {
        return MediaHelper.pickMixed({
            ...options,
            accept: 'image/*',
            rules: options?.rules || [{
                type: RuleType.IMAGE
            }]
        });
    }

    /**
     * Pick only video files
     */
    static async pickVideos(options?: SelectionOptions): Promise<ProcessedFile[]> {
        return MediaHelper.pickMixed({
            ...options,
            accept: 'video/*',
            rules: options?.rules || [{
                type: RuleType.VIDEO
            }]
        });
    }

    /**
     * Pick only audio files
     */
    static async pickAudio(options?: SelectionOptions): Promise<ProcessedFile[]> {
        return MediaHelper.pickMixed({
            ...options,
            accept: 'audio/*',
            rules: options?.rules || [{
                type: RuleType.AUDIO
            }]
        });
    }

    /**
     * Pick only document files
     */
    static async pickDocuments(options?: SelectionOptions): Promise<ProcessedFile[]> {
        return MediaHelper.pickMixed({
            ...options,
            accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf',
            rules: options?.rules || [{
                type: RuleType.DOCUMENT
            }]
        });
    }

    /**
     * Pick only archive files
     */
    static async pickArchives(options?: SelectionOptions): Promise<ProcessedFile[]> {
        return MediaHelper.pickMixed({
            ...options,
            accept: '.zip,.rar,.tar,.gz,.7z',
            rules: options?.rules || [{
                type: RuleType.ARCHIVE
            }]
        });
    }
}

// Export all types
export * from './src/types/common';
export * from './src/types/image';
export * from './src/types/video';
export * from './src/types/audio';
export * from './src/types/document';
export * from './src/types/archive';

// Export individual processors for direct use
export { processImageFile } from './src/utils/image.utils';
export { processVideoFiles } from './src/utils/video.utils';
export { processAudioFiles } from './src/utils/audio.utils';
export { processDocumentFiles } from './src/utils/document.utils';
export { processArchiveFiles } from './src/utils/archive.utils';

// Default export
export default MediaHelper;