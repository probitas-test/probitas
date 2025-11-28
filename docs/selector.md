# Selector Syntax

Probitas selector syntax provides flexible scenario filtering capabilities.

## Basic Syntax

```
[!][type:]value
```

- `!`: Negation operator (optional) - excludes matching scenarios
- `type`: Selector type (optional) - `tag` or `name`
- `value`: Match value (case-insensitive)

## Selector Types

### tag

Match by tag

```bash
probitas run -s "tag:api"      # Scenarios with @api tag
probitas run -s "!tag:slow"    # Scenarios without @slow tag
```

### name

Match by scenario name (default)

```bash
probitas run -s "Login"        # Scenarios with "Login" in name
probitas run -s "!wip"         # Scenarios without "wip" in name
```

## Logical Operations

### OR Condition (Multiple -s flags)

Multiple `-s` options match scenarios that satisfy any selector.

```bash
probitas run -s "tag:smoke" -s "tag:critical"
# @smoke OR @critical
```

### AND Condition (Comma-separated)

Comma-separated selectors within a single option match scenarios that satisfy
all conditions.

```bash
probitas run -s "tag:api,tag:critical"
# @api AND @critical
```

### NOT Condition (! prefix)

The `!` prefix excludes scenarios that match the selector.

```bash
probitas run -s "!tag:slow"
# NOT @slow
```

### Combined Operations

Logical operations can be combined to express complex conditions.

```bash
probitas run -s "tag:api,!tag:slow,User"
# @api AND (NOT @slow) AND (name contains "User")
```

## Usage Examples

### Example 1: Run critical tests only, excluding skip

```bash
probitas run -s "tag:critical,!tag:skip"
```

### Example 2: Multiple tags, excluding slow

```bash
probitas run -s "tag:smoke,!tag:slow" -s "tag:api,!tag:slow"
# (smoke AND NOT slow) OR (api AND NOT slow)
```

### Example 3: Exclude specific directory

```bash
probitas run -s "!file:experimental/"
```

### Example 4: Exclude work-in-progress scenarios

```bash
probitas run -s "!wip" -s "!tag:skip"
# (NOT wip) OR (NOT skip) = all scenarios (including those with wip or skip)
# To exclude both:
probitas run -s "!wip,!tag:skip"
# (NOT wip) AND (NOT skip)
```

## Configuration File Usage

Default selectors can be configured in `deno.json`:

```json
{
  "probitas": {
    "selectors": [
      "!tag:skip",
      "!wip"
    ]
  }
}
```

CLI options take precedence over configuration file.

## Case Insensitivity

Selector matching is case-insensitive:

```bash
# These all match the same scenarios
probitas run -s "Login"
probitas run -s "login"
probitas run -s "LOGIN"
```

## Shell Considerations

The `!` character has special meaning in some shells, so quoting is recommended:

```bash
# Recommended
probitas run -s "!tag:slow"

# May fail in some shells
probitas run -s !tag:slow
```

## File Patterns vs Selectors

Probitas provides two filtering mechanisms that work in sequence:

### 1. File Patterns (`--include` / `--exclude`)

Controls which **files** are discovered and loaded.

```bash
probitas list --include "e2e/**/*.scenario.ts"
probitas run --exclude "**/*.skip.scenario.ts"
```

- Applied during file discovery phase
- Uses glob patterns
- Default include: `**/*.scenario.ts`
- Default exclude: none (config can specify defaults)

### 2. Selectors (`-s` / `--selector`)

Filters loaded **scenarios** by tags, names, or file paths.

```bash
probitas run -s "tag:smoke"
probitas run -s "!tag:slow"
```

- Applied after scenarios are loaded
- Uses selector syntax with `!` negation
- Supports AND (`,`) and OR (multiple `-s`)

### Execution Order

1. **File discovery**: `--include` / `--exclude` determines which files to load
2. **Scenario loading**: Load scenario definitions from discovered files
3. **Selector filtering**: `-s` / `--selector` filters loaded scenarios

### Example: Combining Both

```bash
# Discover files in api/ directory, then filter by smoke tag
probitas run --include "api/**/*.scenario.ts" -s "tag:smoke"

# Exclude skip files, then exclude slow scenarios
probitas run --exclude "**/*.skip.ts" -s "!tag:slow"
```

## Migration

Migrating from the previous `-x/--exclude` option:

**Before**:

```bash
probitas run -s tag:api -x tag:slow
probitas list -x wip
```

**After**:

```bash
probitas run -s "tag:api,!tag:slow"
probitas list -s "!wip"
```
