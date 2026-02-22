import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import type { PdfOptimizerOptions, PdfOptimizerResult } from '../../types';

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

    // Conflict resolution for archive
    let finalArchivePath = archivePath;
    let counter = 1;
    while (true) {
      try {
        await fs.access(finalArchivePath);
        const ext = path.extname(fileName);
        const name = path.basename(fileName, ext);
        finalArchivePath = path.join(archiveDir, `${name}_${counter}${ext}`);
        counter++;
      } catch {
        break;
      }
    }

    await fs.rename(inputPath, finalArchivePath);
    return 'archived';
  }
  return 'kept';
}

export async function optimizePdf(
  inputPath: string,
  options: PdfOptimizerOptions = {}
): Promise<PdfOptimizerResult> {
  try {
    const { outputDir, deleteOriginals = false, archiveDir } = options;
    const originalStats = await fs.stat(inputPath);
    const originalSize = originalStats.size;

    const pdfBytes = await fs.readFile(inputPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Basic optimization by removing unused objects
    const optimizedBytes = await pdfDoc.save();

    const parsedPath = path.parse(inputPath);
    const outputPath = path.join(
      outputDir || parsedPath.dir,
      parsedPath.base
    );

    if (outputDir) {
      await fs.mkdir(outputDir, { recursive: true });
    }

    await fs.writeFile(outputPath, optimizedBytes);

    const optimizedStats = await fs.stat(outputPath);
    const optimizedSize = optimizedStats.size;

    let originalHandled: 'deleted' | 'archived' | 'kept' = 'kept';
    if (path.resolve(inputPath) !== path.resolve(outputPath)) {
      originalHandled = await handleOriginalFile(inputPath, deleteOriginals, archiveDir);
    }

    return {
      success: true,
      inputPath,
      outputPath,
      originalHandled,
      originalSize,
      optimizedSize
    };
  } catch (error) {
    return {
      success: false,
      inputPath,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function optimizePdfsInFolders(
  sourceFolder: string,
  options: PdfOptimizerOptions = {}
): Promise<PdfOptimizerResult[]> {
  const { recursive = true, skipConfirmation = false, deleteOriginals = false, archiveDir } = options;

  // Validate source folder
  await fs.access(sourceFolder);
  const stats = await fs.stat(sourceFolder);
  if (!stats.isDirectory()) {
    throw new Error(`Source path is not a directory: ${sourceFolder}`);
  }

  const allFiles = await getAllFiles(sourceFolder, recursive);
  const pdfFiles = allFiles.filter(f => path.extname(f).toLowerCase() === '.pdf');

  const results: PdfOptimizerResult[] = [];

  for (const filePath of pdfFiles) {
    const res = await optimizePdf(filePath, {
      ...options,
      deleteOriginals: skipConfirmation ? deleteOriginals : false,
      archiveDir: skipConfirmation ? archiveDir : undefined
    });
    results.push(res);
  }

  return results;
}

export async function handleOriginalsAfterReview(
  results: PdfOptimizerResult[],
  deleteOriginals: boolean,
  archiveDir?: string
): Promise<PdfOptimizerResult[]> {
  for (const result of results) {
    if (result.success && result.inputPath && result.outputPath) {
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
