# Builder Specification

The Builder layer provides a type-safe Fluent API for defining test scenarios.
It focuses solely on **definition** and does not execute tests.

## Overview

The Builder layer transforms user intent into immutable scenario definitions
that can be executed by the Runner layer. It achieves both compile-time type
checking and runtime flexibility.

## Core Responsibilities

- Transform user intent into scenario definitions executable by the Runner layer
- Build scenarios incrementally with type-safe Fluent API
- Automatically infer result types throughout the chain
- Generate immutable scenario definitions

## Interface

### scenario(name, options?)

Creates a new scenario builder instance.

```typescript
function scenario(
  name: string,
  options?: { tags?: string[] },
): ScenarioBuilderInit<unknown, readonly [], Record<string, never>>;
```

**Parameters**:

- `name` - Human-readable scenario name
- `options` - Optional configuration (tags only)

**Returns**: `ScenarioBuilderInit` with empty result chain and no resources

## Flexible Chaining API

The builder provides a flexible, fluent API where scenario entries can be
chained in any order. The methods `.step()`, `.resource()`, and `.setup()` can
be interleaved to construct the exact execution flow needed for a test.

This replaces the previous state-based model, giving you more freedom to
structure your scenarios.

**Generic type parameters**:

- `P` - Result type of the previous step
- `A` - Tuple of all accumulated results
- `Resources` - Accumulated resource types

### Methods

#### .resource(name, factory)

Adds a resource entry to the scenario. The resource is initialized at its
position in the chain. If it implements `AsyncDisposable` or `Disposable`, it
will be automatically disposed at the end of the scenario.

```typescript
resource<K extends string, R>(
  name: K,
  factory: (ctx: StepContext<P, A, Resources>) => R | Promise<R>
): ScenarioBuilder<P, A, Resources & Record<K, R>>
```

**Parameters**:

- `name` - Unique resource name (string literal for type inference)
- `factory` - Function to create the resource. It receives the full
  `StepContext` at its point in the execution chain, so it can use results from
  previous steps.

**Returns**: The same builder instance with an updated `Resources` type.

**Example**:

```typescript
scenario("DB Test")
  .step("Get config", () => ({ connectionString: "postgres://..." }))
  .resource("db", (ctx) => {
    // Can access the result of the previous step
    return connectDB(ctx.previous.connectionString);
  })
  .step("Query", (ctx) => {
    // ctx.resources.db is typed and available
    return ctx.resources.db.query("SELECT 1");
  });
```

#### .setup(name, fn)

Adds a setup entry to the scenario. This is for procedural logic that may have
side effects and require corresponding cleanup. The function can optionally
return a cleanup function or a `Disposable`/`AsyncDisposable` object, which will
be run at the end of the scenario.

```typescript
setup(
  name: string,
  fn: (ctx: StepContext<P, A, Resources>) => SetupCleanup | Promise<SetupCleanup>
): ScenarioBuilder<P, A, Resources>
```

**Parameters**:

- `name` - A descriptive name for the setup block.
- `fn` - The setup function. It receives the full `StepContext` and can return a
  cleanup action.

**Returns**: The same builder instance.

**Example**:

```typescript
scenario("User Test")
  .resource("db", () => connectToDb())
  .setup("Create test user", async (ctx) => {
    const { db } = ctx.resources;
    const userId = await db.createUser({ name: "test" });
    ctx.store.set("userId", userId);

    // Return a cleanup function
    return async () => {
      await db.deleteUser(userId);
    };
  })
  .step("Read user", async (ctx) => {
    // ...
  });
```

#### .step(name, fn, options?)

Adds a named step to the scenario.

```typescript
step<T>(
  name: string,
  fn: StepFunction<P, T, A>,
  options?: StepOptions
): ScenarioBuilderInSteps<T, readonly [...A, T]>
```

**Type Inference**:

- Input: `P` (previous result type)
- Output: New builder with `P = T` and `T` added to `A`

#### .step(fn, options?)

