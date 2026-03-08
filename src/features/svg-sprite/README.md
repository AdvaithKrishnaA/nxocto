# SVG Sprite Generator

Generate a single SVG sprite file from a directory of SVG icons. This is a common optimization for Next.js applications, allowing you to load icons once and reference them via the `<use>` tag.

## Files
- `svgSprite.ts` - Main implementation

## Functionality
- Combines multiple SVGs into a single `<svg>` sprite using the `<symbol>` pattern.
- Automatically optimizes SVGs using SVGO (can be disabled).
- Generates unique IDs for each icon based on the filename.
- Supports adding a prefix to icon IDs.
- Optionally generates a TypeScript/JavaScript file with all icon IDs for better type safety.
- Recursive directory scanning.

## Usage

### CLI
```bash
nxocto svg-sprite <source-folder> [options]
```

### Programmatic
```typescript
import { generateSvgSprite } from 'nxocto';

const result = await generateSvgSprite('./icons', {
  outputFile: './public/sprite.svg',
  prefix: 'icon-',
  generateTypes: true,
  typesOutputFile: './types/icons.ts'
});
```

## Options
- `--output-file <file>` - Where to save the generated sprite (default: `sprite.svg`).
- `--prefix <string>` - String to prepend to icon IDs.
- `--no-optimize` - Disable SVGO optimization.
- `--types` - Generate a type definition file for icon IDs.
- `--types-output <file>` - Custom path for the generated types file.
- `--no-recursive` - Disable recursive scanning of the source folder.

## Examples

### Basic usage
```bash
nxocto svg-sprite ./public/icons --output-file ./public/sprite.svg
```

### With prefix and type generation
```bash
nxocto svg-sprite ./icons --output-file ./public/sprite.svg --prefix ui- --types
```

## How to use the generated sprite in React/Next.js

1. Generate your sprite:
   ```bash
   nxocto svg-sprite ./icons --output-file ./public/sprite.svg
   ```

2. Create an Icon component:
   ```tsx
   import React from 'react';

   interface IconProps extends React.SVGProps<SVGSVGElement> {
     id: string; // Or use the generated IconId type
   }

   export const Icon = ({ id, ...props }: IconProps) => (
     <svg {...props}>
       <use href={`/sprite.svg#${id}`} />
     </svg>
   );
   ```
