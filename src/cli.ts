#!/usr/bin/env node
import { convertImagesInFolders, handleOriginalsAfterReview } from './features/image-converter/imageConverter';
import * as readline from 'readline';

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
  console.log('Usage: nxocto convert-images <source-folder> [options]');
  console.log('');
  console.log('Options:');
  console.log('  --output <folder>           Output folder for converted images');
  console.log('  --refs <folder1,folder2>    Comma-separated folders to update references');
  console.log('  --delete                    Delete original files after conversion');
  console.log('  --archive <folder>          Move original files to archive folder');
  console.log('  --format <webp|avif>        Output format (default: webp)');
  console.log('  --quality <1-100>           Quality setting (default: 80)');
  console.log('  --yes, -y                   Skip confirmation prompts');
  console.log('');
  console.log('Examples:');
  console.log('  nxocto convert-images ./images --output ./optimized');
  console.log('  nxocto convert-images ./public/images --refs ./src,./pages --delete');
  console.log('  nxocto convert-images ./images --archive ./archive --refs ./src');
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
} else {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}
