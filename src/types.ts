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

export interface UnusedAssetsOptions {
  referenceDirs: string[];
  deleteUnused?: boolean;
  archiveDir?: string;
  outputFile?: string;
  recursive?: boolean;
}

export interface UnusedAssetResult {
  success: boolean;
  unusedAssets: string[];
  totalAssets: number;
  referenceDirs: string[];
  archivedTo?: string;
  deletedCount?: number;
  error?: string;
}

export interface ReferenceUpdate {
  file: string;
  oldRef: string;
  newRef: string;
  updated: boolean;
}

export interface SvgOptimizerOptions {
  multipass?: boolean;
  floatPrecision?: number;
  outputDir?: string;
  referenceDirs?: string[];
  deleteOriginals?: boolean;
  archiveDir?: string;
}

export interface SvgOptimizerResult {
  success: boolean;
  inputPath: string;
  outputPath?: string;
  referencesUpdated?: number;
  originalHandled?: 'deleted' | 'archived' | 'kept';
  error?: string;
  originalSize?: number;
  optimizedSize?: number;
}

export interface AssetMetadata {
  width?: number;
  height?: number;
  format?: string;
  size?: number;
  aspectRatio?: number;
}

export interface MetadataOptions {
  outputFile?: string;
  includeSize?: boolean;
  recursive?: boolean;
}

export interface MetadataResult {
  success: boolean;
  count: number;
  outputFile: string;
  data: Record<string, AssetMetadata>;
  error?: string;
}
