import { generateSvgSprite } from '../src/features/svg-sprite/svgSprite';
import fs from 'fs/promises';
import path from 'path';

describe('svgSprite', () => {
  const testDir = path.join(__dirname, 'temp-svg-sprite-test');
  const sourceDir = path.join(testDir, 'icons');
  const outputFile = path.join(testDir, 'sprite.svg');

  beforeEach(async () => {
    await fs.mkdir(sourceDir, { recursive: true });

    // Create some sample SVGs
    await fs.writeFile(
      path.join(sourceDir, 'icon1.svg'),
      '<svg viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z" /></svg>'
    );
    await fs.writeFile(
      path.join(sourceDir, 'icon2.svg'),
      '<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>'
    );
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should generate an SVG sprite successfully', async () => {
    const result = await generateSvgSprite(sourceDir, { outputFile });

    expect(result.success).toBe(true);
    expect(result.icons).toContain('icon1');
    expect(result.icons).toContain('icon2');
    expect(result.outputFile).toBe(outputFile);

    const spriteContent = await fs.readFile(outputFile, 'utf-8');
    expect(spriteContent).toContain('<symbol id="icon1"');
    expect(spriteContent).toContain('<symbol id="icon2"');
    expect(spriteContent).toContain('<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">');
  });

  it('should respect the prefix option', async () => {
    const result = await generateSvgSprite(sourceDir, {
      outputFile,
      prefix: 'icon-'
    });

    expect(result.success).toBe(true);
    expect(result.icons).toContain('icon-icon1');
    expect(result.icons).toContain('icon-icon2');

    const spriteContent = await fs.readFile(outputFile, 'utf-8');
    expect(spriteContent).toContain('id="icon-icon1"');
    expect(spriteContent).toContain('id="icon-icon2"');
  });

  it('should generate types when requested', async () => {
    const typesOutputFile = path.join(testDir, 'icons.ts');
    const result = await generateSvgSprite(sourceDir, {
      outputFile,
      generateTypes: true,
      typesOutputFile
    });

    expect(result.success).toBe(true);
    expect(result.typesOutputFile).toBe(typesOutputFile);

    const typesContent = await fs.readFile(typesOutputFile, 'utf-8');
    expect(typesContent).toContain("export type IconId = 'icon1' | 'icon2'");
    expect(typesContent).toContain("export const ICON_IDS: IconId[] = [");
  });

  it('should throw error if no SVG files found', async () => {
    const emptyDir = path.join(testDir, 'empty');
    await fs.mkdir(emptyDir, { recursive: true });

    await expect(generateSvgSprite(emptyDir, { outputFile }))
      .rejects.toThrow('No SVG files found');
  });

  it('should throw error if source path is not a directory', async () => {
    const filePath = path.join(testDir, 'not-a-dir.txt');
    await fs.writeFile(filePath, 'hello');

    await expect(generateSvgSprite(filePath, { outputFile }))
      .rejects.toThrow('Source path is not a directory');
  });
});
