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
        stages?: {
            validating?: string;
            compressing?: string;
            'generating-thumbnail'?: string;
            processing?: string;
            completed?: string;
        };
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
        subDesc: '',
        stages: {
            validating: 'Validating',
            compressing: 'Compressing',
            'generating-thumbnail': 'Generating thumbnail',
            processing: 'Processing',
            completed: 'Completed'
        }
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
            
            // Still process accepted files if any
            if (acceptedFiles.length > 0) {
                processFiles(acceptedFiles);
            }
            return;
        }

        processFiles(acceptedFiles);
    }, [processFiles, onError]);

    // Create dropzone options based on rules
    const computedDropzoneOptions = useMemo(() => {
        const opts: DropzoneOptions = {
            onDrop,
            disabled: disabled || isProcessing,
            multiple: true // Always allow multiple by default
        };

        // Merge all rules to create accept options
        if (options?.rules && options.rules.length > 0) {
            const accept: Record<string, string[]> = {};
            let minSize: number | undefined;
            let maxSize: number | undefined;
            let maxFiles: number | undefined;

            // Process all rules
            options.rules.forEach(rule => {
                // Handle MIME types
                if (rule.allowedMimeTypes) {
                    rule.allowedMimeTypes.forEach(mimeType => {
                        if (mimeType.endsWith('/*')) {
                            // Handle wildcards like 'image/*'
                            if (!accept[mimeType]) {
                                accept[mimeType] = [];
                            }
                        } else {
                            // Specific MIME type
                            const [type, subtype] = mimeType.split('/');
                            const category = `${type}/*`;
                            if (!accept[category]) {
                                accept[category] = [];
                            }
                            // Add extension
                            const ext = `.${subtype}`;
                            if (!accept[category].includes(ext)) {
                                accept[category].push(ext);
                            }
                        }
                    });
                }

                // Handle size limits (use most restrictive)
                if (rule.minFileSize !== undefined) {
                    minSize = minSize === undefined ? rule.minFileSize : Math.max(minSize, rule.minFileSize);
                }
                if (rule.maxFileSize !== undefined) {
                    maxSize = maxSize === undefined ? rule.maxFileSize : Math.min(maxSize, rule.maxFileSize);
                }

                // Handle file count (use most restrictive)
                if (rule.maxSelectionCount !== undefined) {
                    maxFiles = maxFiles === undefined ? rule.maxSelectionCount : Math.min(maxFiles, rule.maxSelectionCount);
                }
            });

            // Apply computed options
            if (Object.keys(accept).length > 0) {
                opts.accept = accept;
            }
            if (minSize !== undefined) {
                opts.minSize = minSize;
            }
            if (maxSize !== undefined) {
                opts.maxSize = maxSize;
            }
            if (maxFiles !== undefined) {
                opts.maxFiles = maxFiles;
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

    // Get stage text
    const getStageText = (stage: ProgressInfo['stage']) => {
        return texts.stages?.[stage] || stage;
    };

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
                            <>
                                <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>
                                    {progressInfo.currentFile}/{progressInfo.totalFiles}
                                </span>
                                <div style={{ 
                                    fontSize: '12px', 
                                    marginTop: '4px',
                                    color: '#999'
                                }}>
                                    {getStageText(progressInfo.stage)}
                                </div>
                            </>
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
                            textAlign: 'center',
                            wordBreak: 'break-word',
                            maxWidth: '300px'
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