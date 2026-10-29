# Run `nix develop` (or use direnv) first so every tool is on PATH.

set shell := ["bash", "-euo", "pipefail", "-c"]

# List the recipes.
default:
    @just --list

# Install the dependencies bun.lock pins.
install:
    bun install --frozen-lockfile

# Format every source.
fmt:
    bun run fmt
    nixfmt $(git ls-files '*.nix')

# Check formatting without changing files.
fmt-check:
    bun run fmt:check
    nixfmt --check $(git ls-files '*.nix')

# Lint the sources.
lint:
    bun run lint

# Type-check the sources.
typecheck:
    bun run check

# Regenerate deno.json (the JSR manifest) from package.json.
jsr-sync:
    bun run jsr:sync

# Check that deno.json is in step with package.json.
jsr-check:
    bun scripts/sync_jsr.ts --check

# Pin flake.nix to Bun's latest release.
update-bun:
    bun scripts/update_bun.ts

# Build the library for npm into dist/.
build:
    bun run build

# Build the single binary into out/.
[positional-arguments]
compile *args:
    bun run compile "$@"

# Package the release archives and SHA256SUMS (see scripts/package_release.ts).
[positional-arguments]
package *args:
    bun run package "$@"

# Run the tests.
[positional-arguments]
test *args:
    bun run test "$@"

# Run the tests and write an lcov report into .coverage/.
coverage:
    bun run test --coverage --coverage-reporter=lcov --coverage-dir=.coverage

# Run the CLI from source (e.g. `just probitas run`).
[positional-arguments]
probitas *args:
    bun run probitas "$@"

# Everything CI checks.
ci: install fmt-check lint typecheck jsr-check build coverage
