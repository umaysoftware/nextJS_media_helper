import { SelectionOptions, ProcessedFile, RuleInfo } from '../types';
import { FileProcessor } from './file.processor';
import {
  AUDIO_MIME_TYPES,
  validateAudioFile,
  generateAudioThumbnail,
  getAudioMetadata
} from '../utils/audio.utils';
import { createProcessedFile, getMatchingRule } from '../utils/common.utils';

export class AudioProcessor {
  /**
   * Process audio files with audio-specific validations
   */
  static async processAudioFiles(
    files: FileList | File[],
    options: SelectionOptions
  ): Promise<ProcessedFile[]> {
    // Ensure audio MIME types are set
    const audioOptions: SelectionOptions = {
      ...options,
      rules: Array.isArray(options.rules) 
        ? options.rules.map(rule => ({
            ...rule,
            allowedMimeTypes: rule.allowedMimeTypes || AUDIO_MIME_TYPES
          }))
        : {
            ...options.rules,
            allowedMimeTypes: options.rules?.allowedMimeTypes || AUDIO_MIME_TYPES
          }
    };

    // Use base file processor for initial processing
    const processedFiles = await FileProcessor.processFiles(files, audioOptions);
    const enhancedFiles: ProcessedFile[] = [];

    // Enhance each processed file with audio-specific processing
    for (const processedFile of processedFiles) {
      try {
        // Get matching rule for this audio file
        const fileRule = getMatchingRule(processedFile.file, options.rules);

        // Validate audio-specific rules
        const validationOptions: any = {};

        if (fileRule?.audioDurationLimit) {
          validationOptions.maxDuration = fileRule.audioDurationLimit;
        }

        // Map bitrate/sample rate to actual values
        if (fileRule?.audioSampleRate) {
          const sampleRateMap = {
            low: 22050,
            medium: 44100,
            high: 48000
          };
          validationOptions.maxSampleRate = sampleRateMap[fileRule.audioSampleRate];
        }

        const validation = await validateAudioFile(processedFile.file, validationOptions);

        if (!validation.valid) {
          console.warn(`Audio validation failed for ${processedFile.name}:`, validation.errors);
          continue;
        }

        // Generate thumbnail (waveform visualization) if requested
        let thumbnail: ProcessedFile | undefined;
        if (fileRule?.willGenerateThumbnail || fileRule?.thumbnailSize) {
          try {
            const thumbnailSizes = {
              small: { width: 150, height: 75 },
              medium: { width: 300, height: 150 },
              large: { width: 500, height: 250 }
            };

            const size = thumbnailSizes[fileRule.thumbnailSize || 'medium'];
            const thumbnailBlob = await generateAudioThumbnail(
              processedFile.file,
              size.width,
              size.height
            );

            const thumbnailFile = new File([thumbnailBlob], `thumb_${processedFile.name}.png`, {
              type: 'image/png'
            });

            // Create thumbnail rule
            const thumbnailRule: RuleInfo = {
              willGenerateBase64: fileRule?.willGenerateBase64,
              willGenerateBlob: true,
              willGenerateFile: true
            };

            thumbnail = await createProcessedFile(
              thumbnailFile,
              thumbnailRule
            );
          } catch (error) {
            console.warn('Failed to generate audio thumbnail:', error);
          }
        }

        // Add thumbnail to processed file if generated
        if (thumbnail) {
          processedFile.thumbnail = thumbnail;
        }

        enhancedFiles.push(processedFile);
      } catch (error) {
        console.error(`Failed to enhance audio file ${processedFile.name}:`, error);
        enhancedFiles.push(processedFile);
      }
    }

    return enhancedFiles;
  }

  /**
   * Get audio metadata
   */
  static async getAudioInfo(file: File): Promise<{
    duration: number;
    sampleRate?: number;
    channels?: number;
    bitrate?: string;
  }> {
    const metadata = await getAudioMetadata(file);

    // Estimate bitrate based on file size and duration
    let bitrate: string | undefined;
    if (metadata.duration > 0) {
      const kbps = Math.round((file.size * 8) / (metadata.duration * 1000));
      bitrate = `${kbps} kbps`;
    }

    return {
      ...metadata,
      bitrate
    };
  }
}