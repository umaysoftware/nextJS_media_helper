# NextJS Media Helper

A powerful and flexible media file processing library for React and Next.js applications. Handle images, videos, audio files, documents, and archives with ease - featuring compression, thumbnail generation, format conversion, and comprehensive validation.

[![npm version](https://img.shields.io/npm/v/nextjs-media-helper.svg)](https://www.npmjs.com/package/nextjs-media-helper)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## ✨ Features

- 🎯 **Multi-format Support** - Images, videos, audio, documents, and archives
- 🖼️ **Smart Thumbnails** - Automatic thumbnail generation for all media types
- 🗜️ **Compression** - Built-in compression for images and videos
- 🔄 **Format Conversion** - Convert between different media formats
- 📏 **Validation** - Comprehensive file validation with custom rules
- 🎨 **Drag & Drop** - Beautiful React dropzone component
- 📊 **Progress Tracking** - Real-time processing progress updates
- 🌍 **i18n Ready** - Full internationalization support
- 💪 **TypeScript** - Fully typed for excellent DX
- ⚡ **Lightweight** - Zero dependencies for core functionality

## 📦 Installation

```bash
npm install nextjs-media-helper
# or
yarn add nextjs-media-helper
# or
pnpm add nextjs-media-helper
```

## 🚀 Quick Start

```typescript
import MediaHelper, { MediaDropzone } from 'nextjs-media-helper';

// Option 1: Native file picker
const files = await MediaHelper.pickMixed({
  rules: [{
    allowedMimeTypes: ['image/*'],
    maxFileSize: 10 * 1024 * 1024 // 10MB
  }]
});

// Option 2: React Dropzone Component
<MediaDropzone
  onFilesProcessed={(files) => console.log(files)}
  options={{
    rules: [{
      allowedMimeTypes: ['image/*', 'video/*'],
      maxFileSize: 50 * 1024 * 1024
    }]
  }}
/>
```

## 📖 Usage Examples

### Basic File Selection

```typescript
import MediaHelper from 'nextjs-media-helper';

// Pick any files
const files = await MediaHelper.pickMixed();

// Pick with validation rules
const files = await MediaHelper.pickMixed({
  rules: [{
    allowedMimeTypes: ['image/jpeg', 'image/png'],
    minFileSize: 1024,        // 1KB minimum
    maxFileSize: 5242880,     // 5MB maximum
    maxSelectionCount: 10     // Max 10 files
  }]
});
```

### Image Processing

```typescript
const images = await MediaHelper.pickMixed({
  rules: [{
    allowedMimeTypes: ['image/*'],
    maxFileSize: 10 * 1024 * 1024,
    
    // Image-specific options
    processedCompressQuality: 80,  // Compress to 80% quality
    processedFormat: 'webp',       // Convert to WebP
    thumbnailCompressQuality: 60,  // Thumbnail at 60% quality
    thumbnailFormat: 'jpeg',       // Thumbnail as JPEG
    
    // Output options
    willGenerateBase64: true,      // Generate base64 string
    willGenerateBlob: true         // Generate blob object
  }]
});
```

### Video Processing

```typescript
const videos = await MediaHelper.pickMixed({
  rules: [{
    allowedMimeTypes: ['video/*'],
    maxFileSize: 100 * 1024 * 1024,
    
    // Video-specific options
    startAt: 2,                    // Thumbnail from 2nd second
    duration: 10,                  // Extract 10-second clip
    processedCompressQuality: 70,  // 70% quality compression
    processedFormat: 'webm'        // Convert to WebM
  }]
});
```

### Audio Processing

```typescript
const audioFiles = await MediaHelper.pickMixed({
  rules: [{
    allowedMimeTypes: ['audio/*'],
    maxFileSize: 20 * 1024 * 1024,
    
    // Audio-specific options
    startAt: 0,                    // Start from beginning
    duration: 30,                  // 30-second preview
    processedFormat: 'mp3'         // Convert to MP3
  }]
});
```

### React Dropzone Component

```tsx
import React, { useState } from 'react';
import { MediaDropzone, ProcessedFile, UnProcessedFile } from 'nextjs-media-helper';

function MyComponent() {
  const [files, setFiles] = useState([]);

  const handleFiles = (results) => {
    // Separate processed and failed files
    const processed = results.filter(f => f.processType === 'processed');
    const failed = results.filter(f => f.processType === 'unprocessed');
    
    console.log('Success:', processed);
    console.log('Failed:', failed);
    
    setFiles(processed);
  };

  return (
    <MediaDropzone
      onFilesProcessed={handleFiles}
      options={{
        rules: [{
          allowedMimeTypes: ['image/*', 'video/*'],
          maxFileSize: 50 * 1024 * 1024,
          maxSelectionCount: 5
        }]
      }}
      icon={
        <svg className="w-12 h-12" fill="none" stroke="currentColor">
          {/* Your icon SVG */}
        </svg>
      }
      texts={{
        dragActive: 'Drop files here...',
        dragInactive: 'Drag & drop or click to browse',
        subDesc: 'Images and videos up to 50MB',
        processing: 'Processing files...'
      }}
    />
  );
}
```

### Internationalization

```tsx
<MediaDropzone
  onFilesProcessed={handleFiles}
  texts={{
    dragActive: 'Dosyaları buraya bırakın...',
    dragInactive: 'Sürükle bırak veya seçmek için tıkla',
    subDesc: 'Maksimum 50MB resim ve video',
    processing: 'Dosyalar işleniyor...',
    stages: {
      validating: 'Doğrulanıyor...',
      compressing: 'Sıkıştırılıyor...',
      'generating-thumbnail': 'Önizleme oluşturuluyor...',
      processing: 'İşleniyor...',
      completed: 'Tamamlandı!'
    }
  }}
/>
```

### Progress Tracking

```typescript
const files = await MediaHelper.pickMixed({
  rules: [/* your rules */],
  onProgress: (progress) => {
    console.log(`Processing ${progress.fileName}`);
    console.log(`Stage: ${progress.stage}`);
    console.log(`Progress: ${progress.percentage}%`);
    console.log(`File ${progress.currentFile} of ${progress.totalFiles}`);
  }
});
```

### Multiple File Type Rules

```typescript
const files = await MediaHelper.pickMixed({
  rules: [
    {
      // Images
      allowedMimeTypes: ['image/*'],
      maxFileSize: 10 * 1024 * 1024,
      processedCompressQuality: 85,
      processedFormat: 'webp'
    },
    {
      // Videos
      allowedMimeTypes: ['video/*'],
      maxFileSize: 100 * 1024 * 1024,
      startAt: 1,
      processedFormat: 'webm'
    },
    {
      // Documents
      allowedMimeTypes: ['application/pdf', 'application/msword'],
      maxFileSize: 5 * 1024 * 1024
    }
  ]
});
```

## 📊 Response Structure

### ProcessedFile

Successfully processed files return this structure:

```typescript
{
  processType: 'processed',
  meta: {
    name: string,          // Original filename
    size: number,          // Original file size
    type: string,          // File type (image/video/audio/document/archive)
    extension: string,     // File extension
    mimeType: string       // MIME type
  },
  originalFile: File,      // Original File object
  processed: {
    name: string,
    size: number,
    type: string,
    extension: string,
    mimeType: string,
    file?: File,           // Processed file
    blob?: Blob,           // Blob object (if requested)
    base64?: string,       // Base64 string (if requested)
    url?: string           // Object URL for preview
  },
  thumbnail?: {            // Thumbnail (for images/videos)
    name: string,
    size: number,
    type: string,
    extension: string,
    mimeType: string,
    file?: File,
    url?: string
  }
}
```

### UnProcessedFile

Failed files return this structure:

```typescript
{
  processType: 'unprocessed',
  meta: {
    name: string,
    size: number,
    type: string,
    extension: string,
    mimeType: string
  },
  originalFile: File,
  reason: {
    fileName: string,
    errorCode: string,     // Error code for handling
    message: string        // Human-readable message
  }
}
```

## 🎨 Thumbnail Generation

The library automatically generates appropriate thumbnails:

- **Images** → Resized, compressed thumbnails
- **Videos** → Frame capture from specified timestamp
- **Audio** → Waveform visualization
- **Documents** → Icon with file type indicator
- **Archives** → Icon with file size display

## ⚙️ API Reference

### MediaHelper Methods

#### `MediaHelper.pickMixed(options?)`
Opens native file picker for any file type.

#### `MediaHelper.processFilesDirectly(files, options?)`
Process an array of File objects directly.

### MediaDropzone Props

| Prop | Type | Description |
|------|------|-------------|
| `options` | `SelectionOptions` | Processing rules and configuration |
| `onFilesProcessed` | `(files: (ProcessedFile \| UnProcessedFile)[]) => void` | Callback with results |
| `onError` | `(errors: FileError[]) => void` | Error callback |
| `onProgress` | `(progress: ProgressInfo) => void` | Progress callback |
| `dropzoneOptions` | `DropzoneOptions` | react-dropzone options |
| `texts` | `object` | UI text customization |
| `icon` | `ReactNode` | Custom icon component |
| `className` | `string` | CSS class for root element |
| `disabled` | `boolean` | Disable the dropzone |

### Rule Options

#### Common Rules (all file types)
```typescript
{
  allowedMimeTypes?: string[],    // e.g., ['image/*', 'video/mp4']
  minFileSize?: number,            // Minimum size in bytes
  maxFileSize?: number,            // Maximum size in bytes
  minSelectionCount?: number,      // Minimum files required
  maxSelectionCount?: number,      // Maximum files allowed
  willGenerateBase64?: boolean,    // Generate base64 output
  willGenerateBlob?: boolean       // Generate blob output
}
```

#### Image-Specific Rules
```typescript
{
  processedCompressQuality?: number,  // 0-100
  processedFormat?: 'jpeg' | 'png' | 'webp',
  thumbnailCompressQuality?: number,   // 0-100
  thumbnailFormat?: 'jpeg' | 'png' | 'webp'
}
```

#### Video-Specific Rules
```typescript
{
  startAt?: number,                    // Thumbnail timestamp (seconds)
  duration?: number,                   // Clip duration (seconds)
  processedCompressQuality?: number,   // 0-100
  processedFormat?: 'mp4' | 'webm' | 'avi'
}
```

#### Audio-Specific Rules
```typescript
{
  startAt?: number,                    // Preview start (seconds)
  duration?: number,                   // Preview duration (seconds)
  processedFormat?: 'wav' | 'mp3' | 'ogg' | 'opus'
}
```

## 🌍 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## 📝 License

MIT © [Your Name]

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🐛 Bug Reports

Found a bug? Please [open an issue](https://github.com/yourusername/nextjs-media-helper/issues) with:
- Description of the bug
- Steps to reproduce
- Expected behavior
- Screenshots (if applicable)
- Browser and version

## 💖 Support

If you find this library helpful, please consider:
- ⭐ Starring the repository
- 🐦 Sharing on Twitter
- 📝 Writing a blog post
- ☕ [Buying me a coffee](https://buymeacoffee.com/yourusername)

## 🔗 Links

- [NPM Package](https://www.npmjs.com/package/nextjs-media-helper)
- [GitHub Repository](https://github.com/yourusername/nextjs-media-helper)
- [Documentation](https://github.com/yourusername/nextjs-media-helper#readme)
- [Changelog](https://github.com/yourusername/nextjs-media-helper/blob/main/CHANGELOG.md)

---

Made with ❤️ by [Your Name](https://github.com/yourusername)