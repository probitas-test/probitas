# Deno/TypeScript Rules

Language-specific conventions and patterns for Deno projects.

## Module Organization

- **Single entry point**: Each package exports through `mod.ts`
- **Colocated tests**: `*_test.ts` files adjacent to implementation

### Export Strategy

Each implementation file should export only what is needed for public API:

```ts
// runner.ts - Export only public API
export class Runner { /* ... */ }
export type { RunnerOptions };

// Internal helpers stay unexported
function internalHelper() { /* ... */ }
```

Entry point files (`mod.ts`, `{module}.ts`) use `export *` to re-export:

```ts
// mod.ts
export * from "./runner.ts";
export * from "./skip.ts";
export type * from "./types.ts";  // Type-only for tree-shaking
```

### Exporting for Tests

When internal functions need to be tested, use `_internal` namespace:

```ts
// parser.ts
function parseValue(input: string): Value {
  // Implementation
}

function validateInput(input: string): boolean {
  // Implementation
}

// Public API
export function parse(input: string): Value {
  if (!validateInput(input)) throw new Error("Invalid");
  return parseValue(input);
}

// Export internals for testing only
export const _internal = {
  parseValue,
  validateInput,
};
```

Usage in tests:

```ts
// parser_test.ts
import { parse, _internal } from "./parser.ts";

const { parseValue, validateInput } = _internal;

Deno.test("parseValue handles edge case", () => {
  const result = parseValue("edge-case");
  // ...
});
```

The `_internal` prefix signals "not part of public API" while keeping exports
minimal and intentional. Note that `_internal` should not be re-exported from
`mod.ts`.

## File Naming Conventions

```
mod.ts           # Package root entry point (only at root)
types.ts         # Public type definitions
utils/           # Public utilities directory
_testutils.ts    # Test utilities (not exported)
_typeutils.ts    # Type utilities (not exported)
```

Underscore prefix (`_*.ts`) indicates internal-only files that are not exported
from `mod.ts` and should not be used outside the package.

### Submodule Entry Points

For submodules with a directory, use `{module}.ts` instead of `{module}/mod.ts`:

```
package/
├── mod.ts           # Root entry point
├── mongodb.ts       # Entry point for mongodb/ (NOT mongodb/mod.ts)
├── mongodb/
│   ├── count.ts
│   └── find.ts
└── redis.ts         # Entry point for redis/
    redis/
    ├── hash.ts
    └── common.ts
```

This keeps `mod.ts` unique to the package root and makes submodule structure
clearer in import paths:

```ts
// Good
import { expectMongoResult } from "@probitas/expect/mongodb";

// Avoid
import { expectMongoResult } from "@probitas/expect/mongodb/mod";
```

## Package Config (deno.json)

```json
{
  "name": "@probitas/{package-name}",
  "version": "0.2.2",
  "exports": "./mod.ts",
  "publish": {
    "exclude": ["**/*_test.ts", "**/*_bench.ts"]
  }
}
```

## Documentation Comments

Code examples in JSDoc comments must be type-checked. Use `@example` tags with
proper TypeScript code blocks:

````ts
/**
 * Adds two numbers.
 *
 * @example
 * ```ts
 * import { add } from "./math.ts";
 * const result = add(1, 2); // result: number
 * ```
 */
export function add(a: number, b: number): number {
  return a + b;
}
````

Deno's `deno test --doc` validates these examples during CI.

## Private Fields

Use `#private` syntax instead of TypeScript's `private` keyword:

```ts
// Good - Runtime-enforced privacy
class Runner {
  #reporter: Reporter;
  #options: Options;

  constructor(reporter: Reporter, options: Options) {
    this.#reporter = reporter;
    this.#options = options;
  }
}

// Bad - Only compile-time privacy
class Runner {
  private reporter: Reporter;
}
```

Benefits of `#private`:

- Runtime enforcement (not just compile-time)
- Works correctly with inheritance
- Cannot be accessed via bracket notation

## Custom Error Classes

Custom error classes must set `this.name` for cross-process safety:

```ts
export class Skip extends Error {
  readonly reason?: string;

  constructor(reason?: string) {
    super(reason ?? "Skipped");
    this.name = "Skip"; // Required for Worker boundary safety
    this.reason = reason;
  }
}
```

When checking error types across Worker boundaries, use fallback:

```ts
function isSkip(err: unknown): err is Skip {
  if (err instanceof Skip) return true;
  // Fallback for cross-process scenarios
  if (err instanceof Error && err.name === "Skip") return true;
  return false;
}
```

## Disposable Patterns

Use `AsyncDisposableStack` for guaranteed cleanup:

```ts
async function runWithResources() {
  await using stack = new AsyncDisposableStack();

  const resource = await acquireResource();
  stack.defer(async () => await resource.close());

  // Resource is automatically cleaned up when scope exits
}
```

Create custom Disposable objects when needed:

```ts
export function createScopedSignal(): AbortSignal & Disposable {
  const controller = new AbortController();
  return Object.assign(controller.signal, {
    [Symbol.dispose]: () => controller.abort(),
  });
}

// Usage
using signal = createScopedSignal();
await fetch(url, { signal });
// Signal is automatically aborted when scope exits
```

## Test Helper Factories

Place test utilities in `_testutils.ts` with factory functions:

```ts
// _testutils.ts
import type { ScenarioDefinition } from "./types.ts";

const defaults: ScenarioDefinition = {
  name: "test-scenario",
  steps: [],
  options: {},
};

export function createTestScenario(
  overrides?: Partial<ScenarioDefinition>,
): ScenarioDefinition {
  return { ...defaults, ...overrides };
}

export function createTestStep(
  overrides?: Partial<StepDefinition>,
): StepDefinition {
  return {
    name: "test-step",
    fn: () => {},
    ...overrides,
  };
}
```

Usage in tests:

```ts
import { createTestScenario } from "./_testutils.ts";

Deno.test("scenario execution", async () => {
  const scenario = createTestScenario({ name: "my-test" });
  // ...
});
```

## Type Safety Patterns

### Type-Safe Chaining

The fluent API uses TypeScript's type system to:

- Infer result types throughout the chain automatically
- Provide compile-time errors for type mismatches
- Enable IDE autocompletion for `ctx.previous` and `ctx.results`

### Discriminated Unions

Results are discriminated unions based on status:

```ts
type StepResult =
  | { status: "passed"; value: unknown }
  | { status: "failed" | "skipped"; error: unknown };
```

This provides type-safe access to status-specific fields:

```ts
if (result.status === "passed") {
  // Safe: value exists when status is "passed"
  console.log(result.value);
} else {
  // Safe: error exists for "failed" and "skipped"
  console.log(result.error);
}
```

## Implementation Style (T-Wada Style)

Follow test-driven development principles:

1. Write a failing test first
2. Write minimal code to make the test pass
3. Refactor while keeping tests green
4. Repeat

## Development Environment

- A Nix flake is provided to supply the Deno toolchain without global installs.
- Enter the shell with `nix develop`, or add `use flake` to `.envrc` and
  `direnv allow` for auto-activation.
