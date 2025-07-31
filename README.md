# NextJS Media Helper

A comprehensive media file processing library for Next.js applications. Supports images, videos, audio files, documents, and archives with automatic type detection, validation, compression, and thumbnail generation.

## Features

- 🎨 **Multi-format Support**: Images, Videos, Audio, Documents, Archives
- 🔍 **Automatic Type Detection**: Smart file type detection based on MIME types and extensions
- 📏 **Validation Rules**: File size limits, type restrictions, count constraints
- 🗜️ **Compression**: Automatic compression for images and videos
- 🖼️ **Thumbnail Generation**: WebP thumbnails for all file types
- 🔄 **Format Conversion**: Convert between different formats (where supported)
- 📦 **Flexible Output**: Base64, Blob, or File objects
- ⚡ **Browser-based Processing**: Uses FFmpeg.wasm for video/audio processing

## Installation

```bash
npm install nextjs-media-helper
# or
yarn add nextjs-media-helper
```

## Quick Start

```typescript
import { pickMixed, RuleType, ImageMimeTypes } from 'nextjs-media-helper';

// Process mixed file types
const files = [imageFile, videoFile, documentFile];
const processed = await pickMixed(files);
```

## Usage Examples

### Basic Usage - Process Any File Type

```typescript
import { pickMixed } from 'nextjs-media-helper';

const handleFileUpload = async (files: File[]) => {
  try {
    const processedFiles = await pickMixed(files);
    console.log(processedFiles);
  } catch (error) {
    console.error('Error processing files:', error);
  }
};
```

### Image Processing with Rules

```typescript
import { processImageFile, RuleType, ImageMimeTypes } from 'nextjs-media-helper';

const imageOptions = {
  rules: [{
    type: RuleType.IMAGE,
    allowedMimeTypes: [ImageMimeTypes.JPEG, ImageMimeTypes.PNG, ImageMimeTypes.WEBP],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    minFileSize: 10 * 1024, // 10KB
    compressQuality: 80, // 80% quality
    willGenerateBase64: true,
    willGenerateBlob: true
  }]
};

const processedImages = await processImageFile([imageFile], imageOptions);

// Access processed data
processedImages.forEach(img => {
  console.log(img.processed.base64); // Base64 string
  console.log(img.processed.blob); // Blob object
  console.log(img.processed.file); // Compressed file
  console.log(img.thumbnail); // WebP thumbnail
});
```

### Video Processing with Compression

```typescript
import { processVideoFiles, RuleType, VideoMimeTypes } from 'nextjs-media-helper';

const videoOptions = {
  rules: [{
    type: RuleType.VIDEO,
    allowedMimeTypes: [VideoMimeTypes.MP4, VideoMimeTypes.WEBM],
    maxFileSize: 100 * 1024 * 1024, // 100MB
    compressQuality: 70, // Compress to 70% quality
    willGenerateBase64: false, // Skip base64 for large files
    willGenerateBlob: true
  }]
};

const processedVideos = await processVideoFiles([videoFile], videoOptions);
```

### Audio Processing

```typescript
import { processAudioFiles, RuleType, AudioMimeTypes } from 'nextjs-media-helper';

const audioOptions = {
  rules: [{
    type: RuleType.AUDIO,
    allowedMimeTypes: [AudioMimeTypes.MP3, AudioMimeTypes.WAV, AudioMimeTypes.OGG],
    maxFileSize: 50 * 1024 * 1024, // 50MB
    compressQuality: 80,
    willGenerateBase64: true
  }]
};

const processedAudio = await processAudioFiles([audioFile], audioOptions);
```

### Document Processing

```typescript
import { processDocumentFiles, RuleType, DocumentMimeTypes } from 'nextjs-media-helper';

const documentOptions = {
  rules: [{
    type: RuleType.DOCUMENT,
    allowedMimeTypes: [
      DocumentMimeTypes.PDF,
      DocumentMimeTypes.DOCX,
      DocumentMimeTypes.XLSX
    ],
    maxFileSize: 20 * 1024 * 1024, // 20MB
    willGenerateBase64: true
  }]
};

const processedDocs = await processDocumentFiles([documentFile], documentOptions);
```

### Mixed File Processing with Multiple Rules

```typescript
import { pickMixed, RuleType, ImageMimeTypes, VideoMimeTypes } from 'nextjs-media-helper';

const mixedOptions = {
  rules: [
    {
      type: RuleType.IMAGE,
      allowedMimeTypes: [ImageMimeTypes.JPEG, ImageMimeTypes.PNG],
      maxFileSize: 5 * 1024 * 1024,
      compressQuality: 85,
      willGenerateBase64: true
    },
    {
      type: RuleType.VIDEO,
      allowedMimeTypes: [VideoMimeTypes.MP4],
      maxFileSize: 50 * 1024 * 1024,
      compressQuality: 75,
      willGenerateBlob: true
    },
    {
      type: RuleType.GENERIC, // Apply to all files
      minSelectionCount: 1,
      maxSelectionCount: 10
    }
  ]
};

const files = [image1, image2, video1, document1];
const processed = await pickMixed(files, mixedOptions);

// Files are automatically grouped and processed by type
processed.forEach(file => {
  console.log(`Type: ${file.type}`);
  console.log(`Original size: ${file.originalFile.size}`);
  console.log(`Processed size: ${file.size}`);
  console.log(`Has thumbnail: ${!!file.thumbnail}`);
});
```

