# CLI Specification

Command-line interface specification for the Probitas test runner.

## Overview

Probitas CLI is a command-line tool for executing scenario-based tests. It
discovers, filters, executes scenario files, and reports results.

## Execution Model

The execution model is defined by two simple parameters:

- **`maxConcurrency`**: Controls parallelism
  - `0` or undefined: Unlimited parallel (default)
  - `1`: Sequential execution
  - `N`: Run up to N scenarios in parallel

- **`maxFailures`**: Controls failure handling
  - `0` or undefined: Execute all scenarios (default)
  - `1`: Stop at first failure (failFast)
  - `N`: Stop after N failures

## Installation

```bash
# Global installation with Deno install
deno install -gAf -n probitas jsr:@lambdalisue/probitas/cli

# Or run directly from JSR (no installation required)
deno run -A jsr:@lambdalisue/probitas/cli run
```

After installation, the `probitas` command becomes available.

**Permissions**:

- The `-A` flag grants all permissions during installation
- Required permissions: `--allow-read`, `--allow-env`, `--allow-net` (when using
  HTTPClient)
- After installation, permissions don't need to be specified each time

Basic usage:

```bash
probitas run
```

## Basic Commands

### `probitas run`

Executes scenario files.

```bash
# Basic execution (all scenarios under current directory)
probitas run

# Specify a file pattern
probitas run "scenarios/**/*.scenario.ts"

# Specify multiple patterns
probitas run "scenarios/**/*.scenario.ts" "e2e/**/*.scenario.ts"

# Select scenarios by tag
probitas run --selector tag:api

# Select scenarios by multiple tags (OR)
probitas run --selector tag:api --selector tag:integration

# Select scenarios by name
probitas run --selector "login"

# Exclude scenarios using negation
probitas run --selector "!tag:wip"

# Specify maximum concurrency (parallel execution by default)
probitas run --max-concurrency 5

# Sequential execution (when there are dependencies between scenarios)
probitas run --max-concurrency 1

# Use custom Reporter
probitas run --reporter list

# Stop at first failure
probitas run --max-failures 1

# Stop after 3 failures
probitas run --max-failures 3
```

#### Scenario File Format

Scenario files must default export either a single scenario or multiple
scenarios.

##### Single Scenario

```typescript
import { scenario } from "probitas";

export default scenario("Login Flow")
  .step("Open login page", () => {/* ... */})
  .step("Enter credentials", () => {/* ... */})
  .build();
```

##### Multiple Scenarios (Array)

```typescript
import { scenario } from "probitas";

const loginScenario = scenario("Login Flow")
  .step("Open login page", () => {/* ... */})
  .build();

const logoutScenario = scenario("Logout Flow")
  .step("Click logout", () => {/* ... */})
  .build();

// Export as array
export default [loginScenario, logoutScenario];
```

**Type Definition**:

```typescript
// Scenario file default export type
type ScenarioFileExport = ScenarioDefinition | ScenarioDefinition[];
```

#### File/Directory Specification

The `probitas run` command accepts files and directories in the following
formats.

**Arguments**:

- `[files...]`: Scenario files or directories to execute (optional)
  - File: Direct specification (e.g., `test.scenario.ts`)
  - glob pattern: Use wildcards (e.g., `**/*.scenario.ts`)
  - Directory: Execute all scenarios within (e.g., `tests/`)
  - Multiple specifications allowed (space-separated)

##### File Patterns (glob)

```bash
# Specific file
probitas run scenarios/login.scenario.ts

# glob pattern
probitas run "scenarios/**/*.scenario.ts"

# Multiple patterns
probitas run "scenarios/**/*.scenario.ts" "e2e/**/*.scenario.ts"
```

##### Directory Specification

When the specified path is a directory, all scenario files within that directory
are automatically executed:

```bash
# Specify directory (executes all *.scenario.ts within)
probitas run scenarios/

# Multiple directories
probitas run scenarios/ e2e/

# Mix of directories and files
probitas run scenarios/ smoke/critical.scenario.ts
```

**Directory Behavior**:

- Searches for all files matching `**/*.scenario.ts` pattern within the
  directory
- Recursively searches subdirectories
- Does not follow symbolic links

##### Default Behavior

