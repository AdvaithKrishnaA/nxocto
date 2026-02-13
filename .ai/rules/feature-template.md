# Feature Development Template

When adding new features to NxOcto, follow this structure. See `.ai/rules/feature-organization.md` for complete guidelines.

## Quick Start Checklist

1. Create feature directory: `src/features/[feature-name]/`
2. Add types to `src/types.ts`
3. Implement in feature directory
4. Export from `src/index.ts`
5. Add CLI command to `src/cli.ts`
6. Write tests in `tests/`
7. Update test fixtures generator
8. Document in feature README.md
9. Update main README.md

## Safety-First Design Principles

For any destructive operations:
1. Perform the main operation first (convert, process, etc.)
2. Show results to the user
3. Ask for confirmation before destructive actions (delete, overwrite, etc.)
4. Provide a `--yes` or `-y` flag to skip confirmations for automation
5. Make the safe option the default (keep, backup, etc.)

## TypeScript Configuration

When adding scripts or utilities outside the main `src/` directory:
- Remove `rootDir` from tsconfig.json to allow multiple source directories
- TypeScript will compile all included files to `dist/` maintaining directory structure
- Scripts in `scripts/` will compile to `dist/scripts/`
- Update package.json scripts to reference the correct compiled path

## 1. Define Types
Add necessary types to `src/types.ts`:
```typescript
export interface YourFeatureOptions {
  // Define options
}

export interface YourFeatureResult {
  success: boolean;
  // Define result properties
}
```

## 2. Implement Feature
Create `src/features/[feature-name]/[feature-name].ts`:
```typescript
import type { YourFeatureOptions, YourFeatureResult } from '../../types';

export async function yourFeature(
  input: string,
  options: YourFeatureOptions
): Promise<YourFeatureResult> {
  // Implementation
}
```

## 3. Export API
Update `src/index.ts`:
```typescript
export { yourFeature } from './features/[feature-name]/[feature-name]';
export type { YourFeatureOptions, YourFeatureResult } from './types';
```

## 4. Add CLI Command
Update `src/cli.ts` to add command handler.

## 5. Add Tests
Create `tests/[featureName].test.ts`:
```typescript
import { yourFeature } from '../src/features/[feature-name]/[feature-name]';

describe('yourFeature', () => {
  it('should handle basic case', async () => {
    // Test implementation
  });
});
```

## 6. Document Feature
Create `src/features/[feature-name]/README.md` with usage and examples.

