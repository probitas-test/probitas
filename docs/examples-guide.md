# Examples Guide

Real-world examples for common testing scenarios.

## REST API Testing

### Basic CRUD Operations

```typescript
import { client, expect, scenario } from "probitas";

await using api = client.http("https://api.example.com");

const crudTest = scenario("User CRUD", { tags: ["api", "crud"] })
  .step("Create", async () => {
    const result = await api.post("/users", {
      json: { name: "Alice", email: "alice@example.com" },
    });
    expect(result.status).toBe(201);
    return result.json.id;
  })
  .step("Read", async (ctx) => {
    const id = ctx.previous;
    const result = await api.get(`/users/${id}`);
    expect(result.json.name).toBe("Alice");
    return id;
  })
  .step("Update", async (ctx) => {
    const id = ctx.previous;
    const result = await api.put(`/users/${id}`, {
      json: { name: "Alice Smith" },
    });
    expect(result.status).toBe(200);
    return id;
  })
  .step("Delete", async (ctx) => {
    const id = ctx.previous;
    const result = await api.delete(`/users/${id}`);
    expect(result.status).toBe(204);
  })
  .build();

export default crudTest;
```

### Authentication Flow

```typescript
import { client, expect, scenario } from "probitas";

await using api = client.http("https://app.example.com");

const authFlow = scenario("Login and Access Protected Route", {
  tags: ["auth", "session"],
})
  .step("Login", async () => {
    const result = await api.post("/login", {
      json: { username: "user", password: "pass123" },
    });
    expect(result.status).toBe(200);
    expect(result.json.token).toBeDefined();
    return result.json.token;
  })
  .step("Access Protected Route", async (ctx) => {
    // Session cookie automatically included
    const result = await api.get("/profile");
    expect(result.status).toBe(200);
    expect(result.json.username).toBe("user");
  })
  .step("Logout", async () => {
    const result = await api.post("/logout");
    expect(result.status).toBe(200);
  })
  .build();

export default authFlow;
```

### Pagination

```typescript
import { client, expect, scenario } from "probitas";

await using api = client.http("https://api.example.com");

const paginationTest = scenario("Pagination", { tags: ["api"] })
  .step("Get First Page", async () => {
    const result = await api.get("/users?page=1&limit=10");
    expect(result.status).toBe(200);
    expect(result.json.items).toHaveLength(10);
    expect(result.json.total).toBeGreaterThan(10);
    return result.json.nextPage;
  })
  .step("Get Next Page", async (ctx) => {
    const nextPage = ctx.previous;
    const result = await api.get(`/users?page=${nextPage}&limit=10`);
    expect(result.status).toBe(200);
    expect(result.json.items).toHaveLength(10);
  })
  .build();

export default paginationTest;
```

## Error Handling

### Retry on Transient Failures

```typescript
import { client, expect, retry, scenario } from "probitas";

await using api = client.http("https://api.example.com");

const retryTest = scenario("Retry Flaky Endpoint", { tags: ["retry"] })
  .step("Call with Retry", async () => {
    return await retry(
      async () => {
        const result = await api.get("/flaky-endpoint");
        if (result.status === 503) {
          throw new Error("Service Unavailable");
        }
        expect(result.status).toBe(200);
        return result.json;
      },
      { maxAttempts: 5, backoff: "exponential" },
    );
  })
  .build();

export default retryTest;
```

### Graceful Error Handling

```typescript
import { client, expect, scenario } from "probitas";

await using api = client.http("https://api.example.com");

const errorHandling = scenario("Error Handling", { tags: ["error"] })
  .step("Handle 404", async () => {
    const result = await api.get("/nonexistent");
    expect(result.status).toBe(404);
    expect(result.json.error).toBe("Not Found");
  })
  .step("Handle Validation Error", async () => {
    const result = await api.post("/users", {
      json: { name: "" }, // Invalid data
    });
    expect(result.status).toBe(400);
    expect(result.json.errors).toBeDefined();
  })
  .build();

export default errorHandling;
```

## Data Validation

### Response Schema Validation

```typescript
import { client, expect, scenario } from "probitas";

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

await using api = client.http("https://api.example.com");

const schemaValidation = scenario("Schema Validation", { tags: ["validation"] })
  .step("Validate User Schema", async () => {
    const result = await api.get<User>("/users/1");
    expect(result.status).toBe(200);

    const user = result.json;
    expect(typeof user.id).toBe("number");
    expect(typeof user.name).toBe("string");
    expect(typeof user.email).toBe("string");
    expect(typeof user.createdAt).toBe("string");

    // Validate email format
    expect(user.email).toMatch(/^[^@]+@[^@]+\.[^@]+$/);
  })
  .build();

export default schemaValidation;
```

