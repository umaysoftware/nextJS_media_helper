import { DocumentMimeTypes } from '@/types/document';
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

const getDocumentMimeType = (format: string): string => {
    const mimeMap: Record<string, string> = {
        'pdf': DocumentMimeTypes.PDF,
        'doc': DocumentMimeTypes.DOC,
        'docx': DocumentMimeTypes.DOCX,
        'xls': DocumentMimeTypes.XLS,
        'xlsx': DocumentMimeTypes.XLSX,
        'ppt': DocumentMimeTypes.PPT,
        'pptx': DocumentMimeTypes.PPTX,
        'txt': DocumentMimeTypes.TXT,
        'csv': DocumentMimeTypes.CSV,
        'rtf': DocumentMimeTypes.RTF,
    };
    return mimeMap[format.toLowerCase()] || DocumentMimeTypes.PDF;
};

const isDocumentFile = (file: File): boolean => {
    return Object.values(DocumentMimeTypes).includes(file.type as DocumentMimeTypes) ||
        file.type.startsWith('application/') ||
        file.type.startsWith('text/');
};

const compressDocument = async (file: File, compressQuality: number): Promise<File> => {
    // Document compression is typically not needed for most document types
    // as they are already compressed (PDF, DOCX, etc.)
    // For text files, we could implement compression, but for now we'll return the original
    console.log(`Document compression requested with quality ${compressQuality}, returning original file`);
    return file;
};

const generateDocumentThumbnail = async (file: File): Promise<ThumbnailFile> => {
    // Generate a simple text-based thumbnail for documents
    // In a real implementation, you might use a library to generate PDF previews
    // or extract text snippets from documents

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    canvas.width = 200;
    canvas.height = 260;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Document icon
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(20, 20, 160, 200);

    // Border
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 160, 200);

    // File type text
    const extension = file.name.split('.').pop()?.toUpperCase() || 'DOC';
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(extension, 100, 120);

    // File name (truncated)
    ctx.font = '12px Arial';
    ctx.fillStyle = '#666666';
    const fileName = file.name.length > 20 ? file.name.substring(0, 17) + '...' : file.name;
    ctx.fillText(fileName, 100, 240);

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            async (blob) => {
                if (!blob) {
                    reject(new Error('Failed to generate document thumbnail'));
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

const convertDocumentFormat = async (file: File, format: DocumentMimeTypes): Promise<File> => {
    // Document format conversion typically requires server-side processing
    // or specialized libraries. For now, we'll throw an error indicating
    // that this feature requires additional implementation

    if (file.type === format) {
        return file;
    }

    // For text-based conversions, we could implement basic conversions
    if (file.type === DocumentMimeTypes.TXT && format === DocumentMimeTypes.CSV) {
        // Simple TXT to CSV conversion (assuming line-based data)
        const text = await file.text();
        const csvContent = text.split('\n').map(line => `"${line}"`).join('\n');
        const blob = new Blob([csvContent], { type: DocumentMimeTypes.CSV });
        return new File([blob], file.name.replace(/\.[^/.]+$/, '.csv'), { type: DocumentMimeTypes.CSV });
    }

    throw new Error(`Document format conversion from ${file.type} to ${format} is not supported in the browser. This requires server-side processing.`);
};




const processDocumentFiles = async (files: File[], options?: SelectionOptions): Promise<ProcessedFile[]> => {
    const processedFiles: ProcessedFile[] = [];

    const documentRule = options?.rules?.find(rule => rule.type === RuleType.DOCUMENT) ||
        options?.rules?.find(rule => rule.type === RuleType.GENERIC);

    for (const file of files) {
        if (!isDocumentFile(file)) {
            throw new Error(`File ${file.name} is not a valid document file`);
        }

        if (documentRule?.allowedMimeTypes && !documentRule.allowedMimeTypes.includes(file.type)) {
            throw new Error(`File type ${file.type} is not allowed`);
        }

        if (documentRule?.minFileSize && file.size < documentRule.minFileSize) {
            throw new Error(`File ${file.name} is too small. Minimum size: ${documentRule.minFileSize} bytes`);
        }

        if (documentRule?.maxFileSize && file.size > documentRule.maxFileSize) {
            throw new Error(`File ${file.name} is too large. Maximum size: ${documentRule.maxFileSize} bytes`);
        }

        let processedMainFile: ProcessedMainFile = {};
        let thumbnailFile: ThumbnailFile | undefined;

        // Documents typically don't need compression
        let processedDocument = file;

        if (documentRule?.willGenerateBase64) {
            processedMainFile.base64 = await fileToBase64(processedDocument);
        }

        if (documentRule?.willGenerateBlob) {
            processedMainFile.blob = new Blob([processedDocument], { type: processedDocument.type });
        }

        processedMainFile.file = processedDocument;

        // Always generate a thumbnail for documents
        thumbnailFile = await generateDocumentThumbnail(file);

        const extension = '.' + file.name.split('.').pop()!.toLowerCase();

        processedFiles.push({
            name: file.name,
            size: processedDocument.size,
            type: 'document',
            extension,
            mimeType: processedDocument.type,
            originalFile: file,
            processed: processedMainFile,
            thumbnail: thumbnailFile
        });
    }

    if (documentRule?.minSelectionCount && processedFiles.length < documentRule.minSelectionCount) {
        throw new Error(`Minimum ${documentRule.minSelectionCount} document(s) required`);
    }

    if (documentRule?.maxSelectionCount && processedFiles.length > documentRule.maxSelectionCount) {
        throw new Error(`Maximum ${documentRule.maxSelectionCount} document(s) allowed`);
    }

    return processedFiles;
};

export { processDocumentFiles };