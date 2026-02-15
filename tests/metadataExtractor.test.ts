import { extractMetadata } from '../src/features/metadata-extractor/metadataExtractor';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

describe('metadataExtractor', () => {
  const testDir = path.join(__dirname, 'temp-metadata-test');
  const outputFile = path.join(testDir, 'metadata.json');

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });

    // Create a test image
    await sharp({
      create: {
        width: 100,
        height: 50,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    }).jpeg().toFile(path.join(testDir, 'test.jpg'));

    // Create a test SVG
    await fs.writeFile(
      path.join(testDir, 'test.svg'),
      '<svg width="200" height="100"><rect width="200" height="100" fill="blue" /></svg>'
    );

    // Create a subdirectory with an image
    const subDir = path.join(testDir, 'subdir');
    await fs.mkdir(subDir, { recursive: true });
    await sharp({
      create: {
        width: 300,
        height: 200,
        channels: 3,
        background: { r: 0, g: 255, b: 0 }
      }
    }).png().toFile(path.join(subDir, 'sub.png'));
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  it('should extract metadata from all assets in a folder', async () => {
    const result = await extractMetadata(testDir, { outputFile });

    expect(result.success).toBe(true);
    expect(result.count).toBe(3);
    expect(result.outputFile).toBe(outputFile);

    const metadata = JSON.parse(await fs.readFile(outputFile, 'utf-8'));

    expect(metadata['test.jpg']).toBeDefined();
    expect(metadata['test.jpg'].width).toBe(100);
    expect(metadata['test.jpg'].height).toBe(50);
    expect(metadata['test.jpg'].format).toBe('jpeg');
    expect(metadata['test.jpg'].size).toBeGreaterThan(0);
    expect(metadata['test.jpg'].aspectRatio).toBe(2);

    expect(metadata['test.svg']).toBeDefined();
    expect(metadata['test.svg'].width).toBe(200);
    expect(metadata['test.svg'].height).toBe(100);

    expect(metadata['subdir/sub.png']).toBeDefined();
    expect(metadata['subdir/sub.png'].width).toBe(300);
    expect(metadata['subdir/sub.png'].height).toBe(200);
    expect(metadata['subdir/sub.png'].format).toBe('png');
  });

  it('should respect the recursive option', async () => {
    const result = await extractMetadata(testDir, { outputFile, recursive: false });

    expect(result.count).toBe(2);
    const metadata = JSON.parse(await fs.readFile(outputFile, 'utf-8'));
    expect(metadata['test.jpg']).toBeDefined();
    expect(metadata['test.svg']).toBeDefined();
    expect(metadata['subdir/sub.png']).toBeUndefined();
  });

  it('should respect the includeSize option', async () => {
    await extractMetadata(testDir, { outputFile, includeSize: false });
    const metadata = JSON.parse(await fs.readFile(outputFile, 'utf-8'));
    expect(metadata['test.jpg'].size).toBeUndefined();
  });

  it('should handle errors gracefully for non-existent directories', async () => {
    await expect(extractMetadata(path.join(testDir, 'non-existent')))
      .rejects.toThrow('Failed to extract metadata');
  });

  it('should skip invalid files and continue', async () => {
    await fs.writeFile(path.join(testDir, 'invalid.jpg'), 'not an image');
    const result = await extractMetadata(testDir, { outputFile });

    // Should still process the 3 valid files
    expect(result.count).toBe(3);
  });
});
