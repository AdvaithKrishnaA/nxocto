# Feature Organization Guidelines

## Project Structure

```
nxocto/
├── src/
│   ├── features/           # Feature modules (one per feature)
│   │   ├── image-converter/
│   │   │   ├── imageConverter.ts
│   │   │   └── README.md
│   │   └── [new-feature]/
│   │       ├── [feature].ts
│   │       └── README.md
│   ├── cli.ts              # CLI entry point (routes to features)
│   ├── index.ts            # Main exports
│   └── types.ts            # Shared types
├── tests/
│   ├── imageConverter.test.ts
│   ├── cli.test.ts
│   └── [newFeature].test.ts
├── scripts/
│   └── generate-test-fixtures.ts
├── .ai/rules/              # AI guidelines
└── test-fixtures/          # Generated test data (gitignored)
```

## Adding a New Feature

Follow these steps to add a new feature to the repository:

### 1. Create Feature Directory

```bash
src/features/[feature-name]/
├── [feature-name].ts       # Main implementation
└── README.md               # Feature documentation
```

### 2. Define Types

Add feature-specific types to `src/types.ts`:

```typescript
// In src/types.ts
export interface YourFeatureOptions {
  // Feature options
}

export interface YourFeatureResult {
  success: boolean;
  // Result properties
}
```

### 3. Implement Feature

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

### 4. Export from Main Index

Update `src/index.ts`:

```typescript
export { yourFeature } from './features/[feature-name]/[feature-name]';
export type { YourFeatureOptions, YourFeatureResult } from './types';
```

### 5. Add CLI Command

Update `src/cli.ts` to add new command:

```typescript
// Add to help text
if (args.length === 0) {
  console.log('Commands:');
  console.log('  convert-images    Convert images to WebP/AVIF');
  console.log('  your-command      Your feature description');
  // ...
}

// Add command handler
if (command === 'your-command') {
  // Parse arguments
  // Call your feature
  // Display results
}
```

### 6. Write Tests

Create `tests/[featureName].test.ts`:

```typescript
import { yourFeature } from '../src/features/[feature-name]/[feature-name]';

describe('[featureName]', () => {
  // Generate test data programmatically
  // Test success cases
  // Test error cases
  // Test edge cases
});
```

Create `tests/cli-[feature].test.ts` for CLI tests.

### 7. Update Test Fixtures Generator

Add fixture generation to `scripts/generate-test-fixtures.ts`:

```typescript
async function generateYourFeatureFixtures() {
  // Generate test data for manual testing
}

// Call in main()
await generateYourFeatureFixtures();
```

### 8. Document Feature

Create `src/features/[feature-name]/README.md`:

```markdown
# [Feature Name]

Description of what the feature does.

## Files
- List of files

## Functionality
- What it does

## Usage
- Examples

## Adding New Options
- How to extend
```

Update main `README.md` with usage examples.

## Feature Isolation Rules

1. **Each feature is self-contained** in its own directory
2. **Shared types** go in `src/types.ts`
3. **Shared utilities** go in `src/utils/` (if needed)
4. **CLI routing** happens in `src/cli.ts`
5. **Main exports** are in `src/index.ts`
6. **Tests mirror feature structure** in `tests/`

## Naming Conventions

- **Feature directories**: kebab-case (e.g., `image-converter`, `pdf-optimizer`)
- **Files**: camelCase for TS files (e.g., `imageConverter.ts`)
- **Functions**: camelCase (e.g., `convertImages`)
- **Types**: PascalCase (e.g., `ImageConversionOptions`)
- **CLI commands**: kebab-case (e.g., `convert-images`)

## Example: Adding a "PDF Optimizer" Feature

```
1. Create: src/features/pdf-optimizer/pdfOptimizer.ts
2. Add types to: src/types.ts
3. Export from: src/index.ts
4. Add CLI command in: src/cli.ts
5. Create tests: tests/pdfOptimizer.test.ts, tests/cli-pdf.test.ts
6. Add fixtures: scripts/generate-test-fixtures.ts
7. Document: src/features/pdf-optimizer/README.md
8. Update: README.md
```

## CLI Command Pattern

All CLI commands should follow this pattern:

```typescript
if (command === 'your-command') {
  // 1. Parse arguments
  const sourceFolder = args[1];
  let option1, option2, skipConfirmation = false;
  
  for (let i = 2; i < args.length; i++) {
    // Parse flags
  }
  
  // 2. Call feature function
  yourFeature(sourceFolder, { option1, option2 })
    .then(async (results) => {
      // 3. Display results
      console.log('✓ Operation complete');
      
      // 4. Handle confirmations if needed
      if (needsConfirmation && !skipConfirmation) {
        const confirmed = await askConfirmation('Proceed? (y/n): ');
        if (confirmed) {
          // Do destructive action
        }
      }
    })
    .catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
}
```

## Testing Pattern

```typescript
describe('featureName', () => {
  const testDir = path.join(__dirname, 'temp-feature-test');
  
  beforeEach(async () => {
    // Generate test data programmatically
    await fs.mkdir(testDir, { recursive: true });
    await generateTestData(testDir);
  });
  
  afterEach(async () => {
    // Clean up
    await fs.rm(testDir, { recursive: true, force: true });
  });
  
  it('should handle success case', async () => {
    // Test implementation
  });
  
  it('should handle error case', async () => {
    // Test implementation
  });
});
```

## Key Principles

1. **Modularity** - Each feature is independent
2. **Discoverability** - Clear structure makes features easy to find
3. **Consistency** - All features follow the same pattern
4. **Documentation** - Each feature documents itself
5. **Testability** - Features are easy to test in isolation
6. **Extensibility** - Adding features doesn't break existing ones

## When to Create a New Feature vs Extend Existing

**Create new feature when:**
- Functionality is conceptually different (e.g., PDF optimization vs image conversion)
- Has its own set of options and results
- Can be used independently

**Extend existing feature when:**
- Adding a new format or option to existing feature
- Enhancing current functionality
- Sharing most of the same logic

## AI Agent Checklist

When adding a new feature, ensure:
- [ ] Feature directory created in `src/features/[name]/`
- [ ] Types added to `src/types.ts`
- [ ] Implementation in feature directory
- [ ] Exported from `src/index.ts`
- [ ] CLI command added to `src/cli.ts`
- [ ] Unit tests created in `tests/`
- [ ] CLI tests created in `tests/`
- [ ] Test fixtures generator updated
- [ ] Feature README.md created
- [ ] Main README.md updated
- [ ] Follows safety-first design (confirmations for destructive actions)
- [ ] Includes `--yes` flag for automation
