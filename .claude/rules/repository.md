# Repository Rules

Project-specific rules for the Probitas repository.

## Pre-Completion Verification

BEFORE reporting task completion, run and ensure zero errors/warnings:

```bash
bun run verify
```

When touching `package.json` exports or dependencies, also run
`bun run jsr:sync` so `deno.json` stays in step (CI checks it).

## Releases

A release is a GitHub Release whose tag is the version (`v2.0.0`). Publishing it
runs `.github/workflows/publish.yml`, which sets that version, attaches the
binaries and `SHA256SUMS`, publishes to npm and JSR, updates the Homebrew
formula and opens a pull request pointing the Nix package (`nix/release.json`)
at the new binaries. Never bump the version in `package.json` by hand. A
pre-release Release publishes under npm's `next` dist-tag only.

Choose the version from the changes since the previous release, following
semantic versioning: breaking (`!`) is major, `feat` is minor, anything else is
patch.

## Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/).

### Scope Convention

Use `@probitas/probitas` (the package's JSR name) as scope. **Scopes are
required**. Use `(*)` for repository-wide changes such as tooling.

```bash
feat(@probitas/probitas): add cache command
fix(@probitas/probitas): handle timeout errors correctly
chore(*): bump dev dependencies
```
