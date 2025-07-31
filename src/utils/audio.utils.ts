import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { AudioMimeTypes, PreviewAudioOptions } from '../types/audio';
import { ThumbnailFile, ProcessedFile, SelectionOptions, ProcessedMainFile, RuleType } from '../types/common';

let ffmpeg: FFmpeg | null = null;

const initFFmpeg = async (): Promise<FFmpeg> => {
    if (!ffmpeg) {
        ffmpeg = new FFmpeg();
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
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

const getAudioMimeType = (format: string): string => {
    const mimeMap: Record<string, string> = {
        'mp3': AudioMimeTypes.MP3,
        'wav': AudioMimeTypes.WAV,
        'ogg': AudioMimeTypes.OGG,
        'flac': AudioMimeTypes.FLAC,
        'aac': AudioMimeTypes.AAC,
        'm4a': AudioMimeTypes.M4A,
        'wma': AudioMimeTypes.WMA,
        'amr': AudioMimeTypes.AMR,
        'aiff': AudioMimeTypes.AIFF,
        'opus': AudioMimeTypes.OPUS,
    };
    return mimeMap[format.toLowerCase()] || AudioMimeTypes.MP3;
};

const isAudioFile = (file: File): boolean => {
    return file.type.startsWith('audio/') || Object.values(AudioMimeTypes).includes(file.type as AudioMimeTypes);
};

const compressAudio = async (file: File, compressQuality: number): Promise<File> => {
    const ffmpeg = await initFFmpeg();
    const inputName = 'input.' + file.name.split('.').pop();
    const outputName = 'output.mp3';

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    const bitrate = Math.round((compressQuality / 100) * 256 + 64);

    await ffmpeg.exec([
        '-i', inputName,
        '-c:a', 'libmp3lame',
        '-b:a', `${bitrate}k`,
        '-ar', '44100',
        '-ac', '2',
        outputName
    ]);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data], { type: AudioMimeTypes.MP3 });

    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    return new File([blob], file.name.replace(/\.[^/.]+$/, '.mp3'), { type: AudioMimeTypes.MP3 });
};

// @ts-ignore
const generateAudioThumbnail = async (file: File, options: PreviewAudioOptions): Promise<ThumbnailFile> => {
    const ffmpeg = await initFFmpeg();
    const inputName = 'input.' + file.name.split('.').pop();
    const outputName = `preview.${options.format || 'mp3'}`;

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    const bitrate = Math.round(((options.compressQuality || 75) / 100) * 128 + 32);

    const args = [
        '-i', inputName,
        '-ss', options.startAt.toString(),
        '-t', options.duration.toString(),
        '-b:a', `${bitrate}k`,
        '-ar', '44100',
        '-ac', '2'
    ];

    switch (options.format) {
        case 'wav':
            args.push('-c:a', 'pcm_s16le');
            break;
        case 'ogg':
            args.push('-c:a', 'libvorbis');
            break;
        case 'opus':
            args.push('-c:a', 'libopus');
            break;
        default:
            args.push('-c:a', 'libmp3lame');
    }

    args.push(outputName);
    await ffmpeg.exec(args);

    const data = await ffmpeg.readFile(outputName);
    const mimeType = getAudioMimeType(options.format || 'mp3');
    const blob = new Blob([data], { type: mimeType });

    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
    });

    return {
        base64,
        blob,
        file: new File([blob], `preview.${options.format || 'mp3'}`, { type: mimeType })
    };
};

// @ts-ignore
export const generateAudioVisualThumbnail = async (file: File): Promise<ThumbnailFile> => {
    // For audio files, we'll generate a visual waveform thumbnail in WebP format
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    canvas.width = 200;
    canvas.height = 200;

    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Waveform visualization (simulated)
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const centerY = canvas.height / 2;
    const amplitude = 40;

    for (let x = 0; x < canvas.width; x += 3) {
        const y = centerY + Math.sin((x / canvas.width) * Math.PI * 8) * amplitude * Math.random();
        if (x === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();

    // Audio icon
    ctx.fillStyle = '#00ff00';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎵', 100, 50);

    // File extension
    const extension = file.name.split('.').pop()?.toUpperCase() || 'AUDIO';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(extension, 100, 180);

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            async (blob) => {
                if (!blob) {
                    reject(new Error('Failed to generate audio thumbnail'));
                    return;
                }

                const thumbnailFile = new File([blob], 'thumbnail.webp', { type: 'image/webp' });
                const base64 = await fileToBase64(thumbnailFile);

                resolve({
                    base64,
                    blob,
                    file: thumbnailFile,
                    url: URL.createObjectURL(blob)
                });
            },
            'image/webp',
            0.9
        );
    });
};


