import { RuleInfo } from './common';

export interface ImageRuleInfo extends RuleInfo {
    processedCompressQuality: number; // Sıkıştırma kalitesi (0-100 arası, varsayılan 75)
    processedFormat: 'jpeg' | 'png' | 'webp'; // Dönüştürme formatı (varsayılan 'webp')

    thumbnailCompressQuality: number; // Thumbnail sıkıştırma kalitesi (0-100 arası, ses dosyaları için için)
    thumbnailFormat: 'jpeg' | 'png' | 'webp'; // Thumbnail formatı (varsayılan 'webp', ses dosyaları için)
}