# Command Reference

Command-line interface for Probitas.

## Installation

```bash
deno install -gAf -n probitas jsr:@probitas/cli
```

To update: `deno install -gAfr -n probitas jsr:@probitas/cli`

## Commands

| Command                     | Description              |
| --------------------------- | ------------------------ |
| [`run`](./command/run.md)   | Execute scenarios        |
| [`list`](./command/list.md) | List available scenarios |
| [`init`](./command/init.md) | Initialize project       |

## Selector Syntax

Used by `run` and `list` commands.

```
[!][type:]value
```

| Component | Description                       |
| --------- | --------------------------------- |
| `!`       | Negation (exclude matching)       |
| `type:`   | `tag:` or `name:` (default: name) |
| `value`   | Match value (case-insensitive)    |

**Logic:**

- Multiple `-s` flags: OR
- Comma in selector: AND
- `!` prefix: NOT

**Examples:**

```bash
-s tag:smoke                  # Has smoke tag
-s login                      # Name contains "login"
-s "!tag:slow"                # NOT slow tag
-s "tag:api,!tag:flaky"       # api AND NOT flaky
-s tag:api -s tag:db          # api OR db
```

## File Discovery

**Default pattern:** `**/*.probitas.ts`

**Priority:**

1. Explicit file paths (direct)
2. `--include` / `--exclude` options
3. Config file `includes` / `excludes`
4. Default pattern

## Configuration

In `deno.json` or `deno.jsonc`:

```json
{
  "probitas": {
    "includes": ["probitas/**/*.probitas.ts"],
    "excludes": [],
    "reporter": "list",
    "maxConcurrency": 4,
    "maxFailures": 0,
    "selectors": ["!tag:wip"]
  }
}
```

CLI options override configuration.

## Environment Variables

| Variable          | Description            |
| ----------------- | ---------------------- |
| `NO_COLOR`        | Disable colored output |
| `PROBITAS_CONFIG` | Config file path       |

## Exit Codes

| Code | Meaning              |
| ---- | -------------------- |
| 0    | All scenarios passed |
| 1    | One or more failed   |
| 2    | Usage/config error   |
| 4    | No scenarios found   |

## Execution Model

Probitas runs scenarios in a subprocess with:

- Merged import map (user's imports + probitas dependencies)
- Automatic temporary config cleanup

Probitas dependencies override user's to ensure correct resolution.

## Related

- [Guide](./guide.md) - Usage examples
- [Architecture](./develop/architecture.md) - Design overview
