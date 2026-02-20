import { generatePlaceholders } from '../src/features/placeholder-generator/placeholderGenerator';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

describe('placeholderGenerator', () => {
  const testDir = path.join(__dirname, 'temp-placeholder-test');
  const imagesDir = path.join(testDir, 'images');
  const outputFile = path.join(testDir, 'placeholders.json');

  beforeEach(async () => {
    await fs.mkdir(imagesDir, { recursive: true });

    // Create test images
    await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    }).jpeg().toFile(path.join(imagesDir, 'test1.jpg'));

    await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 0, g: 255, b: 0 }
      }
    }).png().toFile(path.join(imagesDir, 'test2.png'));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should generate placeholders for all images in a directory', async () => {
    const result = await generatePlaceholders(imagesDir, { outputFile });

    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
    expect(Object.keys(result.data)).toHaveLength(2);
    expect(result.data['test1.jpg']).toContain('data:image/jpeg;base64,');
    expect(result.data['test2.png']).toContain('data:image/png;base64,');

    // Verify output file
    const fileContent = JSON.parse(await fs.readFile(outputFile, 'utf-8'));
    expect(fileContent).toEqual(result.data);
  });

  it('should respect the size option', async () => {
    // We can't easily verify the internal size of the base64 image here without decoding it,
    // but we can verify it runs with the option.
    const result = await generatePlaceholders(imagesDir, { outputFile, size: 5 });
    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
  });

  it('should handle recursive scanning', async () => {
    const subDir = path.join(imagesDir, 'sub');
    await fs.mkdir(subDir);
    await sharp({
      create: {
        width: 50,
        height: 50,
        channels: 3,
        background: { r: 0, g: 0, b: 255 }
      }
    }).jpeg().toFile(path.join(subDir, 'test3.jpg'));

    const result = await generatePlaceholders(imagesDir, { outputFile, recursive: true });
    expect(result.count).toBe(3);
    expect(result.data[path.join('sub', 'test3.jpg')]).toBeDefined();
  });

  it('should disable recursive scanning when requested', async () => {
    const subDir = path.join(imagesDir, 'sub');
    await fs.mkdir(subDir);
    await sharp({
      create: {
        width: 50,
        height: 50,
        channels: 3,
        background: { r: 0, g: 0, b: 255 }
      }
    }).jpeg().toFile(path.join(subDir, 'test3.jpg'));

    const result = await generatePlaceholders(imagesDir, { outputFile, recursive: false });
    expect(result.count).toBe(2);
    expect(result.data[path.join('sub', 'test3.jpg')]).toBeUndefined();
  });

  it('should throw error if source directory does not exist', async () => {
    await expect(generatePlaceholders(path.join(testDir, 'non-existent')))
      .rejects.toThrow('Failed to generate placeholders');
  });
});