When no files or directories are specified, searches from the current directory:

```bash
# These are equivalent
probitas run
probitas run ./
probitas run "**/*.scenario.ts"
```

#### Options

##### File Pattern Specification

```bash
# Default: "**/*.scenario.ts"
probitas run

# Custom pattern
probitas run "scenarios/**/*.test.ts"

# Multiple patterns
probitas run "unit/**/*.ts" "integration/**/*.ts"
```

##### `--selector <selector>` / `-s`

Selects scenarios based on tag or name criteria. Can be specified multiple
times. Supports `!` prefix for negation.

**Selector Format**: `[!][type:]value`

- `!`: Negation prefix (optional) - excludes matching scenarios
- `type`: `tag` or `name` (defaults to `name` if omitted)
- `value`: Value to match (supports regular expressions, case-insensitive)

```bash
# Select scenarios with "api" tag
probitas run --selector tag:api
probitas run -s tag:api

# Select scenarios by name
probitas run --selector "login"
probitas run -s "Login"

# Exclude scenarios using negation
probitas run --selector "!tag:slow"
probitas run -s "!wip"

# Multiple selectors (OR logic - matches any selector)
probitas run --selector tag:api --selector tag:integration
# => Scenarios with "api" OR "integration" tag

# Multiple conditions in one selector (AND logic - comma-separated)
probitas run --selector "tag:api,tag:critical"
# => Scenarios with "api" AND "critical" tags

# Combine positive and negative conditions
probitas run --selector "tag:api,!tag:slow"
# => Scenarios with "api" tag AND NOT "slow" tag

# Mix types in one selector
probitas run --selector "tag:api,name:User,!tag:slow"
# => Scenarios with "api" tag AND name containing "User" AND NOT "slow" tag
```

**Selection Logic**:

- Multiple `--selector` flags: OR logic (matches any selector)
- Comma-separated within one selector: AND logic (must match all conditions)
- `!` prefix: NOT logic (negation - excludes matching scenarios)
- When omitted: All scenarios are selected

##### `--reporter <reporter>`

Specifies the Reporter type.

- Only built-in Reporters (dot, list, json, tap) are available
- If not specified, uses the `reporter` field from configuration file, or `list`
  as default

```bash
# List format (default)
probitas run --reporter list

# Dot format
probitas run --reporter dot

# JSON format (for CI/CD)
probitas run --reporter json > results.json

# TAP format
probitas run --reporter tap
```

##### `--max-concurrency <num>`

Specifies maximum concurrency for parallel execution (default: unlimited - all
scenarios run in parallel).

Note: The default behavior is to run all scenarios in parallel without limit.
For systems with limited resources or to avoid overwhelming external services,
use `--max-concurrency` to set a reasonable limit (e.g.,
`--max-concurrency 10`).

```bash
# Specify concurrency
probitas run --max-concurrency 5

# Specifying 1 is equivalent to sequential execution
probitas run --max-concurrency 1
```

**Execution Modes**:

- Default is parallel execution (`parallel` mode, unlimited concurrency)
- Use `--sequential` for sequential execution when there are dependencies
  between scenarios
- `--sequential` is equivalent to `--max-concurrency 1`
- Maximum concurrency for parallel execution can be controlled with
  `--max-concurrency`

##### `--max-failures <num>`

Stops execution after reaching the specified number of failures.

```bash
# Stop at first failure
probitas run --max-failures 1

# Stop after 3 failures
probitas run --max-failures 3
```

**Default Failure Strategy**:

- Default is to execute all scenarios (continue on failure)
- Use `--max-failures 1` for early termination on first failure
- Use `--max-failures N` to stop after N failures

##### `--no-color`

Disables color output.

```bash
probitas run --no-color
```

- Equivalent to `NO_COLOR=1` environment variable
- Automatically disabled when `NO_COLOR` environment variable is set

##### `-q, --quiet`

Quiet output (errors only).

```bash
probitas run --quiet
probitas run -q
```

##### `-v, --verbose`

Verbose output.

```bash
probitas run --verbose
probitas run -v
```

##### `-d, --debug`

Debug output (maximum detail).

```bash
probitas run --debug
probitas run -d
```

**Verbosity Levels**:

