import { AudioRuleInfo } from './audio';
import { DocumentRuleInfo } from './document';
import { ImageRuleInfo } from './image';
import { VideoRuleInfo } from './video';
/**
 * Seçilen medya dosyasının temel bilgilerini içeren interface
 * Bu interface, dosya seçildikten sonra ilk validasyon için kullanılır
 */
export interface SelectionFile {
    name: string;      // Dosya adı (örn: "photo.jpg")
    size: number;      // Dosya boyutu (byte cinsinden)
    type: string;      // Dosya tipi (örn: "image", "video", "audio")
    extension: string; // Dosya uzantısı (örn: ".jpg", ".mp4")
    mimeType: string;  // MIME tipi (örn: "image/jpeg", "video/mp4")
}



/**
 * İşlenmiş dosya interface'i
 * işlenen dosyanın tüm bilgilerini içerir
 */

export interface ExportedFile {
    base64?: string; // Base64 formatında string (opsiyonel)
    blob?: Blob;     // Blob objesi (opsiyonel)
    file?: File; // İşlenmiş dosya (opsiyonel, örneğin sıkıştırılmış)
    url?: string; // Blob veya File'dan oluşturulan URL (opsiyonel)

    name: string;      // Dosya adı (örn: "photo.jpg")
    size: number;      // Dosya boyutu (byte cinsinden)
    type: string;      // Dosya tipi (örn: "image", "video", "audio")
    extension: string; // Dosya uzantısı (örn: ".jpg", ".mp4")
    mimeType: string;  // MIME tipi (örn: "image/jpeg", "video/mp4") 
}


export interface ProcessedFile {
    processType: 'processed'; // Dosyanın işlenme durumu
    // Temel dosya bilgileri
    meta: {
        name: string;      // Dosya adı (örn: "photo.jpg")
        size: number;      // Dosya boyutu (byte cinsinden)
        type: string;      // Dosya tipi (örn: "image", "video", "audio")
        extension: string; // Dosya uzantısı (örn: ".jpg", ".mp4")
        mimeType: string;  // MIME tipi (örn: "image/jpeg", "video/mp4") 
    },

    // Dosya içeriği (farklı formatlarda)
    originalFile: File; // Orijinal dosya (her zaman mevcut)

    // İşlenmiş dosya bilgileri
    processed: ExportedFile

    // Thumbnail bilgisi (sadece resimler için)
    thumbnail?: ExportedFile
}


export interface UnProcessedFile {
    processType: 'unprocessed'; // Dosyanın işlenme durumu
    // Temel dosya bilgileri
    meta: {
        name: string;      // Dosya adı (örn: "photo.jpg")  
        size: number;      // Dosya boyutu (byte cinsinden)
        type: string;      // Dosya tipi (örn: "image", "video", "audio")
        extension: string; // Dosya uzantısı (örn: ".jpg", ".mp4")
        mimeType: string;  // MIME tipi (örn: "image/jpeg", "video/mp4") 
    },

    // Orijinal dosya içeriği
    originalFile: File; // Orijinal dosya (her zaman mevcut)

    reason: {
        fileName: string;
        errorCode: string;
        message: string;
    }
}


// *** RULE TYPES *** //
export interface RuleInfo {
    allowedMimeTypes?: string[];  // İzin verilen MIME tipleri image/*, video/*, audio/* gibi ifadeleride destekler
    minSelectionCount?: number;   // Minimum seçilmesi gereken dosya sayısı
    maxSelectionCount?: number;   // Maximum seçilebilecek dosya sayısı
    minFileSize?: number;         // Minimum dosya boyutu (byte)
    maxFileSize?: number;         // Maximum dosya boyutu (byte)

    willGenerateBase64?: boolean; // bu dosya için Base64 formatında string üretilecek mi
    willGenerateBlob?: boolean;   // bu dosya için Blob objesi üretilecek mi

    // processedCompressQuality?: number; // Sıkıştırma kalitesi (0-100 arası, resimler video ve ses dosyaları için)
    // processedFormat?: 'jpeg' | 'png' | 'webp'; // Thumbnail formatı (varsayılan webp, resimler için)

    // thumbnailCompressQuality?: number; // Thumbnail sıkıştırma kalitesi (0-100 arası, resimler için)
    // thumbnailFormat?: 'jpeg' | 'png' | 'webp'; // Thumbnail formatı (varsayılan webp, resimler için)
}

export interface ProgressInfo {
    currentFile: number; // Şu anki dosya indexi
    totalFiles: number; // Toplam dosya sayısı
    fileName: string; // İşlenen dosya adı
    stage: 'validating' | 'compressing' | 'generating-thumbnail' | 'processing' | 'completed'; // İşlem aşaması
    percentage: number; // Genel ilerleme yüzdesi (0-100)
}

export interface FileError {
    fileName: string;
    errorCode: string;
    message: string;
}

export type ProgressCallback = (progress: ProgressInfo) => void;

export interface SelectionOptions {
    rules?: (RuleInfo | AudioRuleInfo | DocumentRuleInfo | ImageRuleInfo | VideoRuleInfo)[]; // Seçim kuralları
    onProgress?: ProgressCallback; // İlerleme callback'i
}

