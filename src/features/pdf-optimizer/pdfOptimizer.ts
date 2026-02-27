import { PDFDocument } from 'pdf-lib';
import path from 'path';
import fs from 'fs/promises';
import type { PdfOptimizerOptions, PdfOptimizerResult } from '../../types';

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
    // Use copy + unlink instead of rename to handle cross-device moves
    await fs.copyFile(inputPath, archivePath);
    await fs.unlink(inputPath);
    return 'archived';
  }
  return 'kept';
}

export async function optimizePdf(
  inputPath: string,
  options: PdfOptimizerOptions = {}
): Promise<PdfOptimizerResult> {
  try {
    const {
      outputDir,
      deleteOriginals = false,
      archiveDir
    } = options;

    const pdfBuffer = await fs.readFile(inputPath);
    const originalSize = pdfBuffer.length;

    const pdfDoc = await PDFDocument.load(pdfBuffer);

    // PDF optimization in pdf-lib mostly involves:
    // 1. Removing metadata (optional but reduces size)
    // 2. Saving with object stream compression (useObjectStreams: true)

    // Clear metadata
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('');
    pdfDoc.setCreator('');
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());

    const optimizedPdfBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    const optimizedSize = optimizedPdfBytes.length;

    const parsedPath = path.parse(inputPath);
    const outputPath = path.join(
      outputDir || parsedPath.dir,
      parsedPath.base
    );

    if (outputDir) {
      await fs.mkdir(outputDir, { recursive: true });
    }

    await fs.writeFile(outputPath, optimizedPdfBytes);

    let originalHandled: 'deleted' | 'archived' | 'kept' = 'kept';
    // If output is different from input, we can handle the original
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
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function optimizePdfs(
  inputPaths: string[],
  options: PdfOptimizerOptions
): Promise<PdfOptimizerResult[]> {
  return Promise.all(inputPaths.map(path => optimizePdf(path, options)));
}

export async function optimizePdfsInFolders(
  sourceFolder: string,
  options: PdfOptimizerOptions & { skipConfirmation?: boolean } = {}
): Promise<PdfOptimizerResult[]> {
  const {
    outputDir,
    deleteOriginals = false,
    archiveDir,
    skipConfirmation = false
  } = options;

  const files = await getAllFiles(sourceFolder);
  const pdfPaths = files
    .filter(file => path.extname(file).toLowerCase() === '.pdf');

  // First optimize without deleting/archiving if not skipping confirmation
  const results = await optimizePdfs(pdfPaths, {
    outputDir,
    deleteOriginals: skipConfirmation ? deleteOriginals : false,
    archiveDir: skipConfirmation ? archiveDir : undefined,
  });

  return results;
}

export async function handleOriginalsAfterReview(
  results: PdfOptimizerResult[],
  deleteOriginals: boolean,
  archiveDir?: string
): Promise<PdfOptimizerResult[]> {
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
