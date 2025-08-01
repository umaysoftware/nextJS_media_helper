# NextJS Media Helper

A comprehensive media file processing library for Next.js applications. Features native browser file selection, automatic type detection, validation, compression, and WebP thumbnail generation for all file types.

## Features

- 🎯 **Multiple Selection Methods**: Native file picker, drag & drop modal, or React component
- 🎨 **Multi-format Support**: Images, Videos, Audio, Documents, Archives
- 🔍 **Automatic Type Detection**: Smart file type detection based on MIME types and extensions
- 📏 **Validation Rules**: File size limits, type restrictions, count constraints
- 🗜️ **Compression**: Automatic compression for images, videos (WebM via MediaRecorder), and audio
- 🖼️ **WebP Thumbnails**: Unified WebP thumbnail generation for all file types
- 🔄 **Format Conversion**: Convert between different formats (where supported)
- 📦 **Flexible Output**: Base64, Blob, File objects, and Object URLs
- ⚡ **Browser-based Processing**: Uses MediaRecorder API for video, FFmpeg.wasm for audio
- 📊 **Progress Tracking**: Real-time progress callbacks for all operations
- 🎯 **Drag & Drop Support**: Built-in dropzone functionality with react-dropzone

## Installation

```bash
npm install nextjs-media-helper
# or
yarn add nextjs-media-helper
```

## Quick Start

```typescript
import MediaHelper from 'nextjs-media-helper';

// Option 1: Native file picker
const processedFiles = await MediaHelper.pickMixed();

// Option 2: Dropzone modal
const processedFiles = await MediaHelper.pickWithDropzone();

// Option 3: React component
import { MediaDropzone } from 'nextjs-media-helper';
<MediaDropzone onFilesProcessed={(files) => console.log(files)} />
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

### Dropzone Modal

```typescript
import MediaHelper, { RuleType } from 'nextjs-media-helper';

// Open dropzone modal with drag & drop support
const files = await MediaHelper.pickWithDropzone({
  dropzoneText: 'Drag your files here or click to browse',
  rules: [{
    type: RuleType.IMAGE,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    compressQuality: 80
  }],
  onProgress: (progress) => {
    console.log(`${progress.percentage}% - ${progress.stage}`);
  }
});

// With custom styling
const files = await MediaHelper.pickWithDropzone({
  dropzoneClassName: 'my-custom-dropzone',
  dropzoneText: 'Drop images here'
});
```

### React Dropzone Component

```tsx
import React, { useState } from 'react';
import { MediaDropzone, ProcessedFile, RuleType } from 'nextjs-media-helper';

const MyComponent: React.FC = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [error, setError] = useState<string>('');

  return (
    <MediaDropzone
      options={{
        rules: [{
          type: RuleType.IMAGE,
          maxFileSize: 10 * 1024 * 1024,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
        }],
        onProgress: (progress) => {
          console.log(`Processing: ${progress.percentage}%`);
        }
      }}
      onFilesProcessed={setFiles}
      onError={(err) => setError(err.message)}
      className="border-2 border-dashed border-gray-300 rounded-lg p-8"
      activeClassName="border-blue-500"
      acceptClassName="border-green-500"
      rejectClassName="border-red-500"
    >
      <div className="text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="mt-2 text-sm text-gray-600">
          Drop files here or click to select
        </p>
        <p className="text-xs text-gray-500">
          PNG, JPG, WEBP up to 10MB
        </p>
      </div>
    </MediaDropzone>
  );
};
```

### Dropzone with Turkish Texts

```tsx
<MediaDropzone
  options={{
    rules: [{
      type: RuleType.IMAGE,
      maxFileSize: 5 * 1024 * 1024
    }]
  }}
  onFilesProcessed={setFiles}
  texts={{
    dragActive: 'Dosyaları buraya bırakın...',
    dragInactive: 'Dosyaları sürükleyin veya seçmek için tıklayın',
    processing: 'İşleniyor...',
    error: 'Hata oluştu'
  }}
  className="border-2 border-dashed border-gray-300 rounded-lg p-8"
/>
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
  
  if (file.processed.url) {
    console.log('Object URL available:', file.processed.url);
    // Remember to revoke URLs when done: URL.revokeObjectURL(file.processed.url)
  }
  
  if (file.thumbnail) {
    console.log('WebP thumbnail generated');
    // All thumbnails are in WebP format
    if (file.thumbnail.url) {
      console.log('Thumbnail URL:', file.thumbnail.url);
    }
  }
});
```

### Progress Tracking

```typescript
import MediaHelper, { RuleType } from 'nextjs-media-helper';

const files = await MediaHelper.pickMixed({
  multiple: true,
  rules: [{
    type: RuleType.VIDEO,
    compressQuality: 80
  }],
  onProgress: (progress) => {
    console.log(`Processing ${progress.fileName}`);
    console.log(`File ${progress.currentFile} of ${progress.totalFiles}`);
    console.log(`Stage: ${progress.stage}`);
    console.log(`Progress: ${progress.percentage}%`);
    
    // Update UI
    updateProgressBar(progress.percentage);
    updateStatusText(`${progress.stage}: ${progress.fileName}`);
  }
});