- `-q, --quiet`: Quiet output (errors only)
- `-v, --verbose`: Verbose output
- `-d, --debug`: Debug output (maximum detail)
- Default: Normal output

##### `-S, --sequential`

Run scenarios sequentially. Alias for `--max-concurrency=1`.

```bash
# Sequential execution
probitas run --sequential
# or
probitas run -S

# Equivalent to
probitas run --max-concurrency 1
```

##### `-f, --fail-fast`

Stop after first failure. Alias for `--max-failures=1`.

```bash
# Stop on first failure
probitas run --fail-fast
# or
probitas run -f

# Equivalent to
probitas run --max-failures 1
```

##### `--config <path>`

Specifies the configuration file path.

```bash
# Custom configuration file
probitas run --config ./custom.config.ts

# Another example
probitas run --config ./config/test.config.js
```

#### Filtering

Scenarios can be filtered using selector-based command-line options.

**Unified Selector Syntax**:

Filter scenarios using `--selector` with support for negation (`!` prefix).

```bash
# Select by tag
probitas run --selector tag:api

# Multiple selectors (OR logic - matches any)
probitas run --selector tag:api --selector tag:integration
# => Execute scenarios with "api" OR "integration" tag

# Select by name
probitas run --selector "login"

# Multiple conditions (AND logic - comma-separated within selector)
probitas run --selector "tag:api,tag:critical"
# => Execute scenarios with "api" AND "critical" tags

# Exclude using negation
probitas run --selector "tag:api,!tag:slow"
# => Execute scenarios with "api" tag, excluding "slow" tag

# Negation only
probitas run --selector "!tag:wip"
# => Execute all scenarios except those with "wip" tag

# Mix of types within one selector
probitas run --selector "tag:api,name:User,!tag:slow"
# => Execute scenarios with "api" tag AND name containing "User" AND NOT "slow" tag
```

**Filtering Logic**:

- `--selector` flags (multiple): OR logic - execute if matches any selector
- Comma-separated in selector: AND logic - must match all conditions
- `!` prefix: NOT logic - excludes matching scenarios
- When `--selector` omitted: All scenarios selected

In the configuration file's `selectors` field:

- `selectors`: Array of selector strings (OR logic between items, supports `!`
  prefix)

Example:

```typescript
selectors: [
  "tag:smoke", // Smoke tests
  "tag:api,!tag:slow", // API tests but not slow (AND with negation)
  "!tag:wip", // Exclude WIP
];
// => (smoke) OR (api AND NOT slow) OR (NOT wip)
```

### `probitas list`

Displays a list of available scenarios.

```bash
# List all scenarios
probitas list

# Select by tag
probitas list --selector tag:api

# Multiple selectors (OR logic)
probitas list --selector tag:api --selector tag:integration
# => List scenarios with "api" OR "integration" tag

# Select by name
probitas list --selector "login"

# Multiple conditions (AND logic)
probitas list --selector "tag:api,tag:critical"
# => List scenarios with "api" AND "critical" tags

# Exclude using negation
probitas list --selector "tag:api,!tag:slow"

# Output in JSON format
probitas list --json
```

Note: The `list` command does not accept file arguments. It uses patterns
defined in the configuration file or defaults to `**/*.scenario.ts`.

#### Options

- `--selector <selector>` / `-s` - Select scenarios by tag or name (can be
  specified multiple times, supports `!` prefix for negation)
- `--json` - Output in JSON format
- `--config <path>` - Specify configuration file

**Filtering**:

- Multiple `--selector` flags use OR logic (matches any selector)
- Comma-separated in selector uses AND logic (must match all conditions)
- `!` prefix for negation (excludes matching scenarios)

**Example**:

```bash
$ probitas list

scenarios/login.scenario.ts
  Login Flow

scenarios/auth.scenario.ts
  Login
  Logout
  Password Reset

scenarios/api.scenario.ts
  GET /users
  POST /users
  DELETE /users/:id

Total: 6 scenarios in 3 files
```

### `probitas init`

Initializes the project and generates necessary files.

```bash
probitas init
```

**Generated Files**:

- `probitas.config.ts` - Project configuration file
- `scenarios/example.scenario.ts` - Sample scenario
- `scenarios/deno.jsonc` - Deno configuration for scenarios directory

