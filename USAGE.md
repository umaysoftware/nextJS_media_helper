# MediaHelper Kullanım Kılavuzu

## Kurulum

### NPM ile kurulum
```bash
npm install nextjs-media-helper
```

### Yarn ile kurulum
```bash
yarn add nextjs-media-helper
```

### Local olarak kullanım (development)
```bash
# Bu projede
npm run build

# Kullanacağınız projede
npm install ../path-to-nextjs-media-helper
```

## Temel Kullanım

### Import
```typescript
import { MediaHelper } from 'nextjs-media-helper';
import type { ProcessedFile, SelectionOptions } from 'nextjs-media-helper';
```

## Örnek Kullanımlar

### 1. Basit Resim Seçimi

```typescript
import { MediaHelper } from 'nextjs-media-helper';

const MyComponent = () => {
  const handleImagePick = async () => {
    try {
      const images = await MediaHelper.pickImage();
      console.log('Seçilen resimler:', images);
      
      // Her bir resim için
      images.forEach(image => {
        console.log('Dosya adı:', image.name);
        console.log('Boyut:', image.size);
        console.log('MIME tipi:', image.mimeType);
      });
    } catch (error) {
      console.error('Resim seçimi hatası:', error);
    }
  };

  return (
    <button onClick={handleImagePick}>Resim Seç</button>
  );
};
```

### 2. Gelişmiş Resim Seçimi (Kurallar ile)

```typescript
const handleAdvancedImagePick = async () => {
  const options: Partial<SelectionOptions> = {
    willGenerateBase64: true,
    willGenerateBlob: true,
    rules: {
      maxSelectionCount: 5,
      minSelectionCount: 1,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      minFileSize: 10 * 1024, // 10KB
      imageResolution: 'high',
      imageCompression: 'medium',
      thumbnailSize: 'medium',
      thumbnailFormat: 'jpeg',
      thumbnailQuality: 'high'
    }
  };

  try {
    const images = await MediaHelper.pickImage(options);
    
    images.forEach(image => {
      // Base64 kullanımı
      if (image.base64) {
        const imgElement = document.createElement('img');
        imgElement.src = image.base64;
        document.body.appendChild(imgElement);
      }
      
      // Thumbnail kullanımı
      if (image.thumbnail?.base64) {
        console.log('Thumbnail base64:', image.thumbnail.base64);
      }
    });
  } catch (error) {
    console.error('Hata:', error);
  }
};
```

### 3. Video Seçimi ve İşleme

```typescript
const handleVideoPick = async () => {
  const options: Partial<SelectionOptions> = {
    willGenerateBase64: false, // Video için base64 önerilmez
    willGenerateBlob: true,
    rules: {
      maxSelectionCount: 3,
      maxFileSize: 100 * 1024 * 1024, // 100MB
      videoDurationLimit: 300, // 5 dakika (saniye)
      videoResolution: 'high', // 1920x1080
      thumbnailSize: 'large'
    }
  };

  try {
    const videos = await MediaHelper.pickVideo(options);
    
    videos.forEach(video => {
      console.log('Video:', video.name);
      
      // Video blob URL oluştur
      if (video.blob) {
        const videoUrl = URL.createObjectURL(video.blob);
        const videoElement = document.createElement('video');
        videoElement.src = videoUrl;
        videoElement.controls = true;
        document.body.appendChild(videoElement);
      }
      
      // Video thumbnail
      if (video.thumbnail?.blob) {
        const thumbUrl = URL.createObjectURL(video.thumbnail.blob);
        console.log('Thumbnail URL:', thumbUrl);
      }
    });
  } catch (error) {
    console.error('Video seçimi hatası:', error);
  }
};
```

### 4. Ses Dosyası Seçimi

```typescript
const handleAudioPick = async () => {
  const options: Partial<SelectionOptions> = {
    rules: {
      maxSelectionCount: 10,
      maxFileSize: 20 * 1024 * 1024, // 20MB
      audioDurationLimit: 600, // 10 dakika
      audioSampleRate: 'high', // 48kHz
      thumbnailSize: 'medium' // Waveform görselleştirmesi
    }
  };

  try {
    const audioFiles = await MediaHelper.pickSound(options);
    
    audioFiles.forEach(audio => {
      console.log('Ses dosyası:', audio.name);
      
      // Audio player oluştur
      const audioUrl = URL.createObjectURL(audio.file);
      const audioElement = new Audio(audioUrl);
      audioElement.controls = true;
      
      // Waveform thumbnail
      if (audio.thumbnail?.base64) {
        console.log('Waveform görselleştirmesi:', audio.thumbnail.base64);
      }
    });
  } catch (error) {
    console.error('Ses dosyası seçimi hatası:', error);
  }
};
```

### 5. Genel Dosya Seçimi

```typescript
const handleFilePick = async () => {
  const options: SelectionOptions = {
    willGenerateFile: true,
    willGenerateBase64: false,
    willGenerateBlob: false,
    rules: {
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ],
      maxSelectionCount: 5,
      maxFileSize: 10 * 1024 * 1024 // 10MB
    }
  };

  try {
    const files = await MediaHelper.pickFile(options);
    
    files.forEach(file => {
      console.log('Dosya:', file.name);
      console.log('Tip:', file.mimeType);
      console.log('Boyut:', file.size);
    });
  } catch (error) {
    console.error('Dosya seçimi hatası:', error);
  }
};
```