// Progress stages:
// - 'validating': File validation
// - 'compressing': Compression (if enabled)
// - 'generating-thumbnail': Thumbnail generation
// - 'processing': General processing
// - 'completed': File processing completed
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
  const [progress, setProgress] = useState<number>(0);
  const [currentFile, setCurrentFile] = useState<string>('');

  const handleFileSelect = async () => {
    setLoading(true);
    setProgress(0);
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
        ],
        onProgress: (progressInfo) => {
          setProgress(progressInfo.percentage);
          setCurrentFile(`${progressInfo.stage}: ${progressInfo.fileName}`);
        }
      });
      
      setFiles(processed);
    } catch (error) {
      console.error('Processing failed:', error);
    } finally {
      setLoading(false);
      setProgress(100);
    }
  };

  return (
    <div>
      <button onClick={handleFileSelect} disabled={loading}>
        {loading ? 'Processing...' : 'Select Files'}
      </button>
      
      {loading && (
        <div className="progress">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
          <span>{currentFile}</span>
        </div>
      )}
      
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
  - `onProgress`: Progress callback function (optional)

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

##### `MediaHelper.pickWithDropzone(options?)`
Opens a modal with drag & drop support for file selection.

**Parameters:**
- `options`: Optional configuration object (extends SelectionOptions)
  - `dropzoneText`: String - Custom text to display in dropzone
  - `dropzoneClassName`: String - Custom CSS class for dropzone styling
  - All SelectionOptions parameters

**Returns:** `Promise<ProcessedFile[]>`

##### `MediaHelper.processFilesDirectly(files, options?)`
Process files directly without file picker (useful for custom implementations).

**Parameters:**
- `files`: Array of File objects to process
- `options`: SelectionOptions object

**Returns:** `Promise<ProcessedFile[]>`

### React Components

#### MediaDropzone

A React component that provides drag & drop file selection with built-in processing.

**Props:**
- `options?: SelectionOptions` - File processing options
- `onFilesProcessed: (files: ProcessedFile[]) => void` - Callback when files are processed
- `onError?: (error: Error) => void` - Error callback
- `onProgress?: (progress: ProgressInfo) => void` - Progress callback
- `dropzoneOptions?: DropzoneOptions` - react-dropzone options
- `className?: string` - CSS class for root element
- `activeClassName?: string` - CSS class when dragging
- `acceptClassName?: string` - CSS class when file will be accepted
- `rejectClassName?: string` - CSS class when file will be rejected
- `disabledClassName?: string` - CSS class when disabled
- `children?: React.ReactNode` - Custom content
- `disabled?: boolean` - Disable the dropzone

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

#### ProgressInfo Interface
```typescript
interface ProgressInfo {
  currentFile: number;    // Current file index (1-based)
  totalFiles: number;     // Total number of files
  fileName: string;       // Name of the file being processed
  stage: 'validating' | 'compressing' | 'generating-thumbnail' | 'processing' | 'completed';
  percentage: number;     // Overall progress percentage (0-100)
}
```

#### SelectionOptions Interface
```typescript
interface SelectionOptions {
  rules?: RuleInfo[];
  onProgress?: (progress: ProgressInfo) => void;
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
    url?: string;  // Object URL (remember to revoke when done)
  };
  thumbnail?: {
    base64?: string;
    blob?: Blob;
    file?: File;
    url?: string;  // Object URL (remember to revoke when done)
  };
}
```

## Supported File Types

### Images
- JPEG, PNG, GIF, BMP, TIFF, WebP, SVG, ICO, AVIF, HEIC, HEIF

### Videos
- MP4, WebM, AVI, MKV, MOV, FLV, WMV, OGG, MPEG, TS, M4V
- **Note**: Video compression outputs WebM format using MediaRecorder API

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
- Video compression uses MediaRecorder API (WebM output)
- Audio processing uses FFmpeg.wasm (loaded on-demand)
- Image compression uses browser-image-compression library
- Progress callbacks help track long-running operations
- Object URLs should be revoked after use to prevent memory leaks
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

## URL Management

Remember to clean up Object URLs when you're done using them:

```typescript
const files = await MediaHelper.pickMixed();

// Use the URLs
files.forEach(file => {
  if (file.processed.url) {
    // Use the URL (e.g., as img src)
    console.log(file.processed.url);
  }
});

// Clean up when done
files.forEach(file => {
  if (file.processed.url) {
    URL.revokeObjectURL(file.processed.url);
  }
  if (file.thumbnail?.url) {
    URL.revokeObjectURL(file.thumbnail.url);
  }
});
```

## Notes

- All thumbnails are generated in WebP format for consistency and performance
- Video compression outputs WebM format using MediaRecorder API
- Document format conversion requires server-side processing
- Archive extraction not implemented (use JSZip or similar)
- Cancel file selection returns empty array, not an error
- Object URLs are created for processed files and thumbnails - remember to revoke them

## License

MIT

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.