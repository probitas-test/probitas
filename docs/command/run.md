# probitas run

Execute scenario files.

## Synopsis

```
probitas run [options] [paths...]
```

## Description

The `run` command discovers and executes scenario files. It supports parallel
execution, filtering by tags/names, and various output formats.

## Arguments

| Argument  | Description                                  |
| --------- | -------------------------------------------- |
| `[paths]` | Scenario files or directories (default: `.`) |

## Options

### Discovery Options

| Option      | Short | Description                  |
| ----------- | ----- | ---------------------------- |
| `--include` |       | Include pattern (repeatable) |
| `--exclude` |       | Exclude pattern (repeatable) |
| `--config`  |       | Path to config file          |

### Filtering Options

| Option       | Short | Description                   |
| ------------ | ----- | ----------------------------- |
| `--selector` | `-s`  | Filter scenarios (repeatable) |

### Execution Options

| Option              | Short | Description                                 |
| ------------------- | ----- | ------------------------------------------- |
| `--max-concurrency` |       | Max parallel scenarios (default: unlimited) |
| `--sequential`      | `-S`  | Run sequentially (`--max-concurrency=1`)    |
| `--max-failures`    |       | Stop after N failures                       |
| `--fail-fast`       | `-f`  | Stop on first failure (`--max-failures=1`)  |
| `--reload`          | `-r`  | Reload dependencies before running          |

### Output Options

| Option       | Short | Description                      |
| ------------ | ----- | -------------------------------- |
| `--reporter` |       | Output format: list/dot/json/tap |
| `--quiet`    | `-q`  | Errors only                      |
| `--verbose`  | `-v`  | Verbose output                   |
| `--debug`    | `-d`  | Debug output                     |
| `--no-color` |       | Disable colors                   |
| `--help`     | `-h`  | Show help                        |

## Selector Syntax

```
[!][type:]value
```

| Component | Description                       |
| --------- | --------------------------------- |
| `!`       | Negation (exclude matching)       |
| `type:`   | `tag:` or `name:` (default: name) |
| `value`   | Match value (case-insensitive)    |

### Selector Logic

- Multiple `-s` flags: **OR** logic
- Comma within selector: **AND** logic
- `!` prefix: **NOT** logic

### Selector Examples

```bash
# By tag
-s tag:smoke                  # Has smoke tag
-s tag:api -s tag:db          # api OR db

# By name
-s login                      # Name contains "login"
-s "User Login"               # Name contains "User Login"

# Negation
-s "!tag:slow"                # NOT slow tag
-s "!wip"                     # NOT matching "wip"

# Combined (AND)
-s "tag:api,!tag:flaky"       # api AND NOT flaky
-s "tag:api,User"             # api tag AND name contains "User"
```

## File Discovery

### Default Pattern

```
**/*.probitas.ts
```

### Priority

1. Explicit file paths (direct)
2. `--include` / `--exclude` options
3. Config file `includes` / `excludes`
4. Default pattern

### Pattern Examples

```bash
# Include patterns
probitas run --include "e2e/**/*.probitas.ts"
probitas run --include "api/**/*.ts" --include "web/**/*.ts"

# Exclude patterns
probitas run --exclude "**/*.skip.probitas.ts"
probitas run --exclude "**/fixtures/**"

# Combined
probitas run --include "api/**/*.ts" --exclude "**/*.skip.ts"
```

## Reporters

| Reporter | Description                                         |
| -------- | --------------------------------------------------- |
| `list`   | Detailed output with step-by-step results (default) |
| `dot`    | Compact dot notation (`.` pass, `F` fail, `S` skip) |
| `json`   | Machine-readable JSON output                        |
| `tap`    | TAP (Test Anything Protocol) format                 |

### Reporter Examples

```bash
probitas run --reporter list    # Detailed (default)
probitas run --reporter dot     # Compact
probitas run --reporter json    # For CI/CD parsing
probitas run --reporter tap     # TAP format
```

## Execution Control

### Concurrency

By default, scenarios run in parallel with no limit.

```bash
# Limit parallelism
probitas run --max-concurrency 4    # Max 4 parallel

# Run sequentially
probitas run --sequential           # One at a time
probitas run -S                     # Short form
```

### Failure Handling

```bash
# Stop after N failures
probitas run --max-failures 3       # Stop after 3 failures

# Stop on first failure
probitas run --fail-fast            # Stop immediately
probitas run -f                     # Short form
```

## Exit Codes

| Code | Meaning              |
| ---- | -------------------- |
| 0    | All scenarios passed |
| 1    | One or more failed   |
| 2    | Usage/config error   |
| 4    | No scenarios found   |

## Environment Variables

| Variable   | Description            |
| ---------- | ---------------------- |
| `NO_COLOR` | Disable colored output |

## Examples

### Basic Usage

```bash
# Run all scenarios in current directory
probitas run

# Run scenarios in specific directory
probitas run probitas/

# Run specific file
probitas run auth.probitas.ts
```

### Filtering

```bash
# Run smoke tests
probitas run -s tag:smoke

# Run API tests except slow ones
probitas run -s "tag:api,!tag:slow"

# Run tests matching "login" or "auth"
probitas run -s login -s auth
```

### CI/CD Integration

```bash
# Quiet mode with fail-fast
probitas run -q --fail-fast

# TAP output for CI
probitas run --reporter tap --no-color

# JSON output for parsing
probitas run --reporter json > results.json
```

### Development

```bash
# Verbose output for debugging
probitas run -v

# Debug mode for maximum detail
probitas run -d

# Reload dependencies
probitas run --reload
```

### Combined Examples

```bash
# Run API smoke tests in parallel (max 4)
probitas run api/ -s tag:smoke --max-concurrency 4

# Run all tests except WIP, stop on first failure
probitas run -s "!tag:wip" --fail-fast

# Run e2e tests with custom reporter
probitas run --include "e2e/**/*.probitas.ts" --reporter dot
```

## Related

- [Command Reference](../command.md)
- [probitas list](./list.md)
- [probitas init](./init.md)
- [Guide](../guide.md)