### 6. React/Next.js Component Örneği

```tsx
import React, { useState } from 'react';
import { MediaHelper, ProcessedFile } from 'nextjs-media-helper';

const MediaUploader: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<ProcessedFile[]>([]);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async () => {
    setLoading(true);
    
    try {
      const images = await MediaHelper.pickImage({
        rules: {
          maxSelectionCount: 3,
          maxFileSize: 5 * 1024 * 1024,
          imageCompression: 'medium',
          thumbnailSize: 'small',
          thumbnailFormat: 'webp'
        },
        willGenerateBase64: true
      });
      
      setSelectedFiles(images);
    } catch (error) {
      alert('Resim seçimi başarısız: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="media-uploader">
      <button 
        onClick={handleImageUpload} 
        disabled={loading}
        className="upload-button"
      >
        {loading ? 'Yükleniyor...' : 'Resim Seç'}
      </button>

      <div className="selected-files">
        {selectedFiles.map((file, index) => (
          <div key={index} className="file-preview">
            {file.thumbnail?.base64 && (
              <img 
                src={file.thumbnail.base64} 
                alt={`Thumbnail ${file.name}`}
                className="thumbnail"
              />
            )}
            <div className="file-info">
              <p className="file-name">{file.name}</p>
              <p className="file-size">{formatFileSize(file.size)}</p>
              <p className="file-type">{file.mimeType}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MediaUploader;
```

### 7. Next.js API Route ile Kullanım

```typescript
// pages/api/upload.ts veya app/api/upload/route.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { ProcessedFile } from 'nextjs-media-helper';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { files } = req.body as { files: ProcessedFile[] };
    
    // Dosyaları işle
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        // Base64'ü buffer'a çevir
        if (file.base64) {
          const base64Data = file.base64.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          
          // Dosyayı kaydet veya cloud'a yükle
          // await saveToStorage(buffer, file.name);
        }
        
        return {
          name: file.name,
          size: file.size,
          type: file.mimeType
        };
      })
    );
    
    res.status(200).json({ success: true, files: uploadedFiles });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
}
```

## Özel İşlemciler (Processors) Kullanımı

```typescript
import { ImageProcessor, VideoProcessor, AudioProcessor } from 'nextjs-media-helper';

// Resim metadata bilgisi alma
const getImageInfo = async (file: File) => {
  const info = await ImageProcessor.getImageInfo(file);
  console.log('Genişlik:', info.width);
  console.log('Yükseklik:', info.height);
  console.log('En-boy oranı:', info.aspectRatio);
  console.log('Megapiksel:', info.megapixels);
};

// Video metadata bilgisi alma
const getVideoInfo = async (file: File) => {
  const info = await VideoProcessor.getVideoMetadata(file);
  console.log('Süre:', info.duration, 'saniye');
  console.log('Çözünürlük:', `${info.width}x${info.height}`);
  console.log('En-boy oranı:', info.aspectRatio);
};

// Ses metadata bilgisi alma
const getAudioInfo = async (file: File) => {
  const info = await AudioProcessor.getAudioInfo(file);
  console.log('Süre:', info.duration, 'saniye');
  console.log('Sample rate:', info.sampleRate, 'Hz');
  console.log('Kanal sayısı:', info.channels);
  console.log('Bitrate:', info.bitrate);
};
```

## Hata Yönetimi

```typescript
try {
  const images = await MediaHelper.pickImage({
    rules: {
      maxSelectionCount: 5,
      maxFileSize: 5 * 1024 * 1024,
      imageResolution: 'high'
    }
  });
} catch (error) {
  if (error.message.includes('No files selected')) {
    console.log('Kullanıcı dosya seçmedi');
  } else if (error.message.includes('exceeds')) {
    console.log('Dosya boyutu veya sayısı limiti aşıldı');
  } else if (error.message.includes('Invalid')) {
    console.log('Geçersiz dosya tipi');
  } else {
    console.error('Beklenmeyen hata:', error);
  }
}
```

## TypeScript Tip Tanımlamaları

```typescript
import type { 
  SelectionOptions, 
  ProcessedFile, 
  SelectionFile 
} from 'nextjs-media-helper';

// Component props
interface MediaPickerProps {
  onFilesSelected: (files: ProcessedFile[]) => void;
  options?: Partial<SelectionOptions>;
}

// State
interface MediaState {
  files: ProcessedFile[];
  loading: boolean;
  error: string | null;
}
```

## Notlar

- Bu modül sadece tarayıcı ortamında çalışır (browser-only)
- Büyük video dosyaları için base64 kullanmaktan kaçının
- Thumbnail oluşturma işlemi ek süre alabilir
- Dosya boyutu limitleri byte cinsinden belirtilmelidir
- MIME type kontrolü tarayıcı tarafından yapılır, güvenlik için sunucu tarafında da kontrol edilmelidir