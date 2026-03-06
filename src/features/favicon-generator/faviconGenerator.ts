import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import type { FaviconOptions, FaviconResult } from '../../types';

const FAVICON_SIZES = [16, 32, 48, 180, 192, 512];
const ICO_SIZES = [16, 32, 48];

/**
 * Encodes an array of PNG buffers into a single ICO file buffer.
 * ICO format:
 * - Header (6 bytes): 0-1 reserved (0), 2-3 type (1 for ico), 4-5 number of images
 * - Directory (16 bytes per image): 0 width, 1 height, 2 color count, 3 reserved, 4-5 planes, 6-7 bpp, 8-11 size, 12-15 offset
 * - Image data: PNG or BMP data
 */
function encodeIco(pngBuffers: Buffer[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(pngBuffers.length, 4);

  const directorySize = 16 * pngBuffers.length;
  const directory = Buffer.alloc(directorySize);
  const dataBuffers: Buffer[] = [];

  let currentOffset = 6 + directorySize;

  for (let i = 0; i < pngBuffers.length; i++) {
    const png = pngBuffers[i];
    // In ICO, width/height of 256 is represented by 0.
    // But for sizes < 256, we use the actual value.
    // Let's get size from our known sizes.
    const size = ICO_SIZES[i];

    const entry = Buffer.alloc(16);
    entry[0] = size >= 256 ? 0 : size;
    entry[1] = size >= 256 ? 0 : size;
    entry[2] = 0; // Color palette
    entry[3] = 0; // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(png.length, 8); // Image size
    entry.writeUInt32LE(currentOffset, 12); // Image offset

    entry.copy(directory, i * 16);
    dataBuffers.push(png);
    currentOffset += png.length;
  }

  return Buffer.concat([header, directory, ...dataBuffers]);
}

export async function generateFavicons(
  inputPath: string,
  options: FaviconOptions = {}
): Promise<FaviconResult> {
  const {
    outputDir = './public',
    generateManifest = false,
    appName = 'My App',
    appShortName = 'App',
    backgroundColor = '#ffffff',
    themeColor = '#000000'
  } = options;

  try {
    // Validate input path
    await fs.access(inputPath);

    await fs.mkdir(outputDir, { recursive: true });

    const filesGenerated: string[] = [];
    const icoPngBuffers: Buffer[] = [];

    // Process all standard sizes
    for (const size of FAVICON_SIZES) {
      let fileName = `icon-${size}x${size}.png`;
      if (size === 180) fileName = 'apple-icon.png';
      if (size === 32) {
        // We'll also save a copy as icon.png for Next.js default
        const buffer = await sharp(inputPath)
          .resize(32, 32)
          .png()
          .toBuffer();
        const nextPath = path.join(outputDir, 'icon.png');
        await fs.writeFile(nextPath, buffer);
        filesGenerated.push('icon.png');
      }

      const outputPath = path.join(outputDir, fileName);
      const buffer = await sharp(inputPath)
        .resize(size, size)
        .png()
        .toBuffer();

      await fs.writeFile(outputPath, buffer);
      filesGenerated.push(fileName);

      if (ICO_SIZES.includes(size)) {
        icoPngBuffers.push(buffer);
      }
    }

    // Generate favicon.ico
    const icoBuffer = encodeIco(icoPngBuffers);
    const icoPath = path.join(outputDir, 'favicon.ico');
    await fs.writeFile(icoPath, icoBuffer);
    filesGenerated.push('favicon.ico');

    // Generate manifest if requested
    if (generateManifest) {
      const manifest = {
        name: appName,
        short_name: appShortName,
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        theme_color: themeColor,
        background_color: backgroundColor,
        display: 'standalone'
      };

      const manifestPath = path.join(outputDir, 'site.webmanifest');
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      filesGenerated.push('site.webmanifest');
    }

    return {
      success: true,
      inputPath,
      outputDir,
      filesGenerated
    };
  } catch (error) {
    return {
      success: false,
      inputPath,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
