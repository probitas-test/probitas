# Design Philosophy

This document describes the design principles and architectural decisions for
each layer of Probitas.

## Overall Principles

1. **Single Responsibility** - Each layer has one clear purpose
2. **Immutability** - Scenario definitions are immutable after building
3. **Type Safety** - Compile-time guarantees via TypeScript's type system
4. **Semantic Abstraction** - Theme layer decouples reporters from color details
5. **Extensibility** - Custom reporters and themes via well-defined interfaces

## Builder Layer

The Builder layer provides a type-safe fluent API for defining test scenarios.
It focuses solely on **definition** — it does not execute tests.

### Separation of Definition and Execution

The Builder captures user intent as an immutable data structure. This separation
enables:

- Static analysis of scenario structure before execution
- Reuse of definitions across different runners
- Serialization of definitions for distributed execution

### Type-Safe Chaining

The fluent API uses TypeScript's type system to:

- Infer result types throughout the chain automatically
- Provide compile-time errors for type mismatches
- Enable IDE autocompletion for `ctx.previous` and `ctx.results`

### Immutable Builder Pattern

Each method returns a new builder instance, enabling:

- Branching from a common base to create variants
- Safe sharing of partial definitions
- Predictable behavior without side effects

## Runner Layer

The Runner layer executes scenario definitions and orchestrates the test
lifecycle. It consists of two main classes:

### Two-Tier Execution Architecture

**Runner** (Top-level orchestrator):

- Orchestrates execution of multiple scenarios
- Manages parallel execution with `maxConcurrency`
- Tracks failures and enforces `maxFailures` stopping condition
- Aggregates results into `RunResult`
- Takes `Reporter` as a constructor dependency
- Emits `onRunStart` and `onRunEnd` lifecycle events

**ScenarioRunner** (Per-scenario executor):

- Executes a single scenario from start to finish
- Receives scenario definition and reporter
- Uses `StepRunner` to execute individual steps
- Collects step results and builds `ScenarioResult`
- Emits `onScenarioStart` and `onScenarioEnd` events
- Manages scenario-level context and resource state

**StepRunner** (Per-step executor):

- Executes a single step (setup, step, or cleanup)
- Handles timeout and retry logic
- Reports step execution via `onStepStart` and `onStepEnd`
- Never reports errors directly - always returns `StepResult`

### Definition-Execution Separation

The Runner receives immutable `ScenarioDefinition` objects from the Builder. It
never modifies definitions — only reads and executes them.

### Event-Driven Reporting

The Runner and sub-runners emit lifecycle events to the Reporter rather than
formatting output directly. This enables:

- Multiple output formats from the same execution
- Real-time streaming of results
- Custom reporters without modifying Runner

Event sequence:

1. `onRunStart(scenarios)` - Before any scenario execution
2. For each scenario:
   - `onScenarioStart(scenario)`
   - For each step:
     - `onStepStart(scenario, step)`
     - `onStepEnd(scenario, step, result)` - Always called, result carries
       status
   - `onScenarioEnd(scenario, result)`
3. `onRunEnd(scenarios, result)` - After all scenarios complete

### Controlled Concurrency

The execution model provides two orthogonal controls:

- **maxConcurrency** - How many scenarios run in parallel
- **maxFailures** - When to stop on failures

### Result Discrimination via Union Types

Results are discriminated unions based on status:

```ts
type StepResult =
  | { status: "passed"; value: unknown }
  | { status: "failed" | "skipped"; error: unknown };

type ScenarioResult =
  | { status: "passed"; steps: readonly StepResult[] }
  | { status: "failed" | "skipped"; error: unknown };
```

This provides type-safe access to status-specific fields without runtime checks.

### Cleanup Guarantee

Cleanups are guaranteed to run even when:

- A step throws an error
- The scenario is aborted via signal
- A timeout occurs

Cleanup errors are collected but don't prevent other cleanups from running.

