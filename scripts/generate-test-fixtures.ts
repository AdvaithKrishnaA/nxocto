#!/usr/bin/env ts-node
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

const FIXTURES_DIR = path.join(process.cwd(), 'test-fixtures');
const IMAGES_DIR = path.join(FIXTURES_DIR, 'images');
const CODE_DIR = path.join(FIXTURES_DIR, 'code');
const OUTPUT_DIR = path.join(FIXTURES_DIR, 'output');

async function generateTestImages() {
  await fs.mkdir(IMAGES_DIR, { recursive: true });

  console.log('Generating test images...');

  // Generate various test images
  await sharp({
    create: {
      width: 800,
      height: 600,
      channels: 3,
      background: { r: 255, g: 100, b: 100 }
    }
  }).jpeg({ quality: 90 }).toFile(path.join(IMAGES_DIR, 'hero-image.jpg'));

  await sharp({
    create: {
      width: 400,
      height: 400,
      channels: 4,
      background: { r: 100, g: 100, b: 255, alpha: 1 }
    }
  }).png().toFile(path.join(IMAGES_DIR, 'logo.png'));

  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 3,
      background: { r: 100, g: 200, b: 100 }
    }
  }).jpeg({ quality: 85 }).toFile(path.join(IMAGES_DIR, 'og-image.jpg'));

  await sharp({
    create: {
      width: 64,
      height: 64,
      channels: 4,
      background: { r: 255, g: 200, b: 0, alpha: 1 }
    }
  }).png().toFile(path.join(IMAGES_DIR, 'icon.png'));

  console.log('  ✓ Generated 4 test images');
}

