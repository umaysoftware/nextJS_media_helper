import { FFmpeg } from '@ffmpeg/ffmpeg';
import imageCompression from 'browser-image-compression';
import { ProcessedFile } from '@/types/common';
import { VideoMimeTypes } from '@/types/video';
import { ThumbnailFile, SelectionOptions } from '@/types/common';


const isVideoFile = (file: File): boolean => {
    return file.type.startsWith('video/');
}

const compressVideo = async (file: File, compressQuality: number): Promise<File> => {

}

const generateThumbnail = async (file: File, options: any): Promise<ThumbnailFile> => {

}

const cropVideo = async (file: File, cropOptions: any): Promise<File> => {

}

const covertVideoFormat = async (file: File, format: VideoMimeTypes): Promise<File> => {

}



const processVideoFile = async (file: File, options: SelectionOptions): Promise<ProcessedFile> => {

}