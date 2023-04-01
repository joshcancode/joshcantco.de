export interface FormatData {
    fileType: string,
    fileSize?: string,
    formatId: string,
    resolution: string
}

export interface DownloadParams {
    url: string,
    resolution?: string,
    videoFormat?: string,
    audioFormat?: string,
    conversionMethod: string
}