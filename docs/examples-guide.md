# Examples Guide

Real-world examples for common testing scenarios.

## Basic Scenario

### Simple Data Flow

```typescript
import { scenario } from "probitas";

const basicTest = scenario("Data Flow", { tags: ["basic"] })
  .step("Initialize", () => {
    return { count: 1 };
  })
  .step("Process", (ctx) => {
    return { count: ctx.previous.count + 1 };
  })
  .step("Verify", (ctx) => {
    if (ctx.previous.count !== 2) throw new Error("Count mismatch");
  })
  .build();

export default basicTest;
```

### Using Store

```typescript
import { scenario } from "probitas";

const storeTest = scenario("Store Usage", { tags: ["basic"] })
  .setup((ctx) => {
    ctx.store.set("config", { baseUrl: "https://api.test" });
  })
  .step("Use Config", (ctx) => {
    const config = ctx.store.get("config");
    return config;
  })
  .build();

export default storeTest;
```

## Resource Management

### Using Resources

```typescript
import { scenario } from "probitas";

const resourceTest = scenario("Resource Test", { tags: ["resource"] })
  .resource("db", async () => {
    // Initialize resource
    const connection = await createConnection();
    return connection;
  })
  .step("Use Resource", async (ctx) => {
    const result = await ctx.resources.db.query("SELECT 1");
    return result;
  })
  .build();
// Resource is automatically disposed after scenario

export default resourceTest;
```

### Setup with Cleanup

```typescript
import { scenario } from "probitas";

const cleanupTest = scenario("Cleanup Test", { tags: ["cleanup"] })
  .setup(async (ctx) => {
    // Setup logic
    await seedDatabase();

    // Return cleanup function
    return async () => {
      await cleanupDatabase();
    };
  })
  .step("Test", async () => {
    // Test logic
  })
  .build();

export default cleanupTest;
```

## Error Handling

### Graceful Error Handling

```typescript
import { scenario } from "probitas";

const errorTest = scenario("Error Handling", { tags: ["error"] })
  .step("Handle Error", async () => {
    const result = await someOperation();
    if (!result.success) {
      throw new Error("Operation failed");
    }
  })
  .build();

export default errorTest;
```

## Best Practices

1. **Use Tags**: Organize scenarios by feature, priority, or speed
2. **One Scenario Per File**: Keep scenarios focused and maintainable
3. **Meaningful Names**: Use descriptive scenario and step names
4. **Cleanup**: Use `.setup()` with cleanup function or `.resource()` for
   resource cleanup
5. **Export Default**: Always export scenario as default
