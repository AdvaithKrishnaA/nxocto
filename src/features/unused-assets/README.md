# Unused Asset Detector

The Unused Asset Detector helps you keep your Next.js project clean by identifying assets (images, SVGs, etc.) that are not referenced anywhere in your source code.

## Files
- `unusedAssets.ts` - Main implementation

## Functionality
- Scans a source folder for all asset files.
- Scans specified reference folders for any mention of the asset filenames.
- Supports recursive scanning of both assets and code.
- Can save results to a JSON file.
- Supports deleting or archiving unused assets.

## Usage

### CLI
```bash
nxocto find-unused <assets-folder> --refs <code-folders> [options]
```

### Programmatic
```typescript
import { findUnusedAssets } from 'nxocto';

const results = await findUnusedAssets('./public/images', {
  referenceDirs: ['./src', './pages'],
  outputFile: './unused-assets.json'
});
```

## Options
- `--refs <folder1,folder2>` - Comma-separated folders to scan for references (required).
- `--output-file <file>` - Save results to a JSON file.
- `--delete` - Delete unused assets (prompts for confirmation).
- `--archive <folder>` - Move unused assets to archive folder (prompts for confirmation).
- `--no-recursive` - Disable recursive scanning of assets folder.
- `--yes, -y` - Skip confirmation prompts.

## How it works
The utility collects all filenames from the source folder and checks if each filename exists as a string within any of the code files in the reference directories. This approach is simple and effective for most Next.js projects where images are referenced by their filenames.

## Examples

### Basic usage
```bash
nxocto find-unused ./public/images --refs ./src,./pages
```

### Archive unused assets
```bash
nxocto find-unused ./public/images --refs ./src --archive ./unused-archive --yes
```
