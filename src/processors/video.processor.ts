import { SelectionOptions, ProcessedFile } from '../types';
import { FileProcessor } from './file.processor';
import { 
  VIDEO_MIME_TYPES,
  validateVideoFile,
  generateVideoThumbnail,
  getVideoDuration,
  getVideoDimensions
} from '../utils/video.utils';
import { createProcessedFile } from '../utils/common.utils';

export class VideoProcessor {
  /**
   * Process video files with video-specific validations
   */
  static async processVideoFiles(
    files: FileList | File[],
    options: SelectionOptions
  ): Promise<ProcessedFile[]> {
    // Ensure video MIME types are set
    const videoOptions: SelectionOptions = {
      ...options,
      rules: {
        ...options.rules,
        allowedMimeTypes: VIDEO_MIME_TYPES
      }
    };

    // Use base file processor for initial processing
    const processedFiles = await FileProcessor.processFiles(files, videoOptions);
    const enhancedFiles: ProcessedFile[] = [];

    // Enhance each processed file with video-specific processing
    for (const processedFile of processedFiles) {
      try {
        // Validate video-specific rules
        const validationOptions: any = {};

        if (options.rules?.videoDurationLimit) {
          validationOptions.maxDuration = options.rules.videoDurationLimit;
        }

        // Map resolution to pixel values
        if (options.rules?.videoResolution) {
          const resolutionMap = {
            low: { width: 640, height: 480 },
            medium: { width: 1280, height: 720 },
            high: { width: 1920, height: 1080 }
          };
          const resolution = resolutionMap[options.rules.videoResolution];
          validationOptions.maxWidth = resolution.width;
          validationOptions.maxHeight = resolution.height;
        }

        const validation = await validateVideoFile(processedFile.file, validationOptions);
        
        if (!validation.valid) {
          console.warn(`Video validation failed for ${processedFile.name}:`, validation.errors);
          continue;
        }

        // Generate thumbnail if requested
        let thumbnail: ProcessedFile | undefined;
        if (options.rules?.thumbnailSize) {
          try {
            const thumbnailBlob = await generateVideoThumbnail(processedFile.file);
            const thumbnailFile = new File([thumbnailBlob], `thumb_${processedFile.name}.jpg`, {
              type: 'image/jpeg'
            });
            
            thumbnail = await createProcessedFile(
              thumbnailFile,
              {
                willGenerateBase64: options.willGenerateBase64,
                willGenerateBlob: true,
                willGenerateFile: true
              }
            );
          } catch (error) {
            console.warn('Failed to generate video thumbnail:', error);
          }
        }

        // Add thumbnail to processed file if generated
        if (thumbnail) {
          processedFile.thumbnail = thumbnail;
        }

        enhancedFiles.push(processedFile);
      } catch (error) {
        console.error(`Failed to enhance video file ${processedFile.name}:`, error);
        enhancedFiles.push(processedFile);
      }
    }

    return enhancedFiles;
  }

  /**
   * Get video metadata
   */
  static async getVideoMetadata(file: File): Promise<{
    duration: number;
    width: number;
    height: number;
    aspectRatio: string;
  }> {
    const [duration, dimensions] = await Promise.all([
      getVideoDuration(file),
      getVideoDimensions(file)
    ]);

    const aspectRatio = (dimensions.width / dimensions.height).toFixed(2);

    return {
      duration,
      width: dimensions.width,
      height: dimensions.height,
      aspectRatio
    };
  }
}