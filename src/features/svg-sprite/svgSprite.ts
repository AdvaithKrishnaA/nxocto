import { optimize } from 'svgo';
import path from 'path';
import fs from 'fs/promises';
import type { SvgSpriteOptions, SvgSpriteResult } from '../../types';

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

export async function generateSvgSprite(
  sourceFolder: string,
  options: SvgSpriteOptions = {}
): Promise<SvgSpriteResult> {
  const {
    outputFile = 'sprite.svg',
    prefix = '',
    optimize: shouldOptimize = true,
    generateTypes = false,
    typesOutputFile,
    recursive = true
  } = options;

  try {
    // 1. Validate inputs
    const sourceStats = await fs.stat(sourceFolder);
    if (!sourceStats.isDirectory()) {
      throw new Error(`Source path is not a directory: ${sourceFolder}`);
    }

    // 2. Get files to process
    const allFiles = await getAllFiles(sourceFolder, recursive);
    const svgFiles = allFiles.filter(file => path.extname(file).toLowerCase() === '.svg');

    if (svgFiles.length === 0) {
      throw new Error(`No SVG files found in ${sourceFolder}`);
    }

    const symbols: string[] = [];
    const iconIds: string[] = [];

    // 3. Process each file
    for (const filePath of svgFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const fileName = path.parse(filePath).name;
        const id = `${prefix}${fileName}`;

        let processedSvg = content;

        if (shouldOptimize) {
          const result = optimize(content, {
            path: filePath,
            plugins: [
              'preset-default',
              'removeDimensions',
              {
                name: 'prefixIds',
                params: {
                  prefix: id,
                },
              },
            ],
          });
          if ('data' in result) {
            processedSvg = result.data;
          }
        }

        // Extract viewBox and inner content
        const viewBoxMatch = processedSvg.match(/viewBox=["']([^"']+)["']/);
        const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24';

        // Remove <svg> tags but keep content
        const innerContent = processedSvg
          .replace(/<svg[^>]*>/, '')
          .replace(/<\/svg>/, '')
          .trim();

        symbols.push(`<symbol id="${id}" viewBox="${viewBox}">${innerContent}</symbol>`);
        iconIds.push(id);
      } catch (err) {
        console.error(`Warning: Could not process ${filePath}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    // 4. Assemble sprite
    const spriteContent = `<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
  ${symbols.join('\n  ')}
</svg>`;

    // 5. Write to output file
    const outputDir = path.dirname(outputFile);
    if (outputDir !== '.') {
      await fs.mkdir(outputDir, { recursive: true });
    }
    await fs.writeFile(outputFile, spriteContent, 'utf-8');

    // 6. Generate types if requested
    let finalTypesOutputFile: string | undefined;
    if (generateTypes) {
      finalTypesOutputFile = typesOutputFile || path.join(outputDir, 'icon-types.ts');
      const isTypeScript = finalTypesOutputFile.endsWith('.ts') || finalTypesOutputFile.endsWith('.tsx');

      let typesContent = '';
      if (isTypeScript) {
        typesContent = `export type IconId = ${iconIds.map(id => `'${id}'`).join(' | ')};\n\n`;
        typesContent += `export const ICON_IDS: IconId[] = [\n  ${iconIds.map(id => `'${id}'`).join(',\n  ')}\n];\n`;
      } else {
        typesContent = `export const ICON_IDS = [\n  ${iconIds.map(id => `'${id}'`).join(',\n  ')}\n];\n`;
      }

      const typesDir = path.dirname(finalTypesOutputFile);
      if (typesDir !== '.') {
        await fs.mkdir(typesDir, { recursive: true });
      }
      await fs.writeFile(finalTypesOutputFile, typesContent, 'utf-8');
    }

    return {
      success: true,
      outputFile,
      icons: iconIds,
      typesOutputFile: finalTypesOutputFile
    };
  } catch (error) {
    throw new Error(`SVG Sprite generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
