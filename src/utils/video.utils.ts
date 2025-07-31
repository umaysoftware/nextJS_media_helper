import { FFmpeg } from '@ffmpeg/ffmpeg';
import imageCompression from 'browser-image-compression';
import { ProcessedFile } from '../types';
import { VideoMimeTypes } from '../types';


const isVideoFile = (file: File): boolean => {
    return file.type.startsWith('video/');
}

const compressVideo = async (file: File, compressQuality: number): Promise<File> => {

}

const generateThumbnail = async (file: File, options: any): Promise<File> => {

}

const cropVideo = async (file: File, cropOptions: any): Promise<File> => {

}

const covertVideoFormat = async (file: File, format: VideoMimeTypes): Promise<any> => {

}