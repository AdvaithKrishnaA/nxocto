#!/usr/bin/env node
import { convertImagesInFolders, handleOriginalsAfterReview } from './features/image-converter/imageConverter';
import { optimizeSvgsInFolders, handleOriginalsAfterReview as handleSvgOriginalsAfterReview } from './features/svg-optimizer/svgOptimizer';
import { extractMetadata } from './features/metadata-extractor/metadataExtractor';
import { findUnusedAssets, handleUnusedAssets } from './features/unused-assets/unusedAssets';
import { generatePlaceholders } from './features/placeholder-generator/placeholderGenerator';
import * as readline from 'readline';
import * as path from 'path';

const args = process.argv.slice(2);

function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

if (args.length === 0) {
  console.log('Usage: nxocto <command> <source-folder> [options]');
  console.log('');
  console.log('Commands:');
  console.log('  convert-images              Convert images to WebP/AVIF');
  console.log('  optimize-svg                Optimize SVG files');
  console.log('  extract-metadata            Extract dimensions and metadata from assets');
  console.log('  find-unused                 Find assets that are not referenced in code');
  console.log('  generate-placeholders       Generate blurry base64 placeholders for images');
  console.log('');
  console.log('General Options:');
  console.log('  --output <folder>           Output folder for processed files');
  console.log('  --refs <folder1,folder2>    Comma-separated folders to update references');
  console.log('  --delete                    Delete original files after processing');
  console.log('  --archive <folder>          Move original files to archive folder');
  console.log('  --yes, -y                   Skip confirmation prompts');
  console.log('');
  console.log('convert-images Options:');
  console.log('  --format <webp|avif>        Output format (default: webp)');
  console.log('  --quality <1-100>           Quality setting (default: 80)');
  console.log('');
  console.log('optimize-svg Options:');
  console.log('  --precision <number>        Decimal precision (default: 2)');
  console.log('  --no-multipass              Disable multipass optimization');
  console.log('');
  console.log('extract-metadata Options:');
  console.log('  --output-file <file>        Output JSON file (default: metadata.json)');
  console.log('  --no-size                   Exclude file size from metadata');
  console.log('  --no-recursive              Disable recursive scanning');
  console.log('');
  console.log('find-unused Options:');
  console.log('  --refs <folder1,folder2>    Folders to scan for references (required)');
  console.log('  --output-file <file>        Save results to a JSON file');
  console.log('  --delete                    Delete unused assets');
  console.log('  --archive <folder>          Move unused assets to archive folder');
  console.log('  --no-recursive              Disable recursive scanning of assets folder');
  console.log('');
  console.log('generate-placeholders Options:');
  console.log('  --output-file <file>        Output JSON file (default: placeholders.json)');
  console.log('  --size <number>             Width of placeholder (default: 10)');
  console.log('  --quality <number>          Quality of placeholder (default: 50)');
  console.log('  --no-recursive              Disable recursive scanning');
  console.log('');
  console.log('Examples:');
  console.log('  nxocto convert-images ./images --output ./optimized');
  console.log('  nxocto optimize-svg ./public/icons --precision 3');
  console.log('  nxocto optimize-svg ./icons --delete --yes');
  console.log('  nxocto extract-metadata ./public/assets --output-file ./assets.json');
  console.log('  nxocto find-unused ./public/images --refs ./src,./pages');
  console.log('  nxocto generate-placeholders ./public/images --size 20');
  process.exit(1);
}

const command = args[0];

