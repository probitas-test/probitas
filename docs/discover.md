# File Discovery

Probitas uses a two-phase approach to find and filter scenarios:

1. **File Discovery** - Locate scenario files using paths and patterns
2. **Scenario Loading** - Load and parse scenario definitions from files

## Discovery Process

### Input Types

The file discovery system accepts two types of inputs:

#### 1. Paths (Command-line Arguments)

Direct file or directory paths:

```bash
# Specific file
probitas run test.scenario.ts

# Directory
probitas run api/

# Multiple paths
probitas run api/ e2e/ smoke.scenario.ts
```

**Behavior:**

- **File path** → Returns that file directly
- **Directory path** → Searches within using include patterns
- **Non-existent path** → Skipped (only `NotFound` errors are ignored)

#### 2. Patterns (Options)

Glob patterns for filtering:

```bash
# Include specific patterns
probitas run --include "**/*.test.ts"

# Exclude patterns
probitas run --exclude "**/*.skip.ts"

# Combine both
probitas run api/ --include "**/*.scenario.ts" --exclude "**/*.skip.ts"
```

**Pattern Types:**

- `--include` - Glob patterns for file discovery within directories
- `--exclude` - Glob patterns to exclude files

### Priority Order

```
Paths > --include > config.includes (for directories)
--exclude > config.excludes
```

**Example:**

```bash
# Priority demonstration
probitas run api/                           # Uses api/ directory
probitas run api/ --include "**/*.test.ts"  # Searches *.test.ts in api/
probitas run --include "e2e/**/*.ts"        # Searches e2e/**/*.ts from cwd
probitas run                                # Uses config or default pattern
```

## Default Behavior

When no paths or patterns are specified:

```bash
probitas run
# Equivalent to:
probitas run --include "**/*.scenario.ts"
```

**Default Patterns:**

- Include: `**/*.scenario.ts`
- Exclude: `**/.git/**`, `**/node_modules/**`

## Discovery Algorithm

```typescript
for each path in paths:
  if path is file:
    add to results
  else if path is directory:
    for each include pattern:
      search pattern within directory
      apply exclude patterns
      add matches to results
  else if path not found:
    skip (ignore NotFound errors only)

return sorted unique file paths
```

## Examples

### Basic Usage

```bash
# Current directory with default pattern
probitas run

# Specific directory
probitas run scenarios/

# Multiple directories
probitas run api/ e2e/

# Specific files
probitas run test1.scenario.ts test2.scenario.ts
```

### With Patterns

```bash
# Custom include pattern
probitas run --include "**/*.test.ts"

# Exclude skip files
probitas run --exclude "**/*.skip.ts"

# Directory with custom patterns
probitas run api/ --include "**/*.test.ts" --exclude "**/*.skip.ts"
```

### Configuration File

Define default patterns in `deno.json`:

```json
{
  "probitas": {
    "includes": ["scenarios/**/*.scenario.ts"],
    "excludes": ["**/*.skip.ts", "**/.wip.ts"]
  }
}
```

CLI options override configuration:

```bash
# Uses config patterns
probitas run

# Overrides config includes
probitas run --include "custom/**/*.ts"
```

## File Discovery vs Selectors

File discovery and selectors are complementary but distinct:

### File Discovery (`--include` / `--exclude`)

- **Purpose**: Control which files are loaded
- **Phase**: Before scenario loading
- **Syntax**: Glob patterns
- **Default**: `**/*.scenario.ts`

### Selectors (`-s` / `--selector`)

- **Purpose**: Filter loaded scenarios by metadata
- **Phase**: After scenario loading
- **Syntax**: Selector syntax with `!` negation
- **Examples**: `tag:smoke`, `!tag:slow`, `name:User`

### Execution Order

```
1. File Discovery (--include/--exclude + paths)
   ↓ (file paths)
2. Scenario Loading (loadScenarios)
   ↓ (scenario objects)
3. Selector Filtering (-s/--selector)
   ↓ (filtered scenarios)
4. Execution
```

### Combined Example

```bash
# Discover files in api/ directory
# Exclude skip files
# Then filter scenarios by tag
probitas run api/ \
  --exclude "**/*.skip.ts" \
  -s "tag:smoke,!tag:slow"
```

**Execution:**

1. Discover: Find all `*.scenario.ts` in `api/`, exclude `*.skip.ts`
2. Load: Parse scenario definitions from discovered files
3. Filter: Select scenarios with `smoke` tag but not `slow` tag
4. Run: Execute filtered scenarios

## Error Handling

### NotFound Errors

Silently skipped (path doesn't exist):

```bash
probitas run nonexistent.ts  # No error, just skips
```

### Other Errors

Propagated to user (permission denied, etc.):

```bash
probitas run /root/protected.ts  # Error: Permission denied
```

## Performance Considerations

- File discovery is async and runs in parallel where possible
- Results are deduplicated using Set
- File paths are sorted for deterministic ordering
- Glob patterns use `expandGlob` from `@std/fs`

## Related

- [Selector Syntax](./selector.md) - Scenario filtering after loading
- [CLI Specification](./cli.md) - Command-line interface
- [Loader](./loader.md) - Scenario file loading (if exists)
