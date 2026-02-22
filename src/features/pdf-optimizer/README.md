# PDF Optimizer

Optimizes PDF files by removing unused objects and restructuring the file for smaller size using `pdf-lib`.

## Files
- `pdfOptimizer.ts` - Main implementation

## Functionality
- Basic optimization of PDF files (load and save).
- Recursive directory scanning.
- Supports deleting or archiving original files.
- Calculates potential disk space savings.

## Usage

### CLI
```bash
# Basic optimization
nxocto optimize-pdf ./documents

# Optimize and save to a different folder
nxocto optimize-pdf ./documents --output ./optimized

# Archive originals after optimization
nxocto optimize-pdf ./documents --archive ./pdf-archive --yes
```

### Programmatic
```typescript
import { optimizePdfsInFolders } from 'nxocto';

const results = await optimizePdfsInFolders('./documents', {
  outputDir: './optimized',
  deleteOriginals: true,
  skipConfirmation: true
});
```

## Options
- `--output <folder>` - Where to save optimized PDFs.
- `--delete` - Delete original files after optimization.
- `--archive <folder>` - Move original files to the specified archive folder.
- `--no-recursive` - Disable recursive scanning.
- `--yes, -y` - Skip confirmation prompts.

## Safety-First Design
- Destructive operations (delete/archive) require explicit confirmation unless `--yes` is provided.
- Originals are only deleted/archived if the output folder is different from the source folder.
