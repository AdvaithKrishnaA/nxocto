# SVG Optimizer

Optimizes SVG files by removing unnecessary metadata, comments, and minifying path data while maintaining visual quality.

## Files
- `svgOptimizer.ts` - Main implementation using SVGO

## Functionality
- Removes metadata, comments, and hidden elements
- Minifies path data with configurable precision
- Updates references in code files if filenames change (though usually they stay the same)
- Supports archiving or deleting original files
- Safe by default: keeps originals unless confirmed or `--yes` flag is used

## Usage

### CLI
```bash
# Basic optimization (overwrites originals)
nxocto optimize-svg ./public/icons

# Optimize to a different folder
nxocto optimize-svg ./public/icons --output ./public/optimized-icons

# With custom precision
nxocto optimize-svg ./public/icons --precision 1

# Delete original files after optimization (to a different folder)
nxocto optimize-svg ./public/icons --output ./public/optimized --delete --yes
```

### Programmatic
```typescript
import { optimizeSvg, optimizeSvgsInFolders } from 'nxocto';

// Single file
const result = await optimizeSvg('./icon.svg', {
  floatPrecision: 1,
  multipass: true
});

// Folder
const results = await optimizeSvgsInFolders('./icons', {
  outputDir: './optimized',
  floatPrecision: 2
});
```

## Options
- `outputDir` - Where to save optimized SVGs (defaults to source folder)
- `precision` - Decimal precision for numeric values (default: 2)
- `multipass` - Whether to run multiple optimization passes (default: true)
- `referenceDirs` - Folders to scan and update SVG references
- `deleteOriginals` - Delete original files (only if outputDir is different)
- `archiveDir` - Move original files to this folder (only if outputDir is different)

## Adding New Options
To add new SVGO plugins or configurations, modify the `plugins` array in `svgOptimizer.ts`.
