import { exec } from 'child_process';
import { promisify } from 'util';
import sharp from 'sharp';
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
});