if (command === 'convert-images') {
  const sourceFolder = args[1];
  
  if (!sourceFolder) {
    console.error('Error: Source folder is required');
    process.exit(1);
  }

  // Parse options
  let outputFolder: string | undefined;
  let referenceDirs: string[] = [];
  let deleteOriginals = false;
  let archiveDir: string | undefined;
  let format: 'webp' | 'avif' = 'webp';
  let quality = 80;
  let skipConfirmation = false;

  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--output' && args[i + 1]) {
      outputFolder = args[++i];
    } else if (arg === '--refs' && args[i + 1]) {
      referenceDirs = args[++i].split(',').map(d => d.trim());
    } else if (arg === '--delete') {
      deleteOriginals = true;
    } else if (arg === '--archive' && args[i + 1]) {
      archiveDir = args[++i];
    } else if (arg === '--format' && args[i + 1]) {
      const fmt = args[++i];
      if (fmt === 'webp' || fmt === 'avif') {
        format = fmt;
      }
    } else if (arg === '--quality' && args[i + 1]) {
      quality = parseInt(args[++i], 10);
    } else if (arg === '--yes' || arg === '-y') {
      skipConfirmation = true;
    }
  }

  convertImagesInFolders(sourceFolder, outputFolder, referenceDirs, format, quality, deleteOriginals, archiveDir, skipConfirmation)
    .then(async (results) => {
      const successful = results.filter(r => r.success).length;
      console.log(`✓ Converted ${successful}/${results.length} images to ${format}`);
      
      results.forEach(r => {
        if (r.success) {
          console.log(`  ✓ ${r.inputPath} → ${r.outputPath}`);
          if (r.referencesUpdated && r.referencesUpdated > 0) {
            console.log(`    Updated ${r.referencesUpdated} reference(s)`);
          }
        } else {
          console.error(`  ✗ ${r.inputPath}: ${r.error}`);
        }
      });

      // Handle originals after showing results
      if ((deleteOriginals || archiveDir) && !skipConfirmation) {
        console.log('');
        const action = deleteOriginals ? 'delete' : 'archive';
        const confirmed = await askConfirmation(
          `Do you want to ${action} the original files? (y/n): `
        );

        if (confirmed) {
          const updatedResults = await handleOriginalsAfterReview(results, deleteOriginals, archiveDir);
          console.log('');
          updatedResults.forEach(r => {
            if (r.success && r.originalHandled) {
              console.log(`  ✓ ${r.inputPath}: ${r.originalHandled}`);
            }
          });
        } else {
          console.log('Original files kept.');
        }
      } else if (skipConfirmation && (deleteOriginals || archiveDir)) {
        // Already handled in convertImagesInFolders
        results.forEach(r => {
          if (r.success && r.originalHandled) {
            console.log(`  Original: ${r.originalHandled}`);
          }
        });
      }
    })
    .catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
} else if (command === 'extract-metadata') {
  const sourceFolder = args[1];

  if (!sourceFolder) {
    console.error('Error: Source folder is required');
    process.exit(1);
  }

  // Parse options
  let outputFile = 'metadata.json';
  let includeSize = true;
  let recursive = true;

  for (let i = 2; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--output-file' && args[i + 1]) {
      outputFile = args[++i];
    } else if (arg === '--no-size') {
      includeSize = false;
    } else if (arg === '--no-recursive') {
      recursive = false;
    }
  }

  extractMetadata(sourceFolder, { outputFile, includeSize, recursive })
    .then(result => {
      console.log(`✓ Extracted metadata from ${result.count} assets`);
      console.log(`  Output: ${result.outputFile}`);
    })
    .catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
} else if (command === 'find-unused') {
  const sourceFolder = args[1];

  if (!sourceFolder) {
    console.error('Error: Source folder is required');
    process.exit(1);
  }

  // Parse options
  let referenceDirs: string[] = [];
  let deleteUnused = false;
  let archiveDir: string | undefined;
  let outputFile: string | undefined;
  let recursive = true;
  let skipConfirmation = false;

  for (let i = 2; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--refs' && args[i + 1]) {
      referenceDirs = args[++i].split(',').map(d => d.trim());
    } else if (arg === '--delete') {
      deleteUnused = true;
    } else if (arg === '--archive' && args[i + 1]) {
      archiveDir = args[++i];
    } else if (arg === '--output-file' && args[i + 1]) {
      outputFile = args[++i];
    } else if (arg === '--no-recursive') {
      recursive = false;
    } else if (arg === '--yes' || arg === '-y') {
      skipConfirmation = true;
    }
  }

  if (referenceDirs.length === 0) {
    console.error('Error: --refs <folders> is required for find-unused');
    process.exit(1);
  }

  findUnusedAssets(sourceFolder, {
    referenceDirs,
    deleteUnused: skipConfirmation ? deleteUnused : false,
    archiveDir: skipConfirmation ? archiveDir : undefined,
    outputFile,
    recursive
  })
    .then(async (result) => {
      if (!result.success) {
        throw new Error(result.error || 'Failed to find unused assets');
      }

      console.log(`✓ Scanned ${result.totalAssets} assets`);
      console.log(`✓ Found ${result.unusedAssets.length} unused assets`);

      if (result.unusedAssets.length > 0) {
        result.unusedAssets.forEach(asset => {
          console.log(`  ✗ ${asset}`);
        });

        // Handle destructive actions after review
        if ((deleteUnused || archiveDir) && !skipConfirmation) {
          console.log('');
          const action = deleteUnused ? 'delete' : 'archive';
          const confirmed = await askConfirmation(
            `Do you want to ${action} the unused assets? (y/n): `
          );

          if (confirmed) {
            const handleResult = await handleUnusedAssets(result.unusedAssets, {
              deleteUnused,
              archiveDir
            });

            if (handleResult.deletedCount > 0) {
              console.log(`✓ Deleted ${handleResult.deletedCount} unused assets`);
            } else if (handleResult.archivedTo) {
              console.log(`✓ Archived unused assets to ${handleResult.archivedTo}`);
            }
          } else {
            console.log('Unused assets kept.');
          }
        } else if (skipConfirmation && (deleteUnused || archiveDir)) {
          if (result.deletedCount) {
            console.log(`✓ Deleted ${result.deletedCount} unused assets`);
          } else if (result.archivedTo) {
            console.log(`✓ Archived unused assets to ${result.archivedTo}`);
          }
        }
      }
    })
    .catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
} else if (command === 'generate-placeholders') {
  const sourceFolder = args[1];

  if (!sourceFolder) {
    console.error('Error: Source folder is required');
    process.exit(1);
  }

  // Parse options
  let outputFile = 'placeholders.json';
  let size = 10;
  let quality = 50;
  let recursive = true;

  for (let i = 2; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--output-file' && args[i + 1]) {
      outputFile = args[++i];
    } else if (arg === '--size' && args[i + 1]) {
      size = parseInt(args[++i], 10);
    } else if (arg === '--quality' && args[i + 1]) {
      quality = parseInt(args[++i], 10);
    } else if (arg === '--no-recursive') {
      recursive = false;
    }
  }

  generatePlaceholders(sourceFolder, { outputFile, size, quality, recursive })
    .then(result => {
      console.log(`✓ Generated ${result.count} placeholders`);
      console.log(`  Output: ${result.outputFile}`);
    })
    .catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
} else if (command === 'optimize-svg') {
  const sourceFolder = args[1];

  if (!sourceFolder) {
    console.error('Error: Source folder is required');
    process.exit(1);
  }

  // Parse options
  let outputFolder: string | undefined;
  let referenceDirs: string[] = [];
  let deleteOriginals = false;
  let archiveDir: string | undefined;
  let precision = 2;
  let multipass = true;
  let skipConfirmation = false;

  for (let i = 2; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--output' && args[i + 1]) {
      outputFolder = args[++i];
    } else if (arg === '--refs' && args[i + 1]) {
      referenceDirs = args[++i].split(',').map(d => d.trim());
    } else if (arg === '--delete') {
      deleteOriginals = true;
    } else if (arg === '--archive' && args[i + 1]) {
      archiveDir = args[++i];
    } else if (arg === '--precision' && args[i + 1]) {
      precision = parseFloat(args[++i]);
    } else if (arg === '--no-multipass') {
      multipass = false;
    } else if (arg === '--yes' || arg === '-y') {
      skipConfirmation = true;
    }
  }

  optimizeSvgsInFolders(sourceFolder, {
    outputDir: outputFolder,
    referenceDirs,
    multipass,
    floatPrecision: precision,
    deleteOriginals,
    archiveDir,
    skipConfirmation
  })
    .then(async (results) => {
      const successful = results.filter(r => r.success).length;
      console.log(`✓ Optimized ${successful}/${results.length} SVGs`);

      let totalOriginal = 0;
      let totalOptimized = 0;

      results.forEach(r => {
        if (r.success) {
          totalOriginal += r.originalSize || 0;
          totalOptimized += r.optimizedSize || 0;
          const saving = r.originalSize && r.optimizedSize
            ? ((r.originalSize - r.optimizedSize) / r.originalSize * 100).toFixed(1)
            : 0;

          console.log(`  ✓ ${r.inputPath} (${saving}% saved)`);
          if (r.referencesUpdated && r.referencesUpdated > 0) {
            console.log(`    Updated ${r.referencesUpdated} reference(s)`);
          }
        } else {
          console.error(`  ✗ ${r.inputPath}: ${r.error}`);
        }
      });

      if (totalOriginal > 0) {
        const totalSaving = ((totalOriginal - totalOptimized) / totalOriginal * 100).toFixed(1);
        console.log(`\nTotal savings: ${totalSaving}% (${(totalOriginal/1024).toFixed(1)}KB → ${(totalOptimized/1024).toFixed(1)}KB)`);
      }

      // Handle originals after showing results
      const needsAction = (deleteOriginals || archiveDir) &&
        results.some(r => r.success && r.inputPath && r.outputPath && path.resolve(r.inputPath) !== path.resolve(r.outputPath));

      if (needsAction && !skipConfirmation) {
        console.log('');
        const action = deleteOriginals ? 'delete' : 'archive';
        const confirmed = await askConfirmation(
          `Do you want to ${action} the original files? (y/n): `
        );

        if (confirmed) {
          const updatedResults = await handleSvgOriginalsAfterReview(results, deleteOriginals, archiveDir);
          console.log('');
          updatedResults.forEach(r => {
            if (r.success && r.originalHandled && r.originalHandled !== 'kept') {
              console.log(`  ✓ ${r.inputPath}: ${r.originalHandled}`);
            }
          });
        } else {
          console.log('Original files kept.');
        }
      } else if (skipConfirmation && (deleteOriginals || archiveDir)) {
        results.forEach(r => {
          if (r.success && r.originalHandled && r.originalHandled !== 'kept') {
            console.log(`  Original: ${r.originalHandled}`);
          }
        });
      }
    })
    .catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
} else {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}
