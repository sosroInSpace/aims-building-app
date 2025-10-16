export enum MimeType {
    // Documents
    PDF = "application/pdf",
    MS_WORD = "application/msword",
    MS_WORDX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    MS_EXCEL = "application/vnd.ms-excel",
    MS_EXCELX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    CSV = "text/csv",
    PLAIN_TEXT = "text/plain",
    RTF = "application/rtf",

    // Images
    JPEG = "image/jpeg",
    PNG = "image/png",
    GIF = "image/gif",
    BMP = "image/bmp",
    SVG = "image/svg+xml",
    WEBP = "image/webp",

    // Audio
    MP3 = "audio/mpeg",
    WAV = "audio/wav",
    OGG_AUDIO = "audio/ogg",

    // Video
    MP4 = "video/mp4",
    WEBM = "video/webm",
    OGG_VIDEO = "video/ogg",

    // Archives
    ZIP = "application/zip",
    GZIP = "application/gzip",
    TAR = "application/x-tar",
    RAR = "application/vnd.rar",
    SEVEN_ZIP = "application/x-7z-compressed",

    // JSON / XML / Other
    JSON = "application/json",
    XML = "application/xml",
    HTML = "text/html"
}
