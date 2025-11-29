# ✅ Probitas

[![JSR](https://jsr.io/badges/@probitas/cli)](https://jsr.io/@probitas/cli)
[![Test](https://github.com/jsr-probitas/probitas/actions/workflows/test.yml/badge.svg)](https://github.com/jsr-probitas/probitas/actions/workflows/test.yml)
[![codecov](https://codecov.io/github/jsr-probitas/probitas/graph/badge.svg?token=Yu0GPZAMv6)](https://codecov.io/github/jsr-probitas/probitas)

Scenario-based testing & workflow execution framework for Deno.

## Features

- **Scenario-Based Testing**: Define test workflows as a sequence of steps with
  type-safe result passing
- **Flexible Execution**: Run scenarios in parallel or sequentially with
  configurable concurrency
- **Multiple Reporters**: Output in various formats (List, Dot, JSON, TAP)
- **Resource Management**: Automatic cleanup with Disposable/AsyncDisposable
  pattern
- **Retry Logic**: Built-in retry with exponential/linear backoff
- **Tag-Based Filtering**: Organize and run scenarios by tags

## Quick Start

### Installation

```bash
deno install -grAf -n probitas jsr:@probitas/cli
```

- `-g` Global install
- `-r` Reload cache (fetch latest version)
- `-A` All permissions
- `-f` Force overwrite existing
- `-n probitas` Command name

### Initialize a Project

```bash
probitas init
```

This creates:

- `deno.json` - Configuration with probitas import and settings
- `scenarios/example.scenario.ts` - Example scenario

### Write Your First Scenario

Create `scenarios/hello.scenario.ts`:

```typescript
import { scenario, Skip } from "probitas";

export default scenario("Hello Probitas", { tags: ["example"] })
  .step(() => {
    // Unnamed steps are auto-named as "Step N"
    if (!Deno.env.get("RUN_EXAMPLE")) {
      throw new Skip("Example skipped");
    }
  })
  .step("Greet", () => {
    return { message: "Hello, World!" };
  })
  .step("Verify", (ctx) => {
    if (ctx.previous.message !== "Hello, World!") {
      throw new Error("Unexpected message");
    }
  })
  .build();
```

### Run Scenarios

```bash
# Run all scenarios
probitas run

# Run scenarios with specific tag
probitas run -s tag:example

# Run with different reporter
probitas run --reporter dot
```

## Key Concepts

### Scenarios

A scenario is a sequence of steps that execute in order. Each step can:

- Return a value that's passed to the next step via `ctx.previous`
- Access all previous results via `ctx.results`
- Share state via `ctx.store`
- Have custom timeout and retry configuration

### Resources

Lifecycle-managed objects with automatic cleanup:

```typescript
scenario("Database Test")
  .resource("db", async () => {
    const conn = await Database.connect();
    return conn; // Auto-disposed after scenario
  })
  .step("Query data", (ctx) => {
    return ctx.resources.db.query("SELECT * FROM users");
  })
  .build();
```

### Setup with Cleanup

For side effects that need cleanup:

```typescript
scenario("File Test")
  .setup((ctx) => {
    const tempFile = Deno.makeTempFileSync();
    ctx.store.set("tempFile", tempFile);
    return () => Deno.removeSync(tempFile); // Cleanup function
  })
  .step("Write to file", (ctx) => {
    Deno.writeTextFileSync(ctx.store.get("tempFile") as string, "test");
  })
  .build();
```

### Tags

Organize scenarios with tags for easy filtering:

```typescript
scenario("Login Test", { tags: ["auth", "critical"] });
```

Run specific scenarios:

```bash
probitas run -s tag:auth
probitas run -s "tag:critical,tag:auth"  # AND logic
probitas run -s "!tag:slow"              # NOT logic
```

### Reporters

Choose output format based on your needs:

- `list` - Detailed human-readable output (default)
- `dot` - Compact progress dots
- `json` - Machine-readable JSON
- `tap` - TAP format for CI integration

## Configuration

Add to `deno.json` or `deno.jsonc`:

```json
{
  "imports": {
    "probitas": "jsr:@probitas/std"
  },
  "probitas": {
    "includes": ["scenarios/**/*.scenario.ts"],
    "excludes": ["**/*.skip.scenario.ts"],
    "reporter": "list",
    "maxConcurrency": 4,
    "selectors": ["!tag:wip"]
  }
}
```

## Documentation

- [Guide](docs/guide.md) - Comprehensive usage guide
- [CLI Reference](docs/cli.md) - Command-line options
- [Architecture](docs/architecture.md) - Design overview

## Packages

| Package                                                 | Description                              | Version                                                                               |
| ------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------- |
| [@probitas/std](https://jsr.io/@probitas/std)           | Standard library for writing scenarios   | [![JSR](https://jsr.io/badges/@probitas/std)](https://jsr.io/@probitas/std)           |
| [@probitas/cli](https://jsr.io/@probitas/cli)           | Command-line interface                   | [![JSR](https://jsr.io/badges/@probitas/cli)](https://jsr.io/@probitas/cli)           |
| [@probitas/builder](https://jsr.io/@probitas/builder)   | Type-safe scenario definition API        | [![JSR](https://jsr.io/badges/@probitas/builder)](https://jsr.io/@probitas/builder)   |
| [@probitas/runner](https://jsr.io/@probitas/runner)     | Scenario execution engine                | [![JSR](https://jsr.io/badges/@probitas/runner)](https://jsr.io/@probitas/runner)     |
| [@probitas/reporter](https://jsr.io/@probitas/reporter) | Output formatters (List, Dot, JSON, TAP) | [![JSR](https://jsr.io/badges/@probitas/reporter)](https://jsr.io/@probitas/reporter) |
| [@probitas/scenario](https://jsr.io/@probitas/scenario) | Scenario loading and filtering           | [![JSR](https://jsr.io/badges/@probitas/scenario)](https://jsr.io/@probitas/scenario) |
| [@probitas/discover](https://jsr.io/@probitas/discover) | File discovery with glob patterns        | [![JSR](https://jsr.io/badges/@probitas/discover)](https://jsr.io/@probitas/discover) |

## License

See [LICENSE](LICENSE) file for details.
