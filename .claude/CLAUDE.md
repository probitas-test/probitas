# Probitas

Scenario-based testing and workflow execution framework.

## Quick Reference

- **Runtime**: Deno 2.x
- **Registry**: JSR (`@probitas/*`)
- **Entry point**: `@probitas/probitas` (user-facing API)
- **Example scenarios**: `probitas/*.probitas.ts`

## Commands

```bash
deno task verify      # Run format, lint, type check and tests (USE THIS)
deno task test        # Run tests only
deno task probitas    # Run the CLI (e.g., deno task probitas run)
```

## Documentation

- [Repository Rules](./repository_rules.md) - Project-specific rules and commit
  conventions
- [Deno/TypeScript Rules](./deno_rules.md) - Language-specific conventions
- [Logging Rules](./logging_rules.md) - Logging conventions and levels
- [Development Patterns](./repository_development.md) - Coding conventions and
  practices
- [Package Structure](./repository_structure.md) - Workspace organization
- [Design Philosophy](./repository_design.md) - Architectural decisions
