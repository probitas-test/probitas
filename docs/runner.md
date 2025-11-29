# Runner Specification

The Runner layer executes scenario definitions and orchestrates the test
lifecycle. It coordinates between scenarios, steps, and reporters.

## Overview

The Runner layer receives immutable scenario definitions created by the Builder
layer and manages the execution flow, lifecycle hooks, parallel execution,
timeouts, and reporting.

See [Architecture - Execution Flow](./architecture.md#execution-flow) for a
detailed sequence diagram of the execution process.

## Core Responsibilities

- Receive and execute scenario definitions from Builder
- Manage test lifecycle hooks (setup, teardown)
- Control parallel/sequential execution
- Handle timeouts and abort signals
- Coordinate with Reporter to notify events

## Interface

The Runner layer works with complete, immutable definitions created by the
Builder layer. All types here represent the final form after defaults are
applied.

### SourceLocation

Source file location information for debugging.

```typescript
interface SourceLocation {
  /** File path */
  file: string;

  /** Line number */
  line: number;
}
```

### ScenarioOptions

Complete scenario option definition with all required fields. The Builder layer
uses `Partial<ScenarioOptions>` and fills in defaults.

```typescript
interface ScenarioOptions {
  /** Tags (for filtering) */
  tags: string[];

  /** Skip condition (string is used as skip reason) */
  skip:
    | boolean
    | string
    | (() => boolean | string | Promise<boolean | string>)
    | null;

  /** Default options for all steps */
  stepOptions: StepOptions;
}
```

### StepOptions

Complete step option definition with all required fields. The Builder layer uses
`Partial<StepOptions>` and fills in defaults.

```typescript
interface StepOptions {
  /** Timeout (milliseconds) */
  timeout: number;

  /** Retry configuration */
  retry: {
    maxAttempts: number;
    backoff: "linear" | "exponential";
  };
}
```

### RetryOptions

Configuration for step retry behavior.

```typescript
interface RetryOptions {
  /**
   * Maximum number of retry attempts
   * @default 1 (no retries)
   */
  maxAttempts: number;

  /**
   * Backoff strategy between retries
   * - "linear": Fixed delay between retries
   * - "exponential": Exponentially increasing delay
   * @default "linear"
   */
  backoff: "linear" | "exponential";
}
```

**Usage:**

```typescript
import { retry } from "probitas";

const result = await retry(
  async () => {
    // Operation that might fail
    return await fetchData();
  },
  {
    maxAttempts: 3,
    backoff: "exponential",
  },
);
```

The `retry` function is also used internally by the Runner for step execution
retries.

### ScenarioDefinition

Scenario definition passed from Builder layer.

```typescript
interface ScenarioDefinition {
  /** Scenario name */
  name: string;

  /** Scenario options (final form) */
  options: ScenarioOptions;

  /** Array of entries to execute in order */
  entries: readonly Entry[];

  /** Source file location (for debugging) */
  location?: SourceLocation;
}
```

### Entry Types

A scenario is composed of different types of entries.

```typescript
type Entry =
  | { kind: "step"; value: StepDefinition }
  | { kind: "resource"; value: ResourceDefinition }
  | { kind: "setup"; value: SetupDefinition };

interface StepDefinition {
  name: string;
  fn: AnyStepFunction;
  options: StepOptions;
  location?: SourceLocation;
}

interface ResourceDefinition {
  name: string;
  factory: RunnerResourceFactory;
}

interface SetupDefinition {
  fn: RunnerSetupFunction;
  location?: SourceLocation;
}

// Runtime function signatures
type RunnerResourceFactory = (ctx: StepContext) => unknown | Promise<unknown>;
type RunnerSetupFunction = (
  ctx: StepContext,
) => SetupCleanup | Promise<SetupCleanup>;

// Cleanup type returned by setup functions
type SetupCleanup =
  | void
  | (() => void | Promise<void>)
  | Disposable
  | AsyncDisposable;
```

### StepDefinition

Definition of each step.

```typescript
interface StepDefinition {
  /** Step name */
  name: string;

  /** Step function */
  fn: AnyStepFunction;

  /** Step options (required, defaults already applied) */
  options: StepOptions;

  /** Source file location (for debugging) */
  location?: SourceLocation;
}
```

### ScenarioRunner

Basic runner interface that all implementations should follow.

```typescript
interface ScenarioRunner {
  /**
   * Execute scenarios
   */
  run(
    scenarios: readonly ScenarioDefinition[],
    options?: RunOptions,
  ): Promise<RunSummary>;
}
```

### RunOptions

Runtime options.

```typescript
interface RunOptions {
  /** Reporter to receive execution events */
  reporter?: Reporter;

  /**
   * Maximum concurrent scenarios (default: 0 = unlimited)
   * - 0 or undefined: Unlimited parallel execution
   * - 1: Sequential execution
   * - N: Execute up to N scenarios in parallel
   */
  maxConcurrency?: number;

  /**
   * Maximum number of failures before stopping (default: 0 = continue all)
   * - 0 or undefined: Execute all scenarios (continueAll)
   * - 1: Stop at first failure (failFast)
   * - N: Stop after N failures
   */
  maxFailures?: number;

  /** Abort signal for execution cancellation */
  signal?: AbortSignal;
}
```

### StepResult

Execution result of each step.

```typescript
interface StepResult {
  /** Step metadata */
  metadata: StepMetadata;

  /** Execution status */
  status: "passed" | "failed" | "skipped";

  /** Execution time (milliseconds) */
  duration: number;

  /** Retry count */
  retries: number;

  /** Step return value */
  value?: unknown;

  /** Error (on failure) */
  error?: Error;
}
```

### ScenarioMetadata

Metadata about a scenario definition, used in results.

```typescript
interface ScenarioMetadata {
  name: string;
  location?: SourceLocation;
  options: {
    tags: readonly string[];
    skip: boolean | null;
    stepOptions: StepOptions;
  };
  entries: readonly Entry[];
}
```

Note: This is a simplified version of ScenarioDefinition where `skip` is
normalized to a boolean or null.

### ScenarioResult

Execution result of each scenario.

```typescript
interface ScenarioResult {
  /** Scenario metadata */
  metadata: ScenarioMetadata;

  /** Execution status */
  status: "passed" | "failed" | "skipped";

  /** Execution time (milliseconds) */
  duration: number;

  /** Result of each step entry */
  steps: StepResult[];

  /** Error (on failure) */
  error?: Error;
}
```

### RunSummary

Overall execution result summary.

```typescript
interface RunSummary {
  /** Total number of executed scenarios */
  total: number;

  /** Number of successful scenarios */
  passed: number;

  /** Number of failed scenarios */
  failed: number;

  /** Number of skipped scenarios */
  skipped: number;

  /** Total execution time (milliseconds) */
  duration: number;

  /** Result of each scenario */
  scenarios: ScenarioResult[];
}
```

### StepContext

Created for each entry and passed to the entry's function (`fn` or `factory`).

```typescript
interface StepContext<P = unknown, R extends readonly unknown[] = unknown[]> {
  /** The index of the current entry */
  readonly index: number;
  /** The value returned by the previous step entry */
  readonly previous: P;
  /** An array of all previously returned step values */
  readonly results: R;
  /** A key-value store for sharing data across entries */
  readonly store: Map<string, unknown>;
  /** An abort signal for cancellation */
  readonly signal: AbortSignal;
  /** A record of all initialized resources */
  readonly resources: Record<string, unknown>;
}
```

## Usage Examples

### Basic Execution

```typescript
const runner = new ScenarioRunner();
const summary = await runner.run([definition]);

console.log(`${summary.passed}/${summary.total} passed`);
```

### With Custom Reporter

```typescript
const runner = new ScenarioRunner();
const summary = await runner.run([definition], {
  reporter: new ListReporter(),
});
```

### Parallel Execution

```typescript
const runner = new ScenarioRunner();
const summary = await runner.run(scenarios, {
  maxConcurrency: 5, // Limit to 5 parallel scenarios
});
```

### Stop on Failure

```typescript
const runner = new ScenarioRunner();
const summary = await runner.run(scenarios, {
  maxFailures: 1, // Stop at first failure (failFast)
});

// Or stop after multiple failures
const summary2 = await runner.run(scenarios, {
  maxFailures: 3, // Stop after 3 failures
});
```

## Customization/Extension

### Custom Runner

You can create custom execution engines by implementing the `ScenarioRunner`
interface.

### Concurrency Modes

```typescript
// Unlimited parallel execution (default)
maxConcurrency: 0; // or undefined

// Sequential execution
maxConcurrency: 1;

// Limited parallel execution
maxConcurrency: 10;
```

### Failure Modes

```typescript
// Execute all scenarios (default)
maxFailures: 0; // or undefined

// Stop at first failure (failFast)
maxFailures: 1;

// Stop after specified number of failures
maxFailures: 3;
```

### Error Handling

```typescript
class ScenarioError extends Error {
  constructor(
    message: string,
    public scenario: ScenarioDefinition,
    public cause?: Error,
  ) {}
}

class StepError extends Error {
  constructor(
    message: string,
    public step: StepDefinition,
    public attempt: number,
    public cause?: Error,
  ) {}
}

class TimeoutError extends Error {
  constructor(
    message: string,
    public timeout: number,
  ) {}
}
```

## Best Practices

### 1. Use Appropriate Strategy

- **When debugging**: Sequential execution guarantees output order
- **Performance focused**: Parallel execution improves throughput

### 2. Set Reasonable Timeouts

Balance between slow tests and false positives.

### 3. Resource Cleanup

Use `.resource()` for `Disposable` objects or return a cleanup function from a
`.setup()` entry for guaranteed cleanup.

```typescript
// For disposable objects
scenario("Test")
  .resource("db", () => new Database()); // Implements Disposable

// For procedural cleanup
scenario("Test")
  .setup("Create user", async (ctx) => {
    const userId = await createUser();
    ctx.store.set("userId", userId);
    return async () => {
      await deleteUser(userId);
    };
  });
```

### 4. Signal Handling

Respect abort signals to implement graceful shutdown:

```typescript
await runner.run(scenarios, {
  signal: abortController.signal,
});
```

### 5. Utilize Metadata

Result types are fully serializable:

```typescript
const summary = await runner.run(scenarios);
const json = JSON.stringify(summary);
await Deno.writeTextFile("results.json", json);
```

## Related Resources

- [Builder Specification](./builder.md) - Scenario definition
- [Reporter Specification](./reporter.md) - Test result output
- [Architecture](./architecture.md) - Overall design
