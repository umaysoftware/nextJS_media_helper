
export interface SelectionMediaFile {
  name: string;
  size: number;
  type: string;
  extension: string;
  mimeType: string;
}

export interface RuleInfo {
  allowedMimeTypes?: string[]; // Allowed MIME types for the files
  minSelectionCount?: number; // Minimum number of files that must be selected
  maxSelectionCount?: number; // Maximum number of files that can be selected
  maxFileSize?: number; // Maximum size of a single file in bytes
  minFileSize?: number; // Minimum size of a single file in bytes

  // for video files
  videoDurationLimit?: number; // Maximum duration of video files in seconds
  videoResolution?: 'low' | 'medium' | 'high'; // Resolution of the video files
  videoBitrate?: 'low' | 'medium' | 'high'; // Bitrate of the video files
  videoFrameRate?: 'low' | 'medium' | 'high'; // Frame rate of the video files

  // for audio files
  audioDurationLimit?: number; // Maximum duration of audio files in seconds
  audioBitrate?: 'low' | 'medium' | 'high'; // Bitrate of the audio files
  audioSampleRate?: 'low' | 'medium' | 'high'; // Sample rate of the audio files

  // for image files
  imageResolution?: 'low' | 'medium' | 'high'; // Resolution of the image files
  imageCompression?: 'low' | 'medium' | 'high'; // Compression level of the image files
  imageColorDepth?: 'low' | 'medium' | 'high'; // Color depth of the image files
  imageAspectRatio?: 'square' | 'landscape' | 'portrait'; // Aspect ratio of the image files

  // for thubnail files
  thumbnailSize?: 'small' | 'medium' | 'large'; // Size of the thumbnail files
  thumbnailFormat?: 'jpeg' | 'png' | 'webp'; // Format of the thumbnail files
  thumbnailQuality?: 'low' | 'medium' | 'high'; // Quality of the thumbnail files
  thumbnailAspectRatio?: 'square' | 'landscape' | 'portrait'; // Aspect ratio of the thumbnail files
}

export interface SelectionOptionsInfo {
  willGenerateBase64?: boolean; // Whether to generate Base64 encoded string for the file
  willGenerateBlob?: boolean; // Whether to generate Blob object for the file
  willGenerateFile?: boolean; // Whether to generate File object for the file
  rules?: RuleInfo; // Rules for file selection
}

export interface ProcessedMediaFile {
  name: string; // The name of the file
  size: number; // The size of the file in bytes
  type: string; // The type of the file (e.g., image, video, audio, document, archive)
  extension: string; // The file extension (e.g., .jpg, .mp4, .mp3, .pdf, .zip)
  mimeType: string; // The MIME type of the file (e.g., image/jpeg, video/mp4, audio/mpeg, application/pdf, application/zip)

  file: File; // The file as a File object
  blob?: Blob; // The file as a Blob object
  base64?: string; // The file as a Base64 encoded string

  thumbnail?: ProcessedMediaFile; // Thumbnail for the file, if applicable
}



