import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import type { ImageResizerOptions, ResizeResult } from '../../types';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tiff', '.bmp'];

function isAlreadyResized(filePath: string): boolean {
  const parsed = path.parse(filePath);
  // Match pattern "-300", "-1200", etc. at the end of filename
  return /-\d+$/.test(parsed.name);
}

async function getAllFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        files.push(...await getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }
  } catch (err) {
    // Skip directories that can't be read
  }

  return files;
}

async function handleOriginalFile(
  inputPath: string,
  deleteOriginals: boolean,
  archiveDir?: string
): Promise<'deleted' | 'archived' | 'kept'> {
  if (deleteOriginals) {
    await fs.unlink(inputPath);
    return 'deleted';
  } else if (archiveDir) {
    await fs.mkdir(archiveDir, { recursive: true });
    const fileName = path.basename(inputPath);
    const archivePath = path.join(archiveDir, fileName);
    await fs.rename(inputPath, archivePath);
    return 'archived';
  }
  return 'kept';
}

/**
 * Resizes a single image to one or more widths.
 */
export async function resizeImage(
  inputPath: string,
  options: ImageResizerOptions
): Promise<ResizeResult> {
  try {
    const {
      widths,
      format = 'original',
      quality = 80,
      outputDir,
      deleteOriginals = false,
      archiveDir
    } = options;

    const parsedPath = path.parse(inputPath);
    const outputPaths: string[] = [];

    if (outputDir) {
      await fs.mkdir(outputDir, { recursive: true });
    }

    const targetDir = outputDir || parsedPath.dir;

    for (const width of widths) {
      const targetFormat = format === 'original'
        ? (parsedPath.ext.slice(1).toLowerCase() as any)
        : format;

      // If we are keeping original format and not specifying an output dir,
      // we must change the name to avoid overwriting the original.
      // If multiple widths, always include width in name.
      const fileName = `${parsedPath.name}-${width}.${targetFormat === 'jpeg' ? 'jpg' : targetFormat}`;
      const outputPath = path.join(targetDir, fileName);

      let transformer = sharp(inputPath).resize(width);

      if (targetFormat === 'webp') {
        transformer = transformer.webp({ quality });
      } else if (targetFormat === 'avif') {
        transformer = transformer.avif({ quality });
      } else if (targetFormat === 'jpeg' || targetFormat === 'jpg') {
        transformer = transformer.jpeg({ quality });
      } else if (targetFormat === 'png') {
        transformer = transformer.png();
      }

      await transformer.toFile(outputPath);
      outputPaths.push(outputPath);
    }

    // Handle original file
    const originalHandled = await handleOriginalFile(inputPath, deleteOriginals, archiveDir);

    return {
      success: true,
      inputPath,
      outputPaths,
      originalHandled
    };
  } catch (error) {
    return {
      success: false,
      inputPath,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Resizes all images in a folder.
 */
export async function resizeImagesInFolders(
  sourceFolder: string,
  options: ImageResizerOptions & { skipConfirmation?: boolean; recursive?: boolean }
): Promise<ResizeResult[]> {
  const { skipConfirmation = false, recursive = true, ...resizerOptions } = options;

  try {
    const files = recursive ? await getAllFiles(sourceFolder) : (await fs.readdir(sourceFolder)).map(f => path.join(sourceFolder, f));
    const imagePaths = files
      .filter(file => IMAGE_EXTENSIONS.includes(path.extname(file).toLowerCase()))
      .filter(file => !isAlreadyResized(file));

    const results: ResizeResult[] = [];

    for (const imagePath of imagePaths) {
      const result = await resizeImage(imagePath, {
        ...resizerOptions,
        deleteOriginals: skipConfirmation ? resizerOptions.deleteOriginals : false,
        archiveDir: skipConfirmation ? resizerOptions.archiveDir : undefined,
      });
      results.push(result);
    }

    return results;
  } catch (error) {
    throw new Error(`Failed to process folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Handles original files after user review (for CLI use).
 */
export async function handleOriginalsAfterReview(
  results: ResizeResult[],
  deleteOriginals: boolean,
  archiveDir?: string
): Promise<ResizeResult[]> {
  for (const result of results) {
    if (result.success && result.inputPath) {
      result.originalHandled = await handleOriginalFile(
        result.inputPath,
        deleteOriginals,
        archiveDir
      );
    }
  }
  return results;
}
