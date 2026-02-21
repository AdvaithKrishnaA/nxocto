export { convertImage, convertImages, convertImagesInFolders, handleOriginalsAfterReview } from './features/image-converter/imageConverter';
export { optimizeSvg, optimizeSvgs, optimizeSvgsInFolders, handleOriginalsAfterReview as handleSvgOriginalsAfterReview } from './features/svg-optimizer/svgOptimizer';
export { extractMetadata } from './features/metadata-extractor/metadataExtractor';
export { findUnusedAssets, handleUnusedAssets } from './features/unused-assets/unusedAssets';
export { generatePlaceholders } from './features/placeholder-generator/placeholderGenerator';
export { resizeImagesInFolders } from './features/image-resizer/imageResizer';
export type {
  ImageConversionOptions,
  ConversionResult,
  ReferenceUpdate,
  SvgOptimizerOptions,
  SvgOptimizerResult,
  AssetMetadata,
  MetadataOptions,
  MetadataResult,
  UnusedAssetsOptions,
  UnusedAssetResult,
  PlaceholderOptions,
  PlaceholderResult,
  ImageResizerOptions,
  ResizeResult
} from './types';
