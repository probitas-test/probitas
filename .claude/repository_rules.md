# Repository Rules

Project-specific rules for the Probitas repository.

## Pre-Completion Verification

BEFORE reporting task completion, run and ensure zero errors/warnings:

```bash
deno task verify
```

## Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/)
with [@deno/bump-workspaces](https://jsr.io/@deno/bump-workspaces) for automatic
version management.

### Version Bump Rules

| Commit Type                                              | Version Bump  | Example                                             |
| -------------------------------------------------------- | ------------- | --------------------------------------------------- |
| `feat:`                                                  | minor (0.x.0) | `feat(@probitas/builder): add retry option`         |
| `fix:`, `perf:`, `docs:`, `refactor:`, `test:`, `chore:` | patch (0.0.x) | `fix(@probitas/runner): handle timeout errors`      |
| `BREAKING:` or `!` suffix                                | major (x.0.0) | `feat(@probitas/runner)!: change API signature`     |
| Any type with `/unstable` scope                          | patch (0.0.x) | `feat(@probitas/runner/unstable): experimental API` |

### Scope Convention

Use full package name with `@probitas/` prefix as scope (e.g.,
`@probitas/expect`). **Scopes are required**.

```bash
# Single package
feat(@probitas/builder): add retry option to step execution
fix(@probitas/runner): handle timeout errors correctly

# Multiple packages (comma-separated)
fix(@probitas/runner,@probitas/core): fix shared type definitions

# All packages (wildcard)
docs(*): update copyright headers
refactor(*): apply new linting rules

# Unstable API (always patch, even for BREAKING)
feat(@probitas/runner/unstable): experimental parallel execution
BREAKING(@probitas/runner/unstable): change unstable API signature  # Still patch!
```

### Important Notes

- **All conventional commit types trigger version bumps** (including `docs:`)
- **Scopes determine affected packages** - bump-workspaces uses commit message
  scopes, not file paths
- Use `(*)` to affect all packages at once
- Use `(scope/unstable)` for unstable API changes (always results in patch)
- Run `deno run -A jsr:@deno/bump-workspaces/cli --dry-run` to preview version
  bumps
- The `bump.yml` workflow creates a PR with version updates when manually
  triggered
