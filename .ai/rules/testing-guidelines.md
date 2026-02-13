# Automated Testing Guidelines

## Overview
This project uses AI-generated tests. All tests should be automatically created and maintained by AI agents.

## Test Generation Requirements

When adding a new feature, AI agents should:

1. **Generate realistic test data** - Create actual test files (images, code samples) programmatically
2. **Test all code paths** - Success cases, error cases, edge cases
3. **Clean up after tests** - Remove generated files in afterEach/afterAll hooks
4. **Use temporary directories** - Never pollute the main codebase
5. **Mock external dependencies** - When appropriate for unit tests
6. **Provide manual testing setup** - Include a script to generate test fixtures for manual testing

## Manual Testing Support

Every feature should include a way to generate test fixtures for manual testing:

1. Create a `scripts/generate-test-fixtures.ts` script
2. Generate realistic test data in a `test-fixtures/` directory
3. Add instructions in test file comments on how to use fixtures
4. Keep fixtures in `.gitignore` but document how to generate them

Example script structure:
```typescript
// scripts/generate-test-fixtures.ts
import { generateTestImages, generateTestCode } from './test-helpers';

async function main() {
  console.log('Generating test fixtures...');
  await generateTestImages('test-fixtures/images');
  await generateTestCode('test-fixtures/code');
  console.log('✓ Test fixtures ready in test-fixtures/');
  console.log('Try: node dist/cli.js convert-images test-fixtures/images --output test-fixtures/output');
}

main();
```

## Test Structure

```typescript
describe('featureName', () => {
  const testDir = path.join(__dirname, 'temp-test-data');
  
  beforeEach(async () => {
    // Generate test data programmatically
    await fs.mkdir(testDir, { recursive: true });
    await generateTestFiles(testDir);
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

## Image Conversion Testing

For image conversion tests:
- Generate small test images using Sharp library
- Test with different formats (JPG, PNG, GIF)
- Verify output files exist and have correct format
- Test reference updates with generated code files
- Test archive and delete functionality

## Reference Update Testing

For reference update tests:
- Generate sample code files with image references
- Verify references are updated correctly
- Test with different file types (TS, JS, CSS, HTML)
- Ensure non-matching files are not modified

## Running Tests

```bash
pnpm test              # Run all tests
pnpm test -- --watch   # Watch mode (for development)
pnpm test -- --coverage # With coverage report
```

## AI Agent Instructions

When asked to add tests:
1. Generate realistic test data programmatically (don't use placeholders)
2. Test the actual functionality with real files
3. Ensure tests are isolated and don't depend on external files
4. Add cleanup to prevent test pollution
5. Test both success and failure scenarios
