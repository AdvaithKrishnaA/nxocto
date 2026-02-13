export type ImageFormat = 'webp' | 'avif';

export interface ImageConversionOptions {
  format: ImageFormat;
  quality?: number;
  outputDir?: string;
  referenceDirs?: string[];
  deleteOriginals?: boolean;
  archiveDir?: string;
}

export interface ConversionResult {
  success: boolean;
  inputPath: string;
  outputPath?: string;
  referencesUpdated?: number;
  originalHandled?: 'deleted' | 'archived' | 'kept';
  error?: string;
}

export interface ReferenceUpdate {
  file: string;
  oldRef: string;
  newRef: string;
  updated: boolean;
}
