export enum RuleType {
    IMAGE = "image",       // Resim dosyaları için kural
    VIDEO = "video",       // Video dosyaları için kural
    AUDIO = "audio",       // Ses dosyaları için kural
    DOCUMENT = "document", // Belge dosyaları için kural
    ARCHIVE = "archive",   // Arşiv dosyaları için kural
    GENERIC = "generic"    // Genel dosya türleri için kural
}

/**
 * Seçilen medya dosyasının temel bilgilerini içeren interface
 * Bu interface, dosya seçildikten sonra ilk validasyon için kullanılır
 */
export interface FileSelection {
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

export interface ThumbnailFile {
    base64?: string; // Base64 formatında string (opsiyonel)
    blob?: Blob;     // Blob objesi (opsiyonel)
    file?: File; // İşlenmiş dosya (opsiyonel, örneğin sıkıştırılmış)
    url?: string; // Blob veya File'dan oluşturulan URL (opsiyonel)
}

export interface ProcessedMainFile {
    base64?: string; // Base64 formatında string (opsiyonel)
    blob?: Blob;     // Blob objesi (opsiyonel)
    file?: File; // İşlenmiş dosya (opsiyonel, örneğin sıkıştırılmış)
    url?: string; // Blob veya File'dan oluşturulan URL (opsiyonel)
}

export interface ProcessedFile {
    // Temel dosya bilgileri
    name: string;      // Dosya adı
    size: number;      // Dosya boyutu (byte)
    type: string;      // Dosya tipi (image, video, audio, document, vb.)
    extension: string; // Dosya uzantısı (.jpg, .mp4, vb.)
    mimeType: string;  // MIME tipi (image/jpeg, video/mp4, vb.)

    // Dosya içeriği (farklı formatlarda)
    originalFile: File; // Orijinal dosya (her zaman mevcut)

    // İşlenmiş dosya bilgileri
    processed: ProcessedMainFile

    // Thumbnail bilgisi (sadece resimler için)
    thumbnail?: ThumbnailFile
}







// *** RULE TYPES *** //
export interface RuleInfo {
    type: RuleType; // Kural tipi (image, video, audio, document, archive, generic)
    allowedMimeTypes?: string[];  // İzin verilen MIME tipleri
    minSelectionCount?: number;   // Minimum seçilmesi gereken dosya sayısı
    maxSelectionCount?: number;   // Maximum seçilebilecek dosya sayısı
    minFileSize?: number;         // Minimum dosya boyutu (byte)
    maxFileSize?: number;         // Maximum dosya boyutu (byte)

    willGenerateBase64?: boolean; // bu dosya için Base64 formatında string üretilecek mi
    willGenerateBlob?: boolean;   // bu dosya için Blob objesi üretilecek mi
    compressQuality?: number; // Sıkıştırma kalitesi (0-100 arası, resimler video ve ses dosyaları için)
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
    rules?: RuleInfo[]; // Tek bir kural veya kural dizisi
    onProgress?: ProgressCallback; // İlerleme callback'i
}

