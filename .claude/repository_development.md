# Development Patterns

Coding conventions and development practices for Probitas.

## User-Facing API

The `@probitas/probitas` package is the primary user-facing API:

```typescript
import { scenario, Skip } from "probitas";

export default scenario("My Test")
  .step("Step 1", () => ({ value: 42 }))
  .step("Step 2", (ctx) => {
    if (ctx.previous.value !== 42) throw new Error();
  })
  .build();
```

Key exports:

- `scenario` - Scenario builder function (from `@probitas/builder`)
- `Skip` - Skip class for conditional skipping (from `@probitas/runner`)
- `StepContext` - Type for step context (from `@probitas/builder`)

## Testing Strategy

**Unit Tests (`*_test.ts`)**

- Test in isolation without external dependencies
- Run with `deno task test`

**Example Scenarios (`probitas/`)**

- Example scenarios for documentation and manual testing
- Files named `*.probitas.ts`
- Run with `deno task probitas run`

## Custom Reporter Implementation

Custom reporters should implement the `Reporter` interface and compose a
`Writer` for output. The interface uses `Metadata` types (serializable) instead
of `Definition` types:

```ts
import { Writer, type WriterOptions } from "@probitas/reporter";
import type { Reporter, RunResult, StepResult } from "@probitas/runner";
import type { ScenarioMetadata, StepMetadata } from "@probitas/core";
import { defaultTheme, type Theme } from "@probitas/reporter";

export interface CustomReporterOptions extends WriterOptions {
  theme?: Theme;
}

export class CustomReporter implements Reporter {
  #writer: Writer;
  #theme: Theme;

  constructor(options: CustomReporterOptions = {}) {
    this.#writer = new Writer(options);
    this.#theme = options.theme ?? defaultTheme;
  }

  async onRunStart(scenarios: readonly ScenarioMetadata[]): Promise<void> {
    await this.#writer.write(`Running ${scenarios.length} scenarios\n`);
  }

  async onStepEnd(
    scenario: ScenarioMetadata,
    step: StepMetadata,
    result: StepResult,
  ): Promise<void> {
    // result is a discriminated union - access status-specific fields safely
    if (result.status === "passed") {
      await this.#writer.write(`✓ ${step.name}\n`);
    } else if (result.status === "failed") {
      await this.#writer.write(`✗ ${step.name}: ${result.error}\n`);
    } else if (result.status === "skipped") {
      await this.#writer.write(`⊘ ${step.name}: ${result.error}\n`);
    }
  }

  async onRunEnd(
    scenarios: readonly ScenarioMetadata[],
    result: RunResult,
  ): Promise<void> {
    await this.#writer.write(`\nCompleted: ${result.passed}/${result.total}\n`);
  }
}
```

### Key Points

1. **Implement `Reporter` interface** - All methods are optional
2. **Compose `Writer`** - For serialized, buffered output
3. **Use `Theme`** - For semantic coloring
4. **Access discriminated unions safely** - Check `result.status` before
   accessing fields
5. **Support options** - Allow users to customize output stream and theme