## Reporter Layer

The Reporter layer formats and displays test execution results.

### Reporter Interface Architecture

Reporters implement the `Reporter` interface with lifecycle methods:

```ts
interface Reporter {
  onRunStart?(scenarios: readonly ScenarioDefinition[]): Promise<void> | void;
  onRunEnd?(
    scenarios: readonly ScenarioDefinition[],
    result: RunResult,
  ): Promise<void> | void;

  onScenarioStart?(scenario: ScenarioDefinition): Promise<void> | void;
  onScenarioEnd?(
    scenario: ScenarioDefinition,
    result: ScenarioResult,
  ): Promise<void> | void;

  onStepStart?(
    scenario: ScenarioDefinition,
    step: StepDefinition,
  ): Promise<void> | void;
  onStepEnd?(
    scenario: ScenarioDefinition,
    step: StepDefinition,
    result: StepResult,
  ): Promise<void> | void;
}
```

All methods are optional - reporters implement only the events they care about.

### Composition-Based Architecture

Reporters no longer extend a base class. Instead, they:

1. Implement the `Reporter` interface
2. Compose a `Writer` instance for serialized output
3. Optionally use `Theme` for semantic coloring

Example:

```ts
export class ListReporter implements Reporter {
  #writer: Writer;
  #theme: Theme;

  constructor(options: ListReporterOptions = {}) {
    this.#writer = new Writer(options);
    this.#theme = options.theme ?? defaultTheme;
  }

  async onStepEnd(scenario, step, result): Promise<void> {
    // Format and write output
    await this.#writer.write(`${output}\n`);
  }
}
```

Benefits of composition:

- Reporters have explicit dependencies
- No tight coupling to reporter implementation
- Easy to test in isolation
- Clear responsibility separation

### Event-Driven Architecture

The Runner calls event methods at appropriate times, and reporters decide how to
present the information. This decoupling enables:

- Multiple output formats without changing Runner
- Real-time output as tests execute
- Custom reporters for specific needs (CI/CD, IDEs, dashboards)

### Semantic Coloring via Theme

Reporters use the Theme layer for coloring. Instead of hardcoding colors,
reporters call semantic methods like `theme.success()` or `theme.failure()`.

Benefits:

- Reporters remain color-agnostic
- Users can customize themes without modifying reporters
- Automatic NO_COLOR environment variable support

### Status-Based Result Handling

Since `StepResult` is a discriminated union, reporters can safely access
status-specific fields with TypeScript type narrowing:

```ts
async onStepEnd(scenario, step, result) {
  if (result.status === "passed") {
    // Safe: value exists when status is "passed"
    console.log(result.value);
  } else if (result.status === "failed" || result.status === "skipped") {
    // Safe: error exists for "failed" and "skipped"
    console.log(result.error);
  }
}
```

## Theme Layer

The Theme layer provides semantic coloring for the Reporter layer.

### Semantic Abstraction

Theme methods are named for meaning, not appearance:

- `success` - Test passed (default: green)
- `failure` - Test failed (default: red)
- `warning` - Needs attention (default: yellow)
- `info` - Informational (default: cyan)
- `dim` - Secondary/auxiliary (default: gray)
- `title` - Heading/emphasis (default: bold)

This abstraction provides:

- **Consistency** - Same meaning always styled the same way
- **Customization** - Change colors without modifying reporters
- **Accessibility** - Easy to create high-contrast or colorblind-friendly themes

## Discover Layer

The Discover layer provides functions for finding scenario files in the
filesystem.

### Path Resolution Strategy

The discovery process follows a simple strategy:

- **File path** → Returns that file directly
- **Directory path** → Searches within using include patterns

This allows users to specify exact files or let the system discover them.

### Glob-Based Filtering

Uses standard glob patterns for flexible file matching:

- Include patterns determine which files to discover
- Exclude patterns filter out unwanted paths
- Patterns are evaluated relative to each directory
