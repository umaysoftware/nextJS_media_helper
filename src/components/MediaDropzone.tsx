import React, { useState, useCallback, useMemo } from 'react';
import { useDropzone, DropzoneOptions, FileRejection } from 'react-dropzone';
import { SelectionOptions, ProcessedFile, ProgressInfo } from '../types/common';
import { rulesToDropzoneOptions } from '../utils/dropzone.utils';

export interface MediaDropzoneProps {
    options?: SelectionOptions;
    onFilesProcessed: (files: ProcessedFile[]) => void;
    onError?: (error: Error) => void;
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
    };
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
        error: 'Error occurred'
    }
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
            onFilesProcessed(processedFiles);
        } catch (error) {
            console.error('Error processing files:', error);
            onError?.(error as Error);
        } finally {
            setIsProcessing(false);
            setProgressInfo(null);
        }
    }, [options, onFilesProcessed, onError, onProgress]);

    const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
        if (fileRejections.length > 0) {
            const errors = fileRejections.map(rejection =>
                `${rejection.file.name}: ${rejection.errors.map(e => e.message).join(', ')}`
            ).join('\n');
            onError?.(new Error(errors));
            return;
        }

        processFiles(acceptedFiles);
    }, [processFiles, onError]);

    // Merge rule-based options with user-provided dropzone options
    const computedDropzoneOptions = useMemo(() => {
        const ruleOptions = rulesToDropzoneOptions(options?.rules);
        return {
            ...ruleOptions,
            ...dropzoneOptions, // User options override rule options
            onDrop,
            disabled: disabled || isProcessing
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
                    <div className="dropzone-content">
                        {isDragActive ? (
                            <p>{texts.dragActive || 'Drop the files here...'}</p>
                        ) : (
                            <p>{texts.dragInactive || 'Drag & drop files here, or click to select files'}</p>
                        )}
                    </div>
                )
            )}
        </div>
    );
};