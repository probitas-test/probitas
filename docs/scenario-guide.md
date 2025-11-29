# Scenario Guide

This guide explains how to write scenario files for Probitas testing framework.

## Basic Structure

A scenario is a sequence of steps that run in order. Create a `.scenario.ts`
file:

```typescript
import { scenario } from "probitas";

const myScenario = scenario("My First Scenario", {})
  .step("Step 1", () => {
    return { data: "hello" };
  })
  .step("Step 2", (ctx) => {
    if (ctx.previous.data !== "hello") throw new Error("Unexpected data");
  })
  .build();

export default myScenario;
```

## Scenario Options

```typescript
scenario("Scenario Name", {
  // Tags for filtering
  tags: ["api", "smoke"],
})
  // ... steps
  .build();
```

## Setup and Cleanup

You can insert setup and cleanup logic using the `.setup()` method.

A setup function can optionally return a **cleanup function**. All returned
cleanup functions are guaranteed to run at the end of the scenario, in the
reverse order they were defined.

```typescript
import { scenario } from "probitas";

scenario("My Scenario")
  .setup((ctx) => {
    ctx.store.set("config", { url: "https://api.test" });

    // Return a cleanup function
    return () => {
      console.log("Scenario finished, cleaning up...");
    };
  })
  .step("My Step", (ctx) => {
    const config = ctx.store.get("config");
    // ... use config
  })
  .build();
```

## Writing Steps

### Basic Step

```typescript
.step("Step name", (ctx) => {
  // Your code here
  return { result: 42 };
})
```

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
  if (resultA.a + resultB.b !== 3) throw new Error("Unexpected sum");
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

## Resource Management

Use `.resource()` for automatic lifecycle management:

```typescript
import { scenario } from "probitas";

scenario("Resource Test")
  .resource("db", async () => {
    return await connectDB();
  })
  .step("Use DB", async (ctx) => {
    const users = await ctx.resources.db.query("SELECT * FROM users");
    return users;
  })
  .build();
// Resource is automatically disposed after scenario
```

### Execution Lifecycle

1. **Entries Execution**: `step`, `resource`, and `setup` entries are executed
   in the exact order they are defined.
2. **Cleanup Execution**: After all entries have been executed (or the scenario
   is aborted due to a failure), all cleanup functions and resource disposers
   are executed in **reverse** order.

## Tags for Organization

Use tags to organize and filter scenarios:

```typescript
// Feature-based
scenario("Login", { tags: ["auth", "critical"] });
scenario("Logout", { tags: ["auth"] });

// Speed-based
scenario("Quick Check", { tags: ["smoke", "fast"] });
scenario("Full Test", { tags: ["integration", "slow"] });
```

## Best Practices

1. **Keep steps focused** - Each step should do one thing
2. **Use descriptive names** - Make it clear what each step does
3. **Tag appropriately** - Use tags for easy filtering
4. **Clean up resources** - Use `.setup()` with cleanup function or
   `.resource()`
5. **Return meaningful data** - Return data that subsequent steps might need
6. **Fail fast** - Throw errors when something is wrong
