import { convertImage, convertImagesInFolders } from '../src/features/image-converter/imageConverter';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

describe('imageConverter', () => {
  const testDir = path.join(__dirname, 'temp-test-data');
  const testImagesDir = path.join(testDir, 'images');
  const testOutputDir = path.join(testDir, 'output');
  const testRefsDir = path.join(testDir, 'refs');
  const testArchiveDir = path.join(testDir, 'archive');

  beforeEach(async () => {
    await fs.mkdir(testImagesDir, { recursive: true });
    await fs.mkdir(testOutputDir, { recursive: true });
    await fs.mkdir(testRefsDir, { recursive: true });

    // Generate test images programmatically
    await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    }).jpeg().toFile(path.join(testImagesDir, 'test1.jpg'));

    await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 0, g: 255, b: 0, alpha: 1 }
      }
    }).png().toFile(path.join(testImagesDir, 'test2.png'));

    // Generate test reference files
    await fs.writeFile(
      path.join(testRefsDir, 'component.tsx'),
      `import Image from 'next/image';\n\nexport default function Hero() {\n  return <Image src="/test1.jpg" alt="test" />;\n}`
    );

    await fs.writeFile(
      path.join(testRefsDir, 'styles.css'),
      `.hero { background-image: url('/test2.png'); }`
    );
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  it('should convert image to webp format', async () => {
    const inputPath = path.join(testImagesDir, 'test1.jpg');
    const result = await convertImage(inputPath, {
      format: 'webp',
      quality: 80,
      outputDir: testOutputDir,
    });

    expect(result.success).toBe(true);
    expect(result.outputPath).toBeDefined();
    
    // Verify output file exists
    const stats = await fs.stat(result.outputPath!);
    expect(stats.isFile()).toBe(true);
  });

  it('should convert image to avif format', async () => {
    const inputPath = path.join(testImagesDir, 'test2.png');
    const result = await convertImage(inputPath, {
      format: 'avif',
      quality: 80,
      outputDir: testOutputDir,
    });

    expect(result.success).toBe(true);
    expect(result.outputPath).toContain('.avif');
  });

  it('should update references in code files', async () => {
    const inputPath = path.join(testImagesDir, 'test1.jpg');
    const result = await convertImage(inputPath, {
      format: 'webp',
      quality: 80,
      outputDir: testOutputDir,
      referenceDirs: [testRefsDir],
    });

    expect(result.success).toBe(true);
    expect(result.referencesUpdated).toBeGreaterThan(0);

    // Verify reference was updated
    const componentContent = await fs.readFile(
      path.join(testRefsDir, 'component.tsx'),
      'utf-8'
    );
    expect(componentContent).toContain('test1.webp');
    expect(componentContent).not.toContain('test1.jpg');
  });

  it('should handle multiple reference directories', async () => {
    const inputPath = path.join(testImagesDir, 'test2.png');
    const result = await convertImage(inputPath, {
      format: 'webp',
      quality: 80,
      outputDir: testOutputDir,
      referenceDirs: [testRefsDir],
    });

    expect(result.success).toBe(true);
    
    const cssContent = await fs.readFile(
      path.join(testRefsDir, 'styles.css'),
      'utf-8'
    );
    expect(cssContent).toContain('test2.webp');
  });

  it('should archive original files when specified', async () => {
    const inputPath = path.join(testImagesDir, 'test1.jpg');
    const result = await convertImage(inputPath, {
      format: 'webp',
      quality: 80,
      outputDir: testOutputDir,
      archiveDir: testArchiveDir,
    });

    expect(result.success).toBe(true);
    expect(result.originalHandled).toBe('archived');

    // Verify original is in archive
    const archivedPath = path.join(testArchiveDir, 'test1.jpg');
    const stats = await fs.stat(archivedPath);
    expect(stats.isFile()).toBe(true);

    // Verify original is not in source
    await expect(fs.stat(inputPath)).rejects.toThrow();
  });

  it('should delete original files when specified', async () => {
    const inputPath = path.join(testImagesDir, 'test2.png');
    const result = await convertImage(inputPath, {
      format: 'webp',
      quality: 80,
      outputDir: testOutputDir,
      deleteOriginals: true,
    });

    expect(result.success).toBe(true);
    expect(result.originalHandled).toBe('deleted');

    // Verify original is deleted
    await expect(fs.stat(inputPath)).rejects.toThrow();
  });

  it('should convert all images in folder', async () => {
    const results = await convertImagesInFolders(
      testImagesDir,
      testOutputDir,
      [],
      'webp',
      80
    );

    expect(results.length).toBe(2);
    expect(results.every(r => r.success)).toBe(true);
  });

  it('should handle non-existent file gracefully', async () => {
    const result = await convertImage('non-existent.jpg', {
      format: 'webp',
      quality: 80,
      outputDir: testOutputDir,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle empty folder', async () => {
    const emptyDir = path.join(testDir, 'empty');
    await fs.mkdir(emptyDir, { recursive: true });

    const results = await convertImagesInFolders(emptyDir, testOutputDir);

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });
});
