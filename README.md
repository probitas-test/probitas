# ✅ Probitas

[![JSR](https://jsr.io/badges/@probitas/std)](https://jsr.io/@probitas/std)
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
deno install -gAf -n probitas jsr:@probitas/cli
```

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
import { scenario } from "probitas";

export default scenario("Hello Probitas", { tags: ["example"] })
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

## License

See [LICENSE](LICENSE) file for details.
