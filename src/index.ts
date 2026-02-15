export { convertImage, convertImages, convertImagesInFolders, handleOriginalsAfterReview } from './features/image-converter/imageConverter';
export { optimizeSvg, optimizeSvgs, optimizeSvgsInFolders, handleOriginalsAfterReview as handleSvgOriginalsAfterReview } from './features/svg-optimizer/svgOptimizer';
export { extractMetadata } from './features/metadata-extractor/metadataExtractor';
export type {
  ImageConversionOptions,
  ConversionResult,
  ReferenceUpdate,
  SvgOptimizerOptions,
  SvgOptimizerResult,
  AssetMetadata,
  MetadataOptions,
  MetadataResult
} from './types';
