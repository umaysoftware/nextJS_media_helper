import { ProcessedFile, UnProcessedFile, ExportedFile, ProgressCallback } from '../types/common';
import { ImageRuleInfo } from '../types/image';

/**
 * Generate thumbnail for image
 */
async function generateImageThumbnail(
    file: File,
    rules?: ImageRuleInfo
): Promise<ExportedFile> {
    return new Promise((resolve) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        img.onload = () => {
            // Set thumbnail size (max 200px)
            const maxSize = 200;
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
                if (width > maxSize) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx?.drawImage(img, 0, 0, width, height);
            
            // Convert to specified format
            const format = rules?.thumbnailFormat || 'webp';
            const quality = (rules?.thumbnailCompressQuality || 75) / 100;
            
            canvas.toBlob((blob) => {
                if (blob) {
                    const thumbFile = new File([blob], `thumb_${file.name}`, {
                        type: `image/${format}`
                    });
                    
                    resolve({
                        name: thumbFile.name,
                        size: blob.size,
                        type: 'image',
                        extension: `.${format}`,
                        mimeType: `image/${format}`,
                        file: thumbFile,
                        url: URL.createObjectURL(blob)
                    });
                }
            }, `image/${format}`, quality);
        };
        
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Compress image file
 */
async function compressImage(
    file: File,
    rules?: ImageRuleInfo
): Promise<File> {
    return new Promise((resolve) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            
            const format = rules?.processedFormat || 'webp';
            const quality = (rules?.processedCompressQuality || 80) / 100;
            
            canvas.toBlob((blob) => {
                if (blob) {
                    const compressedFile = new File([blob], file.name, {
                        type: `image/${format}`
                    });
                    resolve(compressedFile);
                } else {
                    resolve(file);
                }
            }, `image/${format}`, quality);
        };
        
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Process image file
 */
export async function processImageFile(
    file: File,
    rules?: ImageRuleInfo,
    onProgress?: ProgressCallback,
    currentIndex?: number,
    totalFiles?: number
): Promise<ProcessedFile | UnProcessedFile> {
    const extension = '.' + file.name.split('.').pop()!.toLowerCase();
    const meta = {
        name: file.name,
        size: file.size,
        type: 'image',
        extension,
        mimeType: file.type
    };

    try {
        // Progress: processing
        if (onProgress && currentIndex !== undefined && totalFiles !== undefined) {
            onProgress({
                currentFile: currentIndex + 1,
                totalFiles,
                fileName: file.name,
                stage: 'processing',
                percentage: Math.round(((currentIndex + 0.3) / totalFiles) * 100)
            });
        }

        // Compress if needed
        let processedFile = file;
        if (rules?.processedCompressQuality && rules.processedCompressQuality < 100) {
            if (onProgress && currentIndex !== undefined && totalFiles !== undefined) {
                onProgress({
                    currentFile: currentIndex + 1,
                    totalFiles,
                    fileName: file.name,
                    stage: 'compressing',
                    percentage: Math.round(((currentIndex + 0.5) / totalFiles) * 100)
                });
            }
            processedFile = await compressImage(file, rules);
        }

        // Create processed object
        const processed: ExportedFile = {
            name: processedFile.name,
            size: processedFile.size,
            type: 'image',
            extension,
            mimeType: processedFile.type,
            file: processedFile,
            url: URL.createObjectURL(processedFile)
        };

        // Generate base64 if needed
        if (rules?.willGenerateBase64) {
            const reader = new FileReader();
            processed.base64 = await new Promise((resolve) => {
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(processedFile);
            });
        }

        // Generate blob if needed
        if (rules?.willGenerateBlob) {
            processed.blob = new Blob([processedFile], { type: processedFile.type });
        }

        // Generate thumbnail
        if (onProgress && currentIndex !== undefined && totalFiles !== undefined) {
            onProgress({
                currentFile: currentIndex + 1,
                totalFiles,
                fileName: file.name,
                stage: 'generating-thumbnail',
                percentage: Math.round(((currentIndex + 0.8) / totalFiles) * 100)
            });
        }
        
        const thumbnail = await generateImageThumbnail(file, rules);

        // Progress: completed
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
                errorCode: 'image-processing-error',
                message: error instanceof Error ? error.message : 'Failed to process image'
            }
        };
    }
}