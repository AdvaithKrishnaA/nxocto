# Asset Metadata Extractor

Extract dimensions, format, and size from images and SVGs into a JSON file.

This is particularly useful for Next.js developers using the `next/image` component with dynamic assets, where dimensions are needed to prevent layout shifts.

## Files
- `metadataExtractor.ts` - Main implementation

## Functionality
- Scans a directory for images and SVGs
- Extracts width, height, format, and file size
- Calculates aspect ratio
- Supports recursive scanning
- Generates a structured JSON file

## Usage

### CLI
```bash
nxocto extract-metadata <source-folder> [options]
```

### Programmatic
```typescript
import { extractMetadata } from 'nxocto';

const result = await extractMetadata('./public/images', {
  outputFile: './data/image-metadata.json',
  includeSize: true,
  recursive: true
});

console.log(`Processed ${result.count} assets`);
```

## Options
- `outputFile` - Path to the generated JSON file (default: `metadata.json`)
- `includeSize` - Whether to include file size in bytes (default: `true`)
- `recursive` - Whether to scan subdirectories (default: `true`)

## JSON Structure
```json
{
  "logo.png": {
    "width": 512,
    "height": 512,
    "format": "png",
    "size": 15240,
    "aspectRatio": 1
  },
  "blog/hero.jpg": {
    "width": 1200,
    "height": 630,
    "format": "jpeg",
    "size": 85420,
    "aspectRatio": 1.9047619047619047
  }
}
```

## Next.js Integration Example

```tsx
import Image from 'next/image';
import metadata from '../data/image-metadata.json';

export function SmartImage({ src, alt }) {
  const info = metadata[src];

  if (!info) return <img src={src} alt={alt} />;

  return (
    <Image
      src={src}
      alt={alt}
      width={info.width}
      height={info.height}
    />
  );
}
```
