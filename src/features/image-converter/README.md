# Image Converter Feature

Converts images to modern web formats (WebP, AVIF) with automatic reference updates.

## Files

- `imageConverter.ts` - Core conversion logic
- `types.ts` - TypeScript interfaces (in `src/types.ts`)
- `cli.ts` - CLI command handler (in `src/cli.ts`)
- `tests/imageConverter.test.ts` - Unit tests
- `tests/cli.test.ts` - CLI integration tests

## Functionality

1. **Image Conversion** - Convert JPG, PNG, GIF, TIFF, BMP to WebP/AVIF
2. **Reference Updates** - Automatically update image references in code files
3. **Original File Handling** - Delete, archive, or keep original files
4. **Batch Processing** - Process entire directories at once

## Usage

### Programmatic
```typescript
import { convertImagesInFolders } from './features/image-converter/imageConverter';

const results = await convertImagesInFolders(
  './images',
  './output',
  ['./src'],
  'webp',
  80,
  false,
  undefined,
  false
);
```

### CLI
```bash
node dist/cli.js convert-images ./images --output ./output --refs ./src
```

## Adding New Options

1. Add option to `ImageConversionOptions` in `src/types.ts`
2. Update conversion logic in `imageConverter.ts`
3. Add CLI flag parsing in `src/cli.ts`
4. Add tests in `tests/imageConverter.test.ts`
5. Update documentation in main README.md
