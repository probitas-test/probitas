# Reporter Specification

The Reporter layer formats and displays test execution results. It receives
lifecycle events from the Runner and presents them to users.

## Overview

The Reporter layer receives events from the Runner layer and outputs execution
results in human-readable or machine-parseable formats. It supports multiple
output formats and allows custom reporter implementations.

The Reporter interface is defined in the Runner layer's type system. See
[Architecture - Execution Flow](./architecture.md#execution-flow) for how the
Reporter integrates with other layers.

## Core Responsibilities

- Transform execution events into human-readable or machine-parseable output
  formats
- Support multiple output formats (list, TAP, JSON, etc.)
- Use Theme layer to format output semantically
- Enable custom reporters

## Interface

### Reporter

All reporters implement this interface. This is the core contract between the
Runner and Reporter layers:

```typescript
interface Reporter {
  /**
   * Called when test execution starts
   */
  onRunStart(scenarios: readonly ScenarioDefinition[]): void | Promise<void>;

  /**
   * Called when scenario execution starts
   */
  onScenarioStart(scenario: ScenarioDefinition): void | Promise<void>;

  /**
   * Called when a scenario is skipped
   */
  onScenarioSkip(
    scenario: ScenarioDefinition,
    reason: string,
  ): void | Promise<void>;

  /**
   * Called when step execution starts
   */
  onStepStart(step: StepDefinition): void | Promise<void>;

  /**
   * Called when a step completes successfully
   */
  onStepEnd(step: StepDefinition, result: StepResult): void | Promise<void>;

  /**
   * Called when a step fails
   */
  onStepError(step: StepDefinition, error: Error): void | Promise<void>;

  /**
   * Called when a scenario completes
   */
  onScenarioEnd(
    scenario: ScenarioDefinition,
    result: ScenarioResult,
  ): void | Promise<void>;

  /**
   * Called when test execution ends
   */
  onRunEnd(summary: RunSummary): void | Promise<void>;
}
```

### ReporterOptions

Options for reporter initialization.

```typescript
interface ReporterOptions {
  /**
   * Output destination (default: Deno.stderr.writable)
   */
  output?: WritableStream;

  /**
   * Output verbosity (mutually exclusive)
   * - "quiet": Suppress all output
   * - "normal": Show only console.error/warn (default)
   * - "verbose": Show console.log/info as well
   * - "debug": Show all including console.debug
   */
  verbosity?: "quiet" | "normal" | "verbose" | "debug";

  /**
   * Disable colored output
   *
   * Defaults to false. Set to true to disable ANSI colors.
   * Note: Users should manually check NO_COLOR environment variable if needed:
   * `noColor: Deno.env.get("NO_COLOR") !== undefined`
   */
  noColor?: boolean;

  /**
   * Output theme
   */
  theme?: Theme;
}
```

**Console Control**:

The BaseReporter class (which all built-in reporters extend) includes console
control functionality. During test execution, reporters can suppress console
output from test code and restore it after execution completes. This prevents
test console output from interfering with reporter output formatting.

- `suppressConsole()`: Temporarily captures console.log/error/warn/debug calls
- `restoreConsole()`: Restores original console behavior

The verbosity option controls which console methods are captured or displayed
during test execution.

## Built-in Reporters

### ListReporter

Reporter that outputs in flat list format.

**Features**:

- Displays detailed individual step results
- Displays separate summary of failed tests
- Most recommended format by default
- Supports colored output

**Output Example**:

```
✓ User Login > Navigate to Login Page (src/user.scenario.ts:12) [12ms]
✓ User Login > Submit Credentials (src/user.scenario.ts:15) [145ms]
✓ User Logout > Click Logout Button (src/user.scenario.ts:22) [8ms]
⊝ Payment Flow (src/payment.scenario.ts:5) # PAYMENT_ENABLED env var not set
✓ API Test > Get User (src/api.scenario.ts:32) [56ms]
✗ API Test > Create User (src/api.scenario.ts:35)
  Connection timeout
  at fetch (http.ts:45:11)
  at step (api.scenario.ts:35:20)

Failed Tests
  ✗ API Test > Create User (src/api.scenario.ts:35)

Summary
  ✓ 2 scenarios passed
  ✗ 1 scenarios failed
  ⊝ 1 scenarios skipped

  4 scenarios total [1399ms]
```

### TAPReporter

Outputs in Test Anything Protocol format.

**Features**:

- Standard format compliant with TAP (Test Anything Protocol)
- Optimal for CI/CD pipeline integration
- Includes detailed information per step

### JSONReporter

Reporter that outputs each event in real-time using JSONLine format.

**Features**:

- JSON format with one event per line
- Real-time output for each event
- Easy for machine parsing
- Optimal for integration with log collection and analysis tools

### DotReporter

Reporter that displays progress in simple dot (`.`) format.

**Features**:

- Very compact output
- Effective when running many tests
- Does not display step details
- Optimal for progress checking with large test counts

**Output Format:**

- `.` (green): Passed scenario
- `F` (red): Failed scenario
- `S` (yellow): Skipped scenario

Example output:

```
...F..S.

5 scenarios passed, 1 scenarios failed, 1 scenarios skipped (245ms)

Failed Tests
  ✗ Login Flow > Submit credentials (auth.scenario.ts:42)

Skipped Tests
  ⊝ Admin Dashboard (admin.scenario.ts:10) # Not implemented yet
```

## Usage Examples

### Basic Usage

```typescript
const reporter = new ListReporter();
await runner.run(scenarios, { reporter });
```

### Custom Output Destination

```typescript
const file = await Deno.open("test-results.txt", { write: true, create: true });
const reporter = new ListReporter({
  output: file.writable,
  noColor: true,
});
```

### With Custom Theme

```typescript
const reporter = new ListReporter({
  theme: customTheme,
});
```

### CI/CD Integration

```typescript
const reporter = new TAPReporter();
await runner.run(scenarios, { reporter });
```

## Customization/Extension

### Custom Reporter

You can create custom reporters by implementing the Reporter interface. The
following patterns are commonly used:

- **Basic Reporter**: Receives event notifications and outputs to console
- **Progress Bar Display**: Visualizes execution progress
- **JSON Output**: Outputs test results in machine-readable format

**Basic Implementation Example**:

```typescript
class CustomReporter implements Reporter {
  async onRunStart(scenarios: readonly ScenarioDefinition[]) {
    console.log(`Starting ${scenarios.length} scenarios`);
  }

  async onScenarioStart(scenario: ScenarioDefinition) {
    console.log(`Running: ${scenario.name}`);
  }

  async onScenarioSkip(scenario: ScenarioDefinition, reason: string) {
    console.log(`Skipped: ${scenario.name} - ${reason}`);
  }

  async onStepStart(step: StepDefinition) {
    // Implementation
  }

  async onStepEnd(step: StepDefinition, result: StepResult) {
    console.log(`  Step: ${step.name} - ${result.status}`);
  }

  async onStepError(step: StepDefinition, error: Error) {
    console.error(`  Step: ${step.name} - ${error.message}`);
  }

  async onScenarioEnd(scenario: ScenarioDefinition, result: ScenarioResult) {
    console.log(`Finished: ${scenario.name} - ${result.status}`);
  }

  async onRunEnd(summary: RunSummary) {
    console.log(`Results: ${summary.passed}/${summary.total} passed`);
  }
}
```

### Custom Reporter Patterns

#### Reporter Chaining (Example Implementation)

While Probitas doesn't provide a built-in chained reporter, you can implement
one yourself:

```typescript
class ChainedReporter implements Reporter {
  constructor(private reporters: Reporter[]) {}

  async onRunStart(scenarios: readonly ScenarioDefinition[]) {
    await Promise.all(this.reporters.map((r) => r.onRunStart(scenarios)));
  }

  async onScenarioStart(scenario: ScenarioDefinition) {
    await Promise.all(this.reporters.map((r) => r.onScenarioStart(scenario)));
  }

  // ... other methods
}
```

## Best Practices

### 1. Real-time Output

Output immediately when events occur without buffering.

### 2. Error Formatting

Format errors appropriately in onStepError to provide helpful error messages:

```typescript
async onStepError(step: StepDefinition, error: Error) {
  const formatted = `${step.name}: ${error.message}`;
  await this.write(formatted);
}
```

### 3. Summary Statistics

Track aggregated data and display statistics in onRunEnd.

### 4. Leverage Theme

Use Theme layer to implement coloring, separating Reporter implementation from
color details:

```typescript
const icon = this.theme.success("✓");
const text = this.theme.dim("auxiliary info");
```

## Related Resources

- [Theme Specification](./theme.md) - Coloring implementation
- [Runner Specification](./runner.md) - Test execution
- [Architecture](./architecture.md) - Overall design
