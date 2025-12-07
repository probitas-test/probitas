# Guide

Practical guide for using Probitas.

## Quick Start

```bash
# Install CLI globally
deno install -gAf -n probitas jsr:@probitas/cli

# Initialize project
probitas init

# Run scenarios
probitas run
```

## Writing Scenarios

Create `*.probitas.ts` files with a default export:

```typescript
import { scenario } from "probitas";

export default scenario("User Login", { tags: ["auth", "smoke"] })
  .step("Navigate to login page", () => {
    return { url: "/login" };
  })
  .step("Enter credentials", (ctx) => {
    // ctx.previous = { url: "/login" }
    return { username: "test", password: "pass" };
  })
  .step("Submit and verify", (ctx) => {
    // ctx.results = [{ url: "/login" }, { username: "test", ... }]
    if (!ctx.previous.username) {
      throw new Error("No username");
    }
    return { token: "abc123" };
  })
  .build();
```

### Using Resources

Resources are lifecycle-managed objects. If they implement `Disposable` or
`AsyncDisposable`, they're automatically cleaned up:

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

### Using Setup with Cleanup

For side effects that need cleanup but aren't disposable objects:

```typescript
scenario("File Test")
  .setup((ctx) => {
    const tempFile = Deno.makeTempFileSync();
    ctx.store.set("tempFile", tempFile);

    // Return cleanup function
    return () => {
      Deno.removeSync(tempFile);
    };
  })
  .step("Write to file", (ctx) => {
    const file = ctx.store.get("tempFile") as string;
    Deno.writeTextFileSync(file, "test data");
  })
  .build();
```

### Skipping Scenarios

Use `Skip` to conditionally skip a scenario based on environment or
preconditions:

```typescript
import { scenario, Skip } from "probitas";

export default scenario("Browser Test", { tags: ["e2e"] })
  .setup(() => {
    if (!Deno.env.get("BROWSER_PATH")) {
      throw new Skip("Browser not configured");
    }
  })
  .step("Open browser", () => {
    // ...
  })
  .build();
```

Skip can be thrown from resource, setup, or step functions. Skipped scenarios:

- Don't count as failures
- Still run registered cleanups
- Show as skipped in reporter output (e.g., `⊘` in list, `S` in dot)

### Multiple Scenarios Per File

Export an array for multiple scenarios:

```typescript
const base = scenario("Auth")
  .resource("api", () => createApiClient());

export default [
  base.step("Login", (ctx) => ctx.resources.api.login()).build(),
  base.step("Logout", (ctx) => ctx.resources.api.logout()).build(),
];
```

## Running Scenarios

### Basic Execution

```bash
probitas run                      # All scenarios
probitas run probitas/           # Specific directory
probitas run login.probitas.ts    # Specific file
```

### Filtering

```bash
# By tag
probitas run -s tag:smoke
probitas run -s tag:api -s tag:auth     # OR: api OR auth

# By name
probitas run -s login
probitas run -s "User Login"

# Exclude with negation
probitas run -s "!tag:slow"             # NOT slow
probitas run -s "tag:api,!tag:flaky"    # AND: api AND NOT flaky
```

### Execution Control

```bash
probitas run --sequential           # One at a time
probitas run --max-concurrency 4    # Limit parallelism
probitas run --fail-fast            # Stop on first failure
probitas run --max-failures 3       # Stop after 3 failures
```

### Output Formats

```bash
probitas run --reporter list        # Detailed (default)
probitas run --reporter dot         # Compact dots
probitas run --reporter json        # Machine-readable
probitas run --reporter tap         # TAP format
```

## Configuration

Add to `deno.json` or `deno.jsonc`:

```json
{
  "imports": {
    "probitas": "jsr:@probitas/probitas"
  },
  "probitas": {
    "includes": ["probitas/**/*.probitas.ts"],
    "excludes": ["**/*.skip.probitas.ts"],
    "reporter": "list",
    "maxConcurrency": 4,
    "maxFailures": 0,
    "selectors": ["!tag:wip"]
  }
}
```

All options can be overridden via CLI flags.

## Context Properties

The `ctx` object passed to step/resource/setup functions:

| Property    | Type                       | Description                  |
| ----------- | -------------------------- | ---------------------------- |
| `index`     | `number`                   | Entry index (0-based)        |
| `previous`  | Typed                      | Previous step's return value |
| `results`   | Typed tuple                | All step results             |
| `store`     | `Map<string, unknown>`     | Shared state across entries  |
| `signal`    | `AbortSignal`              | For cancellation             |
| `resources` | `Record<string, Resource>` | Initialized resources        |

Note: `previous` and `results` only include step entries.

## CI/CD Integration

GitHub Actions example:

```yaml
- name: Run tests
  run: probitas run --reporter tap --fail-fast
  env:
    NO_COLOR: 1
```

## Related

- [Command Reference](./command.md) - Command-line options
- [Architecture](./develop/architecture.md) - Design overview
- [Builder](./develop/builder.md) - Scenario definition API
- [Runner](./develop/runner.md) - Execution engine
