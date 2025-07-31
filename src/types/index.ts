
// ** Media File Information Types **
/**
 * Base interface for all media file information.
 * Contains common properties shared across all media types (images, videos, audio).
 */
export interface MediaFileInfo {
  /**
   * The filename including extension.
   * @example 'vacation-photo.jpg', 'presentation.mp4'
   */
  name: string;

  /**
   * File size in bytes.
   * Used for validation, upload progress, and storage calculations.
   * @example 1048576 (1MB)
   */
  size: number;

  /**
   * MIME type of the file.
   * Used for content type headers and file type validation.
   * @example 'image/jpeg', 'video/mp4', 'audio/mpeg'
   */
  type: string;

  /**
   * File extension without the dot.
   * Extracted from filename for quick type identification.
   * @example 'jpg', 'mp4', 'mp3'
   */
  extension: string;

  /**
   * MIME type of the file (duplicate of 'type' for compatibility).
   * Some APIs expect 'mimeType' instead of 'type'.
   * @example 'image/jpeg', 'video/mp4'
   */
  mimeType: string;

  /**
   * Unix timestamp of when the file was last modified.
   * Optional as it may not be available for all sources (e.g., blob URLs).
   * @example 1634567890000
   */
  lastModified?: number;
}

/**
 * Extended interface for image files.
 * Includes all MediaFileInfo properties plus image-specific metadata.
 */
export interface ImageInfo extends MediaFileInfo {
  /**
   * Image width in pixels.
   * Used for layout calculations and responsive image sizing.
   * @example 1920
   */
  width: number;

  /**
   * Image height in pixels.
   * Used for layout calculations and responsive image sizing.
   * @example 1080
   */
  height: number;

  /**
   * Aspect ratio calculated as width divided by height.
   * Useful for maintaining proportions during resizing.
   * @example 1.7778 (16:9 ratio)
   */
  aspectRatio: number;

  /**
   * Image orientation based on aspect ratio.
   * - 'portrait': height > width
   * - 'landscape': width > height
   * - 'square': width === height
   */
  orientation?: 'portrait' | 'landscape' | 'square';
}

/**
 * Extended interface for video files.
 * Includes all MediaFileInfo properties plus video-specific metadata.
 */
export interface VideoInfo extends MediaFileInfo {
  /**
   * Video duration in seconds.
   * May not be available until video metadata is loaded.
   * @example 120.5 (2 minutes and 0.5 seconds)
   */
  duration?: number;

  /**
   * Video width in pixels.
   * Resolution information for player sizing and quality assessment.
   * @example 1920
   */
  width?: number;

  /**
   * Video height in pixels.
   * Resolution information for player sizing and quality assessment.
   * @example 1080
   */
  height?: number;

  /**
   * Frames per second (FPS).
   * Indicates video smoothness and quality.
   * @example 30, 60, 24
   */
  frameRate?: number;

  /**
   * Video bitrate in bits per second.
   * Indicates video quality and compression level.
   * @example 5000000 (5 Mbps)
   */
  bitRate?: number;
}

/**
 * Extended interface for audio files.
 * Includes all MediaFileInfo properties plus audio-specific metadata.
 */
export interface AudioInfo extends MediaFileInfo {
  /**
   * Audio duration in seconds.
   * Used for playback controls and timeline display.
   * @example 180.5 (3 minutes and 0.5 seconds)
   */
  duration?: number;

  /**
   * Audio bitrate in bits per second.
   * Higher bitrates generally mean better quality.
   * @example 320000 (320 kbps)
   */
  bitRate?: number;

  /**
   * Sample rate in Hz.
   * Number of audio samples per second.
   * @example 44100 (CD quality), 48000 (professional audio)
   */
  sampleRate?: number;

  /**
   * Number of audio channels.
   * 1 = mono, 2 = stereo, 6 = 5.1 surround, etc.
   * @example 2 (stereo)
   */
  channels?: number;
}







// ** Media Processing and Validation Types **
/**
 * Options for image processing and transformation.
 * Used when resizing, converting, or applying effects to images.
 */
export interface ImageProcessingOptions {
  /**
   * Target width in pixels.
   * If only width is specified, height is calculated to maintain aspect ratio.
   * @example 800
   */
  width?: number;

