import { RuleInfo } from './common';

export interface VideoRuleInfo extends RuleInfo {
    startAt: number; // Başlangıç zamanı (saniye cinsinden)
    duration: number; // Süre (saniye cinsinden) 

    processedCompressQuality?: number; // Sıkıştırma kalitesi (0-100 arası, varsayılan 75)
    processedFormat?: 'mp4' | 'webm' | 'avi'; // Dönüştürme formatı (varsayılan 'mp4')

    thumbnailCompressQuality?: number; // Thumbnail sıkıştırma kalitesi (0-100 arası, ses dosyaları için için)
    thumbnailFormat?: 'mp4' | 'webm' | 'avi'; // Thumbnail formatı (varsayılan 'mp4', ses dosyaları için)
}