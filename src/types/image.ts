export enum ImageMimeTypes {
    JPEG = 'image/jpeg',
    PNG = 'image/png',
    GIF = 'image/gif',
    BMP = 'image/bmp',
    TIFF = 'image/tiff',
    WEBP = 'image/webp',
    SVG = 'image/svg+xml',
    ICO = 'image/x-icon',
    AVIF = 'image/avif',
    HEIC = 'image/heic',
    HEIF = 'image/heif',
}

export interface PreviewImageOptions {
    width: number;  // Thumbnail genişliği
    height: number; // Thumbnail yüksekliği

    compressQuality?: number; // Sıkıştırma kalitesi (0-100 arası, varsayılan 75)
    format?: 'jpeg' | 'png' | 'webp'; // Thumbnail formatı (varsayılan jpeg)
}