  /**
   * Target height in pixels.
   * If only height is specified, width is calculated to maintain aspect ratio.
   * @example 600
   */
  height?: number;

  /**
   * Output quality for lossy formats (0-100).
   * Higher values mean better quality but larger file sizes.
   * @default 80
   * @example 90
   */
  quality?: number;

  /**
   * Output image format.
   * - 'jpeg': Best for photos, lossy compression
   * - 'png': Best for graphics with transparency, lossless
   * - 'webp': Modern format with good compression
   * - 'avif': Next-gen format with excellent compression
   */
  format?: 'jpeg' | 'png' | 'webp' | 'avif';

  /**
   * How the image should be resized to fit the dimensions.
   * - 'cover': Fills the area, cropping if necessary
   * - 'contain': Fits entire image, may add letterboxing
   * - 'fill': Stretches to fill, may distort
   * - 'inside': Resize to fit inside dimensions
   * - 'outside': Resize to cover dimensions
   */
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';

  /**
   * Background color for transparent areas.
   * Used when converting from transparent formats to non-transparent.
   * @example '#ffffff', 'rgb(255,255,255)', 'white'
   */
  background?: string;

  /**
   * Blur radius in pixels.
   * Applies Gaussian blur effect to the image.
   * @example 5
   */
  blur?: number;

  /**
   * Convert image to grayscale.
   * Removes all color information from the image.
   * @default false
   */
  grayscale?: boolean;

  /**
   * Rotation angle in degrees (clockwise).
   * Supports 90, 180, 270, or arbitrary angles.
   * @example 90, -45
   */
  rotate?: number;
}

/**
 * Options for video processing and conversion.
 * Used when transcoding, resizing, or trimming videos.
 */
export interface VideoProcessingOptions {
  /**
   * Target video width in pixels.
   * Maintains aspect ratio if height is not specified.
   * @example 1280
   */
  width?: number;

  /**
   * Target video height in pixels.
   * Maintains aspect ratio if width is not specified.
   * @example 720
   */
  height?: number;

  /**
   * Output video container format.
   * - 'mp4': Most compatible, H.264/H.265 codec
   * - 'webm': Web-optimized, VP8/VP9 codec
   * - 'avi': Legacy format, various codecs
   */
  format?: 'mp4' | 'webm' | 'avi';

  /**
   * Video codec to use for encoding.
   * Common values: 'h264', 'h265', 'vp8', 'vp9', 'av1'
   * @example 'h264'
   */
  codec?: string;

  /**
   * Target bitrate for video encoding.
   * Can be specified with units: '5M', '5000k', '5000000'
   * @example '2M' (2 Mbps)
   */
  bitrate?: string;

  /**
   * Target frames per second.
   * Common values: 24, 25, 30, 60
   * @example 30
   */
  fps?: number;

  /**
   * Start time for trimming in seconds.
   * Cuts video from this timestamp.
   * @example 10.5 (start at 10.5 seconds)
   */
  startTime?: number;

  /**
   * Duration to extract in seconds.
   * Used with startTime for trimming segments.
   * @example 30 (extract 30 seconds)
   */
  duration?: number;
}


// *** Media Validation and Error Handling Types **
/**
 * Options for validating media files before processing or upload.
 * Helps ensure files meet application requirements.
 */
export interface MediaValidationOptions {
  /**
   * Maximum file size in bytes.
   * Prevents uploading files that are too large.
   * @example 10485760 (10MB)
   */
  maxSize?: number;

  /**
   * Array of allowed MIME types.
   * Restricts file uploads to specific formats.
   * @example ['image/jpeg', 'image/png', 'video/mp4']
   */
  allowedTypes?: string[];

  /**
   * Minimum width in pixels (for images/videos).
   * Ensures media meets minimum resolution requirements.
   * @example 800
   */
  minWidth?: number;

  /**
   * Maximum width in pixels (for images/videos).
   * Prevents excessively large images.
   * @example 4096
   */
  maxWidth?: number;

  /**
   * Minimum height in pixels (for images/videos).
   * Ensures media meets minimum resolution requirements.
   * @example 600
   */
  minHeight?: number;

  /**
   * Maximum height in pixels (for images/videos).
   * Prevents excessively large images.
   * @example 4096
   */
  maxHeight?: number;

  /**
   * Minimum duration in seconds (for videos/audio).
   * Prevents uploading clips that are too short.
   * @example 1
   */
  minDuration?: number;

