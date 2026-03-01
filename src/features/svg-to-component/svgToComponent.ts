import { optimize } from 'svgo';
import path from 'path';
import fs from 'fs/promises';
import type { SvgToComponentOptions, SvgToComponentResult } from '../../types';

function toPascalCase(str: string): string {
  return str
    .replace(/[-_]+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .replace(
      /\s+(.)(\w*)/g,
      (_, p1, p2) => p1.toUpperCase() + p2.toLowerCase()
    )
    .replace(/^\w/, s => s.toUpperCase());
}

function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

async function getAllFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        files.push(...await getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }
  } catch (err) {
    // Skip directories that can't be read
  }

  return files;
}

export async function svgToComponent(
  inputPath: string,
  options: SvgToComponentOptions = {}
): Promise<SvgToComponentResult> {
  try {
    const {
      outputDir = './components/icons',
      typescript = true,
      prefix = '',
      suffix = '',
      removeDimensions = true
    } = options;

    const svgData = await fs.readFile(inputPath, 'utf-8');
    const fileName = path.parse(inputPath).name;
    const componentName = `${prefix}${toPascalCase(fileName)}${suffix}`;

    const plugins: any[] = [
      'preset-default',
      'convertStyleToAttrs',
      'prefixIds',
    ];

    if (removeDimensions) {
      plugins.push('removeDimensions');
    }

    const result = optimize(svgData, {
      path: inputPath,
      plugins,
    });

    if ('data' in result) {
      let jsx = result.data;

      // Basic transformation to JSX
      // Replace class with className
      jsx = jsx.replace(/\bclass=/g, 'className=');

      // Convert kebab-case attributes to camelCase
      // We look for attributes like stroke-width=
      // But skip data-* and aria-* attributes as React wants them in kebab-case
      jsx = jsx.replace(/([-a-z0-9]+)=/g, (match, attr) => {
        if (
          attr === 'className' ||
          attr === 'xmlns' ||
          attr === 'viewBox' ||
          attr === 'version' ||
          attr.startsWith('data-') ||
          attr.startsWith('aria-')
        ) {
          return match;
        }
        return `${toCamelCase(attr)}=`;
      });

      // Wrap in React component
      const extension = typescript ? 'tsx' : 'jsx';
      const outputPath = path.join(outputDir, `${componentName}.${extension}`);

      let template = '';
      if (typescript) {
        template = `import React, { SVGProps } from 'react';

const ${componentName} = (props: SVGProps<SVGSVGElement>) => (
  ${jsx.replace('<svg', '<svg {...props}')}
);

export default ${componentName};
`;
      } else {
        template = `import React from 'react';

const ${componentName} = (props) => (
  ${jsx.replace('<svg', '<svg {...props}')}
);

export default ${componentName};
`;
      }

      await fs.mkdir(outputDir, { recursive: true });
      await fs.writeFile(outputPath, template, 'utf-8');

      return {
        success: true,
        inputPath,
        outputPath,
        componentName
      };
    } else {
      throw new Error('Optimization failed');
    }
  } catch (error) {
    return {
      success: false,
      inputPath,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function generateIndexFile(
  results: SvgToComponentResult[],
  outputDir: string,
  typescript: boolean
): Promise<string> {
  const extension = typescript ? 'ts' : 'js';
  const indexPath = path.join(outputDir, `index.${extension}`);

  const exports = results
    .filter(r => r.success && r.componentName)
    .map(r => `export { default as ${r.componentName} } from './${r.componentName}';`)
    .join('\n');

  await fs.writeFile(indexPath, exports + '\n', 'utf-8');
  return indexPath;
}

export async function svgToComponentsInFolder(
  sourceFolder: string,
  options: SvgToComponentOptions = {}
): Promise<SvgToComponentResult[]> {
  const {
    outputDir = './components/icons',
    typescript = true,
    generateIndex = true
  } = options;

  const files = await getAllFiles(sourceFolder);
  const svgPaths = files.filter(file => path.extname(file).toLowerCase() === '.svg');

  const results = await Promise.all(
    svgPaths.map(path => svgToComponent(path, options))
  );

  if (generateIndex && results.some(r => r.success)) {
    await generateIndexFile(results, outputDir, typescript);
  }

  return results;
}
