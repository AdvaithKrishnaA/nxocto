import { svgToComponent, svgToComponentsInFolder, generateIndexFile } from '../src/features/svg-to-component/svgToComponent';
import fs from 'fs/promises';
import path from 'path';

describe('svgToComponent', () => {
  const testDir = path.join(__dirname, 'temp-svg-to-component-test');
  const sourceDir = path.join(testDir, 'source');
  const outputDir = path.join(testDir, 'output');

  beforeEach(async () => {
    await fs.mkdir(sourceDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });

    // Create a sample SVG
    const svgContent = `<svg width="100" height="100" viewBox="0 0 100 100" class="test-class" data-testid="icon" aria-hidden="true">
  <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
</svg>`;
    await fs.writeFile(path.join(sourceDir, 'test-icon.svg'), svgContent);
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should convert SVG to TypeScript React component', async () => {
    const result = await svgToComponent(path.join(sourceDir, 'test-icon.svg'), {
      outputDir,
      typescript: true
    });

    expect(result.success).toBe(true);
    expect(result.componentName).toBe('TestIcon');
    expect(result.outputPath).toContain('TestIcon.tsx');

    const content = await fs.readFile(result.outputPath!, 'utf-8');
    expect(content).toContain('import React, { SVGProps } from \'react\'');
    expect(content).toContain('const TestIcon = (props: SVGProps<SVGSVGElement>) =>');
    expect(content).toContain('className=');
    expect(content).toContain('test-class');
    expect(content).toContain('strokeWidth="3"');
    expect(content).toContain('data-testid="icon"');
    expect(content).toContain('aria-hidden="true"');
    expect(content).toContain('{...props}');
  });

  it('should convert SVG to JavaScript React component', async () => {
    const result = await svgToComponent(path.join(sourceDir, 'test-icon.svg'), {
      outputDir,
      typescript: false
    });

    expect(result.success).toBe(true);
    expect(result.outputPath).toContain('TestIcon.jsx');

    const content = await fs.readFile(result.outputPath!, 'utf-8');
    expect(content).toContain('import React from \'react\'');
    expect(content).toContain('const TestIcon = (props) =>');
  });

  it('should respect prefix and suffix', async () => {
    const result = await svgToComponent(path.join(sourceDir, 'test-icon.svg'), {
      outputDir,
      prefix: 'Icon',
      suffix: 'Comp'
    });

    expect(result.componentName).toBe('IconTestIconComp');
    expect(result.outputPath).toContain('IconTestIconComp.tsx');
  });

  it('should handle multiple SVGs in a folder and generate index', async () => {
    await fs.writeFile(path.join(sourceDir, 'another.svg'), '<svg><rect /></svg>');

    const results = await svgToComponentsInFolder(sourceDir, {
      outputDir,
      generateIndex: true
    });

    expect(results).toHaveLength(2);
    expect(results.every(r => r.success)).toBe(true);

    const indexContent = await fs.readFile(path.join(outputDir, 'index.ts'), 'utf-8');
    expect(indexContent).toContain('export { default as TestIcon } from \'./TestIcon\'');
    expect(indexContent).toContain('export { default as Another } from \'./Another\'');
  });

  it('should remove dimensions when requested', async () => {
    const result = await svgToComponent(path.join(sourceDir, 'test-icon.svg'), {
      outputDir,
      removeDimensions: true
    });

    const content = await fs.readFile(result.outputPath!, 'utf-8');
    expect(content).not.toContain('width="100"');
    expect(content).not.toContain('height="100"');
  });

  it('should keep dimensions when requested', async () => {
    const result = await svgToComponent(path.join(sourceDir, 'test-icon.svg'), {
      outputDir,
      removeDimensions: false
    });

    const content = await fs.readFile(result.outputPath!, 'utf-8');
    expect(content).toContain('width="100"');
    expect(content).toContain('height="100"');
  });
});
