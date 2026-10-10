# Migrating from Probitas 1.x (Deno) to 2.x

Probitas 2 runs on Bun and ships as a single `probitas` binary. Deno is no
longer needed to run scenarios, and most scenarios run unchanged. This guide
lists what does change.

Probitas 1.x keeps working if you are not ready to move: pin it with
`PROBITAS_VERSION=1.0.0` for `install.sh`, or `probitas-test/setup-probitas@v1`
in GitHub Actions. It no longer receives updates.

## Installation

The binary is downloaded from the GitHub Release; nothing else is required.

```bash
curl -fsSL https://raw.githubusercontent.com/probitas-test/probitas/main/install.sh | sh
```

- The binary is installed to `~/.local/bin` by default (1.x used `~/.deno/bin`).
  `PROBITAS_INSTALL_DIR` still names the installation root, and the binary goes
  to `$PROBITAS_INSTALL_DIR/bin`.
- Supported platforms: macOS (arm64, x64), Linux with glibc (x64, arm64) and
  Windows (x64, download the `.zip` from the release). musl-based Linux such as
  Alpine is not supported yet.
- Homebrew (`brew install probitas-test/tap/probitas`) and
  `probitas-test/setup-probitas@v2` install the binary as well.

## Scenarios

### Probitas imports keep working

Scenarios run against the copy of Probitas embedded in the binary, so they need
no install step. The 1.x specifiers still resolve:

```ts
import { client, expect, scenario } from "jsr:@probitas/probitas@^0"; // still works
```

The 2.x name is the npm package, which also gives you editor support (see
[Editor support](#editor-support)):

```ts
import { client, expect, scenario } from "@probitas-test/probitas";
```

### Other dependencies need a package.json

Only Probitas itself is embedded. Third-party modules must be installed next to
your scenarios and imported by their bare name; `npm:` and `jsr:` specifiers for
other packages are not resolved.

| 1.x                                              | 2.x                                                             |
| ------------------------------------------------ | --------------------------------------------------------------- |
| `import ms from "npm:ms@2"`                      | `npm install ms`, then `import ms from "ms"`                    |
| `import { assertEquals } from "jsr:@std/assert"` | `npx jsr add @std/assert`, then `import ... from "@std/assert"` |

### No `Deno` global

Scenarios run on Bun, so `Deno.*` APIs are unavailable. Use the Node.js
equivalents, which Bun implements:

| 1.x                       | 2.x                                              |
| ------------------------- | ------------------------------------------------ |
| `Deno.env.get("API_URL")` | `process.env.API_URL`                            |
| `Deno.readTextFile(path)` | `readFile(path, "utf8")` from `node:fs/promises` |
| `Deno.connect({ port })`  | `createConnection({ port })` from `node:net`     |
| `Deno.cwd()`              | `process.cwd()`                                  |

### Removed: Deno KV client

`client.denoKv` (and `@probitas/client-deno-kv`) is gone, since Deno KV only
exists inside the Deno runtime.

## Editor support

1.x relied on the Deno language server. In 2.x, run `probitas init` (or copy
what it generates into an existing project): it writes a `package.json` that
pins `@probitas-test/probitas` to the binary's version and a `tsconfig.json`.
Install with your package manager (`npm install`, `bun install`, ...) and any
TypeScript-aware editor provides completion, type checking and hover
documentation.

## Commands

| 1.x                         | 2.x                                                                    |
| --------------------------- | ---------------------------------------------------------------------- |
| `probitas fmt`              | Removed. Use your formatter (dprint, Prettier, Biome, `deno fmt`, ...) |
| `probitas lint`             | Removed. Use your linter                                               |
| `probitas check`            | Runs the project's `tsgo` or `tsc` (falling back to one on `PATH`)     |
| `probitas cache`            | Now `probitas cache duckdb`: pre-fetches the DuckDB native binding     |
| `--deno-*`, `-r`/`--reload` | Removed                                                                |

`run`, `list` and `init` keep their options, and configuration files
(`probitas.json`, `probitas.jsonc`) are unchanged.

## DuckDB

The DuckDB native binding is not embedded (it would add about 110MB). The first
scenario that creates a DuckDB client downloads it from the npm registry,
verifies it and caches it per version and platform. For CI images or offline
machines, run `probitas cache duckdb` ahead of time, or point
`PROBITAS_DUCKDB_DIR` at an extracted binding.
