# Probitas

Scenario-based testing and workflow execution framework for Deno.

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

## Related Documentation

- [Design Philosophy](./design.md) - Architectural decisions and principles
- [Development Patterns](./development.md) - Coding conventions and patterns
- [Package Structure](./structure.md) - Workspace organization and dependencies

## Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/)
with [@deno/bump-workspaces](https://jsr.io/@deno/bump-workspaces) for automatic
version management.

### Version Bump Rules

| Commit Type                                              | Version Bump  | Example                                   |
| -------------------------------------------------------- | ------------- | ----------------------------------------- |
| `feat:`                                                  | minor (0.x.0) | `feat(builder): add retry option`         |
| `fix:`, `perf:`, `docs:`, `refactor:`, `test:`, `chore:` | patch (0.0.x) | `fix(runner): handle timeout errors`      |
| `BREAKING:` or `!` suffix                                | major (x.0.0) | `feat(runner)!: change API signature`     |
| Any type with `/unstable` scope                          | patch (0.0.x) | `feat(runner/unstable): experimental API` |

### Scope Convention

Use package name (without `@probitas/` or `probitas-` prefix) as scope. **Scopes
are required** for `BREAKING`, `feat`, `fix`, `perf`, and `deprecation`.

```bash
# Single package
feat(builder): add retry option to step execution
fix(runner): handle timeout errors correctly

# Multiple packages (comma-separated)
fix(runner,scenario): fix shared type definitions

# All packages (wildcard)
docs(*): update copyright headers
refactor(*): apply new linting rules

# Unstable API (always patch, even for BREAKING)
feat(runner/unstable): experimental parallel execution
BREAKING(runner/unstable): change unstable API signature  # Still patch!
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

---

## STRICT RULES (MUST FOLLOW)

### 1. Git Commit Restriction

**NEVER commit without explicit user permission.**

- Commits are forbidden by default
- Only perform a commit ONCE when the user explicitly grants permission
- After committing, MUST recite this rule:
  > "Reminder: Commits are forbidden by default. I will not commit again unless
  > explicitly permitted."

### 2. Backup Before Destructive Operations

**ALWAYS create a backup before any operation that may lose working tree
state.**

Examples: `git restore`, `git reset`, `git checkout` (with uncommitted changes),
`git stash drop`, file deletion/overwrite of uncommitted work.

### 3. Pre-Completion Verification

BEFORE reporting task completion, run and ensure zero errors/warnings:

```bash
deno task verify
```

### 4. English for Version-Controlled Content

**Use English for ALL content tracked by Git** (code, comments, documentation,
commit messages).

### 5. Worktree Isolation

- **Stay in worktree**: Never leave `.worktrees/{branch}/` during worktree tasks
- **No git stash**: Use backup branches instead (stash is shared across
  worktrees)