Adds an anonymous step (uses auto-generated name in "Step N" format, e.g., "Step
1", "Step 2").

```typescript
step<T>(
  fn: StepFunction<P, T, A>,
  options?: StepOptions
): ScenarioBuilderInSteps<T, readonly [...A, T]>
```

#### .build()

Finalizes and returns an immutable scenario definition. Can be called from any
builder state.

```typescript
build(): ScenarioDefinition
```

**Returns**: Immutable object used by the Runner layer.

### Type Definitions

#### StepFunction<P, T, A>

Step function signature.

```typescript
type StepFunction<
  P = unknown, // Previous step result type
  T = unknown, // This step's return type
  A extends readonly unknown[] = readonly [], // Accumulated result tuple
> = (ctx: StepContext<P, A>) => T | Promise<T>;
```

#### StepContext<P, A, R>

Context available to each entry's function.

```typescript
interface StepContext<
  P, // Previous step result type
  A extends readonly unknown[], // Accumulated result tuple
  R extends Record<string, unknown>, // Accumulated resources
> {
  index: number; // Entry index (0-based)
  previous: P; // Previous step result (typed)
  results: A; // All accumulated results (typed tuple)
  store: Map<string, unknown>; // Shared storage
  signal: AbortSignal; // Abort signal
  resources: R; // Record of initialized resources
}
```

### ScenarioOptions & StepOptions

During scenario building, all options are optional (using `Partial<>`). The
Builder applies defaults before passing to the Runner.

```typescript
type BuilderScenarioOptions = Partial<ScenarioOptions>;
type BuilderStepOptions = Partial<StepOptions>;
```

For complete option definitions with all fields, see
[Runner Specification - ScenarioOptions](./runner.md#scenariooptions) and
[Runner Specification - StepOptions](./runner.md#stepoptions).

## Usage Examples

### Basic Chaining

```typescript
const definition = scenario("Example")
  .step("Get ID", () => 123)
  .step("Fetch", (ctx) => {
    ctx.previous; // number type
    return { name: "John" };
  })
  .step("Validate", (ctx) => {
    ctx.previous.name; // string type
    ctx.results[0]; // number type
    ctx.results[1]; // { name: string } type
  })
  .build();

// Pass to Runner for execution
const runner = new ScenarioRunner();
await runner.run([definition]);
```

### Interleaving Entries

This example shows how `.step()`, `.resource()`, and `.setup()` can be
interleaved to create a clear and logical test flow.

```typescript
const definition = scenario("Database Test")
  // 1. Define a resource for the database connection
  .resource("db", async () => {
    const db = await connectDB();
    await db.connect();
    return db; // Automatically disposed if it implements AsyncDisposable
  })
  // 2. Add a setup entry to seed the database
  .setup("Seed data", async (ctx) => {
    // Access resources defined so far
    const userId = await ctx.resources.db.seed({ users: 1 });
    ctx.store.set("seededUserId", userId);
    // Return a cleanup function to run at the end
    return async () => {
      await ctx.resources.db.deleteUser(userId);
    };
  })
  // 3. Run a step to test the seeded data
  .step("Read record", async (ctx) => {
    const userId = ctx.store.get("seededUserId");
    const user = await ctx.resources.db.getUser(userId);
    expect(user).toBeDefined();
    return user;
  })
  .build();
```

## Best Practices

### 1. Type Annotations (Optional)

The builder automatically infers types, but explicit annotations can be added:

```typescript
scenario("Example")
  .step("Get Number", (): number => 123)
  .step("Use Number", (ctx): string => {
    const n: number = ctx.previous;
    return n.toString();
  });
```

### 2. Extract Entry Functions

For complex logic, extract functions for your entries:

```typescript
const getUserId = (): number => 123;
const fetchUser = (ctx: StepContext<number, [number]>) => {
  return { id: ctx.previous, name: "John" };
};

scenario("User Flow")
  .step("Get ID", getUserId)
  .step("Fetch", fetchUser);
```

### 3. Use `.resource()` for Disposables

For any object with a cleanup action that fits the `Disposable` or
`AsyncDisposable` pattern (like DB connections), prefer using `.resource()`.

```typescript
// Good: Manages lifecycle automatically
scenario("Test")
  .resource("db", () => new DatabaseConnection());
```

### 4. Use `.setup()` for Procedural Cleanup

For setup actions that don't involve a single "resource" object, like creating a
temporary file or seeding a database, use `.setup()` and return a cleanup
function.

```typescript
// Good: Clear and co-located logic
scenario("Test")
  .setup("Create temp file", () => {
    Deno.writeTextFileSync("temp.txt", "hello");
    return () => {
      Deno.removeSync("temp.txt");
    };
  });
```

### 5. Error Handling

The builder validates types at compile time:

```typescript
const definition = scenario("Example")
  .step("Get Number", () => 123)
  .step("Use String", (ctx) => {
    ctx.previous.toUpperCase(); // ❌ Compile error: number doesn't have toUpperCase
  })
  .build();
```

Runtime errors occur in the Runner layer, not the Builder layer.

## Related Resources

- [Runner Specification](./runner.md) - Scenario execution
- [Architecture](./architecture.md) - Overall design
