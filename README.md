<p align="center">
  <img src="https://probitas-test.github.io/probitas.png" alt="Probitas Logo" width="200">
</p>

<h1 align="center">Probitas</h1>

[![JSR](https://jsr.io/badges/@probitas/probitas)](https://jsr.io/@probitas/probitas)
[![npm](https://img.shields.io/npm/v/@probitas-test/probitas)](https://www.npmjs.com/package/@probitas-test/probitas)
[![Test](https://github.com/probitas-test/probitas/actions/workflows/test.yml/badge.svg)](https://github.com/probitas-test/probitas/actions/workflows/test.yml)
[![codecov](https://codecov.io/github/probitas-test/probitas/graph/badge.svg?token=Yu0GPZAMv6)](https://codecov.io/github/probitas-test/probitas)
[![Docs](https://img.shields.io/badge/docs-probitas--test.github.io-blue)](https://probitas-test.github.io)

Scenario-based testing & workflow execution framework.

## Overview

Probitas is a comprehensive framework for scenario-based testing and workflow
execution, providing:

- **Type-safe scenario builder** - Fluent API for defining test workflows with
  automatic type inference
- **Powerful CLI** - Command-line interface for running, listing, and managing
  scenarios
- **Rich client ecosystem** - Pre-configured clients for HTTP, databases,
  message queues, and more
- **Flexible execution** - Run scenarios in parallel or sequentially with
  configurable concurrency
- **Smart assertions** - Client-specific expectation utilities for comprehensive
  testing

## Installation

### Local Installation

#### Using Install Script

```bash
curl -fsSL https://raw.githubusercontent.com/probitas-test/probitas/main/install.sh | sh
```

The script downloads the single `probitas` binary for your platform from the
GitHub Release, verifies its checksum and installs it to `~/.local/bin`. It
supports macOS and glibc-based Linux; on Windows, download the `.zip` from the
[releases](https://github.com/probitas-test/probitas/releases) instead.

Options via environment variables:

```bash
# Install specific version
curl -fsSL https://raw.githubusercontent.com/probitas-test/probitas/main/install.sh | PROBITAS_VERSION=2.0.0 sh

# Install under a custom root (the binary goes to <root>/bin)
curl -fsSL https://raw.githubusercontent.com/probitas-test/probitas/main/install.sh | PROBITAS_INSTALL_DIR=/usr/local sh
```

Upgrading from Probitas 1.x (Deno)? See [MIGRATION.md](MIGRATION.md).

#### Using Homebrew

```bash
# Add the tap
brew tap probitas-test/tap

# Install probitas
brew install probitas

# Upgrade to latest version
brew upgrade probitas
```

See [probitas-test/homebrew-tap](https://github.com/probitas-test/homebrew-tap)
for more details.

### GitHub Actions

#### Using setup-probitas Action

The recommended way to use Probitas in GitHub Actions:

```yaml
- uses: probitas-test/setup-probitas@v2
  with:
    probitas-version: latest # or a specific version like '2.0.0'

- name: Run scenarios
  run: probitas run
```

See
[probitas-test/setup-probitas](https://github.com/probitas-test/setup-probitas)
for full documentation.

## Quick Start

### 1. Create Your First Scenario

Create `probitas/hello.probitas.ts`:

```typescript
import { client, expect, scenario, Skip } from "@probitas-test/probitas";

const apiUrl = process.env.API_URL;

export default scenario("User API Test", { tags: ["api", "user"] })
  .step("Check API availability", () => {
    if (!apiUrl) {
      throw new Skip("API_URL not configured");
    }
  })
  .resource("http", () => client.http.createHttpClient({ url: apiUrl! }))
  .step("Create user", async (ctx) => {
    const response = await ctx.resources.http.post("/users", {
      body: { name: "Alice", email: "alice@example.com" },
    });
    expect(response).toBeOk().toHaveStatus(201);
    return response.json as { id: string };
  })
  .step("Verify user exists", async (ctx) => {
    const { id } = ctx.previous!;
    const response = await ctx.resources.http.get(`/users/${id}`);
    expect(response).toBeOk().toHaveJsonProperty("name", "Alice");
  })
  .build();
```

Scenarios run against the copy of Probitas embedded in the `probitas` binary, so
nothing needs to be installed to run them. Scenarios written for the Deno
version (`jsr:@probitas/probitas@^0` imports) keep running as well.

> [!NOTE]
> **For editor support**, run `probitas init`: besides an example scenario and a
> config file, it writes a `package.json` that pins `@probitas-test/probitas` to
> the binary's version and a `tsconfig.json`. Install it with your package
> manager (`npm install`, `bun install`, ...) to get auto-completion, type
> checking and hover documentation in any TypeScript-aware editor, and
> `probitas check` to type-check scenarios from the command line.

### 2. Run Your Scenarios

```bash
# Run all scenarios
probitas run

# Run scenarios with specific tag
probitas run -s tag:api

# Re-run only failed scenarios from previous run
probitas run --failed

# Run with JSON output
probitas run --reporter json

# List available scenarios
probitas list

# Initialize configuration file
probitas init
```

## Key Concepts

### Scenarios

A scenario is a sequence of steps that execute in order. Each step can:

- Return a value that's passed to the next step via `ctx.previous`
- Access all previous results via `ctx.results`
- Share state via `ctx.store`
- Use resources defined at the scenario level
- Have custom timeout and retry configuration

### Resources

Resources are lifecycle-managed objects with automatic cleanup (Disposable
pattern):

```typescript
import { client, expect, scenario } from "@probitas-test/probitas";

export default scenario("Database Query Test", { tags: ["db"] })
  .resource("db", () =>
    client.sql.postgres.createPostgresClient({
      url: process.env.DATABASE_URL!,
    }))
  .step("Insert test data", async (ctx) => {
    const result = await ctx.resources.db.query(
      "INSERT INTO users (name) VALUES ($1) RETURNING id",
      ["TestUser"],
    );
    expect(result).toBeOk().toHaveRowCount(1);
    return { userId: result.rows![0].id };
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
// Resource is automatically disposed (connection closed) after scenario
```

### Setup with Cleanup

For side effects that need cleanup without creating a reusable client:

```typescript
import { client, expect, scenario } from "@probitas-test/probitas";

export default scenario("Redis Cache Test", { tags: ["redis", "cache"] })
  .resource("redis", () =>
    client.redis.createRedisClient({
      url: process.env.REDIS_URL!,
    }))
  .setup(async (ctx) => {
    // Create test keys before scenario
    await ctx.resources.redis.set("test:counter", "0");
    // Return cleanup function
    return async () => {
      await ctx.resources.redis.del(["test:counter"]);
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

Organize scenarios with tags for filtering:

```typescript
import { client, expect, scenario } from "@probitas-test/probitas";

export default scenario("Login Flow", { tags: ["auth", "critical", "e2e"] })
  .resource(
    "http",
    () => client.http.createHttpClient({ url: process.env.API_URL! }),
  )
  .step("Login with valid credentials", async (ctx) => {
    const response = await ctx.resources.http.post("/auth/login", {
      body: { email: "test@example.com", password: "secret" },
    });
    expect(response).toBeOk().toHaveStatus(200);
    return response.json as { token: string };
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

Run with tag filters:

```bash
probitas run -s tag:auth
probitas run -s "tag:critical,tag:auth"  # AND logic
probitas run -s "!tag:slow"              # NOT logic
```

## Configuration

Create a `probitas.json` file in your project root:

```json
{
  "includes": ["probitas/**/*.probitas.ts"],
  "excludes": ["**/*.skip.probitas.ts"],
  "reporter": "list",
  "maxConcurrency": 4,
  "maxFailures": 0,
  "timeout": "30s",
  "selectors": ["!tag:wip"]
}
```

Configuration options:

- `includes` - Glob patterns for scenario files to include (default:
  `["**/*.probitas.ts"]`)
- `excludes` - Glob patterns for scenario files to exclude (default: `[]`)
- `reporter` - Output format: `list` or `json` (default: `list`)
- `maxConcurrency` - Maximum number of scenarios to run in parallel (default:
  number of CPU cores)
- `maxFailures` - Stop execution after N failures, 0 for unlimited (default:
  `0`)
- `timeout` - Default timeout for scenarios (e.g., `30s`, `5m`, `1h`)
- `selectors` - Default selectors to filter scenarios (e.g., `["tag:api"]`,
  `["!tag:slow"]`)

Generate a default configuration:

```bash
probitas init
```

## Available Clients

Probitas provides pre-configured clients for common services:

- **HTTP** - REST API testing (`client.http`)
  - **OIDC Authentication** - OpenID Connect authentication for HTTP clients
    (`client.http.oidc`)
- **GraphQL** - GraphQL query testing (`client.graphql`)
- **ConnectRPC** - RPC service testing (`client.connectrpc`)
- **gRPC** - gRPC service testing (`client.grpc`)
- **SQL Databases** - PostgreSQL, MySQL, SQLite, DuckDB (`client.sql.*`)
- **Redis** - Redis operations (`client.redis`)
- **MongoDB** - MongoDB operations (`client.mongodb`)
- **RabbitMQ** - Message queue operations (`client.rabbitmq`)
- **AWS SQS** - SQS queue operations (`client.sqs`)

Each client comes with specialized assertion utilities via the `expect()`
function.

### OIDC Authentication

The HTTP client supports OpenID Connect (OIDC) authentication for testing APIs
that require OAuth 2.0/OIDC authentication:

```typescript
import { client, expect, scenario } from "@probitas-test/probitas";

export default scenario("OIDC Authentication Test", { tags: ["auth", "oidc"] })
  .resource(
    "http",
    async () =>
      await client.http.oidc.createOidcHttpClient({
        url: process.env.API_URL!,
        oidc: {
          issuer: process.env.OIDC_ISSUER!,
          clientId: "my-client-id",
        },
      }),
  )
  .step("Login with OIDC", async (ctx) => {
    const result = await ctx.resources.http.login({
      type: "authorization_code",
      username: "user@example.com",
      password: "password",
    });
    expect(result.ok).toBe(true);
  })
  .step("Access protected resource", async (ctx) => {
    // Authorization header is automatically added
    const response = await ctx.resources.http.get("/protected");
    expect(response).toBeOk().toHaveStatus(200);
  })
  .build();
```

The OIDC client supports:

- **Automatic token discovery** - Discovers OIDC endpoints from issuer URL
- **Manual configuration** - Or configure `authUrl` and `tokenUrl` directly
- **Authorization Code Grant** - For user authentication flows
- **Automatic token management** - Handles token storage and Authorization
  header injection

## Expectation API

Probitas provides client-specific expectation functions:

```typescript
import { client, expect, scenario } from "@probitas-test/probitas";

export default scenario("E-Commerce Order Flow", { tags: ["e2e", "order"] })
  .resource(
    "http",
    () => client.http.createHttpClient({ url: process.env.API_URL! }),
  )
  .resource("db", () =>
    client.sql.postgres.createPostgresClient({
      url: process.env.DATABASE_URL!,
    }))
  .step("Create order via API", async (ctx) => {
    const response = await ctx.resources.http.post("/orders", {
      body: { items: [{ productId: "prod-1", quantity: 2 }] },
    });
    // HTTP-specific assertions
    expect(response)
      .toBeOk()
      .toHaveStatus(201)
      .toHaveHeadersProperty("content-type", /application\/json/);
    return response.json as { orderId: string };
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
    const order = response.json as { total: number };
    // Generic value assertions (chainable)
    expect(order.total).toBeGreaterThan(0).toBeLessThan(10000);
  })
  .build();
```

## CLI Commands

```bash
# Run scenarios
probitas run [options]

# List scenarios without running
probitas list [options]

# Initialize a project (example scenario, config, editor setup)
probitas init

# Type check scenario files (runs the project's tsgo or tsc)
probitas check

# Pre-fetch the DuckDB native binding (otherwise downloaded on first use)
probitas cache duckdb

# Show version
probitas --version

# Show help
probitas --help
```

## Reporters

Choose output format based on your needs:

- `list` - Detailed human-readable output (default)
- `json` - Machine-readable JSON for CI/CD integration

```bash
probitas run --reporter json
```

## AI Integration

### Claude Code Plugin

Probitas provides a Claude Code plugin to enhance scenario development with AI
assistance:

```bash
# Add the plugin marketplace
/plugin marketplace add probitas-test/claude-plugins

# Install the Probitas plugin
/plugin install probitas@probitas-test
```

Or add to your project's `.claude/settings.json`:

```json
{
  "plugins": {
    "marketplaces": ["probitas-test/claude-plugins"],
    "installed": ["probitas@probitas-test"]
  },
  "enabledPlugins": {
    "probitas@probitas-test": true
  }
}
```

The plugin provides:

- **Scenario scaffolding** - Generate scenario templates with common patterns
- **Assertion suggestions** - Context-aware recommendations for expect calls
- **Client integration** - Auto-complete for client configurations
- **Error diagnostics** - AI-powered debugging for failing scenarios

See
[probitas-test/claude-plugins](https://github.com/probitas-test/claude-plugins)
for more details.

### LLM Documentation

For AI assistants and language models, comprehensive documentation is available
in machine-readable format:

- **Documentation website**:
  [probitas-test.github.io](https://probitas-test.github.io)
- **LLM-optimized**: [llms.txt](https://probitas-test.github.io/llms.txt) -
  Structured documentation following the
  [llms.txt standard](https://llmstxt.org/)
- **Markdown format**: All documentation provides `index.md` files for easy
  access and parsing

#### API Documentation

For detailed API reference, read the generated documentation on JSR, or the type
declarations shipped in the npm package:

- [`@probitas/probitas`](https://jsr.io/@probitas/probitas/doc) (main package)
- [`@probitas/probitas/expect`](https://jsr.io/@probitas/probitas/doc/expect)
- [`@probitas/probitas/client`](https://jsr.io/@probitas/probitas/doc/client)
- `node_modules/@probitas-test/probitas/dist/**/*.d.ts` after `probitas init`
  and an install

The combination of narrative documentation (index.md/llms.txt) and API reference
enables AI assistants to provide accurate, comprehensive guidance when working
with Probitas.

## Contributing

Interested in contributing or maintaining Probitas? See
[CONTRIBUTING.md](CONTRIBUTING.md) for:

- Development environment setup
- Release process and workflow
- Architecture overview
- Related repositories

## Acknowledgments

Probitas is greatly inspired by [runn](https://github.com/k1LoW/runn), an
excellent scenario-based testing tool. Many core concepts in Probitas, such as:

- Accessing previous step results via `ctx.previous`
- Integration of database clients and other service helpers beyond traditional
  e2e testing scope
- Scenario-based workflow execution model

are influenced by runn's thoughtful design. We express our deep gratitude and
respect to the runn project and its maintainers for pioneering this approach to
scenario-based testing.

## License

See [LICENSE](LICENSE) file for details.