#### Options

- `--force` - Overwrite existing files

**probitas.config.ts**:

```typescript
import type { ProbitasConfig } from "probitas/cli";

export default {
  reporter: "list",
  verbosity: "normal",
} satisfies ProbitasConfig;
```

Contains minimal configuration only. Other settings use default values.

Default values:

- `includes`: `["**/*.scenario.ts"]`
- `excludes`: `[]`
- `maxConcurrency`: `undefined` (unlimited parallel execution by default)
- `maxFailures`: `undefined` (execute all scenarios)
- `selectors`: `[]`

**scenarios/example.scenario.ts**:

```typescript
import { scenario } from "probitas";

export default scenario("Example Scenario")
  .step("Step 1: Setup", () => {
    return { initialized: true };
  })
  .step("Step 2: Execute", (ctx) => {
    return { value: ctx.previous.initialized ? "success" : "failed" };
  })
  .step("Step 3: Verify", (ctx) => {
    if (ctx.previous.value !== "success") {
      throw new Error("Verification failed");
    }
  })
  .build();
```

**scenarios/deno.jsonc**:

```jsonc
{
  "imports": {
    "probitas": "jsr:@lambdalisue/probitas@^0.1.0"
  }
}
```

Contains minimal import maps only. You can add subpath mappings
(`"probitas/": "jsr:@lambdalisue/probitas/"`) or other configurations as needed.

**Directory Structure After Initialization**:

```
my-project/
├── probitas.config.ts
└── scenarios/
    ├── deno.jsonc
    └── example.scenario.ts
```

### Generated File Details

#### `probitas.config.ts`

Project Probitas configuration file. Contains minimal settings (reporter and
verbosity) only. Other settings use default values.

#### `scenarios/example.scenario.ts`

Executable sample scenario file. Demonstrates basic step writing and context
usage examples.

#### `scenarios/deno.jsonc`

Deno configuration file dedicated to the scenarios directory. Defines `probitas`
import map to enable simple import statements.

**Benefits**:

- Enables shortened imports (`probitas`, etc.) in scenario files
- Managed independently from project root configuration
- Can apply scenarios directory-specific settings (type checking, lint, etc.)

**Purpose**:

- **Import maps definition**: Enable importing dependencies using shortened
  forms like `probitas`
- **Independent configuration management**: Manage scenarios directory-specific
  configuration separately from project root's `deno.json`
- **Scenario file simplification**: Use shortened forms instead of long JSR
  paths, improving readability

### Project Initialization Example

```bash
# Initialize project
probitas init

# Run generated sample scenario
probitas run
```

The following files are created:

```
probitas.config.ts          # Project configuration
scenarios/
  deno.jsonc               # Deno configuration for scenarios
  example.scenario.ts      # Sample scenario
```

`scenarios/deno.jsonc` enables concise imports in scenario files like:

```typescript
import { scenario } from "probitas";
```

## Configuration File

Default settings can be defined by placing `probitas.config.ts` or
`probitas.config.js` in the project root directory.

### File Name Priority

1. `probitas.config.ts`
2. `probitas.config.js`
3. File specified by command-line option (`--config`)

### Configuration File Structure

The configuration file extends `RunOptions` to add CLI-specific configuration
items.

### ProbitasConfig Type

Type definition for configuration file exported from `probitas/cli`.

```typescript
import type { ProbitasConfig } from "probitas/cli";
```

`ProbitasConfig` extends `RunOptions` and adds the following CLI-specific
fields:

- `includes`: Include patterns (glob, files, directories, regular expressions)
- `excludes`: Exclude patterns (glob, files, directories, regular expressions)
- `reporter`: Default Reporter (string name or Reporter instance)
- `verbosity`: Verbosity level
- `maxConcurrency`: Maximum concurrent scenarios (0 or undefined = unlimited)
- `maxFailures`: Maximum failures before stopping (0 or undefined = continue
  all)
- `selectors`: Array of selector strings for scenario filtering (OR logic
  between items, supports `!` prefix for negation)

**Notes**:

- `RunOptions`' `reporter` only accepts `Reporter` type, but `ProbitasConfig`
  also accepts string names
