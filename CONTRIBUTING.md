# Contributing to NxOcto

This project is designed for AI-assisted development. Whether you're an AI agent or human developer, follow these guidelines.

## For AI Agents

Read these files in order:
1. `.ai/rules/feature-organization.md` - How to structure new features
2. `.ai/rules/project-guidelines.md` - Project standards and conventions
3. `.ai/rules/feature-template.md` - Quick checklist for new features
4. `.ai/rules/testing-guidelines.md` - How to write tests

## For Human Developers

### Getting Started

```bash
# Clone and setup
git clone https://github.com/yourusername/nxocto.git
cd nxocto
pnpm install
pnpm build

# Run tests
pnpm test

# Generate test fixtures for manual testing
pnpm generate-fixtures
```

### Project Structure

```
nxocto/
├── src/
│   ├── features/           # Each feature in its own directory
│   │   └── image-converter/
│   ├── cli.ts              # CLI entry point
│   ├── index.ts            # Main exports
│   └── types.ts            # Shared types
├── tests/                  # Test files
├── scripts/                # Utility scripts
└── .ai/rules/              # AI development guidelines
```

### Adding a New Feature

1. **Create feature directory**: `src/features/[feature-name]/`
2. **Add types**: Update `src/types.ts`
3. **Implement**: Create `[feature-name].ts` in feature directory
4. **Export**: Add to `src/index.ts`
5. **CLI**: Add command to `src/cli.ts`
6. **Test**: Create tests in `tests/`
7. **Document**: Create feature README.md

See `.ai/rules/feature-organization.md` for detailed instructions.

### Code Standards

- TypeScript with strict mode
- Functional programming patterns
- Clear, typed interfaces
- Small, focused functions
- Comprehensive tests
- Safety-first design (confirmations for destructive actions)

### Testing

```bash
# Run all tests
pnpm test

# Run specific test suite
pnpm test:unit
pnpm test:cli

# Generate test fixtures
pnpm generate-fixtures
```

All tests should:
- Generate test data programmatically
- Clean up after themselves
- Test success and error cases
- Be isolated and independent

### Pull Request Guidelines

1. Follow the feature organization structure
2. Include tests for all new functionality
3. Update documentation (README.md and feature README.md)
4. Ensure all tests pass
5. Follow existing code style

### Questions?

Check the `.ai/rules/` directory for detailed guidelines on:
- Feature organization
- Testing patterns
- Code standards
- TypeScript configuration
