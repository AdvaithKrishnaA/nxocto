import { generateFavicons } from '../src/features/favicon-generator/faviconGenerator';
import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';

describe('faviconGenerator', () => {
  const testDir = path.join(__dirname, 'temp-favicon-test');
  const sourceImage = path.join(testDir, 'source.png');
  const outputDir = path.join(testDir, 'output');

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
    // Create a high-res source image for testing
    await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 }
      }
    }).png().toFile(sourceImage);
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should generate all expected favicon files', async () => {
    const result = await generateFavicons(sourceImage, {
      outputDir,
      generateManifest: true
    });

    expect(result.success).toBe(true);
    expect(result.filesGenerated).toContain('favicon.ico');
    expect(result.filesGenerated).toContain('icon-16x16.png');
    expect(result.filesGenerated).toContain('icon-32x32.png');
    expect(result.filesGenerated).toContain('icon.png');
    expect(result.filesGenerated).toContain('apple-icon.png');
    expect(result.filesGenerated).toContain('site.webmanifest');

    // Verify some files exist
    const icoExists = await fs.access(path.join(outputDir, 'favicon.ico')).then(() => true).catch(() => false);
    const pngExists = await fs.access(path.join(outputDir, 'icon-192x192.png')).then(() => true).catch(() => false);
    const manifestExists = await fs.access(path.join(outputDir, 'site.webmanifest')).then(() => true).catch(() => false);

    expect(icoExists).toBe(true);
    expect(pngExists).toBe(true);
    expect(manifestExists).toBe(true);
  });

  it('should generate a valid manifest with custom app name', async () => {
    const appName = 'Test Application';
    await generateFavicons(sourceImage, {
      outputDir,
      generateManifest: true,
      appName
    });

    const manifestContent = await fs.readFile(path.join(outputDir, 'site.webmanifest'), 'utf-8');
    const manifest = JSON.parse(manifestContent);

    expect(manifest.name).toBe(appName);
    expect(manifest.icons).toHaveLength(2);
  });

  it('should handle non-existent source file gracefully', async () => {
    const result = await generateFavicons('non-existent.png', { outputDir });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