// @ts-ignore
const cropAudio = async (file: File, cropOptions: { startAt: number; duration: number }): Promise<File> => {
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
const convertAudioFormat = async (file: File, format: AudioMimeTypes): Promise<File> => {
    const ffmpeg = await initFFmpeg();
    const inputName = 'input.' + file.name.split('.').pop();
    const formatExt = format.split('/')[1].replace('x-ms-', '');
    const outputName = `output.${formatExt}`;

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    const args = ['-i', inputName];

    switch (format) {
        case AudioMimeTypes.MP3:
            args.push('-c:a', 'libmp3lame', '-b:a', '192k');
            break;
        case AudioMimeTypes.WAV:
            args.push('-c:a', 'pcm_s16le', '-ar', '44100');
            break;
        case AudioMimeTypes.OGG:
            args.push('-c:a', 'libvorbis', '-b:a', '192k');
            break;
        case AudioMimeTypes.FLAC:
            args.push('-c:a', 'flac', '-compression_level', '5');
            break;
        case AudioMimeTypes.AAC:
        case AudioMimeTypes.M4A:
            args.push('-c:a', 'aac', '-b:a', '192k');
            break;
        case AudioMimeTypes.OPUS:
            args.push('-c:a', 'libopus', '-b:a', '128k');
            break;
        default:
            args.push('-c:a', 'copy');
    }

    args.push(outputName);
    await ffmpeg.exec(args);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data], { type: format });

    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    return new File([blob], file.name.replace(/\.[^/.]+$/, `.${formatExt}`), { type: format });
};






const processAudioFiles = async (files: File[], options?: SelectionOptions): Promise<ProcessedFile[]> => {
    const processedFiles: ProcessedFile[] = [];

    const audioRule = options?.rules?.find(rule => rule.type === RuleType.AUDIO) ||
        options?.rules?.find(rule => rule.type === RuleType.GENERIC);

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Progress callback - validating stage
        if (options?.onProgress) {
            options.onProgress({
                currentFile: i + 1,
                totalFiles: files.length,
                fileName: file.name,
                stage: 'validating',
                percentage: Math.round(((i) / files.length) * 100)
            });
        }
        
        if (!isAudioFile(file)) {
            throw new Error(`File ${file.name} is not a valid audio file`);
        }

        if (audioRule?.allowedMimeTypes && !audioRule.allowedMimeTypes.includes(file.type)) {
            throw new Error(`File type ${file.type} is not allowed`);
        }

        if (audioRule?.minFileSize && file.size < audioRule.minFileSize) {
            throw new Error(`File ${file.name} is too small. Minimum size: ${audioRule.minFileSize} bytes`);
        }

        if (audioRule?.maxFileSize && file.size > audioRule.maxFileSize) {
            throw new Error(`File ${file.name} is too large. Maximum size: ${audioRule.maxFileSize} bytes`);
        }

        let processedMainFile: ProcessedMainFile = {};
        let thumbnailFile: ThumbnailFile | undefined;

        let processedAudio = file;
        if (audioRule?.compressQuality && audioRule.compressQuality < 100) {
            // Progress callback - compressing stage
            if (options?.onProgress) {
                options.onProgress({
                    currentFile: i + 1,
                    totalFiles: files.length,
                    fileName: file.name,
                    stage: 'compressing',
                    percentage: Math.round(((i + 0.25) / files.length) * 100)
                });
            }
            processedAudio = await compressAudio(file, audioRule.compressQuality);
        }

        if (audioRule?.willGenerateBase64) {
            processedMainFile.base64 = await fileToBase64(processedAudio);
        }

        if (audioRule?.willGenerateBlob) {
            processedMainFile.blob = new Blob([processedAudio], { type: processedAudio.type });
        }

        processedMainFile.file = processedAudio;
        
        // URL oluştur
        if (processedMainFile.blob || processedMainFile.file) {
            processedMainFile.url = URL.createObjectURL(processedMainFile.blob || processedMainFile.file);
        }

        // Progress callback - generating thumbnail stage
        if (options?.onProgress) {
            options.onProgress({
                currentFile: i + 1,
                totalFiles: files.length,
                fileName: file.name,
                stage: 'generating-thumbnail',
                percentage: Math.round(((i + 0.75) / files.length) * 100)
            });
        }
        
        // Generate visual thumbnail for audio files
        thumbnailFile = await generateAudioVisualThumbnail(file);

        const extension = '.' + file.name.split('.').pop()!.toLowerCase();

        processedFiles.push({
            name: file.name,
            size: processedAudio.size,
            type: 'audio',
            extension,
            mimeType: processedAudio.type,
            originalFile: file,
            processed: processedMainFile,
            thumbnail: thumbnailFile
        });
        
        // Progress callback - completed stage
        if (options?.onProgress) {
            options.onProgress({
                currentFile: i + 1,
                totalFiles: files.length,
                fileName: file.name,
                stage: 'completed',
                percentage: Math.round(((i + 1) / files.length) * 100)
            });
        }
    }

    if (audioRule?.minSelectionCount && processedFiles.length < audioRule.minSelectionCount) {
        throw new Error(`Minimum ${audioRule.minSelectionCount} audio file(s) required`);
    }

    if (audioRule?.maxSelectionCount && processedFiles.length > audioRule.maxSelectionCount) {
        throw new Error(`Maximum ${audioRule.maxSelectionCount} audio file(s) allowed`);
    }

    return processedFiles;
};

export { processAudioFiles };