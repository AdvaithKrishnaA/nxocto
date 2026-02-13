import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import type { ImageConversionOptions, ConversionResult, ReferenceUpdate } from '../../types';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.tiff', '.bmp'];
const REFERENCE_FILE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.css', '.scss', '.html', '.md', '.json'];

async function updateReferences(
  oldPath: string,
  newPath: string,
  referenceDirs: string[]
): Promise<number> {
  let updatedCount = 0;
  const oldFileName = path.basename(oldPath);
  const newFileName = path.basename(newPath);

  for (const dir of referenceDirs) {
    const files = await getAllFiles(dir);
    const referenceFiles = files.filter(f => 
      REFERENCE_FILE_EXTENSIONS.includes(path.extname(f).toLowerCase())
    );

    for (const file of referenceFiles) {
      try {
        let content = await fs.readFile(file, 'utf-8');
        const originalContent = content;
        
        // Replace various reference patterns
        content = content.replace(
          new RegExp(oldFileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          newFileName
        );

        if (content !== originalContent) {
          await fs.writeFile(file, content, 'utf-8');
          updatedCount++;
        }
      } catch (err) {
        // Skip files that can't be read/written
      }
    }
  }

  return updatedCount;
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

export async function convertImage(
  inputPath: string,
  options: ImageConversionOptions
): Promise<ConversionResult> {
  try {
    const { 
      format, 
      quality = 80, 
      outputDir,
      referenceDirs = [],
      deleteOriginals = false,
      archiveDir
    } = options;
    
    const parsedPath = path.parse(inputPath);
    const outputPath = path.join(
      outputDir || parsedPath.dir,
      `${parsedPath.name}.${format}`
    );

    if (outputDir) {
      await fs.mkdir(outputDir, { recursive: true });
    }

    const converter = sharp(inputPath);
    
    if (format === 'webp') {
      await converter.webp({ quality }).toFile(outputPath);
    } else if (format === 'avif') {
      await converter.avif({ quality }).toFile(outputPath);
    }

    // Update references if directories specified
    let referencesUpdated = 0;
    if (referenceDirs.length > 0) {
      referencesUpdated = await updateReferences(inputPath, outputPath, referenceDirs);
    }

    // Handle original file
    const originalHandled = await handleOriginalFile(inputPath, deleteOriginals, archiveDir);

    return { 
      success: true, 
      inputPath, 
      outputPath,
      referencesUpdated,
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

export async function convertImages(
  inputPaths: string[],
  options: ImageConversionOptions
): Promise<ConversionResult[]> {
  return Promise.all(inputPaths.map(path => convertImage(path, options)));
}

export async function convertImagesInFolders(
  sourceFolder: string,
  outputFolder?: string,
  referenceDirs: string[] = [],
  format: 'webp' | 'avif' = 'webp',
  quality: number = 80,
  deleteOriginals: boolean = false,
  archiveDir?: string,
  skipConfirmation: boolean = false
): Promise<ConversionResult[]> {
  const files = await fs.readdir(sourceFolder);
  const imagePaths = files
    .filter(file => IMAGE_EXTENSIONS.includes(path.extname(file).toLowerCase()))
    .map(file => path.join(sourceFolder, file));

  // First convert without deleting/archiving
  const results = await convertImages(imagePaths, {
    format,
    quality,
    outputDir: outputFolder,
    referenceDirs,
    deleteOriginals: false,
    archiveDir: undefined,
  });

  // If delete or archive is requested and not skipping confirmation, return results for review
  // The CLI will handle the confirmation and call handleOriginalFiles separately
  if ((deleteOriginals || archiveDir) && !skipConfirmation) {
    return results;
  }

  // If skipConfirmation is true, handle originals immediately
  if (skipConfirmation && (deleteOriginals || archiveDir)) {
    for (const result of results) {
      if (result.success && result.inputPath) {
        result.originalHandled = await handleOriginalFile(
          result.inputPath,
          deleteOriginals,
          archiveDir
        );
      }
    }
  }

  return results;
}

export async function handleOriginalsAfterReview(
  results: ConversionResult[],
  deleteOriginals: boolean,
  archiveDir?: string
): Promise<ConversionResult[]> {
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
