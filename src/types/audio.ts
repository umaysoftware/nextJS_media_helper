export enum AudioMimeTypes {
    MP3 = 'audio/mpeg',
    WAV = 'audio/wav',
    OGG = 'audio/ogg',
    FLAC = 'audio/flac',
    AAC = 'audio/aac',
    M4A = 'audio/mp4',
    WMA = 'audio/x-ms-wma',
    AMR = 'audio/amr',
    AIFF = 'audio/aiff',
    OPUS = 'audio/opus',
}

// ** Ornek ses dosyasi mime tipi ** //
export interface PreviewAudioOptions {
    startAt: number; // Başlangıç zamanı (saniye cinsinden)
    duration: number; // Süre (saniye cinsinden)

    compressQuality?: number; // Sıkıştırma kalitesi (0-100 arası, varsayılan 75)
    format?: 'wav' | 'mp3' | 'ogg' | 'opus'; // Dönüştürme formatı (varsayılan 'mp3')
}