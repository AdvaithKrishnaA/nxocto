# SVG to React Component Converter

Converts SVG files into optimized, reusable React components (TSX or JSX). This utility automates a common task in Next.js development, ensuring that icons are optimized with SVGO and follow React best practices.

## Files
- `svgToComponent.ts` - Main implementation

## Functionality
- **SVGO Optimization**: Optimizes SVG files using the default preset, converting styles to attributes, and prefixing IDs to avoid collisions.
- **JSX Transformation**: Automatically transforms SVG attributes to their JSX-compatible camelCase equivalents (e.g., `stroke-width` becomes `strokeWidth`) and replaces `class` with `className`.
- **TypeScript Support**: Generates typed `.tsx` components with `SVGProps<SVGSVGElement>`.
- **Batch Processing**: Converts an entire directory of SVGs at once.
- **Barrel File Generation**: Automatically creates an `index.ts` (or `index.js`) file for easy importing.
- **Configurable naming**: Supports prefixes and suffixes for component names.
- **Dimension handling**: Option to remove `width` and `height` attributes (default: true), which is ideal for icons sized via CSS.

## Usage

### CLI

```bash
# Convert all SVGs in a folder to TypeScript components
nxocto svg-to-component ./public/icons --output ./components/icons

# Convert to JavaScript components with a prefix
nxocto svg-to-component ./icons --output ./components --javascript --prefix Icon

# Keep SVG dimensions
nxocto svg-to-component ./icons --no-dimensions
```

### Programmatic

```typescript
import { svgToComponentsInFolder } from 'nxocto';

const results = await svgToComponentsInFolder('./icons', {
  outputDir: './components/icons',
  typescript: true,
  prefix: 'Icon',
  generateIndex: true
});

results.forEach(result => {
  if (result.success) {
    console.log(`✓ Created component: ${result.componentName}`);
  } else {
    console.error(`✗ Failed to convert ${result.inputPath}: ${result.error}`);
  }
});
```

## Options
- `outputDir` - Directory to save generated components (default: `./components/icons`)
- `typescript` - Whether to generate TypeScript (`.tsx`) or JavaScript (`.jsx`) files (default: true)
- `prefix` - String to prepend to component names
- `suffix` - String to append to component names
- `generateIndex` - Whether to create a barrel file for exports (default: true)
- `removeDimensions` - Whether to remove `width` and `height` from the SVG root (default: true)

## Examples

### Before (icon.svg)
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2">
  <circle cx="12" cy="12" r="10" />
</svg>
```

### After (Icon.tsx)
```tsx
import React, { SVGProps } from 'react';

const Icon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" {...props}>
    <circle cx="12" cy="12" r="10" />
  </svg>
);

export default Icon;
```

## Adding New Options
To extend this feature, update `SvgToComponentOptions` in `src/types.ts` and implement the logic in `svgToComponent.ts`.
