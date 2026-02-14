import { optimize } from 'svgo';
import path from 'path';
import fs from 'fs/promises';
import type { SvgOptimizerOptions, SvgOptimizerResult } from '../../types';

const REFERENCE_FILE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.css', '.scss', '.html', '.md', '.json'];

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

async function updateReferences(
  oldPath: string,
  newPath: string,
  referenceDirs: string[]
): Promise<number> {
  let updatedCount = 0;
  const oldFileName = path.basename(oldPath);
  const newFileName = path.basename(newPath);

  // If filename hasn't changed (which is true for optimize-svg unless output is different),
  // we might still want to call this if we support format changes in future,
  // but for now let's keep it for consistency with imageConverter.
  if (oldFileName === newFileName) return 0;

  for (const dir of referenceDirs) {
    const files = await getAllFiles(dir);
    const referenceFiles = files.filter(f =>
      REFERENCE_FILE_EXTENSIONS.includes(path.extname(f).toLowerCase())
    );

    for (const file of referenceFiles) {
      try {
        let content = await fs.readFile(file, 'utf-8');
        const originalContent = content;

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
    // Use copy + unlink instead of rename to handle cross-device moves
    await fs.copyFile(inputPath, archivePath);
    await fs.unlink(inputPath);
    return 'archived';
  }
  return 'kept';
}

export async function optimizeSvg(
  inputPath: string,
  options: SvgOptimizerOptions = {}
): Promise<SvgOptimizerResult> {
  try {
    const {
      multipass = true,
      floatPrecision = 2,
      outputDir,
      referenceDirs = [],
      deleteOriginals = false,
      archiveDir
    } = options;

    const svgData = await fs.readFile(inputPath, 'utf-8');
    const originalSize = Buffer.byteLength(svgData);

    const result = optimize(svgData, {
      path: inputPath,
      multipass,
      js2svg: {
        indent: 2,
        pretty: false,
      },
      plugins: [
        {
          name: 'preset-default',
          params: {
            overrides: {
              cleanupNumericValues: {
                floatPrecision,
              },
              convertPathData: {
                floatPrecision,
              },
            },
          },
        },
      ],
    });

    if ('data' in result) {
      const optimizedSvg = result.data;
      const optimizedSize = Buffer.byteLength(optimizedSvg);

      const parsedPath = path.parse(inputPath);
      const outputPath = path.join(
        outputDir || parsedPath.dir,
        parsedPath.base
      );

      if (outputDir) {
        await fs.mkdir(outputDir, { recursive: true });
      }

      // If output is same as input, we should only write if it's actually smaller or if explicitly asked
      // But for simplicity, we'll write it.
      await fs.writeFile(outputPath, optimizedSvg, 'utf-8');

      let referencesUpdated = 0;
      if (referenceDirs.length > 0) {
        referencesUpdated = await updateReferences(inputPath, outputPath, referenceDirs);
      }

      let originalHandled: 'deleted' | 'archived' | 'kept' = 'kept';
      // If output is different from input, we can handle the original
      if (path.resolve(inputPath) !== path.resolve(outputPath)) {
        originalHandled = await handleOriginalFile(inputPath, deleteOriginals, archiveDir);
      }

      return {
        success: true,
        inputPath,
        outputPath,
        referencesUpdated,
        originalHandled,
        originalSize,
        optimizedSize
      };
    } else {
      throw new Error('Optimization failed to produce data');
    }
  } catch (error) {
    return {
      success: false,
      inputPath,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function optimizeSvgs(
  inputPaths: string[],
  options: SvgOptimizerOptions
): Promise<SvgOptimizerResult[]> {
  return Promise.all(inputPaths.map(path => optimizeSvg(path, options)));
}

export async function optimizeSvgsInFolders(
  sourceFolder: string,
  options: SvgOptimizerOptions & { skipConfirmation?: boolean } = {}
): Promise<SvgOptimizerResult[]> {
  const {
    outputDir,
    referenceDirs = [],
    multipass = true,
    floatPrecision = 2,
    deleteOriginals = false,
    archiveDir,
    skipConfirmation = false
  } = options;

  const files = await getAllFiles(sourceFolder);
  const svgPaths = files
    .filter(file => path.extname(file).toLowerCase() === '.svg');

  // First optimize without deleting/archiving if not skipping confirmation
  const results = await optimizeSvgs(svgPaths, {
    multipass,
    floatPrecision,
    outputDir,
    referenceDirs,
    deleteOriginals: skipConfirmation ? deleteOriginals : false,
    archiveDir: skipConfirmation ? archiveDir : undefined,
  });

  return results;
}

export async function handleOriginalsAfterReview(
  results: SvgOptimizerResult[],
  deleteOriginals: boolean,
  archiveDir?: string
): Promise<SvgOptimizerResult[]> {
  for (const result of results) {
    if (result.success && result.inputPath && result.outputPath) {
      // Only handle if input and output are different
      if (path.resolve(result.inputPath) !== path.resolve(result.outputPath)) {
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
