import { DropzoneOptions } from 'react-dropzone';
import { RuleType, RuleInfo } from '../types/common';
import { ImageMimeTypes } from '../types/image';
import { VideoMimeTypes } from '../types/video';
import { AudioMimeTypes } from '../types/audio';

/**
 * Convert RuleInfo to DropzoneOptions
 */
export const rulesToDropzoneOptions = (rules?: RuleInfo[]): Partial<DropzoneOptions> => {
    if (!rules || rules.length === 0) {
        return {};
    }

    const options: Partial<DropzoneOptions> = {};
    const acceptTypes: Record<string, string[]> = {};
    let maxSize: number | undefined;
    let minSize: number | undefined;
    let maxFiles: number | undefined;

    // Process each rule
    rules.forEach(rule => {
        // Handle file size constraints
        if (rule.maxFileSize) {
            maxSize = maxSize ? Math.min(maxSize, rule.maxFileSize) : rule.maxFileSize;
        }
        if (rule.minFileSize) {
            minSize = minSize ? Math.max(minSize, rule.minFileSize) : rule.minFileSize;
        }

        // Handle file count constraints
        if (rule.maxSelectionCount) {
            maxFiles = maxFiles ? Math.min(maxFiles, rule.maxSelectionCount) : rule.maxSelectionCount;
        }

        // Handle MIME types
        if (rule.allowedMimeTypes) {
            rule.allowedMimeTypes.forEach(mimeType => {
                const [type, subtype] = mimeType.split('/');
                const key = `${type}/*`;
                if (!acceptTypes[key]) {
                    acceptTypes[key] = [];
                }
                acceptTypes[key].push(`.${subtype}`);
            });
        } else {
            // Add default MIME types based on rule type
            switch (rule.type) {
                case RuleType.IMAGE:
                    acceptTypes['image/*'] = Object.values(ImageMimeTypes).map(mime => {
                        const ext = mime.split('/')[1].replace('x-', '').replace('+xml', '');
                        return `.${ext}`;
                    });
                    break;
                case RuleType.VIDEO:
                    acceptTypes['video/*'] = Object.values(VideoMimeTypes).map(mime => {
                        const ext = mime.split('/')[1].replace('x-', '').replace('mp2t', 'ts');
                        return `.${ext}`;
                    });
                    break;
                case RuleType.AUDIO:
                    acceptTypes['audio/*'] = Object.values(AudioMimeTypes).map(mime => {
                        const ext = mime.split('/')[1].replace('x-', '').replace('mpeg', 'mp3');
                        return `.${ext}`;
                    });
                    break;
                case RuleType.DOCUMENT:
                    const docExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.rtf'];
                    acceptTypes['application/*'] = docExts;
                    acceptTypes['text/*'] = ['.txt', '.csv'];
                    break;
                case RuleType.ARCHIVE:
                    acceptTypes['application/*'] = ['.zip', '.rar', '.tar', '.gz', '.7z'];
                    break;
            }
        }
    });

    // Build dropzone options
    if (Object.keys(acceptTypes).length > 0) {
        options.accept = acceptTypes;
    }
    if (maxSize !== undefined) {
        options.maxSize = maxSize;
    }
    if (minSize !== undefined) {
        options.minSize = minSize;
    }
    if (maxFiles !== undefined) {
        options.maxFiles = maxFiles;
    }

    return options;
};

/**
 * Create a temporary dropzone modal
 */
export const createDropzoneModal = (): {
    container: HTMLDivElement;
    cleanup: () => void;
} => {
    // Create modal container
    const container = document.createElement('div');
    container.className = 'media-helper-dropzone-modal';
    container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;

    // Create modal content
    const content = document.createElement('div');
    content.className = 'media-helper-dropzone-content';
    content.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: 32px;
        min-width: 400px;
        max-width: 600px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
    `;

    content.appendChild(closeButton);
    container.appendChild(content);

    // Cleanup function
    const cleanup = () => {
        document.body.removeChild(container);
    };

    // Close on backdrop click
    container.addEventListener('click', (e) => {
        if (e.target === container) {
            cleanup();
        }
    });

    // Close on close button click
    closeButton.addEventListener('click', cleanup);

    // Close on escape key
    const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            cleanup();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);

    // Add to body
    document.body.appendChild(container);

    return { container: content, cleanup };
};