# NextJS Media Helper

A comprehensive media file processing library for Next.js applications. Features native browser file selection, automatic type detection, validation, compression, and WebP thumbnail generation for all file types.

## Features

- 🎯 **Native File Selection**: Browser's native file picker integration
- 🎨 **Multi-format Support**: Images, Videos, Audio, Documents, Archives
- 🔍 **Automatic Type Detection**: Smart file type detection based on MIME types and extensions
- 📏 **Validation Rules**: File size limits, type restrictions, count constraints
- 🗜️ **Compression**: Automatic compression for images and videos
- 🖼️ **WebP Thumbnails**: Unified WebP thumbnail generation for all file types
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
import MediaHelper from 'nextjs-media-helper';

// Open native file picker and process selected files
const processedFiles = await MediaHelper.pickMixed();
```

## Usage Examples

### Basic Usage - Native File Picker

```typescript
import MediaHelper, { RuleType } from 'nextjs-media-helper';

// Open file picker - accepts any file type
const files = await MediaHelper.pickMixed();

// Open file picker - with options
const files = await MediaHelper.pickMixed({
  multiple: true,  // Allow multiple file selection
  accept: '.jpg,.png,.mp4,.pdf'  // Custom file types
});
```

### With Validation Rules

```typescript
import MediaHelper, { RuleType, ImageMimeTypes, VideoMimeTypes } from 'nextjs-media-helper';