async function generateTestSvgs() {
  await fs.mkdir(IMAGES_DIR, { recursive: true });

  console.log('Generating test SVGs...');

  const iconSvg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <!-- Optimized icon -->
  <circle cx="50.123" cy="50.456" r="40" fill="#ff0000" />
  <rect x="20" y="20" width="60" height="60" fill="none" stroke="black" />
</svg>`;

  const illustrationSvg = `<svg width="500" height="500" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:rgb(255,255,0);stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgb(255,0,0);stop-opacity:1" />
    </linearGradient>
  </defs>
  <ellipse cx="200" cy="70" rx="85" ry="55" fill="url(#grad1)" />
  <text fill="#ffffff" font-size="45" font-family="Verdana" x="90" y="86">SVG</text>
</svg>`;

  await fs.writeFile(path.join(IMAGES_DIR, 'icon.svg'), iconSvg);
  await fs.writeFile(path.join(IMAGES_DIR, 'illustration.svg'), illustrationSvg);

  console.log('  ✓ Generated 2 test SVGs');
}

async function generateTestPdfs() {
  const pdfDir = path.join(FIXTURES_DIR, 'pdfs');
  await fs.mkdir(pdfDir, { recursive: true });

  console.log('Generating test PDFs...');

  // Create a sample PDF
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  page.drawText('Sample PDF for NxOcto testing', { x: 50, y: 750 });
  pdfDoc.setTitle('Sample PDF');
  pdfDoc.setAuthor('NxOcto');

  const pdfBytes = await pdfDoc.save();
  await fs.writeFile(path.join(pdfDir, 'sample.pdf'), pdfBytes);

  console.log('  ✓ Generated 1 test PDF');
}

async function generateSvgToComponentFixtures() {
  const sourceDir = path.join(FIXTURES_DIR, 'svg-icons');
  await fs.mkdir(sourceDir, { recursive: true });

  console.log('Generating SVG to component test fixtures...');

  const homeSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
  const settingsSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;

  await fs.writeFile(path.join(sourceDir, 'home.svg'), homeSvg);
  await fs.writeFile(path.join(sourceDir, 'settings.svg'), settingsSvg);

  console.log('  ✓ Generated 2 test icons for component conversion');
}

async function generateTestCode() {
  await fs.mkdir(CODE_DIR, { recursive: true });

  console.log('Generating test code files...');

  // React component with image references
  await fs.writeFile(
    path.join(CODE_DIR, 'Hero.tsx'),
    `import Image from 'next/image';

export default function Hero() {
  return (
    <div className="hero">
      <Image 
        src="/images/hero-image.jpg" 
        alt="Hero" 
        width={800} 
        height={600}
      />
      <img src="/images/logo.png" alt="Logo" />
      <img src="/images/icon.svg" alt="Icon" />
    </div>
  );
}
`
  );

  // CSS with background images
  await fs.writeFile(
    path.join(CODE_DIR, 'styles.css'),
    `.hero {
  background-image: url('/images/hero-image.jpg');
  background-size: cover;
}

.logo {
  background: url('/images/logo.png') no-repeat center;
}

.icon {
  content: url('/images/icon.png');
}

.svg-icon {
  background-image: url('/images/icon.svg');
}
`
  );

  // HTML file
  await fs.writeFile(
    path.join(CODE_DIR, 'index.html'),
    `<!DOCTYPE html>
<html>
<head>
  <title>Test Page</title>
  <link rel="icon" href="/images/icon.png">
  <meta property="og:image" content="/images/og-image.jpg">
</head>
<body>
  <img src="/images/hero-image.jpg" alt="Hero">
  <img src="/images/logo.png" alt="Logo">
</body>
</html>
`
  );

  // Markdown file
  await fs.writeFile(
    path.join(CODE_DIR, 'README.md'),
    `# Test Documentation

![Hero Image](/images/hero-image.jpg)

![Logo](/images/logo.png)

This is a test markdown file with image references.
`
  );

  console.log('  ✓ Generated 4 test code files');
}

async function generateReadme() {
  await fs.writeFile(
    path.join(FIXTURES_DIR, 'README.md'),
    `# Test Fixtures

This directory contains test data for manual testing of nxocto.

## Generated Files

- \`images/\` - Sample images (JPG, PNG)
- \`code/\` - Sample code files with image references (TSX, CSS, HTML, MD)
- \`output/\` - Will be created when you run conversion commands

## Manual Testing Examples

### Basic Conversion
\`\`\`bash
node dist/cli.js convert-images test-fixtures/images --output test-fixtures/output
\`\`\`

### With Reference Updates
\`\`\`bash
node dist/cli.js convert-images test-fixtures/images --output test-fixtures/output --refs test-fixtures/code
\`\`\`

### With Archive
\`\`\`bash
node dist/cli.js convert-images test-fixtures/images --output test-fixtures/output --archive test-fixtures/archive --refs test-fixtures/code
\`\`\`

### With Delete (use --yes to skip confirmation)
\`\`\`bash
node dist/cli.js convert-images test-fixtures/images --output test-fixtures/output --delete --yes
\`\`\`

### SVG Optimization
\`\`\`bash
# Basic optimization
node dist/cli.js optimize-svg test-fixtures/images --output test-fixtures/output

# With precision and reference updates
node dist/cli.js optimize-svg test-fixtures/images --output test-fixtures/output --precision 1 --refs test-fixtures/code
\`\`\`

### Asset Metadata Extraction
\`\`\`bash
# Basic extraction
node dist/cli.js extract-metadata test-fixtures/images --output-file test-fixtures/metadata.json

# Without file size
node dist/cli.js extract-metadata test-fixtures/images --output-file test-fixtures/metadata-no-size.json --no-size
\`\`\`

### Placeholder Generation
\`\`\`bash
# Basic generation
node dist/cli.js generate-placeholders test-fixtures/images --output-file test-fixtures/placeholders.json

# Custom size and quality
node dist/cli.js generate-placeholders test-fixtures/images --output-file test-fixtures/placeholders-small.json --size 5 --quality 30
\`\`\`

  ### Image Resizing
  \`\`\`bash
  # Resize to multiple widths
  node dist/cli.js resize-images test-fixtures/images --widths 300,600 --output test-fixtures/output

  # Resize and convert to WebP
  node dist/cli.js resize-images test-fixtures/images --widths 400 --format webp --output test-fixtures/output
  \`\`\`

### Different Formats
\`\`\`bash
# WebP (default)
node dist/cli.js convert-images test-fixtures/images --output test-fixtures/output --format webp --quality 85

# AVIF
node dist/cli.js convert-images test-fixtures/images --output test-fixtures/output --format avif --quality 80
\`\`\`

### Find Unused Assets
\`\`\`bash
# Basic finding
node dist/cli.js find-unused test-fixtures/images --refs test-fixtures/code

# With JSON output
node dist/cli.js find-unused test-fixtures/images --refs test-fixtures/code --output-file test-fixtures/unused.json

# Archive unused (use --yes to skip confirmation)
node dist/cli.js find-unused test-fixtures/images --refs test-fixtures/code --archive test-fixtures/unused-archive --yes
\`\`\`

### Find Duplicate Assets
\`\`\`bash
# Find duplicates
node dist/cli.js find-duplicates test-fixtures/duplicates

# Delete duplicates and update references
node dist/cli.js find-duplicates test-fixtures/duplicates --refs test-fixtures/code --delete --yes

# Archive duplicates
node dist/cli.js find-duplicates test-fixtures/duplicates --archive test-fixtures/duplicates-archive --yes
\`\`\`

### PDF Optimization
\`\`\`bash
# Basic optimization
node dist/cli.js optimize-pdf test-fixtures/pdfs --output test-fixtures/output

# With archive
node dist/cli.js optimize-pdf test-fixtures/pdfs --output test-fixtures/output --archive test-fixtures/archive --yes
\`\`\`

### SVG to React Component Conversion
\`\`\`bash
# Basic conversion to TypeScript components
node dist/cli.js svg-to-component test-fixtures/svg-icons --output test-fixtures/components

# Conversion with prefix and index file
node dist/cli.js svg-to-component test-fixtures/svg-icons --output test-fixtures/components --prefix Icon --typescript
\`\`\`

## Regenerating Fixtures

To regenerate these test fixtures:
\`\`\`bash
pnpm generate-fixtures
\`\`\`
`
  );

  console.log('  ✓ Generated README with usage instructions');
}

