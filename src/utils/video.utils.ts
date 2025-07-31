import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { ProcessedFile, ProcessedMainFile, RuleType } from '../types/common';
import { VideoMimeTypes, PreviewVideoOptions } from '../types/video';
import { ThumbnailFile, SelectionOptions } from '../types/common';

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
    const ffmpeg = await initFFmpeg();
    const inputName = 'input.' + file.name.split('.').pop();
    const outputName = 'output.mp4';

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    const crf = Math.round(51 - (compressQuality / 100) * 28);

    await ffmpeg.exec([
        '-i', inputName,
        '-c:v', 'libx264',
        '-crf', crf.toString(),
        '-preset', 'medium',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        outputName
    ]);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data], { type: VideoMimeTypes.MP4 });

    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    return new File([blob], file.name.replace(/\.[^/.]+$/, '.mp4'), { type: VideoMimeTypes.MP4 });
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

    return {
        base64,
        blob,
        file: new File([blob], `thumbnail.${options.format || 'webp'}`, { type: mimeType })
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
    const processedFiles: ProcessedFile[] = [];

    const videoRule = options?.rules?.find(rule => rule.type === RuleType.VIDEO) ||
        options?.rules?.find(rule => rule.type === RuleType.GENERIC);

    for (const file of files) {
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
            processedVideo = await compressVideo(file, videoRule.compressQuality);
        }

        if (videoRule?.willGenerateBase64) {
            processedMainFile.base64 = await fileToBase64(processedVideo);
        }

        if (videoRule?.willGenerateBlob) {
            processedMainFile.blob = new Blob([processedVideo], { type: processedVideo.type });
        }

        processedMainFile.file = processedVideo;

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

    return processedFiles;
};

export { processVideoFiles };