const processedFiles = await MediaHelper.pickMixed({
  multiple: true,
  rules: [
    {
      type: RuleType.IMAGE,
      allowedMimeTypes: [ImageMimeTypes.JPEG, ImageMimeTypes.PNG, ImageMimeTypes.WEBP],
      maxFileSize: 5 * 1024 * 1024, // 5MB
      minFileSize: 10 * 1024, // 10KB
      compressQuality: 80, // 80% quality
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

// Access processed data
processedFiles.forEach(file => {
  console.log(`Name: ${file.name}`);
  console.log(`Type: ${file.type}`);
  console.log(`Size: ${file.size} bytes`);
  
  if (file.processed.base64) {
    console.log('Base64 available');
  }
  
  if (file.thumbnail) {
    console.log('WebP thumbnail generated');
    // All thumbnails are in WebP format
  }
});
```

### Type-Specific File Selection

```typescript
// Pick only images
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

// Pick only audio files
const audioFiles = await MediaHelper.pickAudio();

// Pick only documents
const documents = await MediaHelper.pickDocuments();

// Pick only archives
const archives = await MediaHelper.pickArchives();
```

### React Component Example

```tsx
import React, { useState } from 'react';
import MediaHelper, { ProcessedFile, RuleType } from 'nextjs-media-helper';

const MediaUploader: React.FC = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = async () => {
    setLoading(true);
    try {
      const processed = await MediaHelper.pickMixed({
        multiple: true,
        rules: [
          {
            type: RuleType.IMAGE,
            compressQuality: 85,
            willGenerateBase64: true
          },
          {
            type: RuleType.VIDEO,
            compressQuality: 70,
            willGenerateBlob: true
          }
        ]
      });
      
      setFiles(processed);
    } catch (error) {
      console.error('Processing failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleFileSelect} disabled={loading}>
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
            <h3>{file.name}</h3>
            <p>Type: {file.type}</p>
            <p>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Direct Processing (Without File Picker)

If you already have File objects, you can use the individual processors directly:

```typescript
import { processImageFile, processVideoFiles, RuleType } from 'nextjs-media-helper';

// Process image files directly
const imageFiles: File[] = [...]; // Your image files
const processedImages = await processImageFile(imageFiles, {
  rules: [{
    type: RuleType.IMAGE,
    compressQuality: 80,
    willGenerateBase64: true
  }]
});

// Process video files directly
const videoFiles: File[] = [...]; // Your video files
const processedVideos = await processVideoFiles(videoFiles, {
  rules: [{
    type: RuleType.VIDEO,
    compressQuality: 70
  }]
});
```

### Custom File Input Example

```typescript
// Using with a custom file input
const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(event.target.files || []);
  
  // Process specific file types
  const imageFiles = files.filter(f => f.type.startsWith('image/'));
  const processedImages = await processImageFile(imageFiles, {
    rules: [{
      type: RuleType.IMAGE,
      compressQuality: 85
    }]
  });
};
```

## API Reference

### MediaHelper Class

The main class providing file selection and processing functionality.

#### Methods

##### `MediaHelper.pickMixed(options?)`
Opens native file picker and processes selected files of any type.

**Parameters:**
- `options`: Optional configuration object
  - `multiple`: Boolean - Allow multiple file selection (default: true)
  - `accept`: String - Custom accept attribute for file input
  - `rules`: Array of RuleInfo objects for validation and processing

**Returns:** `Promise<ProcessedFile[]>`

##### `MediaHelper.pickImages(options?)`
Opens file picker filtered for image files only.

##### `MediaHelper.pickVideos(options?)`
Opens file picker filtered for video files only.

##### `MediaHelper.pickAudio(options?)`
Opens file picker filtered for audio files only.

##### `MediaHelper.pickDocuments(options?)`
Opens file picker filtered for document files only.

##### `MediaHelper.pickArchives(options?)`
Opens file picker filtered for archive files only.

### Individual Processors

For direct file processing without the file picker:

- `processImageFile(files: File[], options?): Promise<ProcessedFile[]>`
- `processVideoFiles(files: File[], options?): Promise<ProcessedFile[]>`
- `processAudioFiles(files: File[], options?): Promise<ProcessedFile[]>`
- `processDocumentFiles(files: File[], options?): Promise<ProcessedFile[]>`
- `processArchiveFiles(files: File[], options?): Promise<ProcessedFile[]>`

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

All file types generate thumbnails in WebP format:

| File Type | Thumbnail Description |
|-----------|----------------------|
| **Images** | Resized to 200x200px maintaining aspect ratio |
| **Videos** | Frame extracted from the video |
| **Audio** | Visual waveform representation with file type indicator |
| **Documents** | Document icon with file type text |
| **Archives** | Archive icon with file size display |

## Advanced Features

### File Size Validation
```typescript
const files = await MediaHelper.pickMixed({
  rules: [{
    type: RuleType.IMAGE,
    minFileSize: 100 * 1024,     // 100KB minimum
    maxFileSize: 10 * 1024 * 1024 // 10MB maximum
  }]
});
```

### File Count Limits
```typescript
const files = await MediaHelper.pickMixed({
  rules: [{
    type: RuleType.GENERIC,
    minSelectionCount: 2,  // At least 2 files
    maxSelectionCount: 5   // Maximum 5 files
  }]
});
```

### Mixed Type Processing
```typescript
const files = await MediaHelper.pickMixed({
  rules: [
    {
      type: RuleType.IMAGE,
      compressQuality: 90
    },
    {
      type: RuleType.VIDEO,
      compressQuality: 70
    },
    {
      type: RuleType.GENERIC,
      maxSelectionCount: 10
    }
  ]
});
```

## Browser Compatibility

- Modern browsers with Web Workers support
- FFmpeg.wasm requires SharedArrayBuffer support
- Canvas API for image processing
- FileReader API for file handling

## Performance Considerations

- Large video files may take time to process
- Video/audio processing uses FFmpeg.wasm (loaded on-demand)
- Image compression uses browser-image-compression library
- Consider using Web Workers for heavy processing tasks

## Error Handling

```typescript
try {
  const files = await MediaHelper.pickMixed({
    rules: [{
      type: RuleType.IMAGE,
      maxFileSize: 5 * 1024 * 1024
    }]
  });
} catch (error) {
  if (error.message.includes('too large')) {
    console.error('File size exceeded');
  } else if (error.message.includes('not allowed')) {
    console.error('File type not allowed');
  }
}
```

## Notes

- All thumbnails are generated in WebP format for consistency and performance
- Document format conversion requires server-side processing
- Archive extraction not implemented (use JSZip or similar)
- Cancel file selection returns empty array, not an error

## License

MIT

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.