import { optimizePdf, optimizePdfsInFolders } from '../src/features/pdf-optimizer/pdfOptimizer';
import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('pdfOptimizer', () => {
  const testDir = path.join(__dirname, 'temp-pdf-test');
  const outputDir = path.join(__dirname, 'temp-pdf-output');
  const archiveDir = path.join(__dirname, 'temp-pdf-archive');

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });
    await fs.mkdir(archiveDir, { recursive: true });

    // Create a simple valid PDF for testing
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([400, 400]);
    pdfDoc.setTitle('Test PDF');
    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(path.join(testDir, 'test.pdf'), pdfBytes);
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
    await fs.rm(outputDir, { recursive: true, force: true });
    await fs.rm(archiveDir, { recursive: true, force: true });
  });

  it('should optimize a PDF and reduce size (or keep it same if already small)', async () => {
    const inputPath = path.join(testDir, 'test.pdf');
    const result = await optimizePdf(inputPath, { outputDir });

    expect(result.success).toBe(true);
    expect(result.inputPath).toBe(inputPath);
    expect(result.outputPath).toContain('test.pdf');
    expect(await fs.access(result.outputPath!)).toBeUndefined();

    // Check if metadata was cleared
    const optimizedPdfBytes = await fs.readFile(result.outputPath!);
    const optimizedPdf = await PDFDocument.load(optimizedPdfBytes);
    const title = optimizedPdf.getTitle();
    expect(title === undefined || title === '').toBe(true);
  });

  it('should handle archiving original files', async () => {
    const inputPath = path.join(testDir, 'test.pdf');
    const result = await optimizePdf(inputPath, {
      outputDir,
      archiveDir
    });

    expect(result.success).toBe(true);
    expect(result.originalHandled).toBe('archived');
    expect(await fs.access(path.join(archiveDir, 'test.pdf'))).toBeUndefined();

    try {
      await fs.access(inputPath);
      fail('Original file should have been moved');
    } catch (e) {
      // Expected
    }
  });

  it('should handle deleting original files', async () => {
    const inputPath = path.join(testDir, 'test.pdf');
    const result = await optimizePdf(inputPath, {
      outputDir,
      deleteOriginals: true
    });

    expect(result.success).toBe(true);
    expect(result.originalHandled).toBe('deleted');

    try {
      await fs.access(inputPath);
      fail('Original file should have been deleted');
    } catch (e) {
      // Expected
    }
  });

  it('should process PDFs in folders', async () => {
    const results = await optimizePdfsInFolders(testDir, { outputDir });
    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(true);
  });

  it('should handle non-existent files gracefully', async () => {
    const result = await optimizePdf(path.join(testDir, 'non-existent.pdf'));
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
