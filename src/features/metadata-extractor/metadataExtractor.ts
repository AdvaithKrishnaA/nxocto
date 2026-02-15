import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import type { MetadataOptions, MetadataResult, AssetMetadata } from '../../types';

const ASSET_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg', '.gif', '.tiff', '.bmp'];

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

export async function extractMetadata(
  sourceFolder: string,
  options: MetadataOptions = {}
): Promise<MetadataResult> {
  const {
    outputFile = 'metadata.json',
    includeSize = true,
    recursive = true
  } = options;

  try {
    // Check if source folder exists and is a directory
    const sourceStats = await fs.stat(sourceFolder);
    if (!sourceStats.isDirectory()) {
      throw new Error(`Source path is not a directory: ${sourceFolder}`);
    }

    const files = await getAllFiles(sourceFolder, recursive);
    const assetFiles = files.filter(file =>
      ASSET_EXTENSIONS.includes(path.extname(file).toLowerCase())
    );

    const data: Record<string, AssetMetadata> = {};
    let count = 0;

    for (const filePath of assetFiles) {
      try {
        const metadata = await sharp(filePath).metadata();
        const stats = includeSize ? await fs.stat(filePath) : null;

        const relativePath = path.relative(sourceFolder, filePath);

        data[relativePath] = {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: stats ? stats.size : undefined,
          aspectRatio: metadata.width && metadata.height ? metadata.width / metadata.height : undefined
        };

        count++;
      } catch (err) {
        // Skip files that sharp can't process
        console.error(`Warning: Could not process ${filePath}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    const result: MetadataResult = {
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
  } catch (error) {
    throw new Error(`Failed to extract metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
