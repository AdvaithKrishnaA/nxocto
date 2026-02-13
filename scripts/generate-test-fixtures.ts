#!/usr/bin/env ts-node
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

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

### Different Formats
\`\`\`bash
# WebP (default)
node dist/cli.js convert-images test-fixtures/images --output test-fixtures/output --format webp --quality 85

# AVIF
node dist/cli.js convert-images test-fixtures/images --output test-fixtures/output --format avif --quality 80
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

async function main() {
  console.log('🔧 Generating test fixtures for manual testing...\n');

  try {
    await generateTestImages();
    await generateTestCode();
    await generateReadme();

    console.log('\n✅ Test fixtures ready in test-fixtures/');
    console.log('\nTry running:');
    console.log('  node dist/cli.js convert-images test-fixtures/images --output test-fixtures/output');
    console.log('\nSee test-fixtures/README.md for more examples.');
  } catch (error) {
    console.error('Error generating fixtures:', error);
    process.exit(1);
  }
}

main();
