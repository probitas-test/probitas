# Repository Rules

Project-specific rules for the Probitas repository.

## Pre-Completion Verification

BEFORE reporting task completion, run the quality gate inside the Nix dev shell
and ensure zero errors/warnings:

```bash
just ci
```

`deno.json` (the JSR manifest) is generated from `package.json` when publishing
and never committed; `just jsr-sync` writes it locally.

## Releases

A release is a GitHub Release whose tag is the version (`v2.0.0`). Publishing it
runs `.github/workflows/publish.yml`, which sets that version, attaches the
binaries and `SHA256SUMS`, publishes to npm and JSR, updates the Homebrew
formula, and asks the documentation site to regenerate its API reference (it
opens a pull request there). Never bump the version in `package.json` by hand. A
pre-release Release publishes under npm's `next` dist-tag only.

The flake's package builds the CLI from source (`nix/probitas.nix`), so a
release does not touch it. When `bun.lock` changes, update the node_modules hash
in `nix/probitas.nix`: the `nix-package` CI job fails with the expected value,
or run `nix build .#probitas`.

Updates arrive as pull requests. Dependabot bumps the npm dependencies and the
GitHub Actions, and the Sync Dependabot workflow pushes the new node_modules
hash onto its pull requests. The Update Nix workflow updates `flake.lock` and
the Bun pin in `flake.nix` (`just update-bun`) daily. Both push through the
`UPDATE_TOKEN` secret, a fine-grained personal access token limited to this
repository with read and write access to Contents and Pull requests, registered
as both an Actions and a Dependabot secret. Pull requests and pushes made with
`GITHUB_TOKEN` leave the Test workflow waiting for approval.

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
