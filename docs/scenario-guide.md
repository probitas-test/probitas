# Scenario Guide

This guide explains how to write scenario files for Probitas testing framework.

## Basic Structure

A scenario is a sequence of steps that run in order. Create a `.scenario.ts`
file:

```typescript
import { expect, scenario } from "probitas";

const myScenario = scenario("My First Scenario", {})
  .step("Step 1", () => {
    return { data: "hello" };
  })
  .step("Step 2", (ctx) => {
    expect(ctx.previous.data).toBe("hello");
  })
  .build();

export default myScenario;
```

## Scenario Options

````typescript
scenario("Scenario Name", {
  // Tags for filtering
  tags: ["api", "smoke"],

  // Skip this scenario
  skip: false, // or true, or "reason", or () => boolean
})
  // ... steps
  .build();
```

## Setup and Cleanup

You can insert setup and cleanup logic anywhere in your scenario execution flow
using the `.setup()` method.

A setup function can optionally return a **cleanup function** or a
**Disposable/AsyncDisposable** object. All returned cleanup functions and
disposers are guaranteed to run at the end of the scenario, in the reverse
order they were defined.

```typescript
import { scenario } from "probitas";

scenario("My Scenario")
  .setup("Initialize config", (ctx) => {
    ctx.store.set("config", { url: "https://api.test" });

    // Return a cleanup function
    return () => {
      console.log("Scenario finished, cleaning up config...");
    };
  })
  .step("My Step", (ctx) => {
    const config = ctx.store.get("config");
    // ... use config
  })
  .build();
```

This provides a flexible way to manage lifecycle within a scenario, replacing
the legacy `.setup()` and `.teardown()` methods.

## Writing Steps

### Basic Step

```typescript
.step("Step name", (ctx) => {
  // Your code here
  return { result: 42 };
})
````

### Accessing Previous Result

```typescript
.step("First", () => {
  return { count: 1 };
})
.step("Second", (ctx) => {
  const previous = ctx.previous;  // { count: 1 }
  return { count: previous.count + 1 };
})
```

### Accessing All Results

```typescript
.step("Step A", () => ({ a: 1 }))
.step("Step B", () => ({ b: 2 }))
.step("Step C", (ctx) => {
  const [resultA, resultB] = ctx.results;
  expect(resultA.a + resultB.b).toBe(3);
})
```

### Using Shared Store

```typescript
scenario("With Store")
  .setup((ctx) => {
    ctx.store.set("config", { url: "https://api.test" });
  })
  .step("Use config", (ctx) => {
    const config = ctx.store.get("config");
    // use config
  });
```

### Step Options

Override timeout and retry behavior for individual steps:

```typescript
.step("Custom timeout", () => {
  // ...
}, {
  timeout: 5000,                  // 5 second timeout
  retry: {
    maxAttempts: 3,               // Retry up to 3 times
    backoff: "exponential"        // Exponential backoff
  }
})
```

### Unnamed Steps

```typescript
.step(() => {
  // Auto-named as "Step 1", "Step 2", etc.
})
```

## Using Assertions

Probitas uses `@std/expect` for assertions:

```typescript
import { expect } from "probitas";

.step("Verify", (ctx) => {
  const result = ctx.previous;

  expect(result.status).toBe(200);
  expect(result.data).toBeDefined();
  expect(result.items).toHaveLength(3);
  expect(result.name).toContain("test");
  expect(result.value).toBeGreaterThan(0);
})
```

## HTTP Client

Test REST APIs with the built-in HTTP client.

### Recommended Pattern (Top-Level)

**IMPORTANT**: Create the HTTP client at the script root (outside the scenario)
using `await using` for automatic resource cleanup:

```typescript
import { client, expect, scenario } from "probitas";

// Create client at script root with await using
await using api = client.http("https://api.example.com");

const myScenario = scenario("API Test", { tags: ["api"] })
  .step("GET request", async () => {
    const response = await api.get("/users?page=1&limit=10");
    expect(response.status).toBe(200);
    expect(response.json).toBeDefined();
    return response;
  })
  .step("POST request", async () => {
    const response = await api.post("/users", {
      json: { name: "John Doe" },
    });
    expect(response.status).toBe(201);
    return response.json.id;
  })
  .build();

export default myScenario;
```

### Session Management Pattern

For scenarios requiring session/cookie persistence:

