# Favicon Generator

Generate a complete set of favicons for your Next.js project from a single high-resolution source image (PNG or SVG).

## Files
- `faviconGenerator.ts` - Main implementation

## Functionality
- Resizes the source image to standard favicon sizes (16x16, 32x32, 48x48, 180x180, 192x192, 512x512).
- Generates a multi-resolution `favicon.ico` (includes 16x16, 32x32, 48x48).
- Generates `icon.png` (32x32) and `apple-icon.png` (180x180) for Next.js App Router.
- Optionally generates a `site.webmanifest` file with configurable app name and colors.

## Usage

### CLI
```bash
nxocto generate-favicons <source-file> [options]
```

### Programmatic
```typescript
import { generateFavicons } from 'nxocto';

const result = await generateFavicons('./icon.png', {
  outputDir: './public',
  generateManifest: true,
  appName: 'My Awesome App',
  themeColor: '#ffffff'
});
```

## Options
- `outputDir` - Directory where favicons will be saved (default: `./public`)
- `generateManifest` - Whether to generate a `site.webmanifest` file
- `appName` - Name of the application for the manifest
- `appShortName` - Short name of the application for the manifest
- `backgroundColor` - Background color for the manifest
- `themeColor` - Theme color for the manifest

## Examples

### Basic Generation
```bash
nxocto generate-favicons icon.png
```

### With Manifest and Custom Output
```bash
nxocto generate-favicons icon.svg --output ./public/icons --manifest --name "My Project" --theme "#336699"
```

## Next.js Integration
This utility follows the naming conventions expected by the Next.js App Router:
- `favicon.ico`
- `icon.png` (32x32)
- `apple-icon.png` (180x180)

Simply point the output directory to your `public` folder or the `app` directory.
