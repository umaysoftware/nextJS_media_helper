import { SelectionOptions, ProcessedFile } from '../types';
import { FileProcessor } from './file.processor';
import { 
  IMAGE_MIME_TYPES,
  validateImageFile,
  generateImageThumbnail,
  getImageDimensions,
  getImageAspectRatio,
  compressImage,
  resizeImage
} from '../utils/image.utils';
import { createProcessedFile } from '../utils/common.utils';

export class ImageProcessor {
  /**
   * Process image files with image-specific validations
   */
  static async processImageFiles(
    files: FileList | File[],
    options: SelectionOptions
  ): Promise<ProcessedFile[]> {
    // Ensure image MIME types are set
    const imageOptions: SelectionOptions = {
      ...options,
      rules: {
        ...options.rules,
        allowedMimeTypes: IMAGE_MIME_TYPES
      }
    };

    // Use base file processor for initial processing
    const processedFiles = await FileProcessor.processFiles(files, imageOptions);
    const enhancedFiles: ProcessedFile[] = [];

    // Enhance each processed file with image-specific processing
    for (const processedFile of processedFiles) {
      try {
        // Validate image-specific rules
        const validationOptions: any = {};

        // Map resolution to pixel values
        if (options.rules?.imageResolution) {
          const resolutionMap = {
            low: { width: 800, height: 600 },
            medium: { width: 1600, height: 1200 },
            high: { width: 3200, height: 2400 }
          };
          const resolution = resolutionMap[options.rules.imageResolution];
          validationOptions.maxWidth = resolution.width;
          validationOptions.maxHeight = resolution.height;
        }

        // Check aspect ratio if specified
        if (options.rules?.imageAspectRatio) {
          validationOptions.allowedAspectRatios = [options.rules.imageAspectRatio];
        }

        const validation = await validateImageFile(processedFile.file, validationOptions);
        
        if (!validation.valid) {
          console.warn(`Image validation failed for ${processedFile.name}:`, validation.errors);
          continue;
        }

        // Apply compression if specified
        let processedImageFile = processedFile.file;
        if (options.rules?.imageCompression) {
          try {
            const compressedBlob = await compressImage(
              processedFile.file,
              options.rules.imageCompression
            );
            processedImageFile = new File([compressedBlob], processedFile.name, {
              type: processedFile.mimeType
            });
            
            // Update the processed file with compressed version
            processedFile.file = processedImageFile;
            processedFile.size = processedImageFile.size;
            
            // Regenerate base64/blob if needed
            if (options.willGenerateBase64 || options.willGenerateBlob) {
              const reprocessed = await createProcessedFile(
                processedImageFile,
                options,
                processedFile.thumbnail
              );
              Object.assign(processedFile, reprocessed);
            }
          } catch (error) {
            console.warn('Failed to compress image:', error);
          }
        }

        // Generate thumbnail if requested
        let thumbnail: ProcessedFile | undefined;
        if (options.rules?.thumbnailSize) {
          try {
            const thumbnailBlob = await generateImageThumbnail(
              processedImageFile,
              options.rules.thumbnailSize,
              options.rules.thumbnailFormat || 'jpeg',
              options.rules.thumbnailQuality || 'medium'
            );
            
            const ext = options.rules.thumbnailFormat || 'jpeg';
            const thumbnailFile = new File([thumbnailBlob], `thumb_${processedFile.name}.${ext}`, {
              type: `image/${ext}`
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
            console.warn('Failed to generate image thumbnail:', error);
          }
        }

        // Add thumbnail to processed file if generated
        if (thumbnail) {
          processedFile.thumbnail = thumbnail;
        }

        enhancedFiles.push(processedFile);
      } catch (error) {
        console.error(`Failed to enhance image file ${processedFile.name}:`, error);
        enhancedFiles.push(processedFile);
      }
    }

    return enhancedFiles;
  }

  /**
   * Get image metadata
   */
  static async getImageInfo(file: File): Promise<{
    width: number;
    height: number;
    aspectRatio: 'square' | 'landscape' | 'portrait';
    megapixels: number;
  }> {
    const [dimensions, aspectRatio] = await Promise.all([
      getImageDimensions(file),
      getImageAspectRatio(file)
    ]);

    const megapixels = Number(((dimensions.width * dimensions.height) / 1000000).toFixed(2));

    return {
      width: dimensions.width,
      height: dimensions.height,
      aspectRatio,
      megapixels
    };
  }

  /**
   * Resize image to specific dimensions
   */
  static async resizeImageToFit(
    file: File,
    maxWidth: number,
    maxHeight: number,
    quality: number = 0.8
  ): Promise<Blob> {
    return resizeImage(file, maxWidth, maxHeight, quality);
  }
}