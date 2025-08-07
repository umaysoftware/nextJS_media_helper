import { SelectionOptions, ProcessedFile, UnProcessedFile } from '../types/common';

/**
 * Create a temporary dropzone modal for file selection
 */
export async function createDropzoneModal(options?: SelectionOptions & {
    dropzoneText?: string;
    dropzoneClassName?: string;
}): Promise<(ProcessedFile | UnProcessedFile)[]> {
    return new Promise((resolve) => {
        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.style.cssText = `
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

        // Create dropzone container
        const dropzoneContainer = document.createElement('div');
        dropzoneContainer.className = options?.dropzoneClassName || '';
        dropzoneContainer.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 40px;
            min-width: 400px;
            min-height: 300px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: 2px dashed #d1d5db;
            cursor: pointer;
            position: relative;
        `;

        // Add text
        const text = document.createElement('p');
        text.textContent = options?.dropzoneText || 'Drag & drop files here, or click to select';
        text.style.cssText = `
            color: #6b7280;
            font-size: 16px;
            margin: 0;
        `;
        dropzoneContainer.appendChild(text);

        // Create hidden file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        fileInput.style.display = 'none';
        
        // Set accept attribute based on rules
        if (options?.rules?.[0]?.allowedMimeTypes) {
            fileInput.accept = options.rules[0].allowedMimeTypes.join(',');
        }

        // Handle file selection
        const handleFiles = async (files: File[]) => {
            modalContainer.remove();
            
            // Import MediaHelper dynamically
            const { default: MediaHelper } = await import('../../index');
            const results = await MediaHelper.processFilesDirectly(files, options);
            resolve(results);
        };

        // File input change handler
        fileInput.onchange = (e) => {
            const target = e.target as HTMLInputElement;
            const files = Array.from(target.files || []);
            if (files.length > 0) {
                handleFiles(files);
            }
        };

        // Dropzone click handler
        dropzoneContainer.onclick = () => {
            fileInput.click();
        };

        // Drag and drop handlers
        dropzoneContainer.ondragover = (e) => {
            e.preventDefault();
            dropzoneContainer.style.borderColor = '#667eea';
            dropzoneContainer.style.background = '#ede9fe';
        };

        dropzoneContainer.ondragleave = (e) => {
            e.preventDefault();
            dropzoneContainer.style.borderColor = '#d1d5db';
            dropzoneContainer.style.background = 'white';
        };

        dropzoneContainer.ondrop = (e) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer?.files || []);
            if (files.length > 0) {
                handleFiles(files);
            }
        };

        // Close on backdrop click
        modalContainer.onclick = (e) => {
            if (e.target === modalContainer) {
                modalContainer.remove();
                resolve([]);
            }
        };

        // Add close button
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #6b7280;
        `;
        closeButton.onclick = () => {
            modalContainer.remove();
            resolve([]);
        };

        // Assemble modal
        dropzoneContainer.appendChild(fileInput);
        dropzoneContainer.appendChild(closeButton);
        modalContainer.appendChild(dropzoneContainer);
        document.body.appendChild(modalContainer);
    });
}