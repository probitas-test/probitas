# Subprocess Templates

Subprocess entry point templates executed in isolated Deno subprocesses.

## Files

| File               | Description                           |
| ------------------ | ------------------------------------- |
| `run.ts`           | Entry point for `probitas run`        |
| `list.ts`          | Entry point for `probitas list`       |
| `run_protocol.ts`  | Protocol types for run communication  |
| `list_protocol.ts` | Protocol types for list communication |
| `utils.ts`         | Shared utilities (stdin/stdout)       |

## Rules

- **Self-contained**: Only import from within this directory or JSR packages
- **No direct imports**: Use `subprocess_template.ts` to resolve bare specifiers
