# Migration Guide from 0.5.0 to 0.6.0

This guide helps you migrate from Probitas 0.5.0 to 0.6.0, which includes
significant architectural changes to the CLI execution model and configuration
system.

## Breaking Changes Overview

Version 0.6.0 introduces the following breaking changes:

1. **`init` command removed** - Use manual configuration instead
2. **Configuration location changed** - `deno.json` `probitas` section →
   standalone `probitas.json`
3. **Import maps no longer supported** - Must use full `jsr:` specifiers
4. **Reporter interface changed** - Now uses `Metadata` types instead of
   `Definition` types
5. **Source paths are now absolute** - `Source.file` stores absolute paths

## CLI Changes

### `init` Command Removed

The `probitas init` command has been removed. To configure your project:

1. Create `probitas.json` manually in your project root
2. Or use CLI flags directly

**Before (0.5.0):**

```bash
probitas init
```

**After (0.6.0):**

Create `probitas.json` manually:

```json
{
  "includes": ["**/*.probitas.ts"],
  "excludes": ["**/node_modules/**"],
  "timeout": "30s",
  "maxConcurrency": 4
}
```

### Configuration Location Changed

Configuration has moved from the `probitas` section in `deno.json` to a
standalone `probitas.json` file.

**Before (0.5.0):**

```json
// deno.json
{
  "imports": {
    "probitas": "jsr:@probitas/probitas"
  },
  "probitas": {
    "includes": ["**/*.probitas.ts"],
    "excludes": ["**/node_modules/**"],
    "timeout": "30s"
  }
}
```

**After (0.6.0):**

```json
// probitas.json (new file)
{
  "includes": ["**/*.probitas.ts"],
  "excludes": ["**/node_modules/**"],
  "timeout": "30s"
}
```

**Migration:**

1. Create a new `probitas.json` file in your project root
2. Move the contents of the `probitas` section from `deno.json` to this new file
3. Remove the `probitas` section from `deno.json`

### Configuration Schema

The configuration schema remains compatible:

```json
{
  "includes": ["**/*.probitas.ts"],
  "excludes": ["**/node_modules/**", "**/fixtures/**"],
  "timeout": "30s",
  "maxConcurrency": 4,
  "maxFailures": 10,
  "reporter": "list",
  "selectors": ["@smoke"]
}
```

## Import Maps No Longer Supported

### Why This Changed

In 0.5.0, scenario files were executed via subprocess with `deno run`, which
automatically loaded `deno.json` and its import map. In 0.6.0, scenarios execute
in Web Workers, which do not load `deno.json` import maps.

### Required Changes

All scenario files must use full JSR specifiers instead of bare specifiers.

**Before (0.5.0):**

```typescript
// deno.json had: "imports": { "probitas": "jsr:@probitas/probitas" }
import { scenario, Skip } from "probitas";
```

**After (0.6.0):**

```typescript
import { scenario, Skip } from "jsr:@probitas/probitas";
```

### Migration Script

To update all scenario files at once:

```bash
# macOS/Linux
find . -name "*.probitas.ts" -exec perl -i -pe \
  's/from "probitas"/from "jsr:@probitas\/probitas"/g' {} +

# Or using ripgrep + perl
rg -l 'from "probitas"' --glob '*.probitas.ts' | \
  xargs perl -i -pe 's/from "probitas"/from "jsr:@probitas\/probitas"/g'
```

## Reporter Interface Changes

### Metadata Types Instead of Definition Types

The `Reporter` interface now receives `Metadata` types instead of `Definition`
types. This change enables cross-thread communication in Worker-based execution.

**Key difference:**

- `ScenarioDefinition` / `StepDefinition` - Contains `fn` property (executable
  function)
- `ScenarioMetadata` / `StepMetadata` - Serializable, without `fn` property

**Before (0.5.0):**

