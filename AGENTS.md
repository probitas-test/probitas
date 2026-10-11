# Probitas

Scenario-based testing and workflow execution framework.

This repository provides the user-facing Probitas package: the library API
(scenario builder, `Skip`, client re-exports and expectation utilities,
`src/mod.ts` and its subpaths) published to npm as `@probitas-test/probitas` and
to JSR as `@probitas/probitas`, and the CLI (`src/cli.ts`) shipped as a single
binary. The core framework packages (`@probitas-test/builder`,
`@probitas-test/runner`, …) live in
[probitas-packages](https://github.com/probitas-test/probitas-packages).

## How it is built

- **Test first.** Red → green → refactor. Write the failing test before the code
  that makes it pass.
- **Each layer holds one thing.** Put a fact in the one layer that owns it, and
  nowhere else.

  | Layer        | Holds                                                              |
  | ------------ | ------------------------------------------------------------------ |
  | `docs/adr/`  | one decision and why it was made                                   |
  | `docs/spec/` | the behaviour users and other components can rely on               |
  | Tests        | the details that pin the behaviour down: rules, boundaries, tables |
  | Code         | how it is done                                                     |
  | Commits      | why a change was made                                              |
  | Comments     | why it is not done another way                                     |

  Before writing, fixing or reviewing a record, read `docs/adr/README.md`;
  before writing, fixing or reviewing a spec, read `docs/spec/README.md`. Follow
  their writing order.
- **Dependencies are current.** Before adding or bumping one, look up its latest
  release in the registry. Do not copy a version from memory or from another
  repository.
- **The runtime is Bun 1.4+**, pinned in `flake.nix` (nixpkgs lags behind Bun
  releases). Coding, logging and structure conventions live in `.claude/rules/`.

## Quality gate

Run `just ci` inside the Nix dev shell (`nix develop`, or direnv with
`.envrc.sample`) before reporting a change as done. CI runs the same recipe.
`just` with no arguments lists the other recipes (`just probitas run` runs the
CLI from source, `just compile` builds the binary into `out/`).

When touching `package.json` exports or dependencies, run `just jsr-sync` so
`deno.json` stays in step; when `bun.lock` changes, update the node_modules hash
in `nix/probitas.nix` (see
[`.claude/rules/repository.md`](.claude/rules/repository.md)).

## Layout

| Path        | What lives there                                                            |
| ----------- | --------------------------------------------------------------------------- |
| `src/`      | library entry points, client re-exports and the CLI (`src/cli/`)            |
| `scripts/`  | build, compile, release packaging and JSR manifest scripts                  |
| `internal/` | test helpers shared by the unit tests                                       |
| `assets/`   | CLI help texts and templates embedded into the binary                       |
| `probitas/` | example scenarios, also the end-to-end suite (`docker compose up -d` first) |
| `nix/`      | the flake's package, built from source                                      |
| `docs/`     | ADRs and specs                                                              |
| `.github/`  | CI, publish and Homebrew workflows                                          |

## Language

- README, docs and commit messages: English
- Code comments, log and error messages: English

## Commits

[Conventional Commits](https://www.conventionalcommits.org/) with a required
scope:

- `@probitas/probitas` (the package's JSR name) for changes to the package, e.g.
  `feat(@probitas/probitas): add cache command`.
- `*` for repository-wide changes such as tooling, e.g.
  `chore(*): bump dev dependencies`.
- A breaking change is marked with `!` after the scope.

Releases are GitHub Releases whose tag is the version; never bump the version in
`package.json` by hand. The details, and how the version is chosen, are in
[`.claude/rules/repository.md`](.claude/rules/repository.md).
