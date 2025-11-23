# Usage Guide

Probitas is a scenario-based testing framework for Deno. This guide covers how
to use the CLI commands to run and manage your tests.

## Installation

Install the Probitas CLI globally:

```bash
deno install -A -g -f -n probitas jsr:@lambdalisue/probitas/cli
```

Options:

- `-A` - Allow all permissions
- `-g` - Install globally
- `-f` - Force overwrite existing installation
- `-n probitas` - Name the command `probitas`

This installs the `probitas` command for use anywhere.

## Updating

To update to the latest version, reinstall with the `-r` flag to ignore cache:

```bash
deno install -A -g -f -r -n probitas jsr:@lambdalisue/probitas/cli
```

The `-r` flag forces Deno to fetch the latest version from the registry.

## Getting Started

1. Initialize a new project:
   ```bash
   probitas init
   ```

2. Run all scenarios:
   ```bash
   probitas run
   ```

3. List available scenarios:
   ```bash
   probitas list
   ```

## Commands

### `run`

Execute scenarios in your project.

**Basic usage:**

```bash
probitas run                    # Run all scenarios
probitas run scenarios/         # Run scenarios in a directory
probitas run api.scenario.ts    # Run a specific file
```

**Filtering:**

```bash
# Run scenarios with specific tags
probitas run -s tag:api
probitas run -s tag:smoke -s tag:critical

# Run by scenario name
probitas run -s login
probitas run -s name:checkout

# Exclude scenarios
probitas run -x tag:slow
probitas run -x flaky

# Combine filters (AND logic with comma)
probitas run -s tag:api,tag:critical
```

**Execution control:**

```bash
# Run sequentially (one at a time)
probitas run --sequential

# Limit concurrent scenarios
probitas run --max-concurrency 4

# Stop on first failure
probitas run --fail-fast

# Stop after 3 failures
probitas run --max-failures 3
```

**Output formats:**

```bash
probitas run --reporter list    # Detailed list (default)
probitas run --reporter dot     # Compact dots
probitas run --reporter live    # Real-time progress
probitas run --reporter json    # Machine-readable JSON
probitas run --reporter tap     # TAP format
```

**Verbosity:**

```bash
probitas run -q                 # Quiet (errors only)
probitas run -v                 # Verbose
probitas run -d                 # Debug (very verbose)
probitas run --no-color         # Disable colors
```

**Using a config file:**

```bash
probitas run --config probitas.config.ts
```

### `list`

List available scenarios in your project.

**Basic usage:**

```bash
probitas list                   # List all scenarios
probitas list -s tag:api        # List scenarios with tag
probitas list --json            # Output as JSON
```

### `init`

Bootstrap a new Probitas project.

**Basic usage:**

```bash
probitas init                   # Create config and example
probitas init --force           # Overwrite existing files
```

This creates:

- `probitas.config.ts` - Project configuration
- `scenarios/deno.jsonc` - Import maps
- `scenarios/example.scenario.ts` - Example scenario

## Configuration

Create a `probitas.config.ts` file in your project root:

```typescript
import type { ProbitasConfig } from "probitas/cli";

export default {
  // File patterns to include
  includes: ["scenarios/**/*.scenario.ts"],

  // File patterns to exclude
  excludes: ["**/skip.scenario.ts"],

  // Default reporter
  reporter: "list",

  // Default verbosity
  verbosity: "normal",

  // Concurrency (undefined = unlimited)
  maxConcurrency: undefined,

  // Stop after N failures (undefined = continue all)
  maxFailures: undefined,

  // Default filters
  selectors: ["tag:smoke"],
  excludeSelectors: ["tag:slow"],

  // Default step options
  stepOptions: {
    timeout: 30000,
    retry: { maxAttempts: 1, backoff: "linear" },
  },
} satisfies ProbitasConfig;
```

## Environment Variables

- `NO_COLOR` - Disable colored output
- `PROBITAS_CONFIG` - Path to config file

## Selector Syntax

Selectors filter scenarios by name or tags:

```bash
# By tag
-s tag:api
-s tag:smoke

# By name (exact or partial match)
-s login
-s name:checkout

# Multiple selectors (OR logic)
-s tag:api -s tag:db

# AND logic (comma-separated)
-s tag:api,tag:critical
```

## Common Workflows

**Run smoke tests:**

```bash
probitas run -s tag:smoke
```

**Run all except slow tests:**

```bash
probitas run -x tag:slow
```

**Debug a failing scenario:**

```bash
probitas run -s failing-scenario -d
```

**CI/CD integration:**

```bash
probitas run --reporter tap --fail-fast
```

**Run API tests sequentially:**

```bash
probitas run -s tag:api --sequential
```

## Exit Codes

- `0` - All scenarios passed
- `1` - One or more scenarios failed
- `2` - Error during execution

## Tips

1. **Use tags** to organize scenarios by feature, type, or speed
2. **Start with `--sequential`** when debugging to avoid concurrency issues
3. **Use `--fail-fast`** during development for quick feedback
4. **Use JSON reporter** for integration with other tools
5. **Set up config file** to avoid repeating common options
