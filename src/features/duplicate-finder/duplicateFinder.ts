import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import type { DuplicateOptions, DuplicateResult, DuplicateGroup } from '../../types';

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

async function getFileHash(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

async function updateAllReferences(
  replacements: Map<string, string>,
  referenceDirs: string[]
): Promise<number> {
  let updatedCount = 0;
  if (replacements.size === 0 || referenceDirs.length === 0) return 0;

  for (const dir of referenceDirs) {
    const files = await getAllFiles(dir, true);
    const referenceFiles = files.filter(f =>
      REFERENCE_FILE_EXTENSIONS.includes(path.extname(f).toLowerCase())
    );

    for (const file of referenceFiles) {
      try {
        let content = await fs.readFile(file, 'utf-8');
        const originalContent = content;

        for (const [oldName, newName] of replacements.entries()) {
          const escapedOldName = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          content = content.replace(new RegExp(escapedOldName, 'g'), newName);
        }

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

export async function findDuplicates(
  sourceFolder: string,
  options: DuplicateOptions = {}
): Promise<DuplicateResult> {
  const {
    recursive = true,
    referenceDirs = [],
    deleteDuplicates = false,
    archiveDir,
    outputFile,
    skipConfirmation = false
  } = options;

  try {
    // Validate source folder
    await fs.access(sourceFolder);
    const stats = await fs.stat(sourceFolder);
    if (!stats.isDirectory()) {
      throw new Error(`Source path is not a directory: ${sourceFolder}`);
    }

    const allFiles = await getAllFiles(sourceFolder, recursive);

    // Group by size first to avoid unnecessary hashing
    const sizeMap = new Map<number, string[]>();
    for (const filePath of allFiles) {
      try {
        const stats = await fs.stat(filePath);
        if (!sizeMap.has(stats.size)) {
          sizeMap.set(stats.size, []);
        }
        sizeMap.get(stats.size)!.push(filePath);
      } catch (err) {}
    }

    const groupsMap = new Map<string, { files: string[]; size: number }>();

    for (const [size, files] of sizeMap.entries()) {
      if (files.length > 1) {
        // Potential duplicates, must hash
        for (const filePath of files) {
          try {
            const hash = await getFileHash(filePath);
            if (!groupsMap.has(hash)) {
              groupsMap.set(hash, { files: [], size });
            }
            groupsMap.get(hash)!.files.push(filePath);
          } catch (err) {}
        }
      }
    }

    const duplicateGroups: DuplicateGroup[] = [];
    let totalDuplicates = 0;
    let totalSavings = 0;

    for (const [hash, info] of groupsMap.entries()) {
      if (info.files.length > 1) {
        // Sort files alphabetically to ensure deterministic "KEEP" choice
        info.files.sort();

        duplicateGroups.push({
          hash,
          files: info.files,
          size: info.size
        });
        totalDuplicates += info.files.length - 1;
        totalSavings += info.size * (info.files.length - 1);
      }
    }

    let removedCount = 0;
    let referencesUpdated = 0;

    // Handle destructive actions if skipConfirmation is true
    if (skipConfirmation && (deleteDuplicates || archiveDir)) {
      const handleResult = await handleDuplicates(duplicateGroups, {
        deleteDuplicates,
        archiveDir,
        referenceDirs
      });
      removedCount = handleResult.removedCount;
      referencesUpdated = handleResult.referencesUpdated;
    }

    const result: DuplicateResult = {
      success: true,
      groups: duplicateGroups,
      totalFiles: allFiles.length,
      totalDuplicates,
      totalSavings,
      removedCount: skipConfirmation ? removedCount : undefined,
      referencesUpdated: skipConfirmation ? referencesUpdated : undefined
    };

    if (outputFile) {
      await fs.writeFile(outputFile, JSON.stringify(result, null, 2));
    }

    return result;
  } catch (error) {
    return {
      success: false,
      groups: [],
      totalFiles: 0,
      totalDuplicates: 0,
      totalSavings: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function handleDuplicates(
  groups: DuplicateGroup[],
  options: { deleteDuplicates?: boolean; archiveDir?: string; referenceDirs?: string[] }
): Promise<{ removedCount: number; referencesUpdated: number }> {
  let removedCount = 0;
  const { deleteDuplicates, archiveDir, referenceDirs = [] } = options;

  if (!deleteDuplicates && !archiveDir) {
    return { removedCount, referencesUpdated: 0 };
  }

  const replacements = new Map<string, string>();

  // Collect all replacements first
  for (const group of groups) {
    const [keepFile, ...toRemove] = group.files;
    const keepFileName = path.basename(keepFile);

    for (const removeFile of toRemove) {
      replacements.set(path.basename(removeFile), keepFileName);
    }
  }

  // Update all references in one pass over the codebase
  const referencesUpdated = await updateAllReferences(replacements, referenceDirs);

  // Perform destructive actions
  for (const group of groups) {
    const [_, ...toRemove] = group.files;
    for (const removeFile of toRemove) {
      const removeFileName = path.basename(removeFile);

      if (deleteDuplicates) {
        await fs.unlink(removeFile);
        removedCount++;
      } else if (archiveDir) {
        await fs.mkdir(archiveDir, { recursive: true });
        const destPath = path.join(archiveDir, removeFileName);

        let finalDestPath = destPath;
        let counter = 1;
        while (true) {
          try {
            await fs.access(finalDestPath);
            const ext = path.extname(removeFileName);
            const name = path.basename(removeFileName, ext);
            finalDestPath = path.join(archiveDir, `${name}_${counter}${ext}`);
            counter++;
          } catch {
            break;
          }
        }

        await fs.rename(removeFile, finalDestPath);
        removedCount++;
      }
    }
  }

  return { removedCount, referencesUpdated };
}
