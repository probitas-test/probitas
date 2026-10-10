# Repository Rules

Project-specific rules for the Probitas repository.

## Pre-Completion Verification

BEFORE reporting task completion, run and ensure zero errors/warnings:

```bash
bun run verify
```

When touching `package.json` exports or dependencies, also run
`bun run jsr:sync` so `deno.json` stays in step (CI checks it).

## Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/).
The release tooling that turns them into version bumps is being replaced (the
previous one, `@deno/bump-workspaces`, required Deno); until then, keep writing
messages as below.

### Version Bump Rules

| Commit Type                                              | Version Bump  | Example                                               |
| -------------------------------------------------------- | ------------- | ----------------------------------------------------- |
| `feat:`                                                  | minor (0.x.0) | `feat(@probitas/probitas): add cache command`         |
| `fix:`, `perf:`, `docs:`, `refactor:`, `test:`, `chore:` | patch (0.0.x) | `fix(@probitas/probitas): handle timeout errors`      |
| `BREAKING:` or `!` suffix                                | major (x.0.0) | `feat(@probitas/probitas)!: change CLI options`       |
| Any type with `/unstable` scope                          | patch (0.0.x) | `feat(@probitas/probitas/unstable): experimental API` |

### Scope Convention

Use `@probitas/probitas` (the package's JSR name) as scope. **Scopes are
required**. Use `(*)` for repository-wide changes such as tooling.

```bash
feat(@probitas/probitas): add cache command
fix(@probitas/probitas): handle timeout errors correctly
chore(*): bump dev dependencies
```
