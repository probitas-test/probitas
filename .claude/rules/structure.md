---
paths: "src/**/*"
---
# Package Structure

Single-package structure for user-facing Probitas.

## Directory Layout

```
probitas/
├── deno.json                     # Package configuration
├── src/
│   ├── mod.ts                    # Main entry point (library API)
│   ├── cli.ts                    # CLI entry point
│   ├── cli/                      # CLI implementation
│   │   ├── commands/             # CLI commands (run, list, init, etc.)
│   │   ├── config.ts             # Configuration loading
│   │   └── ...                   # Other CLI utilities
│   ├── client.ts                 # Client exports (re-export hub)
│   ├── client/                   # Client re-exports
│   │   ├── http.ts               # HTTP client re-export
│   │   ├── sql.ts                # SQL client re-export
│   │   ├── sql/                  # SQL client variants
│   │   └── ...                   # Other client re-exports
│   └── expect.ts                 # Expectation API (re-exports from @probitas/expect)
├── probitas/                     # Example scenarios
├── assets/                       # CLI assets (help texts, examples)
└── .claude/                      # Claude Code configuration
```

## Package Responsibilities

### Library API (`src/mod.ts`)

The main entry point provides the user-facing API for writing scenarios:

- Re-exports `scenario` builder from `@probitas/builder`
- Re-exports `Skip` class from `@probitas/runner`
- Re-exports type definitions (`StepContext`, etc.)
- Exports `client` namespace and `expect` utilities
- Re-exports useful testing utilities (faker, time mocking, spies, etc.)

### CLI (`src/cli.ts`)

Command-line interface for managing and running scenarios:

- Scenario discovery and execution
- Configuration management
- Formatting, linting, and type checking
- Multiple reporter formats

### Client Integrations (`src/client/`)

Re-exports client packages with unified interface:

- Each client file re-exports from corresponding `@probitas/client-*` package
- Provides a single import point for all clients
- Maintains type safety across client implementations

## External Dependencies

This package depends on framework packages maintained in the [probitas/probitas-packages](https://github.com/probitas-test/probitas-packages) repository:

```mermaid
graph TD
    probitas[@probitas/probitas] --> builder[@probitas/builder]
    probitas --> runner[@probitas/runner]
    probitas --> expect[@probitas/expect]
    probitas --> client-http[@probitas/client-http]
    probitas --> client-sql[@probitas/client-sql]
    probitas --> other-clients[Other @probitas/client-* packages...]
    runner --> builder
    runner --> core[@probitas/core]
    core --> discover[@probitas/discover]
```

## Dependency Management

- **JSR imports**: All external Probitas packages are imported via `jsr:@probitas/xxx@^version`
- **Self-reference**: Package references itself via `jsr:@probitas/probitas@^0` mapped to `./src/mod.ts` for local development and testing
- **Version management**: All dependencies are declared in `deno.json` under the `imports` field
- **Lock file**: `deno.lock` ensures reproducible builds

## Export Strategy

### Main Entry (`src/mod.ts`)

```typescript
// Re-export builder API
export { scenario } from "@probitas/builder";
export { Skip } from "@probitas/runner";
export type { BuilderStepContext as StepContext } from "@probitas/builder";

// Export client namespace and expect utilities
export * as client from "./client.ts";
export * from "./expect.ts";

// Re-export testing utilities
export { faker } from "@faker-js/faker";
export * from "@std/testing/time";
export * from "@std/testing/mock";
```

### CLI Entry (`src/cli.ts`)

Provides CLI commands without exposing internal implementation:

- Commands are in `src/cli/commands/`
- Main CLI handler dispatches to command handlers
- Not re-exported from `mod.ts`

### Client Hub (`src/client.ts`)

```typescript
// Re-export all client modules
export * as http from "./client/http.ts";
export * as graphql from "./client/graphql.ts";
export * as connectrpc from "./client/connectrpc.ts";
export * as grpc from "./client/grpc.ts";
export * as sql from "./client/sql.ts";
export * as redis from "./client/redis.ts";
export * as mongodb from "./client/mongodb.ts";
export * as denoKv from "./client/deno_kv.ts";
export * as rabbitmq from "./client/rabbitmq.ts";
export * as sqs from "./client/sqs.ts";
```

## Testing Strategy

- **Unit tests**: Co-located `*_test.ts` files for CLI and client integration code
- **Example scenarios**: `probitas/*.probitas.ts` for documentation and manual testing
- **Integration with framework**: Depends on tested framework packages from probitas-packages

## Development Workflow

1. **Local development**: Use `jsr:@probitas/probitas@^0` import alias pointing to `./src/mod.ts`
2. **Framework updates**: Update version constraints in `deno.json` when framework packages are updated
3. **Testing**: Run `deno task verify` to ensure all checks pass
4. **Publishing**: GitHub Actions automatically publishes to JSR on version tags
