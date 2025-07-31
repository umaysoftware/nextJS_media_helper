import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { ProcessedFile, ProcessedMainFile, RuleType } from '../types/common';
import { VideoMimeTypes, PreviewVideoOptions } from '../types/video';
import { ThumbnailFile, SelectionOptions } from '../types/common';

let ffmpeg: FFmpeg | null = null;

const initFFmpeg = async (): Promise<FFmpeg> => {
    if (!ffmpeg) {
        try {
            console.log('Initializing FFmpeg...');
            ffmpeg = new FFmpeg();
            ffmpeg.on('log', ({ message }) => {
                console.log('FFmpeg log:', message);
            });
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
            console.log('FFmpeg initialized successfully');
        } catch (error) {
            console.error('Failed to initialize FFmpeg:', error);
            throw error;
        }
    }
    return ffmpeg;
};

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

// @ts-ignore
const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
};

// @ts-ignore
const getVideoMimeType = (format: string): string => {
    const mimeMap: Record<string, string> = {
        'mp4': VideoMimeTypes.MP4,
        'webm': VideoMimeTypes.WEBM,
        'avi': VideoMimeTypes.AVI,
        'mkv': VideoMimeTypes.MKV,
        'mov': VideoMimeTypes.MOV,
        'flv': VideoMimeTypes.FLV,
        'wmv': VideoMimeTypes.WMV,
        'ogg': VideoMimeTypes.OGG,
        'mpeg': VideoMimeTypes.MPEG,
        'ts': VideoMimeTypes.TS,
        'm4v': VideoMimeTypes.M4V,
    };
    return mimeMap[format] || VideoMimeTypes.MP4;
};

const isVideoFile = (file: File): boolean => {
    return file.type.startsWith('video/') || Object.values(VideoMimeTypes).includes(file.type as VideoMimeTypes);
};

const compressVideo = async (file: File, compressQuality: number): Promise<File> => {
    try {
        console.log('Starting video compression with MediaRecorder...', { fileName: file.name, quality: compressQuality });
        
        // Create a video element to load the file
        const video = document.createElement('video');
        video.muted = true;
        const url = URL.createObjectURL(file);
        
        return new Promise((resolve, reject) => {
            video.onloadedmetadata = async () => {
                try {
                    video.play();
                    
                    // Create canvas for video rendering
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d');
                    
                    if (!ctx) {
                        throw new Error('Failed to get canvas context');
                    }
                    
                    // Calculate bitrate based on quality
                    const baseBitrate = 2500000; // 2.5 Mbps base
                    const targetBitrate = Math.floor(baseBitrate * (compressQuality / 100));
                    
                    // Setup MediaRecorder with WebM format
                    const stream = canvas.captureStream(30); // 30 fps
                    
                    // Add audio track if exists
                    if (file.type.includes('audio') || (video as any).mozHasAudio || (video as any).webkitAudioDecodedByteCount > 0) {
                        const audioContext = new AudioContext();
                        const source = audioContext.createMediaElementSource(video);
                        const destination = audioContext.createMediaStreamDestination();
                        source.connect(destination);
                        source.connect(audioContext.destination);
                        
                        const audioTrack = destination.stream.getAudioTracks()[0];
                        if (audioTrack) {
                            stream.addTrack(audioTrack);
                        }
                    }
                    
                    const mediaRecorder = new MediaRecorder(stream, {
                        mimeType: 'video/webm;codecs=vp9,opus',
                        videoBitsPerSecond: targetBitrate
                    });
                    
                    const chunks: Blob[] = [];
                    
                    mediaRecorder.ondataavailable = (e) => {
                        if (e.data.size > 0) {
                            chunks.push(e.data);
                        }
                    };
                    
                    mediaRecorder.onstop = () => {
                        URL.revokeObjectURL(url);
                        const blob = new Blob(chunks, { type: 'video/webm' });
                        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webm'), {
                            type: 'video/webm',
                            lastModified: Date.now()
                        });
                        console.log('Video compression completed');
                        resolve(compressedFile);
                    };
                    
                    mediaRecorder.start();
                    
                    // Draw video frames to canvas
                    const drawFrame = () => {
                        if (!video.paused && !video.ended) {
                            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                            requestAnimationFrame(drawFrame);
                        } else {
                            mediaRecorder.stop();
                        }
                    };
                    
                    drawFrame();
                    
                } catch (error) {
                    URL.revokeObjectURL(url);
                    reject(error);
                }
            };
            
            video.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load video'));
            };
            
            video.src = url;
        });
        
    } catch (error) {
        console.error('Video compression failed:', error);
        // Hata durumunda orijinal dosyayı dön
        return file;
    }
};

const generateThumbnail = async (file: File, options: PreviewVideoOptions): Promise<ThumbnailFile> => {
    const ffmpeg = await initFFmpeg();
    const inputName = 'input.' + file.name.split('.').pop();
    const outputName = `thumbnail.${options.format || 'webp'}`;

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    const quality = options.compressQuality || 75;
    const qualityScale = Math.round(2 + ((100 - quality) / 100) * 30);

    await ffmpeg.exec([
        '-i', inputName,
        '-ss', options.startAt.toString(),
        '-vframes', '1',
        '-q:v', qualityScale.toString(),
        outputName
    ]);

    const data = await ffmpeg.readFile(outputName);
    const mimeType = `image/${options.format || 'webp'}`;
    const blob = new Blob([data], { type: mimeType });

    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
    });

    const thumbnailFile = new File([blob], `thumbnail.${options.format || 'webp'}`, { type: mimeType });
    
    return {
        base64,
        blob,
        file: thumbnailFile,
        url: URL.createObjectURL(blob)
    };
};


