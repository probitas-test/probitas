<p align="center">
  <img src="https://probitas-test.github.io/documents/static/probitas.png" alt="Probitas Logo" width="200">
</p>

<h1 align="center">Probitas</h1>

[![JSR](https://jsr.io/badges/@probitas/probitas)](https://jsr.io/@probitas/probitas)
[![Test](https://github.com/probitas-test/probitas/actions/workflows/test.yml/badge.svg)](https://github.com/probitas-test/probitas/actions/workflows/test.yml)
[![Release](https://github.com/probitas-test/probitas/actions/workflows/release.yml/badge.svg)](https://github.com/probitas-test/probitas/actions/workflows/release.yml)
[![codecov](https://codecov.io/github/probitas-test/probitas/graph/badge.svg?token=Yu0GPZAMv6)](https://codecov.io/github/probitas-test/probitas)
[![Docs](https://img.shields.io/badge/docs-probitas--test.github.io-blue)](https://probitas-test.github.io/documents)

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
curl -fsSL https://raw.githubusercontent.com/probitas-test/probitas/main/install.sh | bash
```

Options via environment variables:

```bash
# Install specific version
curl -fsSL https://raw.githubusercontent.com/probitas-test/probitas/main/install.sh | PROBITAS_VERSION=0.7.1 bash

# Install to custom directory
curl -fsSL https://raw.githubusercontent.com/probitas-test/probitas/main/install.sh | PROBITAS_INSTALL_DIR=/usr/local/bin bash
```

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

#### Using Nix

```bash
# Run without installing
nix run github:probitas-test/probitas

# Install into your profile
nix profile install github:probitas-test/probitas
```

Or add to your project's `flake.nix`:

```nix
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    probitas.url = "github:probitas-test/probitas";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { nixpkgs, probitas, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ probitas.overlays.default ];
        };
      in {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [ probitas ];
        };
      });
}
```

Then enter the development shell:

```bash
nix develop
probitas run
```

### GitHub Actions

#### Using setup-probitas Action

The recommended way to use Probitas in GitHub Actions:

```yaml
- uses: probitas-test/setup-probitas@v1
  with:
    version: latest # or specific version like '0.7.1'

- name: Run scenarios
  run: probitas run
```

See
[probitas-test/setup-probitas](https://github.com/probitas-test/setup-probitas)
for full documentation.

#### Using Nix in GitHub Actions

For projects using Nix flakes with
[nixbuild/nix-quick-install-action](https://github.com/nixbuild/nix-quick-install-action):

```yaml
- uses: nixbuild/nix-quick-install-action@v34

- name: Run scenarios
  run: nix run github:probitas-test/probitas -- run
```

Or within a Nix development shell:

```yaml
- uses: nixbuild/nix-quick-install-action@v34

- name: Run scenarios
  run: nix develop -c probitas run
```

## Quick Start

### 1. Create Your First Scenario

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
      body: { name: "Alice", email: "alice@example.com" },
    });
    expect(response).toBeOk().toHaveStatus(201);
    return response.json as { id: string };
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

> [!NOTE]
> **Enable Deno LSP in your editor** for the best development experience. With
> Deno LSP enabled, you'll get:
>
> - Auto-completion for Probitas APIs (`scenario`, `expect`, `client`, etc.)
> - Type checking and inline error detection
> - Jump to definition for functions and types
> - Hover documentation for all APIs
>
> See
> [Deno's editor setup guide](https://docs.deno.com/runtime/getting_started/setup_your_environment/)
> for instructions on enabling Deno in VS Code, Vim, Neovim, and other editors.

### 2. Run Your Scenarios

```bash
# Run all scenarios
probitas run

# Run scenarios with specific tag
probitas run -s tag:api

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
import { client, expect, scenario } from "jsr:@probitas/probitas@^0";

export default scenario("Login Flow", { tags: ["auth", "critical", "e2e"] })
  .resource(
    "http",
    () => client.http.createHttpClient({ url: Deno.env.get("API_URL")! }),
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
- **GraphQL** - GraphQL query testing (`client.graphql`)
- **ConnectRPC** - RPC service testing (`client.connectrpc`)
- **gRPC** - gRPC service testing (`client.grpc`)
- **SQL Databases** - PostgreSQL, MySQL, SQLite, DuckDB (`client.sql.*`)
- **Redis** - Redis operations (`client.redis`)
- **MongoDB** - MongoDB operations (`client.mongodb`)
- **Deno KV** - Deno's key-value store (`client.denoKv`)
- **RabbitMQ** - Message queue operations (`client.rabbitmq`)
- **AWS SQS** - SQS queue operations (`client.sqs`)

Each client comes with specialized assertion utilities via the `expect()`
function.

## Expectation API

Probitas provides client-specific expectation functions:

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
    expect(order.total)
      .toBeGreaterThan(0)
      .toBeLessThan(10000);
  })
  .build();
```

## CLI Commands

```bash
# Run scenarios
probitas run [options]

# List scenarios without running
probitas list [options]

# Initialize configuration file
probitas init

# Format scenario files
probitas fmt

# Lint scenario files
probitas lint

# Type check scenario files
probitas check

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
  [probitas-test.github.io/documents](https://probitas-test.github.io/documents)
- **LLM-optimized**:
  [llms.txt](https://probitas-test.github.io/documents/llms.txt) - Structured
  documentation following the [llms.txt standard](https://llmstxt.org/)
- **Markdown format**: All documentation provides `index.md` files for easy
  access and parsing

#### API Documentation

For detailed API reference, use `deno doc` to view type signatures and
documentation directly from the package:

```bash
# View expect API documentation
deno doc jsr:@probitas/probitas/expect

# View client API documentation
deno doc jsr:@probitas/probitas/client

# View main package documentation
deno doc jsr:@probitas/probitas
```

This provides the most accurate and up-to-date type information directly from
the source code.

The combination of narrative documentation (index.md/llms.txt) and API reference
(`deno doc`) enables AI assistants to provide accurate, comprehensive guidance
when working with Probitas.

## Contributing

Interested in contributing or maintaining Probitas? See
[CONTRIBUTING.md](CONTRIBUTING.md) for:

- Development environment setup
- Release process and workflow
- Architecture overview
- Related repositories

## License

See [LICENSE](LICENSE) file for details.