```typescript
import { client, expect, scenario } from "probitas";

await using api = client.http("https://api.example.com");

const loginFlow = scenario("Login Flow", { tags: ["api", "auth"] })
  .step("Login", async () => {
    const result = await api.post("/login", {
      json: { username: "user", password: "pass" },
    });
    expect(result.status).toBe(200);
  })
  .step("Get Profile", async () => {
    // Session cookies automatically included
    const result = await api.get("/profile");
    expect(result.json.username).toBe("user");
  })
  .build();

export default loginFlow;
```

### Resource Management with `.resource()`

For automatic lifecycle management and type-safe access, the recommended way to
handle clients is with the `.resource()` method. This adds a resource entry to
the scenario.

Probitas will automatically manage the client's lifecycle, ensuring it is
created before any steps that need it and disposed of after the scenario
completes.

```typescript
import { client, expect, scenario } from "probitas";

const resourceScenario = scenario("API Test with Resources", { tags: ["api"] })
  .resource("api", () => {
    return client.http("https://api.example.com");
  })
  .step("Use API", async (ctx) => {
    // Type-safe resource access
    const result = await ctx.resources.api.get("/data");
    expect(result.status).toBe(200);
  })
  .build();
// The `api` client is automatically disposed after the scenario.

export default resourceScenario;
```

Use the `.setup()` method for procedural setup that might _use_ a resource, for
example, to seed a database before a test. See the "Setup and Cleanup" and
"Resource Management" sections for more details.

### HTTP Methods

All methods return a `Promise<HTTPResult>`:

```typescript
// GET
const result = await api.get("/path");

// POST
await api.post("/path", {
  json: { name: "John" },
});

// PUT
await api.put("/path", {
  json: { name: "Updated" },
});

// DELETE
await api.delete("/path");

// PATCH
await api.patch("/path", {
  json: { status: "active" },
});

// HEAD
await api.head("/path");
```

### Request Options

```typescript
await api.post("/path", {
  json: { key: "value" }, // Send JSON body
  headers: { "X-Custom": "value" }, // Additional headers
  timeout: 5000, // Request timeout
});
```

### Client Configuration

```typescript
// Set headers for all requests
api.setHeaders({
  "Authorization": "Bearer token",
  "Content-Type": "application/json",
});

// Set timeout for all requests
api.setTimeout(10000); // 10 seconds

// Clear cookies
api.clearCookies();
```

### Response Object

```typescript
{
  status: 200,
  statusText: "OK",
  headers: Headers,
  body: Uint8Array,
  text: string,           // Lazy-parsed text
  json: any,              // Lazy-parsed JSON
  blob: Blob,             // Lazy-parsed Blob
  duration: number        // Request duration in milliseconds
}
```

## Retry Logic

For operations that might fail temporarily, use the `retry` helper:

```typescript
import { retry } from "probitas";

.step("Flaky operation", async () => {
  return await retry(
    async () => {
      const response = await fetch("https://api.test/status");
      if (!response.ok) throw new Error("Not ready");
      return response;
    },
    {
      maxAttempts: 5,
      backoff: "exponential"
    }
  );
})
```

The `retry` function provides:

- Configurable max attempts
- Linear or exponential backoff
- AbortSignal support for cancellation

## Resource Management

A scenario is a sequence of **entries** that are executed in the order they are
defined. Entries can be steps, resources, or setups. This allows for a flexible
structure where resources can be initialized exactly when they are needed, even
using the results of previous steps.

All resources that are `Disposable` or `AsyncDisposable` are automatically
registered for cleanup. Additionally, `setup` entries can return cleanup
functions. At the end of the scenario, all cleanup functions and resource
disposers are executed in the reverse order of their definition.

### Dynamic Resource Initialization

Here is an example where a resource (`db`) depends on the result of a previous
step (`Get config`).

```typescript
import { client, scenario } from "probitas";

const apiScenario = scenario("API Test")
  .step("Get config", async () => {
    // This could be from a config file, an API call, etc.
    const dbUrl = "postgres://user:pass@host:port/db";
    return { dbUrl };
  })
  .resource("db", (ctx) => {
    // This resource is initialized after the "Get config" step.
    // It can access the result of the previous step via `ctx.previous`.
    return connectToDb(ctx.previous.dbUrl);
  })
  .setup("Seed database", async (ctx) => {
    // This setup block runs after the `db` resource is ready.
    // It can access the resource via `ctx.resources`.
    await ctx.resources.db.seed({ users: 10 });
    // Return a cleanup function to tear down the seeded data.
    return async () => {
      await ctx.resources.db.cleanup();
    };
  })
  .step("Query users", async (ctx) => {
    const users = await ctx.resources.db.query("SELECT * FROM users");
    return users;
  })
  .build();
```

