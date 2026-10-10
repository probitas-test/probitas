# Contributing to Probitas

Thank you for your interest in contributing to Probitas! This guide provides
information for developers and maintainers.

## Development Environment

A Nix flake is available to provision the Bun toolchain without global installs.
nixpkgs lags behind Bun releases, so the flake pins the upstream release
Probitas needs (gRPC server streaming over `node:http2` requires Bun 1.4 or
later).

```bash
# Enter the development shell
nix develop

# Optional: auto-activate with direnv
echo "use flake" > .envrc
direnv allow
```

Run project tasks from within the Nix shell:

```bash
bun install
bun run verify    # Run format check, lint, type check, and tests
bun run test      # Run tests only
bun run probitas  # Run the CLI from source (e.g. `bun run probitas run`)
bun run compile   # Build the single binary into out/
bun run build     # Build the library for npm into dist/
bun run jsr:sync  # Regenerate deno.json (the JSR manifest) from package.json
```

The example scenarios in `probitas/` double as the end-to-end suite. Start the
services they talk to with `docker compose up -d`, then run
`bun run probitas run`.

## Release Process

The release tooling is being rebuilt after the move from Deno to Bun; the
previous Deno-based Release and Publish workflows have been removed. This
section will describe the new process once it lands.

## Architecture

This repository provides the user-facing Probitas package, published to npm as
`@probitas-test/probitas` and to JSR as `@probitas/probitas`, which includes:

- **Library API** (`src/mod.ts`) - Scenario builder, Skip, client exports, and
  expectation utilities
- **CLI** (`src/cli.ts`) - Command-line interface for running and managing
  scenarios, distributed as a single binary (`bun build --compile`)
- **Client integrations** (`src/client/`) - Re-exports of client packages with
  unified interface

The binary runs each scenario file in a worker (the binary re-spawned as
`probitas __worker`) and resolves the Probitas modules scenarios import to the
copies embedded in it, so users need nothing but the binary. DuckDB's native
binding is the one exception: it is downloaded and verified on first use (see
`src/cli/duckdb.ts`).

The package depends on core framework packages maintained in the
[probitas-test/probitas-packages](https://github.com/probitas-test/probitas-packages)
repository:

- `@probitas-test/builder` - Type-safe scenario definition API
- `@probitas-test/runner` - Scenario execution engine
- `@probitas-test/core` - Core types and scenario loading
- `@probitas-test/discover` - File discovery with glob patterns
- `@probitas-test/expect` - Expectation library
- `@probitas-test/client-*` - Client implementations for various services

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
