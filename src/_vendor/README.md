# Vendored modules

Copies of JSR-only modules (MIT, see the `LICENSE` in each directory) that
`src/mod.ts` re-exports to users. They are vendored because these packages are
published only on JSR, and depending on them through the `@jsr` npm mirror
would make `@probitas-test/probitas` uninstallable from npm without extra
registry configuration.

| Directory             | Source                                                         | Version |
| --------------------- | -------------------------------------------------------------- | ------- |
| `std_testing`         | [`@std/testing`](https://jsr.io/@std/testing) (`mock`, `time`) | 1.0.21  |
| `core_errorutil`      | [`@core/errorutil`](https://jsr.io/@core/errorutil)            | 1.2.1   |
| `core_unknownutil`    | [`@core/unknownutil`](https://jsr.io/@core/unknownutil)        | 4.3.0   |
| `std_assert`          | [`@std/assert`](https://jsr.io/@std/assert)                    | 1.0.19  |
| `std_async`           | [`@std/async`](https://jsr.io/@std/async)                      | 1.5.1   |
| `std_data-structures` | [`@std/data-structures`](https://jsr.io/@std/data-structures)  | 1.1.3   |
| `std_internal`        | [`@std/internal`](https://jsr.io/@std/internal)                | 1.0.14  |

Only the modules reachable from the entry points below are copied; import
specifiers are rewritten to relative paths, and files that use V8-only typings
(`Error.captureStackTrace`, absent from Deno's types) get `@ts-nocheck`; nothing
else is changed. Do not edit these files by hand. To update, bump the dev
dependencies and run from the repository root:

```sh
rm -rf src/_vendor/*_*
bun scripts/vendor_jsr.ts . src/_vendor @std/testing/mock @std/testing/time @core/errorutil \
  --nocheck core_errorutil/unimplemented.ts \
  --nocheck core_errorutil/unreachable.ts
```

then copy each package's `LICENSE` into its directory and update the table.
