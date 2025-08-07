import { RuleInfo } from './common';

export interface AudioRuleInfo extends RuleInfo {
    startAt: number; // Başlangıç zamanı (saniye cinsinden)
    duration: number; // Süre (saniye cinsinden) 

    processedCompressQuality?: number; // Sıkıştırma kalitesi (0-100 arası, varsayılan 75)
    processedFormat?: 'wav' | 'mp3' | 'ogg' | 'opus'; // Dönüştürme formatı (varsayılan 'wav')

    thumbnailCompressQuality?: number; // Thumbnail sıkıştırma kalitesi (0-100 arası, ses dosyaları için için)
    thumbnailFormat?: 'wav' | 'mp3' | 'ogg' | 'opus'; // Thumbnail formatı (varsayılan 'wav', ses dosyaları için) sesin ön izlemesi mesela 4 dkkalık bi sesin 3.saniyeden 10 sn kadar bir ön izlemesi
}