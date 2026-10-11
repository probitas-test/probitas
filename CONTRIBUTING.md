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
cp .envrc.sample .envrc
direnv allow
```

Run project tasks from within the Nix shell with [just](https://just.systems):

```bash
just              # List the recipes
just ci           # Everything CI checks: format, lint, type check, JSR manifest, build, tests
just install      # Install the dependencies bun.lock pins
just test         # Run tests only
just probitas     # Run the CLI from source (e.g. `just probitas run`)
just compile      # Build the single binary into out/
just build        # Build the library for npm into dist/
just jsr-sync     # Regenerate deno.json (the JSR manifest) from package.json
just fmt          # Format the sources
```

The example scenarios in `probitas/` double as the end-to-end suite. Start the
services they talk to with `docker compose up -d`, then run `just probitas run`.

## Release Process

A release is a GitHub Release whose tag is the version (`v2.0.0`); the tag is
the only record of it, so never bump the version in `package.json` by hand.
Choose the version from the changes since the previous release, following
semantic versioning: a breaking change (`!`) is major, `feat` is minor, anything
else is patch.

Publishing the Release runs `.github/workflows/publish.yml`, which:

1. stamps the version into `package.json` and `deno.json`;
2. builds the binaries and attaches them with `SHA256SUMS` to the Release;
3. publishes to npm and JSR through OIDC trusted publishing (no tokens);
4. asks the Homebrew tap to update its formula.

A Release marked as a pre-release publishes under npm's `next` dist-tag only and
leaves Homebrew alone. Running the workflow by hand is a dry run of the same
steps.

The Nix flake builds the CLI from source, so a release does not touch it. When
`bun.lock` changes, update the node_modules hash in `nix/probitas.nix`: the
`nix-package` CI job fails with the expected value, or run
`nix build .#probitas`.

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
