# probitas list

List available scenarios.

## Synopsis

```
probitas list [options] [paths...]
```

## Description

The `list` command discovers and displays available scenarios without executing
them. Useful for verifying which scenarios would run with given filters.

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

### Output Options

| Option     | Short | Description                        |
| ---------- | ----- | ---------------------------------- |
| `--json`   |       | Output in JSON format              |
| `--reload` | `-r`  | Reload dependencies before listing |
| `--help`   | `-h`  | Show help                          |

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

## Output Formats

### Default Output

Displays scenarios in a human-readable format:

```
probitas/auth.probitas.ts
  - User Login [smoke, api]
  - User Logout [smoke]

probitas/api.probitas.ts
  - API Health Check [api, critical]
  - API Rate Limiting [api, slow]

Found 4 scenarios in 2 files
```

### JSON Output

With `--json`, outputs machine-readable JSON:

```json
{
  "scenarios": [
    {
      "name": "User Login",
      "file": "probitas/auth.probitas.ts",
      "tags": ["smoke", "api"]
    },
    {
      "name": "User Logout",
      "file": "probitas/auth.probitas.ts",
      "tags": ["smoke"]
    }
  ],
  "summary": {
    "scenarioCount": 2,
    "fileCount": 1
  }
}
```

## Exit Codes

| Code | Meaning            |
| ---- | ------------------ |
| 0    | Success            |
| 2    | Usage/config error |
| 4    | No scenarios found |

## Examples

### Basic Usage

```bash
# List all scenarios
probitas list

# List scenarios in specific directory
probitas list probitas/

# List scenarios in specific file
probitas list auth.probitas.ts
```

### Filtering

```bash
# List smoke tests
probitas list -s tag:smoke

# List API tests except slow ones
probitas list -s "tag:api,!tag:slow"

# List tests matching "login" or "auth"
probitas list -s login -s auth
```

### File Patterns

```bash
# List e2e tests
probitas list --include "e2e/**/*.probitas.ts"

# List tests excluding fixtures
probitas list --exclude "**/fixtures/**"

# Combined patterns
probitas list --include "api/**/*.ts" --exclude "**/*.skip.ts"
```

### JSON Output

```bash
# Output as JSON
probitas list --json

# Save to file
probitas list --json > scenarios.json

# Pipe to jq for processing
probitas list --json | jq '.scenarios[].name'
```

### Verification

```bash
# Verify what would run before executing
probitas list -s tag:smoke
# Then run
probitas run -s tag:smoke

# Check for scenarios matching pattern
probitas list -s "!tag:wip" | wc -l
```

## Use Cases

### Pre-run Verification

Before running tests, verify which scenarios match your filters:

```bash
# Check what smoke tests exist
probitas list -s tag:smoke

# Verify exclusion pattern works
probitas list -s "!tag:slow"
```

### CI/CD Integration

Use JSON output for programmatic access:

```bash
# Count scenarios
probitas list --json | jq '.summary.scenarioCount'

# Get list of scenario names
probitas list --json | jq -r '.scenarios[].name'

# Check if specific scenario exists
probitas list --json | jq -e '.scenarios[] | select(.name == "User Login")'
```

### Documentation Generation

Generate scenario inventory:

```bash
# Export all scenarios with tags
probitas list --json | jq -r '.scenarios[] | "\(.name) [\(.tags | join(", "))]"'
```

## Related

- [Command Reference](../command.md)
- [probitas run](./run.md)
- [probitas init](./init.md)
- [Guide](../guide.md)
