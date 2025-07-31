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
 * Detects the file type based on MIME type and file extension
 */
const detectFileType = (file: File): RuleType => {
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
};

/**
 * Groups files by their detected type
 */
const groupFilesByType = (files: File[]): Map<RuleType, File[]> => {
    const fileGroups = new Map<RuleType, File[]>();

    for (const file of files) {
        try {
            const fileType = detectFileType(file);
            const group = fileGroups.get(fileType) || [];
            group.push(file);
            fileGroups.set(fileType, group);
        } catch (error) {
            console.error(`Error detecting file type for ${file.name}:`, error);
            throw error;
        }
    }

    return fileGroups;
};

/**
 * Main function to process mixed file types
 * Automatically detects file types and routes them to appropriate processors
 */
export const pickMixed = async (files: File[], options?: SelectionOptions): Promise<ProcessedFile[]> => {
    if (!files || files.length === 0) {
        throw new Error('No files provided');
    }

    const allProcessedFiles: ProcessedFile[] = [];
    const fileGroups = groupFilesByType(files);

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

    // Check total file count constraints if GENERIC rule exists
    const genericRule = options?.rules?.find(rule => rule.type === RuleType.GENERIC);
    if (genericRule) {
        if (genericRule.minSelectionCount && allProcessedFiles.length < genericRule.minSelectionCount) {
            throw new Error(`Minimum ${genericRule.minSelectionCount} file(s) required in total`);
        }

        if (genericRule.maxSelectionCount && allProcessedFiles.length > genericRule.maxSelectionCount) {
            throw new Error(`Maximum ${genericRule.maxSelectionCount} file(s) allowed in total`);
        }
    }

    return allProcessedFiles;
};

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
export default {
    pickMixed,
    processImageFile,
    processVideoFiles,
    processAudioFiles,
    processDocumentFiles,
    processArchiveFiles
};