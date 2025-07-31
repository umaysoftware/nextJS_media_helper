import { AchiveMimeTypes } from '@/types/archive';
import { ThumbnailFile, ProcessedFile, SelectionOptions, ProcessedMainFile, RuleType } from '@/types/common';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
};

const getArchiveMimeType = (format: string): string => {
    const mimeMap: Record<string, string> = {
        'zip': AchiveMimeTypes.ZIP,
        'rar': AchiveMimeTypes.RAR,
        'tar': AchiveMimeTypes.TAR,
        'gz': AchiveMimeTypes.GZ,
        'gzip': AchiveMimeTypes.GZ,
    };
    return mimeMap[format.toLowerCase()] || AchiveMimeTypes.ZIP;
};

const isArchiveFile = (file: File): boolean => {
    return Object.values(AchiveMimeTypes).includes(file.type as AchiveMimeTypes) ||
        file.name.endsWith('.zip') ||
        file.name.endsWith('.rar') ||
        file.name.endsWith('.tar') ||
        file.name.endsWith('.gz') ||
        file.name.endsWith('.7z');
};

const compressArchive = async (file: File, compressQuality: number): Promise<File> => {
    // Archive files are already compressed, so we'll return the original
    console.log(`Archive compression requested with quality ${compressQuality}, returning original file`);
    return file;
};

const generateArchiveThumbnail = async (file: File): Promise<ThumbnailFile> => {
    // Generate a simple icon-based thumbnail for archive files
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    canvas.width = 200;
    canvas.height = 200;

    // Background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Archive icon (folder with zipper)
    ctx.fillStyle = '#4a90e2';
    ctx.fillRect(40, 60, 120, 100);

    // Zipper representation
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(100, 60);
    ctx.lineTo(100, 160);
    ctx.stroke();

    // Zipper teeth
    for (let i = 70; i < 160; i += 10) {
        ctx.beginPath();
        ctx.moveTo(95, i);
        ctx.lineTo(105, i);
        ctx.stroke();
    }

    // File type text
    const extension = file.name.split('.').pop()?.toUpperCase() || 'ZIP';
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(extension, 100, 30);

    // File size
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    ctx.font = '14px Arial';
    ctx.fillStyle = '#666666';
    ctx.fillText(`${sizeInMB} MB`, 100, 180);

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            async (blob) => {
                if (!blob) {
                    reject(new Error('Failed to generate archive thumbnail'));
                    return;
                }

                const thumbnailFile = new File([blob], 'thumbnail.png', { type: 'image/png' });
                const base64 = await fileToBase64(thumbnailFile);

                resolve({
                    base64,
                    blob,
                    file: thumbnailFile
                });
            },
            'image/png',
            0.9
        );
    });
};

const extractArchive = async (file: File): Promise<File[]> => {
    // Archive extraction typically requires specialized libraries like JSZip
    // This is a placeholder that would need actual implementation
    throw new Error('Archive extraction is not implemented. Consider using JSZip or similar library for client-side extraction.');
};

const convertArchiveFormat = async (file: File, format: AchiveMimeTypes): Promise<File> => {
    // Archive format conversion requires specialized tools
    // This would typically be done server-side

    if (file.type === format) {
        return file;
    }

    throw new Error(`Archive format conversion from ${file.type} to ${format} is not supported in the browser. This requires server-side processing.`);
};

const processArchiveFiles = async (files: File[], options?: SelectionOptions): Promise<ProcessedFile[]> => {
    const processedFiles: ProcessedFile[] = [];

    const archiveRule = options?.rules?.find(rule => rule.type === RuleType.ARCHIVE);

    for (const file of files) {
        if (!isArchiveFile(file)) {
            throw new Error(`File ${file.name} is not a valid archive file`);
        }

        if (archiveRule?.allowedMimeTypes && !archiveRule.allowedMimeTypes.includes(file.type)) {
            throw new Error(`File type ${file.type} is not allowed`);
        }

        if (archiveRule?.minFileSize && file.size < archiveRule.minFileSize) {
            throw new Error(`File ${file.name} is too small. Minimum size: ${archiveRule.minFileSize} bytes`);
        }

        if (archiveRule?.maxFileSize && file.size > archiveRule.maxFileSize) {
            throw new Error(`File ${file.name} is too large. Maximum size: ${archiveRule.maxFileSize} bytes`);
        }

        let processedMainFile: ProcessedMainFile = {};
        let thumbnailFile: ThumbnailFile | undefined;

        // Archives are already compressed, no need for further compression
        let processedArchive = file;

        if (archiveRule?.willGenerateBase64) {
            processedMainFile.base64 = await fileToBase64(processedArchive);
        }

        if (archiveRule?.willGenerateBlob) {
            processedMainFile.blob = new Blob([processedArchive], { type: processedArchive.type });
        }

        processedMainFile.file = processedArchive;

        // Always generate a thumbnail for archives
        thumbnailFile = await generateArchiveThumbnail(file);

        const extension = '.' + file.name.split('.').pop()!.toLowerCase();

        processedFiles.push({
            name: file.name,
            size: processedArchive.size,
            type: 'archive',
            extension,
            mimeType: processedArchive.type,
            originalFile: file,
            processed: processedMainFile,
            thumbnail: thumbnailFile
        });
    }

    if (archiveRule?.minSelectionCount && processedFiles.length < archiveRule.minSelectionCount) {
        throw new Error(`Minimum ${archiveRule.minSelectionCount} archive(s) required`);
    }

    if (archiveRule?.maxSelectionCount && processedFiles.length > archiveRule.maxSelectionCount) {
        throw new Error(`Maximum ${archiveRule.maxSelectionCount} archive(s) allowed`);
    }

    return processedFiles;
};

export { processArchiveFiles };