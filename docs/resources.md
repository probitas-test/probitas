# Resource Management

Probitas provides automatic resource lifecycle management for scenarios,
enabling type-safe access to resources like databases, HTTP clients, and other
shared dependencies.

## Overview

Resources are managed through the `.resource()` method, which:

- Initializes resources before setup in declaration order
- Provides type-safe access via `ctx.resources`
- Automatically disposes AsyncDisposable/Disposable resources
- Enables resource dependencies (later resources can access earlier ones)

## Basic Usage

```typescript
import { client, scenario } from "probitas";

const apiTest = scenario("API Test")
  .resource("api", () => {
    return client.http("https://api.example.com");
  })
  .step("Fetch users", async (ctx) => {
    // Type-safe resource access
    const response = await ctx.resources.api.get("/users");
    return response.json;
  })
  .build();
```

## Dependent Resources

Entries are executed in order, so a resource can depend on any resource defined
before it, or on the result of any step that ran before it.

### Depending on another resource

```typescript
scenario("Database Test")
  .resource("config", () => {
    return { dbUrl: "postgres://localhost/test" };
  })
  .resource("db", (ctx) => {
    // Access previous resources via `ctx.resources`
    return connectDb(ctx.resources.config.dbUrl);
  })
  .step("Query", (ctx) => {
    // All resources typed and available
    ctx.resources.config; // { dbUrl: string }
    ctx.resources.db; // Database
  });
```

### Depending on a step result

```typescript
scenario("Dynamic DB Connection")
  .step("Load test config", () => {
    return { user: "test-user", pass: "secret" };
  })
  .resource("db", (ctx) => {
    // Access the result of the previous step via `ctx.previous`
    const { user, pass } = ctx.previous;
    return connectToDbAs(user, pass);
  })
  .step("Verify connection", (ctx) => {
    expect(ctx.resources.db.isConnected).toBe(true);
  });
```

## Automatic Disposal

Resources implementing `AsyncDisposable` or `Disposable` are automatically
disposed after the scenario finishes, in reverse order of definition:

```typescript
class Database implements AsyncDisposable {
  async [Symbol.asyncDispose]() {
    await this.close();
  }
}

scenario("Auto Dispose")
  .resource("db", () => new Database())
  .step("Use", (ctx) => ctx.resources.db.query("..."));
// db.close() called automatically after scenario
```

## Execution Lifecycle

A scenario is a sequence of **entries** (`step`, `resource`, `setup`) that are
executed in the order they are defined.

After all entries have run (or the scenario fails), all registered cleanup
functions and resource disposers are executed in **reverse order** of their
definition.

```
// Definition Order
.step("A", ...)
.resource("db", ...)
.setup("B", ...)
.step("C", ...)

// Execution Order
1. Step "A" runs
2. `db` resource is initialized
3. Setup "B" runs
4. Step "C" runs
5. Cleanup for Setup "B" runs
6. `db` resource is disposed
```

## Interleaving with Other Entries

Resources can be defined anywhere in the scenario chain. This is useful for
initializing a resource only when it's needed, or for using the result of a
previous step in the resource's factory.

```typescript
scenario("Full Lifecycle")
  .step("Get config", () => {
    return { dbUrl: "postgres://..." };
  })
  .resource("db", async (ctx) => {
    // Uses result from the previous step
    return await connectDb(ctx.previous.dbUrl);
  })
  .setup("Seed data", async (ctx) => {
    // Resources are available in setup entries
    await ctx.resources.db.migrate();
    await ctx.resources.db.seed({ users: 1 });

    // Return a cleanup function
    return async () => {
      await ctx.resources.db.rollback();
    };
  })
  .step("Insert", async (ctx) => {
    // Resources are available in steps
    const id = await ctx.resources.db.insert({ name: "test" });
    return id;
  });
// The `db` resource is automatically disposed after the cleanup from "Seed data"
```

## Non-Disposable Resources

Resources don't need to implement Disposable interfaces:

```typescript
scenario("Config Resource")
  .resource("config", () => {
    return { apiKey: "secret", timeout: 5000 };
  })
  .step("Use config", (ctx) => {
    const key = ctx.resources.config.apiKey;
    // config is just a plain object, no disposal needed
  });
```

## Error Handling

If resource initialization fails, the scenario fails immediately, and no
subsequent entries are run.

```typescript
scenario("Resource Error")
  .resource("db", async () => {
    throw new Error("Connection failed");
    // Scenario fails, no steps or other entries run
  })
  .step("Never runs", () => {});
```

## Best Practices

### 1. Use Resources for Shared Dependencies

```typescript
// Good: Shared HTTP client as resource
scenario("API Tests")
  .resource("api", () => client.http("https://api.test"))
  .step("Test 1", (ctx) => ctx.resources.api.get("/users"))
  .step("Test 2", (ctx) => ctx.resources.api.get("/posts"));
```

### 2. Order Resources by Dependency

```typescript
// Good: db before cache (cache depends on db)
scenario("Test")
  .resource("db", () => connectDb())
  .resource("cache", ({ resources }) => new Cache(resources.db));
```

### 3. Use AsyncDisposable for Cleanup

```typescript
class ApiClient implements AsyncDisposable {
  async [Symbol.asyncDispose]() {
    await this.disconnect();
    await this.clearCache();
  }
}

scenario("Test")
  .resource("client", () => new ApiClient());
// Automatically calls disconnect() and clearCache()
```

### 4. Keep Resource Factories Pure

```typescript
// Good: Pure factory
.resource("config", () => loadConfig())

// Avoid: Side effects in factory
.resource("logger", () => {
  console.log("Creating logger"); // Side effect
  return new Logger();
})
```

## Related

- [Builder Specification](./builder.md) - Builder API details
- [Scenario Guide](./scenario-guide.md) - Writing scenarios
- [Client Layer](./client.md) - HTTP client documentation
