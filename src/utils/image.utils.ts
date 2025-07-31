import imageCompression from 'browser-image-compression';
import { ImageMimeTypes, PreviewImageOptions } from '../types/image';
import { ThumbnailFile, SelectionOptions, ProcessedFile, ProcessedMainFile, RuleType } from '../types/common';

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
const getImageMimeType = (format: string): string => {
    const mimeMap: Record<string, string> = {
        'jpeg': ImageMimeTypes.JPEG,
        'jpg': ImageMimeTypes.JPEG,
        'png': ImageMimeTypes.PNG,
        'gif': ImageMimeTypes.GIF,
        'bmp': ImageMimeTypes.BMP,
        'tiff': ImageMimeTypes.TIFF,
        'tif': ImageMimeTypes.TIFF,
        'webp': ImageMimeTypes.WEBP,
        'svg': ImageMimeTypes.SVG,
        'ico': ImageMimeTypes.ICO,
        'avif': ImageMimeTypes.AVIF,
        'heic': ImageMimeTypes.HEIC,
        'heif': ImageMimeTypes.HEIF,
    };
    return mimeMap[format.toLowerCase()] || ImageMimeTypes.JPEG;
};

const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/') || Object.values(ImageMimeTypes).includes(file.type as ImageMimeTypes);
};

const compressImage = async (file: File, compressQuality: number): Promise<File> => {
    const options = {
        maxSizeMB: 10,
        maxWidthOrHeight: 4096,
        useWebWorker: true,
        quality: compressQuality / 100,
        fileType: file.type as any
    };

    try {
        const compressedFile = await imageCompression(file, options);
        return new File([compressedFile], file.name, {
            type: file.type,
            lastModified: Date.now()
        });
    } catch (error) {
        console.error('Image compression failed:', error);
        return file;
    }
};

const generateThumbnail = async (file: File, options: PreviewImageOptions): Promise<ThumbnailFile> => {
    const targetFormat = options.format || 'webp';
    const quality = (options.compressQuality || 75) / 100;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    const img = new Image();
    const url = URL.createObjectURL(file);

    return new Promise((resolve, reject) => {
        img.onload = async () => {
            URL.revokeObjectURL(url);

            const aspectRatio = img.width / img.height;
            let targetWidth = options.width;
            let targetHeight = options.height;

            if (aspectRatio > targetWidth / targetHeight) {
                targetHeight = targetWidth / aspectRatio;
            } else {
                targetWidth = targetHeight * aspectRatio;
            }

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            canvas.toBlob(
                async (blob) => {
                    if (!blob) {
                        reject(new Error('Failed to generate thumbnail'));
                        return;
                    }

                    const base64 = await fileToBase64(new File([blob], `thumbnail.${targetFormat}`, {
                        type: `image/${targetFormat}`
                    }));

                    const thumbnailFile = new File([blob], `thumbnail.${targetFormat}`, {
                        type: `image/${targetFormat}`
                    });
                    
                    resolve({
                        base64,
                        blob,
                        file: thumbnailFile,
                        url: URL.createObjectURL(blob)
                    });
                },
                `image/${targetFormat}`,
                quality
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
};

// @ts-ignore
const cropImage = async (file: File, cropOptions: { x: number; y: number; width: number; height: number }): Promise<File> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    const img = new Image();
    const url = URL.createObjectURL(file);

    return new Promise((resolve, reject) => {
        img.onload = () => {
            URL.revokeObjectURL(url);

            canvas.width = cropOptions.width;
            canvas.height = cropOptions.height;

            ctx.drawImage(
                img,
                cropOptions.x,
                cropOptions.y,
                cropOptions.width,
                cropOptions.height,
                0,
                0,
                cropOptions.width,
                cropOptions.height
            );

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Failed to crop image'));
                        return;
                    }

                    resolve(new File([blob], `cropped_${file.name}`, {
                        type: file.type,
                        lastModified: Date.now()
                    }));
                },
                file.type
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
};

// @ts-ignore
const convertImageFormat = async (file: File, format: ImageMimeTypes): Promise<File> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    const img = new Image();
    const url = URL.createObjectURL(file);

    return new Promise((resolve, reject) => {
        img.onload = () => {
            URL.revokeObjectURL(url);

            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0);

            const formatExtension = format.split('/')[1].replace('+xml', '');

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Failed to convert image format'));
                        return;
                    }

                    const newFileName = file.name.replace(/\.[^/.]+$/, `.${formatExtension}`);
                    resolve(new File([blob], newFileName, {
                        type: format,
                        lastModified: Date.now()
                    }));
                },
                format,
                0.9
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
};

const processImageFile = async (files: File[], options?: SelectionOptions): Promise<ProcessedFile[]> => {
    const processedFiles: ProcessedFile[] = [];

    const imageRule = options?.rules?.find(rule => rule.type === RuleType.IMAGE) ||
        options?.rules?.find(rule => rule.type === RuleType.GENERIC);

    for (const file of files) {
        if (!isImageFile(file)) {
            throw new Error(`File ${file.name} is not a valid image file`);
        }

        if (imageRule?.allowedMimeTypes && !imageRule.allowedMimeTypes.includes(file.type)) {
            throw new Error(`File type ${file.type} is not allowed`);
        }

        if (imageRule?.minFileSize && file.size < imageRule.minFileSize) {
            throw new Error(`File ${file.name} is too small. Minimum size: ${imageRule.minFileSize} bytes`);
        }

        if (imageRule?.maxFileSize && file.size > imageRule.maxFileSize) {
            throw new Error(`File ${file.name} is too large. Maximum size: ${imageRule.maxFileSize} bytes`);
        }

        let processedMainFile: ProcessedMainFile = {};
        let thumbnailFile: ThumbnailFile | undefined;

        let processedImage = file;
        if (imageRule?.compressQuality && imageRule.compressQuality < 100) {
            processedImage = await compressImage(file, imageRule.compressQuality);
        }

        if (imageRule?.willGenerateBase64) {
            processedMainFile.base64 = await fileToBase64(processedImage);
        }

        if (imageRule?.willGenerateBlob) {
            processedMainFile.blob = new Blob([processedImage], { type: processedImage.type });
        }

        processedMainFile.file = processedImage;
        
        // URL oluştur
        if (processedMainFile.blob || processedMainFile.file) {
            processedMainFile.url = URL.createObjectURL(processedMainFile.blob || processedMainFile.file);
        }

        const defaultThumbnailOptions: PreviewImageOptions = {
            width: 200,
            height: 200,
            compressQuality: 75,
            format: 'webp'
        };
        thumbnailFile = await generateThumbnail(file, defaultThumbnailOptions);

        const extension = '.' + file.name.split('.').pop()!.toLowerCase();

        processedFiles.push({
            name: file.name,
            size: processedImage.size,
            type: 'image',
            extension,
            mimeType: processedImage.type,
            originalFile: file,
            processed: processedMainFile,
            thumbnail: thumbnailFile
        });
    }

    if (imageRule?.minSelectionCount && processedFiles.length < imageRule.minSelectionCount) {
        throw new Error(`Minimum ${imageRule.minSelectionCount} image(s) required`);
    }

    if (imageRule?.maxSelectionCount && processedFiles.length > imageRule.maxSelectionCount) {
        throw new Error(`Maximum ${imageRule.maxSelectionCount} image(s) allowed`);
    }

    return processedFiles;
};

export { processImageFile };