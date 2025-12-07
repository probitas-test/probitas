# probitas init

Initialize a new Probitas project.

## Synopsis

```
probitas init [options]
```

## Description

The `init` command sets up Probitas in your project by:

1. Creating or updating a Deno configuration file (`deno.json` or `deno.jsonc`)
2. Adding Probitas import and configuration section
3. Creating a `probitas/` directory
4. Generating an example scenario file

## Options

| Option      | Short | Description              |
| ----------- | ----- | ------------------------ |
| `--help`    | `-h`  | Show help message        |
| `--force`   | `-f`  | Overwrite existing files |
| `--verbose` | `-v`  | Enable verbose logging   |
| `--quiet`   | `-q`  | Suppress most logging    |
| `--debug`   | `-d`  | Enable debug logging     |

## Generated Structure

```
your-project/
├── deno.json                      # Created or updated
└── probitas/
    └── example.probitas.ts        # Example scenario
```

## Generated Files

### deno.json

When no `deno.json` or `deno.jsonc` exists, creates a new `deno.json`:

```json
{
  "imports": {
    "probitas": "jsr:@probitas/probitas@^0.2.2"
  },
  "probitas": {
    "reporter": "list",
    "includes": [
      "probitas/**/*.probitas.ts"
    ],
    "excludes": [
      "**/node_modules/**",
      "**/.git/**"
    ]
  }
}
```

When a config file already exists, the command merges Probitas configuration
into it:

- Adds `imports.probitas` if not present
- Adds `probitas` section if not present
- Preserves existing configuration and comments

### probitas/example.probitas.ts

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

## Behavior

### Config File Priority

When both `deno.json` and `deno.jsonc` exist, `deno.json` is preferred.

### Comment Preservation

When editing `.jsonc` files, comments are preserved using edit-based
modification (powered by `jsonc-parser`). The command modifies only the
necessary parts of the file, leaving existing comments and formatting intact.

Example - before:

```jsonc
{
  // Project configuration
  "name": "my-app",
  "tasks": {
    "dev": "deno run -A main.ts"
  }
}
```

Example - after `probitas init`:

```jsonc
{
  // Project configuration
  "name": "my-app",
  "tasks": {
    "dev": "deno run -A main.ts"
  },
  "imports": {
    "probitas": "jsr:@probitas/probitas@^0.2.2"
  },
  "probitas": {
    "reporter": "list",
    "includes": [
      "probitas/**/*.probitas.ts"
    ],
    "excludes": [
      "**/node_modules/**",
      "**/.git/**"
    ]
  }
}
```

### Version Detection

The command automatically detects the CLI version and uses it for the import
specifier (e.g., `jsr:@probitas/probitas@^0.2.2`).

### Directory Conflict

If `probitas/` directory already exists, the command skips directory creation
and proceeds with file generation. Existing files are not overwritten unless
`--force` is specified.

## Error Handling

### Output Strategy

Errors are displayed in a user-friendly format:

- **Logger (info level)**: Technical details for debugging (visible with `-v`)
- **Console output**: Clear error message with actionable resolution

### Error Message Format

```
Error: <what went wrong>

  <detailed explanation>

To fix: <actionable command or instruction>
```

### Example Output

When `probitas` section already exists:

```
Error: Probitas is already configured

  Found existing "probitas" section in deno.json.
  Running init again would overwrite your current configuration.

To fix this, either:

  1. Use --force to overwrite:

     $ probitas init --force

  2. Or edit deno.json manually:

     {
       ...
       "imports": {
         ...
         "probitas": "jsr:@probitas/probitas@^0.2.2"
       },
       "probitas": {
         "includes": ["probitas/**/*.probitas.ts"]
       }
     }
```

When `example.probitas.ts` already exists:

```
Error: Example file already exists

  probitas/example.probitas.ts already exists.

To fix: Use --force to overwrite, or delete the file manually.
```

When config file has invalid syntax:

```
Error: Invalid configuration file

  deno.jsonc has a syntax error at line 15, column 3.
  Unexpected token '}', expected property name.

To fix: Fix the syntax error in deno.jsonc and try again.
```

### Error Conditions

| Condition                            | Exit Code | Override  |
| ------------------------------------ | --------- | --------- |
| `probitas` section already exists    | 2         | `--force` |
| `example.probitas.ts` already exists | 2         | `--force` |
| Invalid JSON/JSONC syntax            | 2         | -         |
| Invalid `imports` section            | 2         | -         |

## Exit Codes

| Code | Meaning     |
| ---- | ----------- |
| 0    | Success     |
| 2    | Usage error |

## Examples

Initialize a new project:

```bash
probitas init
```

Overwrite existing configuration:

```bash
probitas init --force
```

## Manual Setup

If you prefer to configure Probitas manually instead of using `probitas init`,
add the following to your `deno.json` or `deno.jsonc`:

### Step 1: Add import

Add `probitas` to the `imports` section:

```jsonc
{
  "imports": {
    // ... your existing imports
    "probitas": "jsr:@probitas/probitas@^0.2.2"
  }
}
```

### Step 2: Add configuration

Add the `probitas` section:

```jsonc
{
  "probitas": {
    "reporter": "list",
    "includes": ["probitas/**/*.probitas.ts"],
    "excludes": ["**/node_modules/**", "**/.git/**"]
  }
}
```

### Step 3: Create scenario directory

```bash
mkdir -p probitas
```

### Step 4: Create your first scenario

Create `probitas/example.probitas.ts`:

```typescript
import { scenario } from "probitas";

export default scenario("My First Scenario")
  .step("Setup", () => {
    return { value: 42 };
  })
  .step("Verify", (ctx) => {
    if (ctx.previous.value !== 42) {
      throw new Error("Unexpected value");
    }
  })
  .build();
```

### Step 5: Run

```bash
probitas run
```

## Related

- [Command Reference](../command.md)
- [Guide](../guide.md)
