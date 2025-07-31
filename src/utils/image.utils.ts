import imageCompression from 'browser-image-compression';
import { ImageMimeTypes } from '@/types/image';
import { PreviewImageOptions } from '@/types/image';
import { ThumbnailFile } from '@/types/common';
import { SelectionOptions, ProcessedFile } from '@/types/common';


const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
}


const compressImage = async (file: File, compressQuality: number): Promise<File> => {

}

const generateThumbnail = async (file: File, options: PreviewImageOptions): Promise<ThumbnailFile> => {
  // Implement image thumbnail generation logic here
}

const cropImage = async (file: File, cropOptions: any): Promise<File> => {
  // Implement image cropping logic here
}

const convertImageFormat = async (file: File, format: ImageMimeTypes): Promise<any> => {
  // Implement image format conversion logic here
}



const processImageFile = async (file: File, options: SelectionOptions): Promise<ProcessedFile> => {

}