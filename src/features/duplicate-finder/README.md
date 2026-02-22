# Duplicate Asset Finder

Identifies duplicate assets in a directory by comparing their content hashes. It helps in reducing the repository size and cleaning up redundant assets by merging duplicates and updating references in the code.

## Files
- `duplicateFinder.ts` - Main implementation

## Functionality
- Recursive scanning for duplicates across all file types.
- Groups duplicates by content hash (MD5).
- Calculates potential disk space savings.
- Supports deleting or archiving duplicates while keeping a single "master" copy.
- Automatically updates references in code files (`.tsx`, `.ts`, `.jsx`, `.js`, `.css`, etc.) when duplicates are removed.

## Usage

### CLI
```bash
# Basic scan
nxocto find-duplicates ./public/assets

# Delete duplicates and update references in src folder
nxocto find-duplicates ./public/assets --refs ./src --delete

# Archive duplicates to a separate folder without confirmation
nxocto find-duplicates ./public/assets --archive ./duplicates-archive --yes
```

### Programmatic
```typescript
import { findDuplicates } from 'nxocto';

const result = await findDuplicates('./public/assets', {
  referenceDirs: ['./src'],
  deleteDuplicates: true,
  skipConfirmation: true
});

if (result.success) {
  console.log(`Removed ${result.removedCount} duplicates`);
  console.log(`Updated ${result.referencesUpdated} references`);
}
```

## Options
- `--refs <folders>` - Comma-separated folders to scan for references to update.
- `--delete` - Delete duplicate files (keeping one).
- `--archive <folder>` - Move duplicate files to the specified archive folder.
- `--output-file <file>` - Save the results to a JSON file.
- `--no-recursive` - Disable recursive scanning.
- `--yes, -y` - Skip confirmation prompts.

## Safety-First Design
- By default, it only reports duplicates without taking any action.
- Destructive actions (delete/archive) require explicit confirmation unless `--yes` is provided.
- One file from each duplicate group is always kept as the primary copy.