### Execution Lifecycle

1. **Entries Execution**: `step`, `resource`, and `setup` entries are executed
   in the exact order they are defined in the scenario chain.
2. **Cleanup Execution**: After all entries have been executed (or the scenario
   is aborted due to a failure), all registered cleanup functions (from
   `.setup()` entries) and resource disposers (from `.resource()` entries) are
   executed in **reverse** order of their definition.

## Resource Cleanup

Use `defer` for automatic cleanup:

```typescript
import { defer } from "probitas";

.step("With cleanup", async () => {
  const resource = await createResource();

  await using _cleanup = defer(async () => {
    await resource.close();
  });

  // Use resource
  await resource.doSomething();

  // Cleanup runs automatically
})
```

## Environment Variables

Access environment variables safely:

```typescript
import { env } from "probitas";

.step("Setup", () => {
  const apiKey = env.get("API_KEY", "default-key");
  const hasToken = env.has("TOKEN");

  return { apiKey };
})
```

## Conditional Skip

Skip scenarios based on conditions:

```typescript
// Skip with boolean
scenario("Scenario", { skip: true });

// Skip with reason
scenario("Scenario", { skip: "Not implemented yet" });

// Skip with function
scenario("Scenario", {
  skip: () => Deno.build.os === "windows",
});
```

## Tags for Organization

Use tags to organize and filter scenarios:

```typescript
// Feature-based
scenario("Login", { tags: ["auth", "critical"] });
scenario("Logout", { tags: ["auth"] });

// Speed-based
scenario("Quick Check", { tags: ["smoke", "fast"] });
scenario("Full Test", { tags: ["integration", "slow"] });

// Environment-based
scenario("Production Test", { tags: ["prod", "e2e"] });
```

## Example Patterns

### API CRUD Test

```typescript
import { client, expect, scenario } from "probitas";

await using api = client.http("https://api.test");

const crudScenario = scenario("User CRUD", { tags: ["api", "users"] })
  .step("Create user", async () => {
    const result = await api.post("/users", {
      json: { name: "Test User" },
    });
    expect(result.status).toBe(201);
    return result.json.id;
  })
  .step("Get user", async (ctx) => {
    const userId = ctx.previous;
    const result = await api.get(`/users/${userId}`);
    expect(result.json.name).toBe("Test User");
  })
  .step("Delete user", async (ctx) => {
    const userId = ctx.results[0];
    await api.delete(`/users/${userId}`);
  })
  .build();

export default crudScenario;
```

### Managing Multiple Resources

To manage multiple resources, simply chain `.resource()` calls. Each resource is
initialized in order, and later resources can even depend on earlier ones. All
are disposed of automatically at the end.

```typescript
import { client, scenario } from "probitas";

scenario("Complex Test", { tags: ["integration"] })
  .resource("db", async () => {
    return await connectDB();
  })
  .resource("api", (ctx) => {
    // You can access previously defined resources via the context
    const dbConnectionString = ctx.resources.db.connectionString;
    return client.http(`https://api.test?db=${dbConnectionString}`);
  })
  .step("Test operation", async (ctx) => {
    const api = ctx.resources.api;
    const db = ctx.resources.db;
    // Use both resources
    const result = await api.get("/data");
    await db.insert("logs", result.json);
    return result.json;
  })
  .build();
```

### Retry with Verification

```typescript
import { client, expect, retry, scenario } from "probitas";

await using api = client.http("https://api.test");

const healthCheck = scenario("Wait for Ready", { tags: ["health"] })
  .step("Wait for ready", async () => {
    return await retry(
      async () => {
        const result = await api.get("/health");
        expect(result.status).toBe(200);
        expect(result.json.status).toBe("ready");
        return result;
      },
      { maxAttempts: 10, backoff: "exponential" },
    );
  })
  .build();

export default healthCheck;
```

## Best Practices

1. **Keep steps focused** - Each step should do one thing
2. **Use descriptive names** - Make it clear what each step does
3. **Tag appropriately** - Use tags for easy filtering
4. **Clean up resources** - Use teardown or defer for cleanup
5. **Share setup** - Use `setup` and `ctx.store` for common initialization
6. **Return meaningful data** - Return data that subsequent steps might need
7. **Use type safety** - Let TypeScript infer types from step returns
8. **Fail fast** - Throw errors or use expect() assertions when something is
   wrong
