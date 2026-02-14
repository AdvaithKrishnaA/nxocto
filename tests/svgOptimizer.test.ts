import { optimizeSvg, optimizeSvgsInFolders } from '../src/features/svg-optimizer/svgOptimizer';
import fs from 'fs/promises';
import path from 'path';

describe('svgOptimizer', () => {
  const testDir = path.join(__dirname, 'temp-svg-test');
  const testSvgsDir = path.join(testDir, 'svgs');
  const testOutputDir = path.join(testDir, 'output');
  const testRefsDir = path.join(testDir, 'refs');
  const testArchiveDir = path.join(testDir, 'archive');

  const sampleSvg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <!-- This is a comment -->
  <circle cx="50.12345" cy="50.6789" r="40.00001" fill="red" />
  <rect x="10" y="10" width="20" height="20" />
</svg>`;

  beforeEach(async () => {
    await fs.mkdir(testSvgsDir, { recursive: true });
    await fs.mkdir(testOutputDir, { recursive: true });
    await fs.mkdir(testRefsDir, { recursive: true });

    await fs.writeFile(path.join(testSvgsDir, 'test1.svg'), sampleSvg);
    await fs.writeFile(path.join(testSvgsDir, 'test2.svg'), sampleSvg);

    // Generate test reference files
    await fs.writeFile(
      path.join(testRefsDir, 'component.tsx'),
      `export default function Icon() { return <img src="/test1.svg" />; }`
    );
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  it('should optimize svg file', async () => {
    const inputPath = path.join(testSvgsDir, 'test1.svg');
    const result = await optimizeSvg(inputPath, {
      outputDir: testOutputDir,
    });

    expect(result.success).toBe(true);
    expect(result.outputPath).toBeDefined();
    expect(result.optimizedSize).toBeLessThan(result.originalSize!);

    const optimizedContent = await fs.readFile(result.outputPath!, 'utf-8');
    expect(optimizedContent).not.toContain('<!-- This is a comment -->');
  });

  it('should respect precision option', async () => {
    const inputPath = path.join(testSvgsDir, 'test1.svg');
    const result = await optimizeSvg(inputPath, {
      outputDir: testOutputDir,
      floatPrecision: 1,
    });

    expect(result.success).toBe(true);
    const optimizedContent = await fs.readFile(result.outputPath!, 'utf-8');
    // 50.12345 -> 50.1
    expect(optimizedContent).toContain('cx="50.1"');
  });

  it('should update references when filename changes (if outputDir is different and we support it)', async () => {
    // In current implementation, filename doesn't change for SVG optimization,
    // but if we were to support it, it would work.
    // Let's test that it DOESN'T update if filename is same.
    const inputPath = path.join(testSvgsDir, 'test1.svg');
    const result = await optimizeSvg(inputPath, {
      outputDir: testOutputDir,
      referenceDirs: [testRefsDir],
    });

    expect(result.success).toBe(true);
    expect(result.referencesUpdated).toBe(0);
  });

  it('should archive original files when specified and output is different', async () => {
    const inputPath = path.join(testSvgsDir, 'test1.svg');
    // To make output different, we just use a different directory
    const result = await optimizeSvg(inputPath, {
      outputDir: testOutputDir,
      archiveDir: testArchiveDir,
    });

    expect(result.success).toBe(true);
    expect(result.originalHandled).toBe('archived');

    // Verify original is in archive
    const archivedPath = path.join(testArchiveDir, 'test1.svg');
    const stats = await fs.stat(archivedPath);
    expect(stats.isFile()).toBe(true);

    // Verify original is not in source
    await expect(fs.stat(inputPath)).rejects.toThrow();
  });

  it('should delete original files when specified and output is different', async () => {
    const inputPath = path.join(testSvgsDir, 'test1.svg');
    const result = await optimizeSvg(inputPath, {
      outputDir: testOutputDir,
      deleteOriginals: true,
    });

    expect(result.success).toBe(true);
    expect(result.originalHandled).toBe('deleted');

    // Verify original is deleted
    await expect(fs.stat(inputPath)).rejects.toThrow();
  });

  it('should optimize all svgs in folder', async () => {
    const results = await optimizeSvgsInFolders(testSvgsDir, {
      outputDir: testOutputDir,
    });

    expect(results.length).toBe(2);
    expect(results.every(r => r.success)).toBe(true);
  });

  it('should handle errors gracefully', async () => {
    const result = await optimizeSvg('non-existent.svg');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