- CLI converts strings to Reporter instances
- `maxConcurrency` and `maxFailures` are inherited from `RunOptions`
- Selector configuration uses `selectors` field with support for `!` prefix

TypeScript (recommended):

```typescript
import type { ProbitasConfig } from "probitas/cli";

export default {
  // File patterns
  includes: ["scenarios/**/*.scenario.ts"],
  excludes: ["**/*.skip.scenario.ts", /.*\.wip\.scenario\.ts$/],

  // Default Reporter
  reporter: "list",

  // Verbosity level
  verbosity: "normal",

  // Concurrency control
  maxConcurrency: 4, // Limit to 4 parallel scenarios
  // maxConcurrency: 1,  // Sequential execution
  // maxConcurrency: 0,  // Unlimited parallel (default)

  // Failure handling (default is to execute all scenarios)
  // maxFailures: 1,  // Stop at first failure (failFast)
  // maxFailures: 3,  // Stop after 3 failures

  // Scenario selector configuration
  selectors: [
    // OR logic between items
    "tag:smoke", // Smoke tests
    "tag:api,!tag:slow", // API tests but not slow (AND with negation)
    "!tag:wip", // Exclude WIP
  ],
} satisfies ProbitasConfig;
```

JavaScript:

```javascript
export default {
  includes: ["scenarios/**/*.scenario.js"],
  excludes: ["**/*.skip.scenario.js"],
  reporter: "dot",
  verbosity: "normal",

  maxConcurrency: 4,
  // maxFailures: 3,
};
```

### Using Custom Reporters

In TypeScript configuration files, Reporters can be specified as string names or
instances:

#### Specify by String Name

```typescript
import type { ProbitasConfig } from "probitas/cli";

export default {
  includes: ["scenarios/**/*.scenario.ts"],
  excludes: ["**/*.skip.scenario.ts"],

  // Specify built-in Reporter by name
  reporter: "list",

  maxConcurrency: 8,
} satisfies ProbitasConfig;
```

#### Set Reporter Instance Directly

When custom configuration is needed, set the instance directly in the `reporter`
field:

```typescript
import { ListReporter } from "probitas/reporter";
import type { ProbitasConfig } from "probitas/cli";

export default {
  includes: ["scenarios/**/*.scenario.ts"],
  excludes: ["**/*.skip.scenario.ts"],

  // Reporter instance with custom configuration
  reporter: new ListReporter({
    verbosity: "verbose",
    noColor: false,
  }),

  maxConcurrency: 8,
} satisfies ProbitasConfig;
```

**Notes**:

- String names can only be used for built-in Reporters (dot, list, json, tap)
- Set Reporter instance directly when custom configuration is needed
- When instance is set, it can be overridden with `--reporter` option

### Configuration Priority

Priority (highest first):

1. Command-line arguments
2. Environment variables
3. Configuration file
4. Default values

Example:

```bash
# Even if configuration file has "reporter": "list", command-line takes priority
probitas run --reporter json  # => json is used
```

## Usage Examples

### Basic Execution

```bash
# Default parallel execution (execute all scenarios in parallel)
probitas run

# Specify maximum concurrency
probitas run --max-concurrency 4

# Sequential execution (when there are dependencies between scenarios)
probitas run --max-concurrency 1

# Execute scenarios in specific directory
probitas run "scenarios/**/*.scenario.ts"
```

**Scenario File Examples**:

Single scenario:

```typescript
// scenarios/login.scenario.ts
export default scenario("Login").step(...).build();
```

Multiple scenarios (multiple scenarios in one file):

```typescript
// scenarios/auth.scenario.ts
export default [
  scenario("Login").step(...).build(),
  scenario("Logout").step(...).build(),
  scenario("Password Reset").step(...).build(),
];
```

#### Directory Specification

```bash
# Execute all scenarios under scenarios directory
probitas run scenarios/

# Execute multiple directories
probitas run scenarios/ e2e/ integration/

# Mix directories and files
probitas run scenarios/ smoke/critical.scenario.ts
```

### Scenario Selection and Filtering

