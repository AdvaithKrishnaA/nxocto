import { optimizePdf, optimizePdfsInFolders } from '../src/features/pdf-optimizer/pdfOptimizer';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

describe('pdfOptimizer', () => {
  const testDir = path.join(__dirname, 'temp-pdf-test');
  const pdfsDir = path.join(testDir, 'pdfs');
  const outputDir = path.join(testDir, 'output');
  const archiveDir = path.join(testDir, 'archive');

  async function createTestPdf(filePath: string) {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([600, 400]);
    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(filePath, pdfBytes);
  }

  beforeEach(async () => {
    await fs.mkdir(pdfsDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });
    await createTestPdf(path.join(pdfsDir, 'test1.pdf'));
    await createTestPdf(path.join(pdfsDir, 'test2.pdf'));
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  it('should optimize a PDF file', async () => {
    const inputPath = path.join(pdfsDir, 'test1.pdf');
    const result = await optimizePdf(inputPath, { outputDir });

    expect(result.success).toBe(true);
    expect(result.originalSize).toBeGreaterThan(0);
    expect(result.optimizedSize).toBeGreaterThan(0);

    const stats = await fs.stat(result.outputPath!);
    expect(stats.isFile()).toBe(true);
  });

  it('should delete originals when specified', async () => {
    const inputPath = path.join(pdfsDir, 'test1.pdf');
    const result = await optimizePdf(inputPath, {
      outputDir,
      deleteOriginals: true
    });

    expect(result.success).toBe(true);
    expect(result.originalHandled).toBe('deleted');
    await expect(fs.stat(inputPath)).rejects.toThrow();
  });

  it('should archive originals when specified', async () => {
    const inputPath = path.join(pdfsDir, 'test1.pdf');
    const result = await optimizePdf(inputPath, {
      outputDir,
      archiveDir
    });

    expect(result.success).toBe(true);
    expect(result.originalHandled).toBe('archived');

    const archivedPath = path.join(archiveDir, 'test1.pdf');
    const stats = await fs.stat(archivedPath);
    expect(stats.isFile()).toBe(true);
    await expect(fs.stat(inputPath)).rejects.toThrow();
  });

  it('should optimize all PDFs in folder', async () => {
    const results = await optimizePdfsInFolders(pdfsDir, { outputDir });
    expect(results).toHaveLength(2);
    expect(results.every(r => r.success)).toBe(true);
  });

  it('should handle errors gracefully', async () => {
    const result = await optimizePdf('non-existent.pdf');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
