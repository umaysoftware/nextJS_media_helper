import { ProcessedFile, UnProcessedFile, ExportedFile, ProgressCallback } from '../types/common';
import { AudioRuleInfo } from '../types/audio';

/**
 * Generate audio waveform visualization as thumbnail
 */
async function generateAudioWaveform(
    file: File,
    _rules?: AudioRuleInfo
): Promise<ExportedFile> {
    return new Promise((resolve, reject) => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target?.result as ArrayBuffer;
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                
                // Create canvas for waveform
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 400;
                canvas.height = 100;
                
                if (ctx) {
                    // Clear canvas
                    ctx.fillStyle = '#f3f4f6';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    // Get audio data
                    const data = audioBuffer.getChannelData(0);
                    const step = Math.ceil(data.length / canvas.width);
                    const amp = canvas.height / 2;
                    
                    // Draw waveform
                    ctx.beginPath();
                    ctx.moveTo(0, amp);
                    ctx.strokeStyle = '#3b82f6';
                    ctx.lineWidth = 2;
                    
                    for (let i = 0; i < canvas.width; i++) {
                        let min = 1.0;
                        let max = -1.0;
                        
                        for (let j = 0; j < step; j++) {
                            const datum = data[i * step + j];
                            if (datum < min) min = datum;
                            if (datum > max) max = datum;
                        }
                        
                        ctx.lineTo(i, (1 + min) * amp);
                        ctx.lineTo(i, (1 + max) * amp);
                    }
                    
                    ctx.stroke();
                }
                
                // Convert to image
                canvas.toBlob((blob) => {
                    if (blob) {
                        const thumbFile = new File([blob], `waveform_${file.name}.png`, {
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
                        reject(new Error('Failed to generate waveform'));
                    }
                }, 'image/png');
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Failed to read audio file'));
        };
        
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Create audio preview/thumbnail (shorter clip)
 */
async function createAudioPreview(
    file: File,
    rules?: AudioRuleInfo
): Promise<ExportedFile | undefined> {
    // If duration and startAt are specified, create a preview clip
    if (rules?.duration && rules?.startAt !== undefined) {
        // This would require server-side processing or Web Audio API manipulation
        // For now, we'll just create a reference to the original with metadata
        return {
            name: `preview_${file.name}`,
            size: file.size,
            type: 'audio',
            extension: '.' + file.name.split('.').pop()!,
            mimeType: file.type,
            file: file,
            url: URL.createObjectURL(file)
        };
    }
    
    // Generate waveform as visual thumbnail
    return generateAudioWaveform(file, rules);
}

/**
 * Process audio file
 */
export async function processAudioFile(
    file: File,
    rules?: AudioRuleInfo,
    onProgress?: ProgressCallback,
    currentIndex?: number,
    totalFiles?: number
): Promise<ProcessedFile | UnProcessedFile> {
    const extension = '.' + file.name.split('.').pop()!.toLowerCase();
    const meta = {
        name: file.name,
        size: file.size,
        type: 'audio',
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

        // For audio, we typically don't compress in the browser
        // This would require server-side processing
        const processedFile = file;

        // Create processed object
        const processed: ExportedFile = {
            name: processedFile.name,
            size: processedFile.size,
            type: 'audio',
            extension,
            mimeType: processedFile.type,
            file: processedFile,
            url: URL.createObjectURL(processedFile)
        };

        // Generate base64 if needed (usually for small audio files)
        if (rules?.willGenerateBase64 && file.size < 5 * 1024 * 1024) { // Only for files < 5MB
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

        // Generate thumbnail (waveform or preview)
        let thumbnail: ExportedFile | undefined;
        try {
            if (onProgress && currentIndex !== undefined && totalFiles !== undefined) {
                onProgress({
                    currentFile: currentIndex + 1,
                    totalFiles,
                    fileName: file.name,
                    stage: 'generating-thumbnail',
                    percentage: Math.round(((currentIndex + 0.8) / totalFiles) * 100)
                });
            }
            thumbnail = await createAudioPreview(file, rules);
        } catch (error) {
            console.warn('Failed to generate audio thumbnail:', error);
        }

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
                errorCode: 'audio-processing-error',
                message: error instanceof Error ? error.message : 'Failed to process audio'
            }
        };
    }
}