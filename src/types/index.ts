
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
 * Dosya seçim kurallarını tanımlayan interface
 * Her bir kural opsiyoneldir ve ihtiyaca göre kullanılabilir
 */
export interface RuleInfo {
  willGenerateBase64?: boolean; // Base64 formatında string üretilecek mi
  willGenerateBlob?: boolean;   // Blob objesi üretilecek mi
  willGenerateFile?: boolean;   // File objesi üretilecek mi (default: true)
  willGenerateThumbnail?: boolean; // Thumbnail üretilecek mi

  // Genel dosya kuralları
  allowedMimeTypes?: string[];  // İzin verilen MIME tipleri
  minSelectionCount?: number;   // Minimum seçilmesi gereken dosya sayısı
  maxSelectionCount?: number;   // Maximum seçilebilecek dosya sayısı
  maxFileSize?: number;         // Maximum dosya boyutu (byte)
  minFileSize?: number;         // Minimum dosya boyutu (byte)

  // Video dosyaları için kurallar
  videoDurationLimit?: number;                      // Maximum video süresi (saniye)
  videoResolution?: 'low' | 'medium' | 'high';      // Video çözünürlüğü
  videoBitrate?: 'low' | 'medium' | 'high';         // Video bit hızı
  videoFrameRate?: 'low' | 'medium' | 'high';       // Video kare hızı

  // Ses dosyaları için kurallar
  audioDurationLimit?: number;                      // Maximum ses süresi (saniye)
  audioBitrate?: 'low' | 'medium' | 'high';         // Ses bit hızı
  audioSampleRate?: 'low' | 'medium' | 'high';      // Ses örnekleme hızı

  // Resim dosyaları için kurallar
  imageResolution?: 'low' | 'medium' | 'high';      // Resim çözünürlüğü
  imageCompression?: 'low' | 'medium' | 'high';     // Sıkıştırma seviyesi
  imageColorDepth?: 'low' | 'medium' | 'high';      // Renk derinliği
  imageAspectRatio?: 'square' | 'landscape' | 'portrait'; // En-boy oranı

  // Thumbnail (küçük resim) için kurallar
  thumbnailSize?: 'small' | 'medium' | 'large';     // Thumbnail boyutu
  thumbnailFormat?: 'jpeg' | 'png' | 'webp';        // Thumbnail formatı
  thumbnailQuality?: 'low' | 'medium' | 'high';     // Thumbnail kalitesi
  thumbnailAspectRatio?: 'square' | 'landscape' | 'portrait'; // Thumbnail en-boy oranı
}

/**
 * Dosya seçim ve işleme seçenekleri
 */
export interface SelectionOptions {
  rules?: RuleInfo | RuleInfo[]; // Tek bir kural veya kural dizisi
}

/**
 * İşlenmiş medya dosyası interface'i
 * Seçilen ve işlenen dosyanın tüm bilgilerini içerir
 */
export interface ProcessedFile {
  // Temel dosya bilgileri
  name: string;      // Dosya adı
  size: number;      // Dosya boyutu (byte)
  type: string;      // Dosya tipi (image, video, audio, document, vb.)
  extension: string; // Dosya uzantısı (.jpg, .mp4, vb.)
  mimeType: string;  // MIME tipi (image/jpeg, video/mp4, vb.)

  // Dosya içeriği (farklı formatlarda)
  file: File;        // Orijinal File objesi (her zaman mevcut)
  blob?: Blob;       // Blob formatında dosya (opsiyonel)
  base64?: string;   // Base64 string formatında dosya (opsiyonel)

  // Thumbnail bilgisi (sadece resimler için)
  thumbnail?: ProcessedFile; // Küçük resim verisi
}
