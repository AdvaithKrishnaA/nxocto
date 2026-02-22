import { findDuplicates } from '../src/features/duplicate-finder/duplicateFinder';
import fs from 'fs/promises';
import path from 'path';

describe('duplicateFinder', () => {
  const testDir = path.join(__dirname, 'temp-duplicate-test');
  const assetsDir = path.join(testDir, 'assets');
  const refsDir = path.join(testDir, 'refs');
  const archiveDir = path.join(testDir, 'archive');

  beforeEach(async () => {
    await fs.mkdir(assetsDir, { recursive: true });
    await fs.mkdir(refsDir, { recursive: true });

    // Create identical files
    const content1 = 'identical content';
    await fs.writeFile(path.join(assetsDir, 'file1.txt'), content1);
    await fs.writeFile(path.join(assetsDir, 'file1_copy.txt'), content1);

    const content2 = 'another identical content';
    await fs.mkdir(path.join(assetsDir, 'sub'), { recursive: true });
    await fs.writeFile(path.join(assetsDir, 'file2.txt'), content2);
    await fs.writeFile(path.join(assetsDir, 'sub', 'file2_dup.txt'), content2);

    // Create unique file
    await fs.writeFile(path.join(assetsDir, 'unique.txt'), 'unique content');

    // Create reference files
    await fs.writeFile(
      path.join(refsDir, 'code.js'),
      "const img1 = 'file1_copy.txt';\nconst img2 = 'file2_dup.txt';"
    );
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore
    }
  });

  it('should find duplicates in a directory', async () => {
    const result = await findDuplicates(assetsDir);

    expect(result.success).toBe(true);
    expect(result.totalFiles).toBe(5);
    expect(result.groups).toHaveLength(2);
    expect(result.totalDuplicates).toBe(2);
  });

  it('should handle non-recursive scanning', async () => {
    const result = await findDuplicates(assetsDir, { recursive: false });

    expect(result.success).toBe(true);
    // file1.txt, file1_copy.txt, file2.txt, unique.txt (sub/file2_dup.txt excluded)
    expect(result.totalFiles).toBe(4);
    expect(result.groups).toHaveLength(1); // Only group for content1
    expect(result.totalDuplicates).toBe(1);
  });

  it('should delete duplicates and update references', async () => {
    const result = await findDuplicates(assetsDir, {
      deleteDuplicates: true,
      referenceDirs: [refsDir],
      skipConfirmation: true
    });

    expect(result.success).toBe(true);
    expect(result.removedCount).toBe(2);
    expect(result.referencesUpdated).toBe(1); // Both refs in the same file

    // Verify files were deleted
    await expect(fs.stat(path.join(assetsDir, 'file1_copy.txt'))).rejects.toThrow();
    await expect(fs.stat(path.join(assetsDir, 'sub', 'file2_dup.txt'))).rejects.toThrow();

    // Verify originals kept
    const stats = await fs.stat(path.join(assetsDir, 'file1.txt'));
    expect(stats.isFile()).toBe(true);

    // Verify references updated
    const codeContent = await fs.readFile(path.join(refsDir, 'code.js'), 'utf-8');
    expect(codeContent).toContain("const img1 = 'file1.txt'");
    expect(codeContent).toContain("const img2 = 'file2.txt'");
  });

  it('should archive duplicates', async () => {
    const result = await findDuplicates(assetsDir, {
      archiveDir: archiveDir,
      skipConfirmation: true
    });

    expect(result.success).toBe(true);
    expect(result.removedCount).toBe(2);

    // Verify files moved to archive
    const stats1 = await fs.stat(path.join(archiveDir, 'file1_copy.txt'));
    expect(stats1.isFile()).toBe(true);
    const stats2 = await fs.stat(path.join(archiveDir, 'file2_dup.txt'));
    expect(stats2.isFile()).toBe(true);

    // Verify files removed from source
    await expect(fs.stat(path.join(assetsDir, 'file1_copy.txt'))).rejects.toThrow();
  });

  it('should handle errors gracefully', async () => {
    const result = await findDuplicates('non-existent-folder');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
