# Image Resizer

Batch resize images to specific widths. Perfect for generating responsive image sets for Next.js.

## Files
- `imageResizer.ts` - Main implementation

## Functionality
- Resize images to one or more widths
- Preserve aspect ratio
- Automatic naming convention (`[name]-[width].[ext]`)
- Optional format conversion (WebP, AVIF)
- Recursive processing of entire directories
- Safety-first original file handling (keep, delete, or archive)

## Usage

### CLI
```bash
# Basic usage (resizes to 300px and 600px width)
nxocto resize-images ./images --widths 300,600

# With custom output folder and format conversion
nxocto resize-images ./images --widths 800 --output ./optimized --format webp
```

### Programmatic
```typescript
import { resizeImagesInFolders } from 'nxocto';

const results = await resizeImagesInFolders('./images', {
  widths: [300, 600, 1200],
  outputDir: './public/resized',
  format: 'webp',
  quality: 85
});
```

## Options
- `--widths <w1,w2,...>` - Comma-separated list of target widths (required)
- `--output <folder>` - Where to save resized images
- `--format <webp|avif|original>` - Output format (default: original)
- `--quality <1-100>` - Quality setting for lossy formats (default: 80)
- `--delete` - Delete original files after processing (prompts for confirmation)
- `--archive <folder>` - Move original files to archive folder (prompts for confirmation)
- `--yes, -y` - Skip confirmation prompts

## Examples

### Generating Responsive Set
```bash
nxocto resize-images ./public/hero --widths 640,750,1080,1200 --output ./public/hero/resized --format webp
```

### Downscaling and Archiving
```bash
nxocto resize-images ./assets/raw --widths 1920 --archive ./assets/archive --yes
```