  /**
   * Maximum duration in seconds (for videos/audio).
   * Prevents uploading files that are too long.
   * @example 300 (5 minutes)
   */
  maxDuration?: number;
}

/**
 * Standardized error interface for media processing failures.
 * Provides consistent error handling across the application.
 */
export interface MediaError {
  /**
   * Error code for programmatic error handling.
   * @example 'FILE_TOO_LARGE', 'UNSUPPORTED_FORMAT', 'PROCESSING_FAILED'
   */
  code: string;

  /**
   * Human-readable error message.
   * Can be displayed to end users.
   * @example 'File size exceeds the maximum allowed limit of 10MB'
   */
  message: string;

  /**
   * Additional error context or metadata.
   * May include validation details, original error objects, etc.
   * @example { actualSize: 15728640, maxSize: 10485760 }
   */
  details?: any;
}

/**
 * Enumeration of supported media types.
 * Used for type-specific processing and validation.
 * - 'image': JPEG, PNG, GIF, WebP, etc.
 * - 'video': MP4, WebM, AVI, MOV, etc.
 * - 'audio': MP3, WAV, OGG, AAC, etc.
 * - 'unknown': Unrecognized or unsupported file types
 */
export type MediaType = 'image' | 'video' | 'audio' | 'unknown';

/**
 * Result of converting media to Base64 format.
 * Useful for embedding media in JSON or displaying inline.
 */
export interface Base64Result {
  /**
   * Base64-encoded string of the media file.
   * Can be used in data URLs: `data:${mimeType};base64,${base64}`
   * @example 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
   */
  base64: string;

  /**
   * MIME type of the encoded media.
   * Required for creating valid data URLs.
   * @example 'image/png'
   */
  mimeType: string;

  /**
   * Original file size in bytes before encoding.
   * Note: Base64 encoding increases size by ~33%.
   * @example 1024
   */
  size: number;
}

/**
 * Result of converting media to Blob format.
 * Useful for file uploads and browser-based processing.
 */
export interface BlobResult {
  /**
   * Blob object containing the media data.
   * Can be used with File API, FormData, or object URLs.
   */
  blob: Blob;

  /**
   * MIME type of the blob data.
   * Used for Content-Type headers and type validation.
   * @example 'video/mp4'
   */
  mimeType: string;

  /**
   * Size of the blob in bytes.
   * Useful for upload progress and validation.
   * @example 2048576
   */
  size: number;
}

/**
 * Options for generating thumbnails from images or videos.
 * Creates smaller preview versions of media files.
 */
export interface ThumbnailOptions {
  /**
   * Thumbnail width in pixels.
   * Should be significantly smaller than source for performance.
   * @example 200
   */
  width: number;

  /**
   * Thumbnail height in pixels.
   * Should be significantly smaller than source for performance.
   * @example 150
   */
  height: number;

  /**
   * Output quality for lossy formats (0-100).
   * Lower quality acceptable for thumbnails to reduce size.
   * @default 70
   * @example 80
   */
  quality?: number;

  /**
   * Output format for thumbnail.
   * - 'jpeg': Smallest file size, no transparency
   * - 'png': Supports transparency, larger files
   * - 'webp': Good compression with optional transparency
   * @default 'jpeg'
   */
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Progress information for media processing operations.
 * Used to display progress bars for uploads, conversions, and other processing tasks.
 */
export interface MediaProcessingProgress {
  /**
   * Number of bytes processed so far.
   * Updates continuously during processing operations.
   * @example 512000
   */
  loaded: number;

  /**
   * Total file size in bytes.
   * Remains constant during processing.
   * @example 1048576
   */
  total: number;

  /**
   * Processing progress as a percentage (0-100).
   * Calculated as (loaded / total) * 100.
   * @example 48.8
   */
  percentage: number;
}

/**
 * Callback function type for handling processing progress updates.
 * Called periodically during media processing operations to update UI.
 * @param progress - Current processing progress information
 * @example
 * const handleProgress: MediaProcessingCallback = (progress) => {
 *   console.log(`Processing ${progress.percentage}% complete`);
 *   setProcessingProgress(progress.percentage);
 * };
 */
export type MediaProcessingCallback = (progress: MediaProcessingProgress) => void;