# Probitas

Scenario-based testing and workflow execution framework.

## Quick Reference

- **Runtime**: Bun 1.4+ (pinned in `flake.nix`)
- **Registries**: npm (`@probitas-test/probitas`) and JSR (`@probitas/probitas`)
- **Package exports**: Library API (`src/mod.ts` and subpaths); the CLI
  (`src/cli.ts`) ships as a single binary built with `bun run compile`
- **Example scenarios**: `probitas/*.probitas.ts`

## Repository Role

This repository provides the user-facing Probitas package that includes:

- **Library API** - Scenario builder, Skip, client exports, and expectation
  utilities
- **CLI** - Command-line interface for running and managing scenarios
- **Client integrations** - Re-exports of client packages with unified interface

Core framework packages (`@probitas-test/builder`, `@probitas-test/runner`,
etc.) are maintained separately in the
[probitas-packages](https://github.com/probitas-test/probitas-packages)
repository.

## Commands

```bash
bun run verify        # Run format check, lint, type check and tests (USE THIS)
bun run test          # Run tests only
bun run probitas      # Run the CLI from source (e.g., bun run probitas run)
bun run compile       # Build the single binary into out/
```
