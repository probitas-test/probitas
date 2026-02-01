# Contributing to Probitas

Thank you for your interest in contributing to Probitas! This guide provides
information for developers and maintainers.

## Development Environment

A Nix flake is available to provision the Deno toolchain without global
installs.

```bash
# Enter the development shell
nix develop

# Optional: auto-activate with direnv
echo "use flake" > .envrc
direnv allow
```

Run project tasks from within the Nix shell:

```bash
deno task verify  # Run format, lint, type check, and tests
deno task test    # Run tests only
```

## Release Process

For maintainers: To publish a new version, use the Release workflow.

### Prerequisites

- Merge all changes to `main` branch
- Ensure all tests pass (`deno task verify`)
- Decide on the version number following
  [Semantic Versioning](https://semver.org/)

### Release Steps

1. Go to the
   [Actions tab](https://github.com/probitas-test/probitas/actions/workflows/release.yml)
2. Click "Run workflow"
3. Enter the version (e.g., `v0.7.2` or `0.7.2`)
4. Click "Run workflow"

The workflow will automatically:

1. Update `deno.json`, `deno.lock`, and `flake.lock`
2. Run comprehensive tests with both Deno and Nix environments
3. Commit the changes to `main` (only if tests pass)
4. Create a git tag
5. Publish to [JSR](https://jsr.io/@probitas/probitas)
6. Create a GitHub Release with auto-generated notes

### Fail-Safe Mechanism

The release workflow includes a fail-safe mechanism:

- **Tests run before release**: After updating lock files, the workflow runs
  full scenario tests in both Deno (`deno task probitas run`) and Nix
  (`nix run . -- run`) environments
- **Release only on success**: If any test fails, the workflow stops before
  committing, tagging, or publishing
- **Consistent state**: This ensures the repository and JSR package remain in a
  consistent, working state

### Post-Release

After a successful release:

- The Homebrew tap will be automatically updated via the `update-homebrew.yml`
  workflow
- Verify the package is available on JSR:
  `deno add jsr:@probitas/probitas@<version>`
- Announce the release if necessary

## Architecture

This repository provides the user-facing Probitas package
(`@probitas/probitas`), which includes:

- **Library API** (`src/mod.ts`) - Scenario builder, Skip, client exports, and
  expectation utilities
- **CLI** (`src/cli.ts`) - Command-line interface for running and managing
  scenarios
- **Client integrations** (`src/client/`) - Re-exports of client packages with
  unified interface

The package depends on core framework packages maintained in the
[probitas/probitas-packages](https://github.com/probitas-test/probitas-packages)
repository:

- `@probitas/builder` - Type-safe scenario definition API
- `@probitas/runner` - Scenario execution engine
- `@probitas/core` - Core types and scenario loading
- `@probitas/discover` - File discovery with glob patterns
- `@probitas/expect` - Expectation library
- `@probitas/client-*` - Client implementations for various services

## Related Repositories

- [probitas-test/probitas-packages](https://github.com/probitas-test/probitas-packages) -
  Core framework packages
- [probitas-test/homebrew-tap](https://github.com/probitas-test/homebrew-tap) -
  Homebrew formula for easy installation
- [probitas-test/setup-probitas](https://github.com/probitas-test/setup-probitas) -
  GitHub Actions setup action
- [probitas-test/claude-plugins](https://github.com/probitas-test/claude-plugins) -
  Claude Code plugin for AI-assisted scenario development
- [probitas-test/documents](https://github.com/probitas-test/documents) -
  Documentation website with llms.txt support