```typescript
import type {
  Reporter,
  ScenarioDefinition,
  StepDefinition,
} from "@probitas/runner";

class MyReporter implements Reporter {
  onScenarioStart(scenario: ScenarioDefinition): void {
    console.log(`Starting: ${scenario.name}`);
  }

  onStepEnd(
    scenario: ScenarioDefinition,
    step: StepDefinition,
    result: StepResult,
  ): void {
    console.log(`Step: ${step.name} - ${result.status}`);
  }
}
```

**After (0.6.0):**

```typescript
import type { Reporter, StepResult } from "@probitas/runner";
import type { ScenarioMetadata, StepMetadata } from "@probitas/scenario";

class MyReporter implements Reporter {
  onScenarioStart(scenario: ScenarioMetadata): void {
    console.log(`Starting: ${scenario.name}`);
  }

  onStepEnd(
    scenario: ScenarioMetadata,
    step: StepMetadata,
    result: StepResult,
  ): void {
    console.log(`Step: ${step.name} - ${result.status}`);
  }
}
```

### Available Properties in Metadata Types

`ScenarioMetadata` includes:

- `name: string`
- `tags: readonly string[]`
- `source?: Source`
- `steps: readonly StepMetadata[]`

`StepMetadata` includes:

- `kind: "resource" | "setup" | "step"`
- `name: string`
- `timeout: number`
- `retry?: RetryOptions`
- `source?: Source`

### New `cwd` Option for Reporters

Reporters now support a `cwd` option to display relative paths:

```typescript
import { ListReporter } from "@probitas/reporter";

const reporter = new ListReporter({
  cwd: Deno.cwd(), // Paths will be displayed relative to this directory
});
```

## Source Path Changes

### Absolute Paths in Source.file

`Source.file` now stores absolute paths instead of relative paths. This ensures
reliable file loading in Worker-based parallel execution.

**Before (0.5.0):**

```typescript
scenario.source?.file; // "scenarios/login.probitas.ts"
```

**After (0.6.0):**

```typescript
scenario.source?.file; // "/Users/project/scenarios/login.probitas.ts"
```

**Impact:** If you're accessing `source.file` directly, you may need to convert
to relative paths for display:

```typescript
import { relative } from "@std/path";

const relativePath = relative(Deno.cwd(), scenario.source?.file ?? "");
```

Or use the built-in `formatSource` utility:

```typescript
import { formatSource } from "@probitas/reporter";

const formatted = formatSource(scenario.source, {
  cwd: Deno.cwd(),
  prefix: "(",
  suffix: ")",
});
// "(scenarios/login.probitas.ts:15)"
```

## Execution Model Changes (Internal)

While not a breaking change for most users, the CLI execution model has changed
significantly:

### Before (0.5.0): Subprocess-based

- Each `run` command spawned a subprocess per scenario file
- Higher startup overhead
- Process isolation

### After (0.6.0): Worker-based

- Uses Web Workers for parallel execution
- Lower startup overhead
- Better resource utilization
- Real-time progress events

**Benefits:**

- Faster test execution (no subprocess spawn overhead)
- Better isolation (each Worker runs one scenario)
- Real-time step-by-step progress reporting

## Quick Migration Checklist

1. [ ] Move configuration from `deno.json` `probitas` section to `probitas.json`
2. [ ] Update scenario imports from `"probitas"` to `"jsr:@probitas/probitas"`
3. [ ] Remove any scripts that depend on `probitas init`
4. [ ] Update custom reporters to use `Metadata` types
5. [ ] Update any code that accesses `source.file` directly (now absolute paths)
6. [ ] Run tests to verify everything works

## New Features in 0.6.0

### Parallel Execution with Workers

Scenarios now execute in parallel using Web Workers, providing:

- True parallel execution across CPU cores
- Isolated execution context per scenario
- No global state pollution between scenarios

### Real-time Progress Reporting

Step-by-step progress is now reported in real-time during execution, even for
parallel scenarios.

### Improved Error Messages

Source locations in error messages now consistently show relative paths for
better readability.

## Getting Help

If you encounter migration challenges:

1. Check the [API documentation](https://jsr.io/@probitas/cli)
2. Review the [changelog](../Releases.md)
3. Open an issue at https://github.com/jsr-probitas/probitas/issues
