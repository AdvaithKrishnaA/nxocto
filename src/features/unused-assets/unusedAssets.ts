import fs from 'fs/promises';
import path from 'path';
import type { UnusedAssetsOptions, UnusedAssetResult } from '../../types';

const REFERENCE_FILE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.css', '.scss', '.html', '.md', '.json'];

async function getAllFiles(dir: string, recursive: boolean = true): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (recursive) {
          files.push(...await getAllFiles(fullPath, recursive));
        }
      } else {
        files.push(fullPath);
      }
    }
  } catch (err) {
    // Skip directories that can't be read
  }

  return files;
}

export async function findUnusedAssets(
  sourceFolder: string,
  options: UnusedAssetsOptions
): Promise<UnusedAssetResult> {
  const {
    referenceDirs,
    deleteUnused = false,
    archiveDir,
    outputFile,
    recursive = true
  } = options;

  try {
    const assetFiles = await getAllFiles(sourceFolder, recursive);
    const unusedAssets: string[] = [];

    if (assetFiles.length === 0) {
      return {
        success: true,
        unusedAssets: [],
        totalAssets: 0,
        referenceDirs
      };
    }

    // Load all code files into memory for faster searching
    // We'll read them once and concatenate
    let allCodeContent = '';
    for (const dir of referenceDirs) {
      const files = await getAllFiles(dir, true);
      const codeFiles = files.filter(f =>
        REFERENCE_FILE_EXTENSIONS.includes(path.extname(f).toLowerCase())
      );

      for (const file of codeFiles) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          allCodeContent += content + '\n';
        } catch (err) {
          // Skip files that can't be read
        }
      }
    }

    // Check each asset
    for (const assetPath of assetFiles) {
      const fileName = path.basename(assetPath);

      // Use includes for better performance than regex if we don't need word boundaries
      // but regex is safer if we want to avoid partial matches (e.g. 'logo.png' matching 'my-logo.png')
      // However, image-converter uses regex with no word boundaries, so let's stick to that for now
      // or actually, let's use includes to be simple and fast.
      if (!allCodeContent.includes(fileName)) {
        unusedAssets.push(assetPath);
      }
    }

    let deletedCount = 0;
    let archivedTo: string | undefined;

    // We only perform destructive actions if explicitly requested via options
    // The CLI should handle confirmation before setting these to true
    if (unusedAssets.length > 0) {
      if (deleteUnused) {
        for (const assetPath of unusedAssets) {
          await fs.unlink(assetPath);
          deletedCount++;
        }
      } else if (archiveDir) {
        await fs.mkdir(archiveDir, { recursive: true });
        for (const assetPath of unusedAssets) {
          const fileName = path.basename(assetPath);
          const destPath = path.join(archiveDir, fileName);

          // Basic conflict resolution for archive
          let finalDestPath = destPath;
          let counter = 1;
          while (true) {
            try {
              await fs.access(finalDestPath);
              const ext = path.extname(fileName);
              const name = path.basename(fileName, ext);
              finalDestPath = path.join(archiveDir, `${name}_${counter}${ext}`);
              counter++;
            } catch {
              break;
            }
          }

          // Use copy + unlink to handle cross-device moves
          await fs.copyFile(assetPath, finalDestPath);
          await fs.unlink(assetPath);
        }
        archivedTo = archiveDir;
      }
    }

    const result: UnusedAssetResult = {
      success: true,
      unusedAssets,
      totalAssets: assetFiles.length,
      referenceDirs,
      deletedCount: deleteUnused ? deletedCount : undefined,
      archivedTo
    };

    if (outputFile) {
      await fs.writeFile(outputFile, JSON.stringify(result, null, 2));
    }

    return result;
  } catch (error) {
    return {
      success: false,
      unusedAssets: [],
      totalAssets: 0,
      referenceDirs,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function handleUnusedAssets(
  unusedAssets: string[],
  options: { deleteUnused?: boolean; archiveDir?: string }
): Promise<{ deletedCount: number; archivedTo?: string }> {
  let deletedCount = 0;
  let archivedTo: string | undefined;

  if (options.deleteUnused) {
    for (const assetPath of unusedAssets) {
      await fs.unlink(assetPath);
      deletedCount++;
    }
  } else if (options.archiveDir) {
    const archiveDir = options.archiveDir;
    await fs.mkdir(archiveDir, { recursive: true });
    for (const assetPath of unusedAssets) {
      const fileName = path.basename(assetPath);
      const destPath = path.join(archiveDir, fileName);

      let finalDestPath = destPath;
      let counter = 1;
      while (true) {
        try {
          await fs.access(finalDestPath);
          const ext = path.extname(fileName);
          const name = path.basename(fileName, ext);
          finalDestPath = path.join(archiveDir, `${name}_${counter}${ext}`);
          counter++;
        } catch {
          break;
        }
      }

      await fs.copyFile(assetPath, finalDestPath);
      await fs.unlink(assetPath);
    }
    archivedTo = archiveDir;
  }

  return { deletedCount, archivedTo };
}