```bash
# Execute only scenarios with "smoke" tag
probitas run --selector tag:smoke

# Execute scenarios with "api" OR "integration" tags
probitas run --selector tag:api --selector tag:integration

# Select by name
probitas run --selector "login"

# Combination of tags and pattern (AND)
probitas run --selector "tag:api,name:User"
# => Execute only scenarios with "api" tag AND name containing "User"

# Exclude using negation
probitas run --selector "tag:api,!tag:slow"
# => Execute API tests, but exclude slow ones

# Negation only
probitas run --selector "!tag:wip"
# => Execute all except WIP scenarios
```

**Filtering Logic**:

- Multiple `--selector` flags: OR logic (matches any selector)
- Comma-separated in selector: AND logic (must match all conditions)
- `!` prefix: NOT logic (excludes matching scenarios)

### Execution Modes

```bash
# Default: Parallel execution (unlimited concurrency)
probitas run

# Limit concurrency
probitas run --max-concurrency 2

# Sequential execution (one by one)
probitas run --sequential
# or
probitas run -S
```

### Color Output Control

```bash
# Disable with option
probitas run --no-color

# Disable with environment variable (these are equivalent)
NO_COLOR=1 probitas run
export NO_COLOR=1
probitas run

# Can be overridden by configuration file even if environment variable is set
probitas run  # Automatically disabled if NO_COLOR is set
```

**Priority**:

1. `--no-color` option (command-line)
2. `NO_COLOR` environment variable
3. Configuration file's `verbosity` setting
4. Default (color enabled)

### Custom Reporters

```bash
# Dot format (simple)
probitas run --reporter dot

# Save to file in JSON format
probitas run --reporter json > results.json

# TAP format
probitas run --reporter tap
```

### Failure Strategies

```bash
# Default: Execute all scenarios even on failure
probitas run

# Stop on first failure
probitas run --max-failures 1

# Stop after 3 failures
probitas run --max-failures 3
```

### CI/CD Usage

GitHub Actions example:

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: denoland/setup-deno@v2
        with:
          deno-version: v2.x

      - name: Install Probitas
        run: deno install -gAf -n probitas jsr:@lambdalisue/probitas/cli

      - name: Run tests
        run: |
          probitas run \
            --max-concurrency 10 \
            --max-failures 1
        env:
          NO_COLOR: 1 # Disable color output
```

GitLab CI example:

```yaml
test:
  image: denoland/deno:alpine
  script:
    - export NO_COLOR=1
    - deno install -gAf -n probitas jsr:@lambdalisue/probitas/cli
    - probitas run --max-failures 5
```

### Using Configuration File

`probitas.config.ts`:

```typescript
import type { ProbitasConfig } from "probitas/cli";

export default {
  includes: ["scenarios/**/*.scenario.ts"],
  excludes: [],
  reporter: "list",
  verbosity: "normal",

  maxConcurrency: 5, // Limit parallel execution to 5 scenarios
  maxFailures: 3, // Stop after 3 failures

  // Scenario selector configuration (optional)
  selectors: [
    "tag:smoke", // Smoke tests (OR)
    "tag:api,!tag:slow", // API tests but not slow (AND with negation)
    "!tag:wip", // Exclude WIP
  ],
} satisfies ProbitasConfig;
```

Execution:

```bash
# Use probitas.config.ts
probitas run

# Override part of configuration file
probitas run --reporter json

# Specify specific configuration file
probitas run --config custom.config.ts
```

## Environment Variables

### `NO_COLOR`

Disables colored output.

```bash
# Disable colored output
NO_COLOR=1 probitas run

# Equivalent to --no-color flag
```

- Equivalent to `--no-color` option
- Any value disables colors (just needs to be set)
- Follows standard environment variable convention (https://no-color.org/)

### `PROBITAS_CONFIG`

Specifies the default config file path.

```bash
# Use custom config file
PROBITAS_CONFIG=custom.config.ts probitas run
```

## Exit Codes

Probitas CLI returns the following exit codes:

- `0` - All scenarios succeeded
- `1` - One or more scenarios failed
- `2` - CLI usage error (invalid options, file conflicts, etc.)
- `4` - Scenario files not found

## Related Resources

- [Runner Specification](./runner.md) - Scenario execution engine
- [Reporter Specification](./reporter.md) - Test result output formats
- [Builder Specification](./builder.md) - Scenario definition methods
- [Architecture](./architecture.md) - Overall design
