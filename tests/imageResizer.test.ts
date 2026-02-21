import { resizeImage, resizeImagesInFolders } from '../src/features/image-resizer/imageResizer';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

describe('imageResizer', () => {
  const testDir = path.join(__dirname, 'temp-resize-test');
  const testImagesDir = path.join(testDir, 'images');
  const testOutputDir = path.join(testDir, 'output');
  const testArchiveDir = path.join(testDir, 'archive');

  beforeEach(async () => {
    await fs.mkdir(testImagesDir, { recursive: true });
    await fs.mkdir(testOutputDir, { recursive: true });

    // Generate test images
    await sharp({
      create: {
        width: 1000,
        height: 1000,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    }).jpeg().toFile(path.join(testImagesDir, 'large.jpg'));
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  it('should resize image to a single width', async () => {
    const inputPath = path.join(testImagesDir, 'large.jpg');
    const result = await resizeImage(inputPath, {
      widths: [500],
      outputDir: testOutputDir
    });

    expect(result.success).toBe(true);
    expect(result.outputPaths).toHaveLength(1);
    expect(result.outputPaths![0]).toContain('large-500.jpg');

    const metadata = await sharp(result.outputPaths![0]).metadata();
    expect(metadata.width).toBe(500);
  });

  it('should resize image to multiple widths', async () => {
    const inputPath = path.join(testImagesDir, 'large.jpg');
    const result = await resizeImage(inputPath, {
      widths: [300, 600],
      outputDir: testOutputDir
    });

    expect(result.success).toBe(true);
    expect(result.outputPaths).toHaveLength(2);
    expect(result.outputPaths![0]).toContain('large-300.jpg');
    expect(result.outputPaths![1]).toContain('large-600.jpg');

    const meta1 = await sharp(result.outputPaths![0]).metadata();
    expect(meta1.width).toBe(300);
    const meta2 = await sharp(result.outputPaths![1]).metadata();
    expect(meta2.width).toBe(600);
  });

  it('should convert format during resizing', async () => {
    const inputPath = path.join(testImagesDir, 'large.jpg');
    const result = await resizeImage(inputPath, {
      widths: [400],
      format: 'webp',
      outputDir: testOutputDir
    });

    expect(result.success).toBe(true);
    expect(result.outputPaths![0]).toContain('large-400.webp');

    const metadata = await sharp(result.outputPaths![0]).metadata();
    expect(metadata.format).toBe('webp');
    expect(metadata.width).toBe(400);
  });

  it('should archive original files when specified', async () => {
    const inputPath = path.join(testImagesDir, 'large.jpg');
    const result = await resizeImage(inputPath, {
      widths: [200],
      outputDir: testOutputDir,
      archiveDir: testArchiveDir
    });

    expect(result.success).toBe(true);
    expect(result.originalHandled).toBe('archived');

    // Verify original is in archive
    await expect(fs.stat(path.join(testArchiveDir, 'large.jpg'))).resolves.toBeDefined();
    // Verify original is not in source
    await expect(fs.stat(inputPath)).rejects.toThrow();
  });

  it('should process all images in a folder', async () => {
    // Add another image
    await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 0, g: 0, b: 255 } }
    }).png().toFile(path.join(testImagesDir, 'small.png'));

    const results = await resizeImagesInFolders(testImagesDir, {
      widths: [50],
      outputDir: testOutputDir
    });

    expect(results).toHaveLength(2);
    expect(results.every(r => r.success)).toBe(true);

    await expect(fs.stat(path.join(testOutputDir, 'large-50.jpg'))).resolves.toBeDefined();
    await expect(fs.stat(path.join(testOutputDir, 'small-50.png'))).resolves.toBeDefined();
  });

  it('should process images recursively', async () => {
    const subDir = path.join(testImagesDir, 'subdir');
    await fs.mkdir(subDir, { recursive: true });
    await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 0, g: 255, b: 0 } }
    }).jpeg().toFile(path.join(subDir, 'sub.jpg'));

    const results = await resizeImagesInFolders(testImagesDir, {
      widths: [50],
      outputDir: testOutputDir,
      recursive: true
    });

    const subResult = results.find(r => r.inputPath.includes('sub.jpg'));
    expect(subResult).toBeDefined();
    expect(subResult?.success).toBe(true);
    await expect(fs.stat(path.join(testOutputDir, 'sub-50.jpg'))).resolves.toBeDefined();
  });

  it('should skip already resized images', async () => {
    // Create an image that looks like it was already resized
    const alreadyResizedPath = path.join(testImagesDir, 'image-300.jpg');
    await sharp({
      create: { width: 300, height: 300, channels: 3, background: { r: 0, g: 0, b: 0 } }
    }).jpeg().toFile(alreadyResizedPath);

    const results = await resizeImagesInFolders(testImagesDir, {
      widths: [150],
      outputDir: testOutputDir
    });

    // It should find large.jpg but NOT image-300.jpg
    expect(results.some(r => r.inputPath.includes('large.jpg'))).toBe(true);
    expect(results.some(r => r.inputPath.includes('image-300.jpg'))).toBe(false);
  });
});