### File Selection Validation

```typescript
import { FileSelection, RuleInfo } from 'nextjs-media-helper';

// Example: Validate files before processing
const validateFiles = (files: File[]): FileSelection[] => {
  return files.map(file => ({
    name: file.name,
    size: file.size,
    type: file.type.split('/')[0],
    extension: '.' + file.name.split('.').pop()!,
    mimeType: file.type
  }));
};

// Custom validation rules
const customRules: RuleInfo = {
  type: RuleType.IMAGE,
  allowedMimeTypes: [ImageMimeTypes.JPEG, ImageMimeTypes.PNG],
  minSelectionCount: 2,
  maxSelectionCount: 5,
  minFileSize: 100 * 1024, // 100KB minimum
  maxFileSize: 10 * 1024 * 1024, // 10MB maximum
  willGenerateBase64: true,
  willGenerateBlob: true,
  compressQuality: 90
};
```

### React Component Example

```tsx
import React, { useState } from 'react';
import { pickMixed, ProcessedFile, RuleType } from 'nextjs-media-helper';

const MediaUploader: React.FC = () => {
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setLoading(true);
    try {
      const options = {
        rules: [
          {
            type: RuleType.IMAGE,
            compressQuality: 80,
            willGenerateBase64: true
          },
          {
            type: RuleType.VIDEO,
            compressQuality: 70,
            willGenerateBlob: true
          }
        ]
      };

      const processed = await pickMixed(files, options);
      setProcessedFiles(processed);
    } catch (error) {
      console.error('Processing failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        multiple 
        onChange={handleFileChange}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
      />
      
      {loading && <p>Processing files...</p>}
      
      <div className="processed-files">
        {processedFiles.map((file, index) => (
          <div key={index} className="file-item">
            <h3>{file.name}</h3>
            <p>Type: {file.type}</p>
            <p>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
            {file.thumbnail && (
              <img 
                src={file.thumbnail.base64} 
                alt="Thumbnail"
                style={{ width: 200, height: 200 }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

## API Reference

### Main Functions

#### `pickMixed(files: File[], options?: SelectionOptions): Promise<ProcessedFile[]>`
Process mixed file types automatically.

#### `processImageFile(files: File[], options?: SelectionOptions): Promise<ProcessedFile[]>`
Process image files only.

#### `processVideoFiles(files: File[], options?: SelectionOptions): Promise<ProcessedFile[]>`
Process video files only.

#### `processAudioFiles(files: File[], options?: SelectionOptions): Promise<ProcessedFile[]>`
Process audio files only.

#### `processDocumentFiles(files: File[], options?: SelectionOptions): Promise<ProcessedFile[]>`
Process document files only.

#### `processArchiveFiles(files: File[], options?: SelectionOptions): Promise<ProcessedFile[]>`
Process archive files only.

### Types

#### RuleType Enum
```typescript
enum RuleType {
  IMAGE = "image",
  VIDEO = "video", 
  AUDIO = "audio",
  DOCUMENT = "document",
  ARCHIVE = "archive",
  GENERIC = "generic" // Applies to all file types
}
```

#### RuleInfo Interface
```typescript
interface RuleInfo {
  type: RuleType;
  allowedMimeTypes?: string[];
  minSelectionCount?: number;
  maxSelectionCount?: number;
  minFileSize?: number;
  maxFileSize?: number;
  willGenerateBase64?: boolean;
  willGenerateBlob?: boolean;
  compressQuality?: number; // 0-100
}
```

#### ProcessedFile Interface
```typescript
interface ProcessedFile {
  name: string;
  size: number;
  type: string;
  extension: string;
  mimeType: string;
  originalFile: File;
  processed: {
    base64?: string;
    blob?: Blob;
    file?: File;
  };
  thumbnail?: {
    base64?: string;
    blob?: Blob;
    file?: File;
  };
}
```

## Supported File Types

### Images
- JPEG, PNG, GIF, BMP, TIFF, WebP, SVG, ICO, AVIF, HEIC, HEIF

### Videos
- MP4, WebM, AVI, MKV, MOV, FLV, WMV, OGG, MPEG, TS, M4V

### Audio
- MP3, WAV, OGG, FLAC, AAC, M4A, WMA, AMR, AIFF, OPUS

### Documents
- PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, RTF

### Archives
- ZIP, RAR, TAR, GZ

## Thumbnail Generation

All file types generate WebP thumbnails:
- **Images**: Resized to 200x200px maintaining aspect ratio
- **Videos**: Frame extraction at specified time
- **Audio**: Visual waveform representation
- **Documents**: Icon with file type indicator
- **Archives**: Icon with file size display

## Browser Compatibility

- Modern browsers with Web Workers support
- FFmpeg.wasm requires SharedArrayBuffer support
- Canvas API for image processing
- FileReader API for file handling

## Notes

- Large files may take time to process
- Video/audio processing uses FFmpeg.wasm (loaded on-demand)
- Document format conversion requires server-side processing
- Archive extraction not implemented (use JSZip or similar)

## License

MIT

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.