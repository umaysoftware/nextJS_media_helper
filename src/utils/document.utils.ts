import { ProcessedFile, UnProcessedFile, ExportedFile, ProgressCallback } from '../types/common';
import { DocumentRuleInfo } from '../types/document';

/**
 * Generate document thumbnail (first page preview for PDFs, icon for others)
 */
async function generateDocumentThumbnail(
    file: File,
    _rules?: DocumentRuleInfo
): Promise<ExportedFile | undefined> {
    // For PDFs, we could use pdf.js to render first page
    // For now, we'll create a simple icon-based thumbnail
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 200;
    
    if (ctx) {
        // Background
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Document icon
        ctx.fillStyle = '#6b7280';
        const iconSize = 80;
        const x = (canvas.width - iconSize) / 2;
        const y = (canvas.height - iconSize) / 2;
        
        // Draw document shape
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + iconSize * 0.7, y);
        ctx.lineTo(x + iconSize, y + iconSize * 0.3);
        ctx.lineTo(x + iconSize, y + iconSize);
        ctx.lineTo(x, y + iconSize);
        ctx.closePath();
        ctx.fill();
        
        // Draw fold
        ctx.fillStyle = '#9ca3af';
        ctx.beginPath();
        ctx.moveTo(x + iconSize * 0.7, y);
        ctx.lineTo(x + iconSize, y + iconSize * 0.3);
        ctx.lineTo(x + iconSize * 0.7, y + iconSize * 0.3);
        ctx.closePath();
        ctx.fill();
        
        // Add file extension text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const ext = file.name.split('.').pop()?.toUpperCase() || 'DOC';
        ctx.fillText(ext, canvas.width / 2, canvas.height / 2 + 20);
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
 * Process document file
 */
export async function processDocumentFile(
    file: File,
    rules?: DocumentRuleInfo,
    onProgress?: ProgressCallback,
    currentIndex?: number,
    totalFiles?: number
): Promise<ProcessedFile | UnProcessedFile> {
    const extension = '.' + file.name.split('.').pop()!.toLowerCase();
    const meta = {
        name: file.name,
        size: file.size,
        type: 'document',
        extension,
        mimeType: file.type || 'application/octet-stream'
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

        // Documents typically aren't processed, just stored
        const processedFile = file;

        // Create processed object
        const processed: ExportedFile = {
            name: processedFile.name,
            size: processedFile.size,
            type: 'document',
            extension,
            mimeType: processedFile.type || 'application/octet-stream',
            file: processedFile,
            url: URL.createObjectURL(processedFile)
        };

        // Generate base64 if needed (only for small documents)
        if (rules?.willGenerateBase64 && file.size < 2 * 1024 * 1024) { // Only for files < 2MB
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
        thumbnail = await generateDocumentThumbnail(file, rules);

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
                errorCode: 'document-processing-error',
                message: error instanceof Error ? error.message : 'Failed to process document'
            }
        };
    }
}