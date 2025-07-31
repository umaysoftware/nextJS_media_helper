import { MediaHelper, RuleType, ImageMimeTypes, VideoMimeTypes } from '../index';

// Example 1: Basic usage - opens native file picker
async function basicExample() {
    try {
        // This will open the native file picker dialog
        const processedFiles = await MediaHelper.pickMixed();
        
        console.log('Processed files:', processedFiles);
        
        processedFiles.forEach(file => {
            console.log(`Name: ${file.name}`);
            console.log(`Type: ${file.type}`);
            console.log(`Size: ${file.size} bytes`);
            if (file.thumbnail) {
                console.log('Thumbnail available');
            }
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

// Example 2: With validation rules
async function withRulesExample() {
    const processedFiles = await MediaHelper.pickMixed({
        multiple: true, // Allow multiple file selection
        rules: [
            {
                type: RuleType.IMAGE,
                allowedMimeTypes: [ImageMimeTypes.JPEG, ImageMimeTypes.PNG],
                maxFileSize: 5 * 1024 * 1024, // 5MB
                compressQuality: 80,
                willGenerateBase64: true,
                willGenerateBlob: true
            },
            {
                type: RuleType.VIDEO,
                allowedMimeTypes: [VideoMimeTypes.MP4],
                maxFileSize: 100 * 1024 * 1024, // 100MB
                compressQuality: 70,
                willGenerateBlob: true
            },
            {
                type: RuleType.GENERIC,
                minSelectionCount: 1,
                maxSelectionCount: 10
            }
        ]
    });
    
    console.log(`Processed ${processedFiles.length} files`);
}

// Example 3: Pick specific file types
async function pickSpecificTypes() {
    // Pick only images - native picker will filter to show only images
    const images = await MediaHelper.pickImages({
        rules: [{
            type: RuleType.IMAGE,
            compressQuality: 90,
            willGenerateBase64: true
        }]
    });
    
    // Pick only videos
    const videos = await MediaHelper.pickVideos({
        rules: [{
            type: RuleType.VIDEO,
            maxFileSize: 200 * 1024 * 1024
        }]
    });
    
    // Pick only documents
    const documents = await MediaHelper.pickDocuments();
    
    // Pick only audio files
    const audioFiles = await MediaHelper.pickAudio();
    
    // Pick only archives
    const archives = await MediaHelper.pickArchives();
}

// Example 4: React component usage
import React, { useState } from 'react';

const FileUploadComponent: React.FC = () => {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    const handleSelectFiles = async () => {
        setLoading(true);
        try {
            // Opens native file picker
            const processed = await MediaHelper.pickMixed({
                multiple: true,
                rules: [{
                    type: RuleType.IMAGE,
                    compressQuality: 85,
                    willGenerateBase64: true
                }]
            });
            
            setFiles(processed);
        } catch (error) {
            console.error('File selection failed:', error);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div>
            <button onClick={handleSelectFiles} disabled={loading}>
                {loading ? 'Processing...' : 'Select Files'}
            </button>
            
            <div className="file-grid">
                {files.map((file, index) => (
                    <div key={index} className="file-item">
                        {file.thumbnail?.base64 && (
                            <img 
                                src={file.thumbnail.base64} 
                                alt={file.name}
                                style={{ width: 200, height: 200, objectFit: 'cover' }}
                            />
                        )}
                        <p>{file.name}</p>
                        <p>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Example 5: Custom accept types
async function customAcceptExample() {
    // Only allow specific file types
    const files = await MediaHelper.pickMixed({
        accept: '.jpg,.png,.mp4,.pdf', // Custom accept attribute
        multiple: true,
        rules: [{
            type: RuleType.GENERIC,
            willGenerateBase64: true
        }]
    });
}

// Example 6: Single file selection
async function singleFileExample() {
    const files = await MediaHelper.pickMixed({
        multiple: false, // Only allow single file selection
        rules: [{
            type: RuleType.IMAGE,
            maxFileSize: 10 * 1024 * 1024,
            compressQuality: 90
        }]
    });
    
    if (files.length > 0) {
        const file = files[0];
        console.log('Selected file:', file.name);
    }
}

// Example 7: Using individual processors directly
import { processImageFile, processVideoFiles } from '../index';

async function directProcessingExample() {
    // If you already have File objects, you can use individual processors directly
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    const files = Array.from(fileInput.files || []);
    
    // Separate files by type
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const videoFiles = files.filter(f => f.type.startsWith('video/'));
    
    // Process each type
    const processedImages = await processImageFile(imageFiles, {
        rules: [{
            type: RuleType.IMAGE,
            compressQuality: 80
        }]
    });
    
    const processedVideos = await processVideoFiles(videoFiles, {
        rules: [{
            type: RuleType.VIDEO,
            compressQuality: 70
        }]
    });
    
    return [...processedImages, ...processedVideos];
}

export {
    basicExample,
    withRulesExample,
    pickSpecificTypes,
    FileUploadComponent,
    customAcceptExample,
    singleFileExample,
    directProcessingExample
};