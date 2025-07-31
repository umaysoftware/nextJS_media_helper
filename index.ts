import { SelectionOptions, ProcessedFile, RuleInfo } from './src/types';
import { FileProcessor } from './src/processors/file.processor';
import { ImageProcessor } from './src/processors/image.processor';
import { VideoProcessor } from './src/processors/video.processor';
import { AudioProcessor } from './src/processors/audio.processor';

export class MediaHelper {
  /**
   * Ensure rules have default willGenerateFile value
   */
  private static ensureDefaultWillGenerate(rules?: RuleInfo | RuleInfo[]): RuleInfo | RuleInfo[] | undefined {
    if (!rules) return undefined;
    
    if (Array.isArray(rules)) {
      return rules.map(rule => ({
        willGenerateFile: true,
        ...rule
      }));
    }
    
    return {
      willGenerateFile: true,
      ...rules
    };
  }

  static async pickFile(selectionOptions: SelectionOptions): Promise<ProcessedFile[]> {
    const options = {
      ...selectionOptions,
      rules: this.ensureDefaultWillGenerate(selectionOptions.rules)
    };
    return FileProcessor.selectAndProcess(options);
  }

  static async pickImage(selectionOptions?: Partial<SelectionOptions>): Promise<ProcessedFile[]> {
    const options: SelectionOptions = {
      ...selectionOptions,
      rules: this.ensureDefaultWillGenerate(selectionOptions?.rules)
    };

    const files = await FileProcessor.selectAndProcess(
      options,
      'image/*'
    );

    return ImageProcessor.processImageFiles(files.map(f => f.file), options);
  }

  static async pickVideo(selectionOptions?: Partial<SelectionOptions>): Promise<ProcessedFile[]> {
    const options: SelectionOptions = {
      ...selectionOptions,
      rules: this.ensureDefaultWillGenerate(selectionOptions?.rules)
    };

    const files = await FileProcessor.selectAndProcess(
      options,
      'video/*'
    );

    return VideoProcessor.processVideoFiles(files.map(f => f.file), options);
  }

  static async pickSound(selectionOptions?: Partial<SelectionOptions>): Promise<ProcessedFile[]> {
    const options: SelectionOptions = {
      ...selectionOptions,
      rules: this.ensureDefaultWillGenerate(selectionOptions?.rules)
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