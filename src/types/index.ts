// ** TYPES ** //
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

export enum DocumentMimeTypes {
  PDF = 'application/pdf',
  DOC = 'application/msword',
  DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLS = 'application/vnd.ms-excel',
  XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  PPT = 'application/vnd.ms-powerpoint',
  PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  TXT = 'text/plain',
  CSV = 'text/csv',
  RTF = 'application/rtf',
}

export enum AchiveMimeTypes {
  ZIP = 'application/zip',
  RAR = 'application/x-rar-compressed',
  TAR = 'application/x-tar',
  GZ = 'application/gzip',
}




export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  OTHER = 'other',
}

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


// ** RULES TYPES ** //
/**
 * Dosya seçim kurallarını tanımlayan interface
 * Her bir kural opsiyoneldir ve ihtiyaca göre kullanılabilir
 */

export interface RuleBase {
  allowedMimeTypes?: string[];  // İzin verilen MIME tipleri
  minSelectionCount?: number;   // Minimum seçilmesi gereken dosya sayısı
  maxSelectionCount?: number;   // Maximum seçilebilecek dosya sayısı
  minFileSize?: number;         // Minimum dosya boyutu (byte)
  maxFileSize?: number;         // Maximum dosya boyutu (byte)
}


export interface RuleInfo extends RuleBase {
  willGenerateBase64?: boolean; // Base64 formatında string üretilecek mi
  willGenerateBlob?: boolean;   // Blob objesi üretilecek mi
}

/**
 * Dosya seçim ve işleme seçenekleri
 */
export interface SelectionOptions {
  rules?: RuleInfo | RuleInfo[]; // Tek bir kural veya kural dizisi
}

/**
 * İşlenmiş medya dosyası interface'i
 * işlenen dosyanın tüm bilgilerini içerir
 */
export interface ProcessedFile {
  // Temel dosya bilgileri
  name: string;      // Dosya adı
  size: number;      // Dosya boyutu (byte)
  type: string;      // Dosya tipi (image, video, audio, document, vb.)
  extension: string; // Dosya uzantısı (.jpg, .mp4, vb.)
  mimeType: string;  // MIME tipi (image/jpeg, video/mp4, vb.)

  // Dosya içeriği (farklı formatlarda)
  originalFile: File; // Orijinal dosya (her zaman mevcut)
  processed: {
    base64?: string; // Base64 formatında string (opsiyonel)
    blob?: Blob;     // Blob objesi (opsiyonel)
    file?: File; // İşlenmiş dosya (opsiyonel, örneğin sıkıştırılmış)
  }

  // Thumbnail bilgisi (sadece resimler için)
  thumbnail?: {
    base64?: string; // Base64 formatında string (opsiyonel)
    blob?: Blob;     // Blob objesi (opsiyonel)
    file?: File; // İşlenmiş dosya (opsiyonel, örneğin sıkıştırılmış)
  }
}
