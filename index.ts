import { SelectionOptions, ProcessedFile } from './src/types';

export class MediaHelper {
  private static readonly IMAGE_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff'
  ];

  private static readonly VIDEO_MIME_TYPES = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
    'video/webm',
    'video/ogg',
    'video/3gpp',
    'video/3gpp2'
  ];

  private static readonly AUDIO_MIME_TYPES = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/wave',
    'audio/ogg',
    'audio/webm',
    'audio/aac',
    'audio/flac',
    'audio/x-m4a',
    'audio/mp4'
  ];

  static async pickFile(selectionOptions: SelectionOptions): Promise<ProcessedFile[]> {
    // TODO: Implement file picking logic
    return [];
  }

  static async pickImage(selectionOptions?: Partial<SelectionOptions>): Promise<ProcessedFile[]> {
    const options: SelectionOptions = {
      ...selectionOptions,
      rules: {
        ...selectionOptions?.rules,
        allowedMimeTypes: MediaHelper.IMAGE_MIME_TYPES
      }
    };
    return MediaHelper.pickFile(options);
  }

  static async pickVideo(selectionOptions?: Partial<SelectionOptions>): Promise<ProcessedFile[]> {
    const options: SelectionOptions = {
      ...selectionOptions,
      rules: {
        ...selectionOptions?.rules,
        allowedMimeTypes: MediaHelper.VIDEO_MIME_TYPES
      }
    };
    return MediaHelper.pickFile(options);
  }

  static async pickSound(selectionOptions?: Partial<SelectionOptions>): Promise<ProcessedFile[]> {
    const options: SelectionOptions = {
      ...selectionOptions,
      rules: {
        ...selectionOptions?.rules,
        allowedMimeTypes: MediaHelper.AUDIO_MIME_TYPES
      }
    };
    return MediaHelper.pickFile(options);
  }
}

export * from './src/types';