# ✅ Probitas

[![JSR](https://jsr.io/badges/@lambdalisue/probitas)](https://jsr.io/@lambdalisue/probitas)
[![Test](https://github.com/lambdalisue/deno-probitas/actions/workflows/test.yml/badge.svg)](https://github.com/lambdalisue/deno-probitas/actions/workflows/test.yml)
[![codecov](https://codecov.io/github/lambdalisue/deno-probitas/graph/badge.svg?token=Yu0GPZAMv6)](https://codecov.io/github/lambdalisue/deno-probitas)

Scenario-based testing & workflow execution framework for programmers.

## Features

- **Scenario-Based Testing**: Define test workflows as a sequence of steps with
  type-safe result passing
- **Built-in HTTP Client**: Test REST APIs with automatic cookie/session
  management
- **Flexible Execution**: Run scenarios in parallel or sequentially with
  configurable concurrency
- **Multiple Reporters**: Output in various formats (List, Dot, Live, JSON, TAP)
- **Resource Management**: Automatic cleanup with AsyncDisposable pattern
- **Retry Logic**: Built-in retry with exponential/linear backoff
- **Tag-Based Filtering**: Organize and run scenarios by tags

## Quick Start

### Installation

```bash
deno install -gfA -r -n probitas jsr:@lambdalisue/probitas/cli
```

### Initialize a Project

```bash
probitas init
```

This creates:

- `probitas.config.ts` - Configuration file
- `scenarios/deno.jsonc` - Import maps for scenarios
- `scenarios/example.scenario.ts` - Example scenario

### Write Your First Scenario

Create `scenarios/hello.scenario.ts`:

```typescript
import { expect, scenario } from "probitas";

const hello = scenario("Hello Probitas", { tags: ["example"] })
  .step("Greet", () => {
    return { message: "Hello, World!" };
  })
  .step("Verify", (ctx) => {
    expect(ctx.previous.message).toBe("Hello, World!");
  })
  .build();

export default hello;
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

## HTTP Client Example

Test REST APIs with the built-in HTTP client:

```typescript
import { client, expect, scenario } from "probitas";

// Create client at script root
await using api = client.http("https://api.example.com");

const apiTest = scenario("API Test", { tags: ["api"] })
  .step("Create User", async () => {
    const result = await api.post("/users", {
      json: { name: "John Doe" },
    });
    expect(result.status).toBe(201);
    return result.json.id;
  })
  .step("Get User", async (ctx) => {
    const userId = ctx.previous;
    const result = await api.get(`/users/${userId}`);
    expect(result.json.name).toBe("John Doe");
  })
  .build();

export default apiTest;
```

## Documentation

- **[Usage Guide](docs/usage-guide.md)** - CLI commands and options
- **[Scenario Guide](docs/scenario-guide.md)** - How to write scenarios
- **[Examples Guide](docs/examples-guide.md)** - Real-world use cases
- **[Troubleshooting](docs/troubleshooting.md)** - Common issues and solutions

### Architecture Documentation

- [Architecture Overview](docs/architecture.md)
- [Builder Layer](docs/builder.md)
- [Runner Layer](docs/runner.md)
- [Reporter Layer](docs/reporter.md)
- [Client Layer](docs/client.md)
- [Resource Management](docs/resources.md)
- [CLI Layer](docs/cli.md)

## Key Concepts

### Scenarios

A scenario is a sequence of steps that execute in order. Each step can:

- Return a value that's passed to the next step
- Access all previous results
- Share state via context store
- Have custom timeout and retry configuration

### Tags

Organize scenarios with tags for easy filtering:

```typescript
scenario("Login Test", { tags: ["auth", "critical"] });
```

Run specific scenarios:

```bash
probitas run -s tag:auth
probitas run -s tag:critical,tag:auth  # AND logic
```

### Reporters

Choose output format based on your needs:

- `list` - Detailed human-readable output (default)
- `dot` - Compact progress dots
- `live` - Real-time progress display
- `json` - Machine-readable JSON
- `tap` - TAP format for CI integration

## Configuration

Create `probitas.config.ts` in your project:

```typescript
import type { ProbitasConfig } from "probitas/cli";

export default {
  includes: ["scenarios/**/*.scenario.ts"],
  excludes: ["**/skip.scenario.ts"],
  reporter: "list",
  verbosity: "normal",
  maxConcurrency: undefined, // unlimited
  selectors: ["tag:smoke"],
  excludeSelectors: ["tag:slow"],
  stepOptions: {
    timeout: 30000,
    retry: { maxAttempts: 1, backoff: "linear" },
  },
} satisfies ProbitasConfig;
```

## License

See [LICENSE](LICENSE) file for details.
