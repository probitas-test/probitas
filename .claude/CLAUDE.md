# Probitas

Scenario-based testing and workflow execution framework.

## Quick Reference

- **Runtime**: Deno 2.x
- **Registry**: JSR (`@probitas/probitas`)
- **Package exports**: Library API (`mod.ts`) and CLI (`cli.ts`)
- **Example scenarios**: `probitas/*.probitas.ts`

## Repository Role

This repository provides the user-facing Probitas package that includes:

- **Library API** - Scenario builder, Skip, client exports, and expectation utilities
- **CLI** - Command-line interface for running and managing scenarios
- **Client integrations** - Re-exports of client packages with unified interface

Core framework packages (`@probitas/builder`, `@probitas/runner`, etc.) are maintained separately in the [probitas/probitas-packages](https://github.com/probitas-test/probitas-packages) repository.

## Commands

```bash
deno task verify      # Run format, lint, type check and tests (USE THIS)
deno task test        # Run tests only
deno task probitas    # Run the CLI (e.g., deno task probitas run)
```
