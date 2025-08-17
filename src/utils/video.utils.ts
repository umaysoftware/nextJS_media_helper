import { ProcessedFile, UnProcessedFile, ExportedFile, ProgressCallback } from '../types/common';
import { VideoRuleInfo } from '../types/video';

/**
 * Generate thumbnail from video
 */
async function generateVideoThumbnail(
    file: File,
    rules?: VideoRuleInfo
): Promise<ExportedFile> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        video.onloadedmetadata = () => {
            // Seek to specific time or 1 second
            video.currentTime = rules?.startAt || 1;
        };

        video.onseeked = () => {
            // Set canvas size
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw frame
            ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Scale down for thumbnail
            const maxSize = 600;
            let width = canvas.width;
            let height = canvas.height;

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

            const thumbCanvas = document.createElement('canvas');
            const thumbCtx = thumbCanvas.getContext('2d');
            thumbCanvas.width = width;
            thumbCanvas.height = height;
            thumbCtx?.drawImage(canvas, 0, 0, width, height);

            // Convert to image
            thumbCanvas.toBlob((blob) => {
                if (blob) {
                    const thumbFile = new File([blob], `thumb_${file.name}.jpg`, {
                        type: 'image/jpeg'
                    });

                    resolve({
                        name: thumbFile.name,
                        size: blob.size,
                        type: 'image',
                        extension: '.jpg',
                        mimeType: 'image/jpeg',
                        file: thumbFile,
                        url: URL.createObjectURL(blob)
                    });
                } else {
                    reject(new Error('Failed to generate thumbnail'));
                }

                // Clean up
                URL.revokeObjectURL(video.src);
            }, 'image/jpeg', 0.8);
        };

        video.onerror = () => {
            reject(new Error('Failed to load video'));
        };

        video.src = URL.createObjectURL(file);
        video.load();
    });
}

/**
 * Extract video clip
 */
async function extractVideoClip(
    file: File,
    _rules?: VideoRuleInfo
): Promise<File> {
    // For now, return original file
    // In a real implementation, you'd use MediaRecorder API or server-side processing
    return file;
}

/**
 * Compress video using MediaRecorder API
 */
async function compressVideo(
    file: File,
    _rules?: VideoRuleInfo
): Promise<File> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const stream = canvas.captureStream(30);
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 2500000 // 2.5 Mbps
            });

            const chunks: Blob[] = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.webm'), {
                    type: 'video/webm'
                });
                resolve(compressedFile);
            };

            // Start recording
            mediaRecorder.start();
            video.play();

            // Draw frames to canvas
            const drawFrame = () => {
                if (!video.paused && !video.ended) {
                    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
                    requestAnimationFrame(drawFrame);
                } else {
                    mediaRecorder.stop();
                }
            };
            drawFrame();
        };

        video.onerror = () => {
            reject(new Error('Failed to load video for compression'));
        };

        video.src = URL.createObjectURL(file);
        video.load();
    });
}

/**
 * Process video file
 */
export async function processVideoFile(
    file: File,
    rules?: VideoRuleInfo,
    onProgress?: ProgressCallback,
    currentIndex?: number,
    totalFiles?: number
): Promise<ProcessedFile | UnProcessedFile> {
    const extension = '.' + file.name.split('.').pop()!.toLowerCase();
    const meta = {
        name: file.name,
        size: file.size,
        type: 'video',
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

        // Process video (compress or extract clip)
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
            processedFile = await compressVideo(file, rules);
        } else if (rules?.duration) {
            // Extract clip if duration is specified
            processedFile = await extractVideoClip(file, rules);
        }

        // Create processed object
        const processed: ExportedFile = {
            name: processedFile.name,
            size: processedFile.size,
            type: 'video',
            extension: processedFile.name.includes('.webm') ? '.webm' : extension,
            mimeType: processedFile.type,
            file: processedFile,
            url: URL.createObjectURL(processedFile)
        };

        // Generate blob if needed
        if (rules?.willGenerateBlob) {
            processed.blob = new Blob([processedFile], { type: processedFile.type });
        }

        // Note: Base64 for videos is usually not recommended due to size

        // Generate thumbnail
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
            thumbnail = await generateVideoThumbnail(file, rules);
        } catch (error) {
            console.warn('Failed to generate video thumbnail:', error);
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
                errorCode: 'video-processing-error',
                message: error instanceof Error ? error.message : 'Failed to process video'
            }
        };
    }
}