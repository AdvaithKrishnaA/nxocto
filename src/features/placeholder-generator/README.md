# Placeholder Generator

Generate low-resolution blurry base64 placeholders for images, perfect for Next.js `next/image` with `placeholder="blur"`.

## Files
- `placeholderGenerator.ts` - Main implementation

## Functionality
- Scans a directory for images (JPG, PNG, WebP, AVIF)
- Generates a low-resolution blurry version of each image
- Converts the blurry image to a base64 Data URL
- Outputs a JSON mapping of relative file paths to their base64 Data URLs
- Supports recursive directory scanning
- Configurable placeholder size and quality

## Usage

### CLI
```bash
nxocto generate-placeholders <source-folder> [options]
```

**Options:**
- `--output-file <file>` - Output JSON file (default: `placeholders.json`)
- `--size <number>` - Width of the placeholder in pixels (default: `10`)
- `--quality <number>` - Quality of the placeholder (default: `50`)
- `--no-recursive` - Disable recursive scanning

### Programmatic
```typescript
import { generatePlaceholders } from 'nxocto';

const results = await generatePlaceholders('./public/images', {
  outputFile: './placeholders.json',
  size: 20
});

console.log(`Generated ${results.count} placeholders`);
```

## Next.js Integration

You can use the generated JSON file with `next/image`:

```tsx
import placeholders from '../placeholders.json';
import Image from 'next/image';

export function MyImage({ src, alt }) {
  const blurDataURL = placeholders[src.replace(/^\//, '')];

  return (
    <Image
      src={src}
      alt={alt}
      placeholder="blur"
      blurDataURL={blurDataURL}
      width={800}
      height={600}
    />
  );
}
```
