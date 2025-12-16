<p align="center">
  <img src="https://jsr-probitas.github.io/documents/static/probitas.png" alt="Probitas Logo" width="200">
</p>

<h1 align="center">Probitas</h1>

[![JSR](https://jsr.io/badges/@probitas/cli)](https://jsr.io/@probitas/cli)
[![Test](https://github.com/jsr-probitas/probitas/actions/workflows/test.yml/badge.svg)](https://github.com/jsr-probitas/probitas/actions/workflows/test.yml)
[![Publish](https://github.com/jsr-probitas/probitas/actions/workflows/publish.yml/badge.svg)](https://github.com/jsr-probitas/probitas/actions/workflows/publish.yml)
[![codecov](https://codecov.io/github/jsr-probitas/probitas/graph/badge.svg?token=Yu0GPZAMv6)](https://codecov.io/github/jsr-probitas/probitas)

Scenario-based testing & workflow execution framework.

## Features

- **Scenario-Based Testing**: Define test workflows as a sequence of steps with
  type-safe result passing
- **Flexible Execution**: Run scenarios in parallel or sequentially with
  configurable concurrency
- **Resource Management**: Automatic cleanup with Disposable/AsyncDisposable
  pattern
- **Retry Logic**: Built-in retry with exponential/linear backoff
- **Tag-Based Filtering**: Organize and run scenarios by tags

## Quick Start

### Installation

```bash
curl -fsSL https://raw.githubusercontent.com/jsr-probitas/probitas/main/install.sh | bash
```

Options via environment variables:

```bash
# Install specific version
curl -fsSL https://raw.githubusercontent.com/jsr-probitas/probitas/main/install.sh | PROBITAS_VERSION=0.7.1 bash

# Install to custom directory
curl -fsSL https://raw.githubusercontent.com/jsr-probitas/probitas/main/install.sh | PROBITAS_INSTALL_DIR=/usr/local/bin bash
```

#### Using Nix

```bash
# Run without installing
nix run github:jsr-probitas/probitas

# Install into your profile
nix profile install github:jsr-probitas/probitas#probitas
```

### Write Your First Scenario

Create `probitas/hello.probitas.ts`:

```typescript
import { scenario, Skip } from "jsr:@probitas/probitas";

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

# Run with JSON reporter
probitas run --reporter json
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
- `json` - Machine-readable JSON

## Configuration

Create a `probitas.json` file in your project root:

```json
{
  "includes": ["probitas/**/*.probitas.ts"],
  "excludes": ["**/*.skip.probitas.ts"],
  "reporter": "list",
  "maxConcurrency": 4,
  "timeout": "30s",
  "selectors": ["!tag:wip"]
}
```

## Expectation API

Probitas provides specialized expectation functions for various client
responses:

```typescript
import { client, expect, scenario } from "jsr:@probitas/probitas";

export default scenario("API Test Example")
  .resource("http", () =>
    client.http.createHttpClient({
      url: "http://localhost:3000",
    }))
  .step("GET /api/users", async (ctx) => {
    const { http } = ctx.resources;
    const response = await http.get("/api/users");

    // HTTP Response expectations
    expect(response)
      .toBeOk() // Status 2xx
      .toHaveStatus(200) // Specific status
      .toHaveHeadersProperty("content-type", /application\/json/)
      .toHaveDataMatching({ users: [] });
  })
  .step("Validate count", (ctx) => {
    const count = 42;

    // Chainable expectations for any value
    expect(count).toBe(42).toBeGreaterThan(40).toBeLessThan(50);
  })
  .step("Validate message", (ctx) => {
    const message = "hello";

    expect(message).not.toBe("world").toContain("ello");
  })
  .build();
```

Supported client types:

- **HTTP** - `expectHttpResponse` for REST API testing
- **GraphQL** - `expectGraphqlResponse` for GraphQL queries
- **ConnectRPC** - `expectConnectRpcResponse` for RPC calls
- **SQL** - `expectSqlQueryResult` for database queries
- **Redis** - `expectRedisResult` for Redis operations
- **MongoDB** - `expectMongoResult` for MongoDB operations
- **Deno KV** - `expectDenoKvResult` for Deno KV operations
- **RabbitMQ** - `expectRabbitMqResult` for message queue operations
- **SQS** - `expectSqsResult` for AWS SQS operations

All expectation methods follow a consistent naming pattern (`toBeXxx`,
`toHaveXxx`) and support method chaining for fluent assertions.

## Documentation

- [Migration from 0.5.0](docs/migration-from-0.5.0.md) - **Breaking changes in
  0.6.0**
- [Migration from 0.4.0](docs/migration-from-0.4.0.md) - Breaking changes in
  0.5.0
- [Migration from 0.3.6](docs/migration-from-0.3.6.md) - Breaking changes in
  0.4.0
- [Guide](docs/guide.md) - Comprehensive usage guide
- [CLI Reference](docs/cli.md) - Command-line options
- [Architecture](docs/architecture.md) - Design overview

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

Run project tasks such as `deno task verify` from within the Nix shell for
consistent tooling.

## Packages

| Package                                                 | JSR                                                                                   | Description                           |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------- |
| [@probitas/probitas](https://jsr.io/@probitas/probitas) | [![JSR](https://jsr.io/badges/@probitas/probitas)](https://jsr.io/@probitas/probitas) | Primary library for writing scenarios |
| [@probitas/cli](https://jsr.io/@probitas/cli)           | [![JSR](https://jsr.io/badges/@probitas/cli)](https://jsr.io/@probitas/cli)           | Command-line interface                |
| [@probitas/builder](https://jsr.io/@probitas/builder)   | [![JSR](https://jsr.io/badges/@probitas/builder)](https://jsr.io/@probitas/builder)   | Type-safe scenario definition API     |
| [@probitas/runner](https://jsr.io/@probitas/runner)     | [![JSR](https://jsr.io/badges/@probitas/runner)](https://jsr.io/@probitas/runner)     | Scenario execution engine             |
| [@probitas/reporter](https://jsr.io/@probitas/reporter) | [![JSR](https://jsr.io/badges/@probitas/reporter)](https://jsr.io/@probitas/reporter) | Output formatters (List, JSON)        |
| [@probitas/core](https://jsr.io/@probitas/core)         | [![JSR](https://jsr.io/badges/@probitas/core)](https://jsr.io/@probitas/core)         | Scenario loading and filtering        |
| [@probitas/discover](https://jsr.io/@probitas/discover) | [![JSR](https://jsr.io/badges/@probitas/discover)](https://jsr.io/@probitas/discover) | File discovery with glob patterns     |
| [@probitas/expect](https://jsr.io/@probitas/expect)     | [![JSR](https://jsr.io/badges/@probitas/expect)](https://jsr.io/@probitas/expect)     | Expectation library                   |

## License

See [LICENSE](LICENSE) file for details.
