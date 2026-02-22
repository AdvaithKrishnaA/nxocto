import { exec } from 'child_process';
import { promisify } from 'util';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

describe('CLI', () => {
  const testDir = path.join(__dirname, 'temp-cli-test');
  const testImagesDir = path.join(testDir, 'images');
  const testOutputDir = path.join(testDir, 'output');
  const testRefsDir = path.join(testDir, 'refs');
  const testArchiveDir = path.join(testDir, 'archive');
  const cliPath = path.join(__dirname, '../dist/src/cli.js');

  beforeAll(async () => {
    // Ensure CLI is built
    try {
      await fs.access(cliPath);
    } catch {
      throw new Error('CLI not built. Run "pnpm build" first.');
    }
  });

  beforeEach(async () => {
    await fs.mkdir(testImagesDir, { recursive: true });
    await fs.mkdir(testRefsDir, { recursive: true });

    // Generate test images
    await sharp({
      create: {
        width: 50,
        height: 50,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    }).jpeg().toFile(path.join(testImagesDir, 'cli-test.jpg'));

    // Generate test reference file
    await fs.writeFile(
      path.join(testRefsDir, 'page.tsx'),
      `export default function Page() { return <img src="/cli-test.jpg" />; }`
    );
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  it('should show help when no arguments provided', async () => {
    try {
      await execAsync(`node ${cliPath}`);
    } catch (error: any) {
      expect(error.code).toBe(1);
      expect(error.stdout).toContain('Usage:');
      expect(error.stdout).toContain('convert-images');
    }
  });

  it('should convert images via CLI', async () => {
    const { stdout } = await execAsync(
      `node ${cliPath} convert-images ${testImagesDir} --output ${testOutputDir}`
    );

    expect(stdout).toContain('Converted 1/1 images');
    expect(stdout).toContain('cli-test.jpg');

    // Verify output file exists
    const outputFile = path.join(testOutputDir, 'cli-test.webp');
    const stats = await fs.stat(outputFile);
    expect(stats.isFile()).toBe(true);
  });

  it('should update references via CLI', async () => {
    const { stdout } = await execAsync(
      `node ${cliPath} convert-images ${testImagesDir} --output ${testOutputDir} --refs ${testRefsDir}`
    );

    expect(stdout).toContain('Updated 1 reference');

    // Verify reference was updated
    const content = await fs.readFile(path.join(testRefsDir, 'page.tsx'), 'utf-8');
    expect(content).toContain('cli-test.webp');
    expect(content).not.toContain('cli-test.jpg');
  });

  it('should archive originals via CLI', async () => {
    await execAsync(
      `node ${cliPath} convert-images ${testImagesDir} --output ${testOutputDir} --archive ${testArchiveDir} --yes`
    );

    // Verify original is archived
    const archivedFile = path.join(testArchiveDir, 'cli-test.jpg');
    const stats = await fs.stat(archivedFile);
    expect(stats.isFile()).toBe(true);

    // Verify original is not in source
    await expect(fs.stat(path.join(testImagesDir, 'cli-test.jpg'))).rejects.toThrow();
  });

  it('should delete originals via CLI', async () => {
    await execAsync(
      `node ${cliPath} convert-images ${testImagesDir} --output ${testOutputDir} --delete --yes`
    );

    // Verify original is deleted
    await expect(fs.stat(path.join(testImagesDir, 'cli-test.jpg'))).rejects.toThrow();
  });

  it('should support format and quality options', async () => {
    const { stdout } = await execAsync(
      `node ${cliPath} convert-images ${testImagesDir} --output ${testOutputDir} --format avif --quality 90`
    );

    expect(stdout).toContain('Converted 1/1 images to avif');

    // Verify AVIF file exists
    const outputFile = path.join(testOutputDir, 'cli-test.avif');
    const stats = await fs.stat(outputFile);
    expect(stats.isFile()).toBe(true);
  });

  it('should handle unknown command', async () => {
    try {
      await execAsync(`node ${cliPath} unknown-command`);
    } catch (error: any) {
      expect(error.code).toBe(1);
      expect(error.stderr).toContain('Unknown command');
    }
  });

  describe('optimize-svg', () => {
    const testSvgsDir = path.join(testDir, 'svgs');

    beforeEach(async () => {
      await fs.mkdir(testSvgsDir, { recursive: true });
      await fs.writeFile(
        path.join(testSvgsDir, 'test.svg'),
        `<svg><circle cx="50" cy="50" r="40" fill="red" /><!-- comment --></svg>`
      );
    });

    it('should optimize SVGs via CLI', async () => {
      const { stdout } = await execAsync(
        `node ${cliPath} optimize-svg ${testSvgsDir} --output ${testOutputDir}`
      );

      expect(stdout).toContain('Optimized 1/1 SVGs');
      expect(stdout).toContain('Total savings');

      // Verify output file exists
      const outputFile = path.join(testOutputDir, 'test.svg');
      const stats = await fs.stat(outputFile);
      expect(stats.isFile()).toBe(true);

      const content = await fs.readFile(outputFile, 'utf-8');
      expect(content).not.toContain('<!-- comment -->');
    });

    it('should respect precision via CLI', async () => {
      await fs.writeFile(
        path.join(testSvgsDir, 'precision.svg'),
        `<svg><circle cx="50.123" cy="50.456" r="40" /></svg>`
      );

      await execAsync(
        `node ${cliPath} optimize-svg ${testSvgsDir} --output ${testOutputDir} --precision 1`
      );

      const content = await fs.readFile(path.join(testOutputDir, 'precision.svg'), 'utf-8');
      expect(content).toContain('cx="50.1"');
    });

    it('should archive originals via CLI', async () => {
      await execAsync(
        `node ${cliPath} optimize-svg ${testSvgsDir} --output ${testOutputDir} --archive ${testArchiveDir} --yes`
      );

      // Verify original is archived
      const archivedFile = path.join(testArchiveDir, 'test.svg');
      const stats = await fs.stat(archivedFile);
      expect(stats.isFile()).toBe(true);
    });
  });

  describe('extract-metadata', () => {
    it('should extract metadata via CLI', async () => {
      const { stdout } = await execAsync(
        `node ${cliPath} extract-metadata ${testImagesDir} --output-file ${testOutputDir}/metadata.json`
      );

      expect(stdout).toContain('Extracted metadata from 1 assets');
      expect(stdout).toContain('metadata.json');

      const metadata = JSON.parse(await fs.readFile(path.join(testOutputDir, 'metadata.json'), 'utf-8'));
      expect(metadata['cli-test.jpg']).toBeDefined();
      expect(metadata['cli-test.jpg'].width).toBe(50);
    });

    it('should respect --no-size flag', async () => {
      await execAsync(
        `node ${cliPath} extract-metadata ${testImagesDir} --output-file ${testOutputDir}/no-size.json --no-size`
      );

      const metadata = JSON.parse(await fs.readFile(path.join(testOutputDir, 'no-size.json'), 'utf-8'));
      expect(metadata['cli-test.jpg'].size).toBeUndefined();
    });
  });

  describe('find-unused', () => {
    const testAssetsDir = path.join(testDir, 'assets_find_unused');
    const testCodeDir = path.join(testDir, 'code_find_unused');

    beforeEach(async () => {
      await fs.mkdir(testAssetsDir, { recursive: true });
      await fs.mkdir(testCodeDir, { recursive: true });

      await fs.writeFile(path.join(testAssetsDir, 'apple.png'), 'used');
      await fs.writeFile(path.join(testAssetsDir, 'orange.png'), 'unused');

      await fs.writeFile(
        path.join(testCodeDir, 'App.js'),
        `const img = "apple.png";`
      );
    });

    it('should find unused assets via CLI', async () => {
      const { stdout } = await execAsync(
        `node ${cliPath} find-unused ${testAssetsDir} --refs ${testCodeDir}`
      );

      expect(stdout).toContain('Scanned 2 assets');
      expect(stdout).toContain('Found 1 unused assets');
      expect(stdout).toContain('orange.png');
      expect(stdout).not.toContain('apple.png');
    });

    it('should delete unused assets via CLI with --yes', async () => {
      await execAsync(
        `node ${cliPath} find-unused ${testAssetsDir} --refs ${testCodeDir} --delete --yes`
      );

      await expect(fs.access(path.join(testAssetsDir, 'orange.png'))).rejects.toThrow();
      await expect(fs.access(path.join(testAssetsDir, 'apple.png'))).resolves.toBeUndefined();
    });

    it('should save results to JSON file via CLI', async () => {
      const resultsFile = path.join(testOutputDir, 'unused-results.json');
      await fs.mkdir(testOutputDir, { recursive: true });

      await execAsync(
        `node ${cliPath} find-unused ${testAssetsDir} --refs ${testCodeDir} --output-file ${resultsFile}`
      );

      const results = JSON.parse(await fs.readFile(resultsFile, 'utf-8'));
      expect(results.unusedAssets).toContain(path.join(testAssetsDir, 'orange.png'));
    });

    it('should show error when --refs is missing', async () => {
      try {
        await execAsync(`node ${cliPath} find-unused ${testAssetsDir}`);
      } catch (error: any) {
        expect(error.stderr).toContain('Error: --refs <folders> is required');
      }
    });
  });

  describe('generate-placeholders', () => {
    it('should generate placeholders via CLI', async () => {
      const { stdout } = await execAsync(
        `node ${cliPath} generate-placeholders ${testImagesDir} --output-file ${testOutputDir}/placeholders.json`
      );

      expect(stdout).toContain('Generated 1 placeholders');
      expect(stdout).toContain('placeholders.json');

      const placeholders = JSON.parse(await fs.readFile(path.join(testOutputDir, 'placeholders.json'), 'utf-8'));
      expect(placeholders['cli-test.jpg']).toBeDefined();
      expect(placeholders['cli-test.jpg']).toContain('data:image/jpeg;base64,');
    });

    it('should respect --size and --quality flags', async () => {
      const { stdout } = await execAsync(
        `node ${cliPath} generate-placeholders ${testImagesDir} --output-file ${testOutputDir}/options.json --size 5 --quality 10`
      );

      expect(stdout).toContain('Generated 1 placeholders');
      const placeholders = JSON.parse(await fs.readFile(path.join(testOutputDir, 'options.json'), 'utf-8'));
      expect(placeholders['cli-test.jpg']).toBeDefined();
    });
  });

  describe('resize-images', () => {
    it('should resize images via CLI', async () => {
      const { stdout } = await execAsync(
        `node ${cliPath} resize-images ${testImagesDir} --widths 30,60 --output ${testOutputDir}`
      );

      expect(stdout).toContain('Processed 1/1 images');
      expect(stdout).toContain('cli-test-30.jpg');
      expect(stdout).toContain('cli-test-60.jpg');

      // Verify output files exist
      await expect(fs.stat(path.join(testOutputDir, 'cli-test-30.jpg'))).resolves.toBeDefined();
      await expect(fs.stat(path.join(testOutputDir, 'cli-test-60.jpg'))).resolves.toBeDefined();
    });

    it('should convert format via CLI', async () => {
      await execAsync(
        `node ${cliPath} resize-images ${testImagesDir} --widths 40 --format webp --output ${testOutputDir}`
      );

      await expect(fs.stat(path.join(testOutputDir, 'cli-test-40.webp'))).resolves.toBeDefined();
    });

    it('should error when --widths is missing', async () => {
      try {
        await execAsync(`node ${cliPath} resize-images ${testImagesDir}`);
      } catch (error: any) {
        expect(error.stderr).toContain('Error: --widths <w1,w2,...> is required');
      }
    });
  });

  describe('optimize-pdf', () => {
    const testPdfsDir = path.join(testDir, 'pdfs_cli');

    beforeEach(async () => {
      await fs.mkdir(testPdfsDir, { recursive: true });
      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([100, 100]);
      const pdfBytes = await pdfDoc.save();
      await fs.writeFile(path.join(testPdfsDir, 'test.pdf'), pdfBytes);
    });

    it('should optimize PDFs via CLI', async () => {
      const { stdout } = await execAsync(
        `node ${cliPath} optimize-pdf ${testPdfsDir} --output ${testOutputDir}`
      );

      expect(stdout).toContain('Optimized 1/1 PDFs');
      expect(stdout).toContain('Total savings');

      const outputFile = path.join(testOutputDir, 'test.pdf');
      const stats = await fs.stat(outputFile);
      expect(stats.isFile()).toBe(true);
    });

    it('should archive originals via CLI', async () => {
      await execAsync(
        `node ${cliPath} optimize-pdf ${testPdfsDir} --output ${testOutputDir} --archive ${testArchiveDir} --yes`
      );

      const archivedFile = path.join(testArchiveDir, 'test.pdf');
      const stats = await fs.stat(archivedFile);
      expect(stats.isFile()).toBe(true);
      await expect(fs.stat(path.join(testPdfsDir, 'test.pdf'))).rejects.toThrow();
  describe('find-duplicates', () => {
    const testAssetsDir = path.join(testDir, 'assets_find_duplicates');
    const testCodeDir = path.join(testDir, 'code_find_duplicates');

    beforeEach(async () => {
      await fs.mkdir(testAssetsDir, { recursive: true });
      await fs.mkdir(testCodeDir, { recursive: true });

      const content = 'duplicate content';
      // copy.txt will be kept (sorted first), orig.txt will be removed
      await fs.writeFile(path.join(testAssetsDir, 'orig.txt'), content);
      await fs.writeFile(path.join(testAssetsDir, 'copy.txt'), content);
      await fs.writeFile(path.join(testAssetsDir, 'unique.txt'), 'unique');

      await fs.writeFile(
        path.join(testCodeDir, 'App.js'),
        `const file = "orig.txt";`
      );
    });

    it('should find duplicates via CLI', async () => {
      const { stdout } = await execAsync(
        `node ${cliPath} find-duplicates ${testAssetsDir}`
      );

      expect(stdout).toContain('Scanned 3 files');
      expect(stdout).toContain('Found 1 duplicate(s)');
      expect(stdout).toContain('orig.txt');
      expect(stdout).toContain('copy.txt');
    });

    it('should delete duplicates and update refs via CLI', async () => {
      const { stdout } = await execAsync(
        `node ${cliPath} find-duplicates ${testAssetsDir} --refs ${testCodeDir} --delete --yes`
      );

      expect(stdout).toContain('Deleted 1 duplicate(s)');
      expect(stdout).toContain('Updated 1 reference(s)');

      // Verify duplicate was deleted
      await expect(fs.access(path.join(testAssetsDir, 'orig.txt'))).rejects.toThrow();

      // Verify ref updated to the kept file
      const content = await fs.readFile(path.join(testCodeDir, 'App.js'), 'utf-8');
      expect(content).toContain('copy.txt');
    });

    it('should archive duplicates via CLI', async () => {
      const archiveDir = path.join(testDir, 'dup_archive');
      await execAsync(
        `node ${cliPath} find-duplicates ${testAssetsDir} --archive ${archiveDir} --yes`
      );

      const stats = await fs.stat(path.join(archiveDir, 'orig.txt'));
      expect(stats.isFile()).toBe(true);
      await expect(fs.access(path.join(testAssetsDir, 'orig.txt'))).rejects.toThrow();
    });
  });
});
