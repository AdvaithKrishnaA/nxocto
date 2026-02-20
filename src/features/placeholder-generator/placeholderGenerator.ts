import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import type { PlaceholderOptions, PlaceholderResult } from '../../types';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

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

export async function generatePlaceholders(
  sourceFolder: string,
  options: PlaceholderOptions = {}
): Promise<PlaceholderResult> {
  const {
    size = 10,
    quality = 50,
    outputFile = 'placeholders.json',
    recursive = true
  } = options;

  try {
    // Check if source folder exists and is a directory
    const sourceStats = await fs.stat(sourceFolder);
    if (!sourceStats.isDirectory()) {
      throw new Error(`Source path is not a directory: ${sourceFolder}`);
    }

    const files = await getAllFiles(sourceFolder, recursive);
    const imageFiles = files.filter(file =>
      IMAGE_EXTENSIONS.includes(path.extname(file).toLowerCase())
    );

    const data: Record<string, string> = {};
    let count = 0;

    for (const filePath of imageFiles) {
      try {
        const image = sharp(filePath);
        const metadata = await image.metadata();
        const format = metadata.format || 'jpeg';

        // Apply resize, blur and quality
        let pipeline = image.resize(size).blur();

        // Apply quality based on format
        if (format === 'jpeg' || format === 'jpg') {
          pipeline = pipeline.jpeg({ quality });
        } else if (format === 'webp') {
          pipeline = pipeline.webp({ quality });
        } else if (format === 'avif') {
          pipeline = pipeline.avif({ quality });
        } else if (format === 'png') {
          pipeline = pipeline.png({ quality: Math.min(quality, 100) });
        }

        const buffer = await pipeline.toBuffer();
        const base64 = buffer.toString('base64');
        const dataUrl = `data:image/${format};base64,${base64}`;

        const relativePath = path.relative(sourceFolder, filePath);
        data[relativePath] = dataUrl;
        count++;
      } catch (err) {
        // Skip files that sharp can't process
        console.error(`Warning: Could not generate placeholder for ${filePath}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    const result: PlaceholderResult = {
      success: true,
      count,
      outputFile,
      data
    };

    // Write to output file
    const outputDir = path.dirname(outputFile);
    if (outputDir !== '.') {
      await fs.mkdir(outputDir, { recursive: true });
    }

    await fs.writeFile(outputFile, JSON.stringify(data, null, 2), 'utf-8');

    return result;
  } catch (error: any) {
    throw new Error(`Failed to generate placeholders: ${error?.message || 'Unknown error'}`);
  }
}