async function generateUnusedAssetsFixtures() {
  console.log('Generating unused assets fixtures...');

  // illustration.svg is already unused from previous steps,
  // but let's add something more specific.
  await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0.5 }
    }
  }).png().toFile(path.join(IMAGES_DIR, 'unused-asset.png'));

  console.log('  ✓ Generated additional unused asset');
}

async function generateResizeFixtures() {
  const resizeDir = path.join(FIXTURES_DIR, 'resize');
  await fs.mkdir(resizeDir, { recursive: true });

  console.log('Generating resize test fixtures...');

  await sharp({
    create: { width: 1200, height: 1200, channels: 3, background: { r: 100, g: 100, b: 255 } }
  }).jpeg().toFile(path.join(resizeDir, 'landscape.jpg'));

  await sharp({
    create: { width: 800, height: 1200, channels: 3, background: { r: 255, g: 100, b: 255 } }
  }).png().toFile(path.join(resizeDir, 'portrait.png'));

  console.log('  ✓ Generated 2 resize test images');
}

async function generateDuplicateFixtures() {
  const dupDir = path.join(FIXTURES_DIR, 'duplicates');
  await fs.mkdir(dupDir, { recursive: true });

  console.log('Generating duplicate test fixtures...');

  const content = 'This is a duplicate file content.';
  await fs.writeFile(path.join(dupDir, 'file1.txt'), content);
  await fs.writeFile(path.join(dupDir, 'file1_copy.txt'), content);

  await fs.mkdir(path.join(dupDir, 'nested'), { recursive: true });
  await fs.writeFile(path.join(dupDir, 'nested', 'file1_nested_copy.txt'), content);

  await fs.writeFile(path.join(dupDir, 'unique.txt'), 'This is a unique file content.');

  // Code with references to duplicates
  await fs.writeFile(
    path.join(CODE_DIR, 'Duplicates.js'),
    `// References to duplicate files\nconst f1 = 'file1_copy.txt';\nconst f2 = 'file1_nested_copy.txt';`
  );

  console.log('  ✓ Generated duplicate test fixtures');
}

async function main() {
  console.log('🔧 Generating test fixtures for manual testing...\n');

  try {
    await generateTestImages();
    await generateTestSvgs();
    await generateTestCode();
    await generateUnusedAssetsFixtures();
    await generateResizeFixtures();
    await generateDuplicateFixtures();
    await generateTestPdfs();
    await generateSvgToComponentFixtures();
    await generateReadme();

    console.log('\n✅ Test fixtures ready in test-fixtures/');
    console.log('\nTry running:');
    console.log('  node dist/cli.js convert-images test-fixtures/images --output test-fixtures/output');
    console.log('  node dist/cli.js extract-metadata test-fixtures/images --output-file test-fixtures/metadata.json');
    console.log('\nSee test-fixtures/README.md for more examples.');
  } catch (error) {
    console.error('Error generating fixtures:', error);
    process.exit(1);
  }
}

main();
