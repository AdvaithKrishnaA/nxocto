# OpsUtil Project Guidelines

## Project Overview
NxOcto is a TypeScript-based utility library for Next.js projects, designed to be plug-and-play with automatic feature additions through AI assistance. Users clone the repo from GitHub and run utilities via CLI commands or programmatic API.

## Repository Structure

See `.ai/rules/feature-organization.md` for detailed structure and how to add new features.

Quick overview:
- `src/features/` - Feature modules (one directory per feature)
- `src/cli.ts` - CLI entry point that routes to features
- `src/index.ts` - Main exports for programmatic use
- `src/types.ts` - Shared TypeScript types
- `tests/` - Test files (mirror feature structure)
- `scripts/` - Utility scripts
- `.ai/rules/` - AI agent guidelines

## Code Standards
- Use TypeScript with strict mode enabled
- Follow functional programming patterns where possible
- Export clear, typed interfaces for all public APIs
- Keep functions small and focused on single responsibilities
- When adding scripts outside `src/`, ensure tsconfig.json doesn't have `rootDir` set, or scripts won't compile

## TypeScript Project Structure
- Main source code: `src/`
- Utility scripts: `scripts/` (compiled to `dist/scripts/`)
- Tests: `tests/` (not compiled, run via ts-jest)
- No `rootDir` in tsconfig.json to allow multiple source directories

## Testing Requirements
- All utilities must have corresponding unit tests in `/tests`
- Use Jest for testing framework
- Aim for meaningful test coverage, not just numbers
- Test both success and error cases

## Feature Development Process
1. Define types in `src/types.ts`
2. Implement utility in `src/utils/`
3. Export from `src/index.ts`
4. Add CLI command in `src/cli.ts` for folder-based operations
5. Add tests in `tests/`
6. Update README with CLI and programmatic usage examples

## CLI Design Pattern
- Commands should accept folder paths as arguments
- Support source folder and optional output folder
- Process all relevant files in the folder automatically
- Provide clear progress and error messages
- Example: `node dist/cli.js command-name <source-folder> [output-folder]`

## Image Conversion Guidelines
- Support webp and avif formats
- Default quality: 80
- Handle errors gracefully with clear messages
- Allow batch processing for multiple images

## User Safety and Confirmation
- Destructive operations (delete, archive) should show results BEFORE executing
- Always provide confirmation prompts for destructive actions
- Allow users to review converted images before removing originals
- Provide `--yes` flag to skip confirmations for automated workflows
- Show clear summary of what will happen before asking for confirmation
- Default behavior should be safe (keep originals unless explicitly confirmed)
