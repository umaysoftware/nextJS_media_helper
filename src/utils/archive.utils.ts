import { ProcessedFile, UnProcessedFile, ExportedFile, ProgressCallback } from '../types/common';
import { ArchiveRuleInfo } from '../types/archive';

/**
 * Generate archive thumbnail (icon with file count)
 */
async function generateArchiveThumbnail(
    file: File,
    _rules?: ArchiveRuleInfo
): Promise<ExportedFile | undefined> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 200;
    
    if (ctx) {
        // Background
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Archive icon (folder with zipper)
        ctx.fillStyle = '#6b7280';
        const iconSize = 80;
        const x = (canvas.width - iconSize) / 2;
        const y = (canvas.height - iconSize) / 2;
        
        // Draw folder shape
        ctx.beginPath();
        ctx.moveTo(x, y + 20);
        ctx.lineTo(x, y + iconSize);
        ctx.lineTo(x + iconSize, y + iconSize);
        ctx.lineTo(x + iconSize, y + 20);
        ctx.lineTo(x + iconSize * 0.8, y + 20);
        ctx.lineTo(x + iconSize * 0.7, y);
        ctx.lineTo(x + iconSize * 0.3, y);
        ctx.lineTo(x + iconSize * 0.2, y + 20);
        ctx.closePath();
        ctx.fill();
        
        // Draw zipper
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, y + 35);
        ctx.lineTo(canvas.width / 2, y + iconSize - 10);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Add file extension text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const ext = file.name.split('.').pop()?.toUpperCase() || 'ZIP';
        ctx.fillText(ext, canvas.width / 2, canvas.height / 2 + 25);
        
        // Add file size
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#4b5563';
        const sizeText = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
        ctx.fillText(sizeText, canvas.width / 2, canvas.height - 20);
    }
    
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            if (blob) {
                const thumbFile = new File([blob], `thumb_${file.name}.png`, {
                    type: 'image/png'
                });
                
                resolve({
                    name: thumbFile.name,
                    size: blob.size,
                    type: 'image',
                    extension: '.png',
                    mimeType: 'image/png',
                    file: thumbFile,
                    url: URL.createObjectURL(blob)
                });
            } else {
                resolve(undefined);
            }
        }, 'image/png');
    });
}

/**
 * Process archive file
 */
export async function processArchiveFile(
    file: File,
    rules?: ArchiveRuleInfo,
    onProgress?: ProgressCallback,
    currentIndex?: number,
    totalFiles?: number
): Promise<ProcessedFile | UnProcessedFile> {
    const extension = '.' + file.name.split('.').pop()!.toLowerCase();
    const meta = {
        name: file.name,
        size: file.size,
        type: 'archive',
        extension,
        mimeType: file.type || 'application/zip'
    };

    try {
        // Progress: processing
        if (onProgress && currentIndex !== undefined && totalFiles !== undefined) {
            onProgress({
                currentFile: currentIndex + 1,
                totalFiles,
                fileName: file.name,
                stage: 'processing',
                percentage: Math.round(((currentIndex + 0.5) / totalFiles) * 100)
            });
        }

        // Archives typically aren't processed, just stored
        const processedFile = file;

        // Create processed object
        const processed: ExportedFile = {
            name: processedFile.name,
            size: processedFile.size,
            type: 'archive',
            extension,
            mimeType: processedFile.type || 'application/zip',
            file: processedFile,
            url: URL.createObjectURL(processedFile)
        };

        // Generate blob if needed
        if (rules?.willGenerateBlob) {
            processed.blob = new Blob([processedFile], { type: processedFile.type });
        }

        // Note: Base64 for archives is usually not recommended due to size

        // Generate thumbnail
        let thumbnail: ExportedFile | undefined;
        if (onProgress && currentIndex !== undefined && totalFiles !== undefined) {
            onProgress({
                currentFile: currentIndex + 1,
                totalFiles,
                fileName: file.name,
                stage: 'generating-thumbnail',
                percentage: Math.round(((currentIndex + 0.8) / totalFiles) * 100)
            });
        }
        thumbnail = await generateArchiveThumbnail(file, rules);

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
                errorCode: 'archive-processing-error',
                message: error instanceof Error ? error.message : 'Failed to process archive'
            }
        };
    }
}