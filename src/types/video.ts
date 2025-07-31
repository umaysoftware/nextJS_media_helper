export enum VideoMimeTypes {
    MP4 = 'video/mp4',
    WEBM = 'video/webm',
    AVI = 'video/x-msvideo',
    MKV = 'video/x-matroska',
    MOV = 'video/quicktime',
    FLV = 'video/x-flv',
    WMV = 'video/x-ms-wmv',
    OGG = 'video/ogg',
    MPEG = 'video/mpeg',
    TS = 'video/mp2t',
    M4V = 'video/x-m4v',
    HLS = 'application/x-mpegURL',
}

export interface PreviewVideoOptions {
    startAt: number; // Başlangıç zamanı (saniye cinsinden)
    duration: number; // Süre (saniye cinsinden)

    compressQuality?: number; // Sıkıştırma kalitesi (0-100 arası, varsayılan 75)
    format?: 'jpeg' | 'png' | 'webp'; // Thumbnail formatı (varsayılan webp)
}