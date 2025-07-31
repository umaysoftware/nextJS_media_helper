import { SelectionOptions, ProcessedFile } from './src/types';
import { FileProcessor } from './src/processors/file.processor';
import { ImageProcessor } from './src/processors/image.processor';
import { VideoProcessor } from './src/processors/video.processor';
import { AudioProcessor } from './src/processors/audio.processor';

export class MediaHelper {
  static async pickFile(selectionOptions: SelectionOptions): Promise<ProcessedFile[]> {
    return FileProcessor.selectAndProcess(selectionOptions);
  }

  static async pickImage(selectionOptions?: Partial<SelectionOptions>): Promise<ProcessedFile[]> {
    const options: SelectionOptions = {
      willGenerateFile: true,
      ...selectionOptions
    };

    const files = await FileProcessor.selectAndProcess(
      options,
      'image/*'
    );

    return ImageProcessor.processImageFiles(files.map(f => f.file), options);
  }

  static async pickVideo(selectionOptions?: Partial<SelectionOptions>): Promise<ProcessedFile[]> {
    const options: SelectionOptions = {
      willGenerateFile: true,
      ...selectionOptions
    };

    const files = await FileProcessor.selectAndProcess(
      options,
      'video/*'
    );

    return VideoProcessor.processVideoFiles(files.map(f => f.file), options);
  }

  static async pickSound(selectionOptions?: Partial<SelectionOptions>): Promise<ProcessedFile[]> {
    const options: SelectionOptions = {
      willGenerateFile: true,
      ...selectionOptions
    };

    const files = await FileProcessor.selectAndProcess(
      options,
      'audio/*'
    );

    return AudioProcessor.processAudioFiles(files.map(f => f.file), options);
  }
}

export * from './src/types';
export { ImageProcessor } from './src/processors/image.processor';
export { VideoProcessor } from './src/processors/video.processor';
export { AudioProcessor } from './src/processors/audio.processor';
export { FileProcessor } from './src/processors/file.processor';