// @ts-ignore
const cropVideo = async (file: File, cropOptions: { startAt: number; duration: number }): Promise<File> => {
    const ffmpeg = await initFFmpeg();
    const inputName = 'input.' + file.name.split('.').pop();
    const outputName = 'cropped.' + file.name.split('.').pop();

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    await ffmpeg.exec([
        '-i', inputName,
        '-ss', cropOptions.startAt.toString(),
        '-t', cropOptions.duration.toString(),
        '-c', 'copy',
        '-avoid_negative_ts', 'make_zero',
        outputName
    ]);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data], { type: file.type });

    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    return new File([blob], `cropped_${file.name}`, { type: file.type });
};

// @ts-ignore
const convertVideoFormat = async (file: File, format: VideoMimeTypes): Promise<File> => {
    const ffmpeg = await initFFmpeg();
    const inputName = 'input.' + file.name.split('.').pop();
    const formatExt = format.split('/')[1].replace('x-', '').replace('-compressed', '');
    const outputName = `output.${formatExt}`;

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    const args = ['-i', inputName];

    switch (format) {
        case VideoMimeTypes.MP4:
            args.push('-c:v', 'libx264', '-c:a', 'aac', '-movflags', '+faststart');
            break;
        case VideoMimeTypes.WEBM:
            args.push('-c:v', 'libvpx-vp9', '-c:a', 'libopus');
            break;
        case VideoMimeTypes.OGG:
            args.push('-c:v', 'libtheora', '-c:a', 'libvorbis');
            break;
        default:
            args.push('-c', 'copy');
    }

    args.push(outputName);
    await ffmpeg.exec(args);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data], { type: format });

    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    return new File([blob], file.name.replace(/\.[^/.]+$/, `.${formatExt}`), { type: format });
};



const processVideoFiles = async (files: File[], options?: SelectionOptions): Promise<ProcessedFile[]> => {
    console.log('processVideoFiles started', { filesCount: files.length, options });
    const processedFiles: ProcessedFile[] = [];

    const videoRule = options?.rules?.find(rule => rule.type === RuleType.VIDEO) ||
        options?.rules?.find(rule => rule.type === RuleType.GENERIC);
    
    console.log('Video rule found:', videoRule);

    for (const file of files) {
        console.log('Processing video file:', file.name);
        if (!isVideoFile(file)) {
            throw new Error(`File ${file.name} is not a valid video file`);
        }

        if (videoRule?.allowedMimeTypes && !videoRule.allowedMimeTypes.includes(file.type)) {
            throw new Error(`File type ${file.type} is not allowed`);
        }

        if (videoRule?.minFileSize && file.size < videoRule.minFileSize) {
            throw new Error(`File ${file.name} is too small. Minimum size: ${videoRule.minFileSize} bytes`);
        }

        if (videoRule?.maxFileSize && file.size > videoRule.maxFileSize) {
            throw new Error(`File ${file.name} is too large. Maximum size: ${videoRule.maxFileSize} bytes`);
        }

        let processedMainFile: ProcessedMainFile = {};
        let thumbnailFile: ThumbnailFile | undefined;

        let processedVideo = file;
        if (videoRule?.compressQuality && videoRule.compressQuality < 100) {
            console.log('Compression requested with quality:', videoRule.compressQuality);
            try {
                processedVideo = await compressVideo(file, videoRule.compressQuality);
            } catch (error) {
                console.error('Compression failed, using original file:', error);
                processedVideo = file;
            }
        }

        if (videoRule?.willGenerateBase64) {
            processedMainFile.base64 = await fileToBase64(processedVideo);
        }

        if (videoRule?.willGenerateBlob) {
            processedMainFile.blob = new Blob([processedVideo], { type: processedVideo.type });
        }

        processedMainFile.file = processedVideo;
        
        // URL oluştur
        if (processedMainFile.blob || processedMainFile.file) {
            processedMainFile.url = URL.createObjectURL(processedMainFile.blob || processedMainFile.file);
        }

        const defaultThumbnailOptions: PreviewVideoOptions = {
            startAt: 0,
            duration: 1,
            compressQuality: 75,
            format: 'webp'
        };
        thumbnailFile = await generateThumbnail(file, defaultThumbnailOptions);

        const extension = '.' + file.name.split('.').pop()!.toLowerCase();

        processedFiles.push({
            name: file.name,
            size: processedVideo.size,
            type: 'video',
            extension,
            mimeType: processedVideo.type,
            originalFile: file,
            processed: processedMainFile,
            thumbnail: thumbnailFile
        });
    }

    if (videoRule?.minSelectionCount && processedFiles.length < videoRule.minSelectionCount) {
        throw new Error(`Minimum ${videoRule.minSelectionCount} video(s) required`);
    }

    if (videoRule?.maxSelectionCount && processedFiles.length > videoRule.maxSelectionCount) {
        throw new Error(`Maximum ${videoRule.maxSelectionCount} video(s) allowed`);
    }

    console.log('processVideoFiles completed, returning:', processedFiles.length, 'files');
    return processedFiles;
};

export { processVideoFiles };