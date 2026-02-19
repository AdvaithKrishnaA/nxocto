import { findUnusedAssets, handleUnusedAssets } from '../src/features/unused-assets/unusedAssets';
import fs from 'fs/promises';
import path from 'path';

describe('unusedAssets', () => {
  const testDir = path.join(__dirname, 'temp-unused-test');
  const assetsDir = path.join(testDir, 'assets');
  const refsDir = path.join(testDir, 'refs');
  const archiveDir = path.join(testDir, 'archive');

  beforeEach(async () => {
    await fs.mkdir(assetsDir, { recursive: true });
    await fs.mkdir(refsDir, { recursive: true });

    // Create some assets
    await fs.writeFile(path.join(assetsDir, 'used.png'), 'used content');
    await fs.writeFile(path.join(assetsDir, 'unused.png'), 'unused content');
    await fs.writeFile(path.join(assetsDir, 'nested-unused.jpg'), 'nested content');

    // Create code references
    await fs.writeFile(
      path.join(refsDir, 'component.tsx'),
      `import React from 'react';
       export const MyComp = () => <img src="/assets/used.png" />;`
    );
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should find unused assets', async () => {
    const result = await findUnusedAssets(assetsDir, {
      referenceDirs: [refsDir]
    });

    expect(result.success).toBe(true);
    expect(result.totalAssets).toBe(3);
    expect(result.unusedAssets).toHaveLength(2);
    expect(result.unusedAssets).toContain(path.join(assetsDir, 'unused.png'));
    expect(result.unusedAssets).toContain(path.join(assetsDir, 'nested-unused.jpg'));
    expect(result.unusedAssets).not.toContain(path.join(assetsDir, 'used.png'));
  });

  it('should respect recursive option', async () => {
    const subAssetsDir = path.join(assetsDir, 'sub');
    await fs.mkdir(subAssetsDir, { recursive: true });
    await fs.writeFile(path.join(subAssetsDir, 'sub-unused.png'), 'sub content');

    const result = await findUnusedAssets(assetsDir, {
      referenceDirs: [refsDir],
      recursive: false
    });

    expect(result.totalAssets).toBe(3); // used.png, unused.png, nested-unused.jpg (sub is ignored)
    expect(result.unusedAssets).toHaveLength(2);
  });

  it('should delete unused assets if requested', async () => {
    const result = await findUnusedAssets(assetsDir, {
      referenceDirs: [refsDir],
      deleteUnused: true
    });

    expect(result.deletedCount).toBe(2);

    // Verify files are gone
    await expect(fs.access(path.join(assetsDir, 'unused.png'))).rejects.toThrow();
    await expect(fs.access(path.join(assetsDir, 'nested-unused.jpg'))).rejects.toThrow();
    // Used file should still be there
    await expect(fs.access(path.join(assetsDir, 'used.png'))).resolves.toBeUndefined();
  });

  it('should archive unused assets if requested', async () => {
    const result = await findUnusedAssets(assetsDir, {
      referenceDirs: [refsDir],
      archiveDir: archiveDir
    });

    expect(result.archivedTo).toBe(archiveDir);

    // Verify files are moved
    await expect(fs.access(path.join(archiveDir, 'unused.png'))).resolves.toBeUndefined();
    await expect(fs.access(path.join(archiveDir, 'nested-unused.jpg'))).resolves.toBeUndefined();
    // Originals should be gone
    await expect(fs.access(path.join(assetsDir, 'unused.png'))).rejects.toThrow();
  });

  it('should save results to output file', async () => {
    const outputFile = path.join(testDir, 'results.json');
    await findUnusedAssets(assetsDir, {
      referenceDirs: [refsDir],
      outputFile: outputFile
    });

    const savedResult = JSON.parse(await fs.readFile(outputFile, 'utf-8'));
    expect(savedResult.unusedAssets).toHaveLength(2);
  });

  it('should handle handleUnusedAssets correctly', async () => {
    const unused = [path.join(assetsDir, 'unused.png')];
    const result = await handleUnusedAssets(unused, { deleteUnused: true });

    expect(result.deletedCount).toBe(1);
    await expect(fs.access(path.join(assetsDir, 'unused.png'))).rejects.toThrow();
  });
});
