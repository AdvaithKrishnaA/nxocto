# PDF Optimizer

Reduce the file size of PDF documents by removing metadata and using object stream compression.

## Files
- `pdfOptimizer.ts` - Main implementation

## Functionality
- Clears PDF metadata (Title, Author, Subject, etc.)
- Saves with object stream compression to reduce file size
- Batch processing of entire directories
- Original file handling: keep, delete, or archive

## Usage

### CLI
```bash
nxocto optimize-pdf <source> [options]
```

### Programmatic
```typescript
import { optimizePdfsInFolders } from 'nxocto';

const results = await optimizePdfsInFolders('./documents', {
  outputDir: './optimized',
  deleteOriginals: false
});
```

## Options
- `outputDir` - Where to save optimized PDFs
- `deleteOriginals` - Delete original files after optimization (prompts for confirmation)
- `archiveDir` - Move original files to archive folder (prompts for confirmation)
- `skipConfirmation` - Skip confirmation prompts (for automation)

## Examples

### Basic Optimization
```bash
nxocto optimize-pdf ./documents
```

### With Output Folder
```bash
nxocto optimize-pdf ./documents --output ./optimized
```

### Archive Originals
```bash
nxocto optimize-pdf ./documents --archive ./archive
```

## Adding New Options
To add new optimization options, update `PdfOptimizerOptions` in `src/types.ts` and modify `optimizePdf` in `pdfOptimizer.ts`.
