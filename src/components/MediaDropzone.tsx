import React, { useState, useCallback, useMemo } from 'react';
import { useDropzone, DropzoneOptions, FileRejection } from 'react-dropzone';
import { SelectionOptions, ProcessedFile, UnProcessedFile, ProgressInfo, FileError } from '../types/common';

export interface MediaDropzoneProps {
    options?: SelectionOptions;
    onFilesProcessed: (files: (ProcessedFile | UnProcessedFile)[]) => void;
    onError?: (errors: FileError[]) => void;
    onProgress?: (progress: ProgressInfo) => void;
    dropzoneOptions?: DropzoneOptions;
    className?: string;
    activeClassName?: string;
    acceptClassName?: string;
    rejectClassName?: string;
    disabledClassName?: string;
    children?: React.ReactNode;
    disabled?: boolean;
    texts?: {
        dragActive?: string;
        dragInactive?: string;
        processing?: string;
        error?: string;
        subDesc?: string;
    };
    icon?: React.ReactNode;
}

export const MediaDropzone: React.FC<MediaDropzoneProps> = ({
    options,
    onFilesProcessed,
    onError,
    onProgress,
    dropzoneOptions,
    className = '',
    activeClassName = '',
    acceptClassName = '',
    rejectClassName = '',
    disabledClassName = '',
    children,
    disabled = false,
    texts = {
        dragActive: 'Drop the files here...',
        dragInactive: 'Drag & drop files here, or click to select files',
        processing: 'Processing...',
        error: 'Error occurred',
        subDesc: ''
    },
    icon
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progressInfo, setProgressInfo] = useState<ProgressInfo | null>(null);

    const processFiles = useCallback(async (files: File[]) => {
        if (!files || files.length === 0) return;

        setIsProcessing(true);
        try {
            // Import MediaHelper dynamically to avoid circular dependency
            const { default: MediaHelper } = await import('../../index');

            // Create options with progress callback
            const processOptions: SelectionOptions = {
                ...options,
                onProgress: (progress) => {
                    setProgressInfo(progress);
                    onProgress?.(progress);
                }
            };

            // Process files using MediaHelper
            const processedFiles = await MediaHelper.processFilesDirectly(files, processOptions);

            // Separate processed and unprocessed files for error reporting
            const unprocessedFiles = processedFiles.filter(f => f.processType === 'unprocessed') as UnProcessedFile[];
            if (unprocessedFiles.length > 0 && onError) {
                const errors = unprocessedFiles.map(f => f.reason);
                onError(errors);
            }

            onFilesProcessed(processedFiles);
        } catch (error) {
            console.error('Error processing files:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const fileErrors: FileError[] = files.map(file => ({
                fileName: file.name,
                errorCode: 'PROCESSING_ERROR',
                message: errorMessage
            }));
            onError?.(fileErrors);
        } finally {
            setIsProcessing(false);
            setProgressInfo(null);
        }
    }, [options, onFilesProcessed, onError, onProgress]);

    const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
        if (fileRejections.length > 0) {
            const errors: FileError[] = fileRejections.flatMap(rejection =>
                rejection.errors.map(error => ({
                    fileName: rejection.file.name,
                    errorCode: error.code,
                    message: error.message
                }))
            );
            onError?.(errors);
            return;
        }

        processFiles(acceptedFiles);
    }, [processFiles, onError]);

    // Create dropzone options based on rules
    const computedDropzoneOptions = useMemo(() => {
        const opts: DropzoneOptions = {
            onDrop,
            disabled: disabled || isProcessing
        };

        // If rules are provided, configure accept and file size
        if (options?.rules?.[0]) {
            const rule = options.rules[0];

            // Set accepted file types
            if (rule.allowedMimeTypes) {
                const accept: Record<string, string[]> = {};
                rule.allowedMimeTypes.forEach(mimeType => {
                    if (mimeType.endsWith('/*')) {
                        // Handle wildcards like 'image/*'
                        accept[mimeType] = [];
                    } else {
                        // Group by MIME type category
                        const category = mimeType.split('/')[0] + '/*';
                        if (!accept[category]) {
                            accept[category] = [];
                        }
                        accept[category].push('.' + mimeType.split('/')[1]);
                    }
                });
                opts.accept = accept;
            }

            // Set file size limits
            if (rule.maxFileSize) {
                opts.maxSize = rule.maxFileSize;
            }
            if (rule.minFileSize) {
                opts.minSize = rule.minFileSize;
            }

            // Set file count limits
            if (rule.maxSelectionCount) {
                opts.maxFiles = rule.maxSelectionCount;
            }
        }

        // User options override computed options
        return {
            ...opts,
            ...dropzoneOptions
        };
    }, [options?.rules, dropzoneOptions, onDrop, disabled, isProcessing]);

    const {
        getRootProps,
        getInputProps,
        isDragActive,
        isDragAccept,
        isDragReject
    } = useDropzone(computedDropzoneOptions);

    const rootClassName = [
        className,
        isDragActive && activeClassName,
        isDragAccept && acceptClassName,
        isDragReject && rejectClassName,
        (disabled || isProcessing) && disabledClassName
    ].filter(Boolean).join(' ');

    return (
        <div {...getRootProps({ className: rootClassName })}>
            <input {...getInputProps()} />

            {isProcessing ? (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '20px'
                }}>
                    <div style={{
                        fontSize: '14px',
                        color: '#666',
                        textAlign: 'center'
                    }}>
                        {texts.processing || 'Processing...'}
                        {progressInfo && (
                            <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>
                                {progressInfo.currentFile}/{progressInfo.totalFiles}
                            </span>
                        )}
                    </div>

                    <div style={{
                        width: '100%',
                        maxWidth: '300px',
                        height: '4px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '9999px',
                        overflow: 'hidden'
                    }}>
                        <div
                            style={{
                                width: `${progressInfo?.percentage || 0}%`,
                                height: '100%',
                                backgroundColor: '#3b82f6',
                                borderRadius: '9999px',
                                transition: 'width 0.3s ease'
                            }}
                        />
                    </div>

                    {progressInfo && (
                        <div style={{
                            fontSize: '12px',
                            color: '#999',
                            textAlign: 'center'
                        }}>
                            {progressInfo.fileName}
                        </div>
                    )}
                </div>
            ) : (
                children || (
                    <div className="dropzone-content" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '40px 20px',
                        textAlign: 'center'
                    }}>
                        {icon && (
                            <div style={{
                                fontSize: '48px',
                                color: '#9ca3af',
                                marginBottom: '8px'
                            }}>
                                {icon}
                            </div>
                        )}

                        <p style={{
                            margin: 0,
                            fontSize: '16px',
                            color: '#374151',
                            fontWeight: 500
                        }}>
                            {isDragActive ? texts.dragActive : texts.dragInactive}
                        </p>

                        {texts.subDesc && (
                            <p style={{
                                margin: 0,
                                fontSize: '14px',
                                color: '#6b7280',
                                maxWidth: '400px'
                            }}>
                                {texts.subDesc}
                            </p>
                        )}
                    </div>
                )
            )}
        </div>
    );
};