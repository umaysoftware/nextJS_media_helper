import React, { useState, useCallback } from 'react';
import { useDropzone, DropzoneOptions, FileRejection } from 'react-dropzone';
import { SelectionOptions, ProcessedFile, ProgressInfo } from '../types/common';

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
    disabled = false
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

    const {
        getRootProps,
        getInputProps,
        isDragActive,
        isDragAccept,
        isDragReject
    } = useDropzone({
        onDrop,
        disabled: disabled || isProcessing,
        ...dropzoneOptions
    });

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
                <div className="dropzone-processing">
                    {progressInfo && (
                        <div>
                            <p>Processing {progressInfo.fileName}</p>
                            <p>File {progressInfo.currentFile} of {progressInfo.totalFiles}</p>
                            <p>{progressInfo.stage}</p>
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill" 
                                    style={{ width: `${progressInfo.percentage}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                children || (
                    <div className="dropzone-content">
                        {isDragActive ? (
                            <p>Drop the files here...</p>
                        ) : (
                            <p>Drag & drop files here, or click to select files</p>
                        )}
                    </div>
                )
            )}
        </div>
    );
};