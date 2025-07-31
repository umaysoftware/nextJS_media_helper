// import { ProcessedFile, SelectionFile } from '../types';

/**
 * Audio MIME types
 */
export const AUDIO_MIME_TYPES = [
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

/**
 * Check if file is an audio file
 */
export const isAudioFile = (mimeType: string): boolean => {
  return AUDIO_MIME_TYPES.includes(mimeType);
};

/**
 * Get audio duration from file
 */
export const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();

    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(audio.src);
      resolve(audio.duration);
    };

    audio.onerror = () => {
      URL.revokeObjectURL(audio.src);
      reject(new Error('Failed to load audio metadata'));
    };

    audio.src = URL.createObjectURL(file);
  });
};

/**
 * Get audio context for advanced processing
 */
export const createAudioContext = (): AudioContext => {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  return new AudioContextClass();
};

/**
 * Analyze audio file and get waveform data
 */
export const getAudioWaveform = async (file: File, samples: number = 100): Promise<number[]> => {
  const audioContext = createAudioContext();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const channelData = audioBuffer.getChannelData(0); // Get first channel
  const blockSize = Math.floor(channelData.length / samples);
  const waveform: number[] = [];

  for (let i = 0; i < samples; i++) {
    const start = blockSize * i;
    let sum = 0;

    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(channelData[start + j]);
    }

    waveform.push(sum / blockSize);
  }

  audioContext.close();
  return waveform;
};

/**
 * Get audio metadata
 */
export const getAudioMetadata = async (file: File): Promise<{
  duration: number;
  sampleRate?: number;
  channels?: number;
}> => {
  try {
    const duration = await getAudioDuration(file);

    // Try to get more detailed metadata using Web Audio API
    try {
      const audioContext = createAudioContext();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const metadata = {
        duration,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels
      };

      audioContext.close();
      return metadata;
    } catch {
      // If Web Audio API fails, return basic metadata
      return { duration };
    }
  } catch (error) {
    throw new Error('Failed to get audio metadata');
  }
};

/**
 * Generate audio visualization thumbnail
 */
export const generateAudioThumbnail = async (
  file: File,
  width: number = 200,
  height: number = 100
): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  canvas.width = width;
  canvas.height = height;

  // Get waveform data
  const waveform = await getAudioWaveform(file, width);

  // Draw background
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, width, height);

  // Draw waveform
  ctx.fillStyle = '#4a90e2';
  const barWidth = width / waveform.length;

  waveform.forEach((value, index) => {
    const barHeight = value * height;
    const x = index * barWidth;
    const y = (height - barHeight) / 2;

    ctx.fillRect(x, y, barWidth - 1, barHeight);
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to generate audio thumbnail'));
      }
    }, 'image/png');
  });
};

/**
 * Validate audio file
 */
export const validateAudioFile = async (
  file: File,
  options?: {
    maxDuration?: number;
    minDuration?: number;
    maxSampleRate?: number;
    minSampleRate?: number;
  }
): Promise<{ valid: boolean; errors: string[] }> => {
  const errors: string[] = [];

  if (!isAudioFile(file.type)) {
    errors.push('Invalid audio file type');
    return { valid: false, errors };
  }

  try {
    const metadata = await getAudioMetadata(file);

    if (options?.maxDuration && metadata.duration > options.maxDuration) {
      errors.push(`Audio duration exceeds ${options.maxDuration} seconds`);
    }

    if (options?.minDuration && metadata.duration < options.minDuration) {
      errors.push(`Audio duration is less than ${options.minDuration} seconds`);
    }

    if (options?.maxSampleRate && metadata.sampleRate && metadata.sampleRate > options.maxSampleRate) {
      errors.push(`Audio sample rate exceeds ${options.maxSampleRate} Hz`);
    }

    if (options?.minSampleRate && metadata.sampleRate && metadata.sampleRate < options.minSampleRate) {
      errors.push(`Audio sample rate is less than ${options.minSampleRate} Hz`);
    }
  } catch (error) {
    errors.push('Failed to validate audio file');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};