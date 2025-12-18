<p align="center">
  <img src="https://jsr-probitas.github.io/documents/static/probitas.png" alt="Probitas Logo" width="200">
</p>

<h1 align="center">Probitas</h1>

[![JSR](https://jsr.io/badges/@probitas/probitas)](https://jsr.io/@probitas/probitas)
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
curl -fsSL https://raw.githubusercontent.com/jsr-probitas/cli/main/install.sh | bash
```

Options via environment variables:

```bash
# Install specific version
curl -fsSL https://raw.githubusercontent.com/jsr-probitas/cli/main/install.sh | PROBITAS_VERSION=0.7.1 bash

# Install to custom directory
curl -fsSL https://raw.githubusercontent.com/jsr-probitas/cli/main/install.sh | PROBITAS_INSTALL_DIR=/usr/local/bin bash
```

#### Using Nix

```bash
# Run without installing
nix run github:jsr-probitas/cli

# Install into your profile
nix profile install github:jsr-probitas/cli
```

### Write Your First Scenario

Create `probitas/hello.probitas.ts`:

```typescript
import { client, expect, scenario, Skip } from "jsr:@probitas/probitas@^0";

const apiUrl = Deno.env.get("API_URL");

export default scenario("User API Test", { tags: ["api", "user"] })
  .step("Check API availability", () => {
    if (!apiUrl) {
      throw new Skip("API_URL not configured");
    }
  })
  .resource("http", () => client.http.createHttpClient({ url: apiUrl! }))
  .step("Create user", async (ctx) => {
    const response = await ctx.resources.http.post("/users", {
      name: "Alice",
      email: "alice@example.com",
    });
    expect(response).toBeOk().toHaveStatus(201);
    return response.json<{ id: string }>();
  })
  .step("Verify user exists", async (ctx) => {
    const { id } = ctx.previous!;
    const response = await ctx.resources.http.get(`/users/${id}`);
    expect(response)
      .toBeOk()
      .toHaveJsonProperty("name", "Alice");
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
import { client, expect, scenario } from "jsr:@probitas/probitas@^0";

export default scenario("Database Query Test", { tags: ["db"] })
  .resource("db", () =>
    client.sql.postgres.createPostgresClient({
      url: Deno.env.get("DATABASE_URL")!,
    }))
  .step("Insert test data", async (ctx) => {
    const result = await ctx.resources.db.query(
      "INSERT INTO users (name) VALUES ($1) RETURNING id",
      ["TestUser"],
    );
    expect(result).toBeOk().toHaveRowCount(1);
    return { userId: result.rows[0].id };
  })
  .step("Query inserted user", async (ctx) => {
    const { userId } = ctx.previous!;
    const result = await ctx.resources.db.query(
      "SELECT * FROM users WHERE id = $1",
      [userId],
    );
    expect(result)
      .toBeOk()
      .toHaveRowCount(1)
      .toHaveRowsMatching({ name: "TestUser" });
  })
  .build();
// Resource is auto-disposed (connection closed) after scenario
```

### Setup with Cleanup

For side effects that need cleanup (use `.setup()` instead of `.resource()` when
you need to perform setup actions that don't return a reusable client):

```typescript
import { client, expect, scenario } from "jsr:@probitas/probitas@^0";

export default scenario("Redis Cache Test", { tags: ["redis", "cache"] })
  .resource("redis", () =>
    client.redis.createRedisClient({
      url: Deno.env.get("REDIS_URL")!,
    }))
  .setup(async (ctx) => {
    // Create test keys before scenario
    await ctx.resources.redis.set("test:counter", "0");
    // Return cleanup function
    return async () => {
      await ctx.resources.redis.del("test:counter");
    };
  })
  .step("Increment counter", async (ctx) => {
    const result = await ctx.resources.redis.incr("test:counter");
    expect(result).toBeOk().toHaveValue(1);
  })
  .step("Verify counter value", async (ctx) => {
    const result = await ctx.resources.redis.get("test:counter");
    expect(result).toBeOk().toHaveValue("1");
  })
  .build();
```

### Tags

Organize scenarios with tags for filtering. Tags help categorize tests by
feature, priority, or environment:

```typescript
import { client, expect, scenario } from "jsr:@probitas/probitas@^0";

export default scenario("Login Flow", { tags: ["auth", "critical", "e2e"] })
  .resource(
    "http",
    () => client.http.createHttpClient({ url: Deno.env.get("API_URL")! }),
  )
  .step("Login with valid credentials", async (ctx) => {
    const response = await ctx.resources.http.post("/auth/login", {
      email: "test@example.com",
      password: "secret",
    });
    expect(response).toBeOk().toHaveStatus(200);
    return response.json<{ token: string }>();
  })
  .step("Access protected resource", async (ctx) => {
    const { token } = ctx.previous!;
    const response = await ctx.resources.http.get("/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response).toBeOk().toHaveJsonProperty("email", "test@example.com");
  })
  .build();
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
responses. Each client type has tailored assertions:

```typescript
import { client, expect, scenario } from "jsr:@probitas/probitas@^0";

export default scenario("E-Commerce Order Flow", { tags: ["e2e", "order"] })
  .resource(
    "http",
    () => client.http.createHttpClient({ url: Deno.env.get("API_URL")! }),
  )
  .resource("db", () =>
    client.sql.postgres.createPostgresClient({
      url: Deno.env.get("DATABASE_URL")!,
    }))
  .step("Create order via API", async (ctx) => {
    const response = await ctx.resources.http.post("/orders", {
      items: [{ productId: "prod-1", quantity: 2 }],
    });
    // HTTP-specific assertions
    expect(response)
      .toBeOk()
      .toHaveStatus(201)
      .toHaveHeadersProperty("content-type", /application\/json/);
    return response.json<{ orderId: string }>();
  })
  .step("Verify order in database", async (ctx) => {
    const { orderId } = ctx.previous!;
    const result = await ctx.resources.db.query(
      "SELECT * FROM orders WHERE id = $1",
      [orderId],
    );
    // SQL-specific assertions
    expect(result)
      .toBeOk()
      .toHaveRowCount(1)
      .toHaveRowsMatching({ status: "pending" });
  })
  .step("Validate order total", async (ctx) => {
    const { orderId } = ctx.results[0] as { orderId: string };
    const response = await ctx.resources.http.get(`/orders/${orderId}`);
    const order = response.json<{ total: number }>()!;
    // Generic value assertions (chainable)
    expect(order.total)
      .toBeGreaterThan(0)
      .toBeLessThan(10000);
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
| [@probitas/builder](https://jsr.io/@probitas/builder)   | [![JSR](https://jsr.io/badges/@probitas/builder)](https://jsr.io/@probitas/builder)   | Type-safe scenario definition API     |
| [@probitas/runner](https://jsr.io/@probitas/runner)     | [![JSR](https://jsr.io/badges/@probitas/runner)](https://jsr.io/@probitas/runner)     | Scenario execution engine             |
| [@probitas/reporter](https://jsr.io/@probitas/reporter) | [![JSR](https://jsr.io/badges/@probitas/reporter)](https://jsr.io/@probitas/reporter) | Output formatters (List, JSON)        |
| [@probitas/core](https://jsr.io/@probitas/core)         | [![JSR](https://jsr.io/badges/@probitas/core)](https://jsr.io/@probitas/core)         | Scenario loading and filtering        |
| [@probitas/discover](https://jsr.io/@probitas/discover) | [![JSR](https://jsr.io/badges/@probitas/discover)](https://jsr.io/@probitas/discover) | File discovery with glob patterns     |
| [@probitas/expect](https://jsr.io/@probitas/expect)     | [![JSR](https://jsr.io/badges/@probitas/expect)](https://jsr.io/@probitas/expect)     | Expectation library                   |

The CLI is maintained in a
[separate repository](https://github.com/jsr-probitas/cli).

## License

See [LICENSE](LICENSE) file for details.