## Performance Testing

### Response Time Validation

```typescript
import { client, expect, scenario } from "probitas";

await using api = client.http("https://api.example.com");

const performanceTest = scenario("Response Time", { tags: ["performance"] })
  .step("Check Response Time", async () => {
    const result = await api.get("/users");
    expect(result.status).toBe(200);
    expect(result.duration).toBeLessThan(500); // Less than 500ms
  })
  .build();

export default performanceTest;
```

### Concurrent Requests

```typescript
import { client, expect, scenario } from "probitas";

await using api = client.http("https://api.example.com");

const concurrentTest = scenario("Concurrent Requests", {
  tags: ["performance"],
})
  .step("Send Parallel Requests", async () => {
    const requests = Array.from(
      { length: 10 },
      (_, i) => api.get(`/users/${i + 1}`),
    );

    const results = await Promise.all(requests);

    results.forEach((result) => {
      expect(result.status).toBe(200);
    });

    // Calculate average response time
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) /
      results.length;
    expect(avgDuration).toBeLessThan(1000);
  })
  .build();

export default concurrentTest;
```

## Environment-Based Testing

### Skip Based on Environment

```typescript
import { client, env, expect, scenario } from "probitas";

await using api = client.http(env.get("API_URL", "https://api.example.com"));

const prodOnlyTest = scenario("Production Only", {
  tags: ["production"],
  skip: () => env.get("ENVIRONMENT") !== "production",
})
  .step("Test Production Feature", async () => {
    const result = await api.get("/production-only-endpoint");
    expect(result.status).toBe(200);
  })
  .build();

export default prodOnlyTest;
```

### Multi-Environment Configuration

```typescript
import { client, env, expect, scenario } from "probitas";

const API_URL = env.get("API_URL", "https://api.example.com");
const API_KEY = env.get("API_KEY");

await using api = client.http(API_URL, {
  headers: API_KEY ? { "X-API-Key": API_KEY } : {},
});

const envTest = scenario("Environment Config", { tags: ["config"] })
  .step("Verify Environment", async () => {
    const result = await api.get("/health");
    expect(result.status).toBe(200);
    console.log(`Testing against: ${API_URL}`);
  })
  .build();

export default envTest;
```

## Resource Cleanup

### Database Cleanup

```typescript
import { defer, expect, scenario } from "probitas";

const dbTest = scenario("Database Test", {
  tags: ["database"],
  setup: async (ctx) => {
    const db = await connectDB();
    ctx.store.set("db", db);
  },
  teardown: async (ctx) => {
    const db = ctx.store.get("db");
    await db?.close();
  },
})
  .step("Insert Record", async (ctx) => {
    const db = ctx.store.get("db");

    await using _cleanup = defer(async () => {
      await db.execute("DELETE FROM test_users WHERE email = ?", [
        "test@example.com",
      ]);
    });

    const result = await db.execute(
      "INSERT INTO test_users (name, email) VALUES (?, ?)",
      ["Test User", "test@example.com"],
    );

    expect(result.rowsAffected).toBe(1);
  })
  .build();

export default dbTest;
```

## Health Check Polling

### Wait for Service Ready

```typescript
import { client, expect, retry, scenario } from "probitas";

await using api = client.http("https://api.example.com");

const healthCheck = scenario("Health Check Polling", { tags: ["health"] })
  .step("Wait for Service", async () => {
    return await retry(
      async () => {
        const result = await api.get("/health");
        expect(result.status).toBe(200);
        expect(result.json.status).toBe("healthy");
        return result.json;
      },
      { maxAttempts: 30, backoff: "linear" }, // Try for 30 seconds
    );
  })
  .step("Run Tests", async () => {
    const result = await api.get("/users");
    expect(result.status).toBe(200);
  })
  .build();

export default healthCheck;
```

## Best Practices

1. **Use Tags**: Organize scenarios by feature, priority, or speed
2. **One Scenario Per File**: Keep scenarios focused and maintainable
3. **Meaningful Names**: Use descriptive scenario and step names
4. **Top-Level Client**: Create HTTP clients at script root with `await using`
5. **Type Safety**: Use TypeScript interfaces for API responses
6. **Environment Variables**: Use `env` helper for configuration
7. **Cleanup**: Use `defer` or teardown for resource cleanup
8. **Retry Wisely**: Only retry operations expected to be transient
9. **Assertions**: Use `expect()` for clear test failures
10. **Export Default**: Always export scenario as default
