// Vendor JSR modules (TypeScript sources from the @jsr npm mirror) into a
// package, following their import graph and rewriting specifiers to relative
// paths.
//
// Usage: bun vendor_jsr.ts <repo-root> <dest-dir> <entry>... [--map spec=replacement]...
//   entry: "@std/expect" or "@std/path/glob-to-regexp" (JSR name[/subpath])
//   --map: replace an import specifier verbatim instead of vendoring it,
//          e.g. --map "jsr:@std/internal@^1.0.14/os=node:os-shim"
//   --nocheck: vendored path (relative to dest) to prefix with @ts-nocheck,
//          for modules that rely on runtime-specific typings (Deno APIs,
//          V8-only members) that not every type checker here provides
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";

const args = process.argv.slice(2);
const [root, dest] = args;
const entries: string[] = [];
const maps = new Map<string, string>();
const nocheck = new Set<string>();
for (let i = 2; i < args.length; i++) {
  if (args[i] === "--nocheck") {
    nocheck.add(args[++i]);
  } else if (args[i] === "--map") {
    const [from, to] = args[++i].split("=");
    maps.set(from, to);
  } else {
    entries.push(args[i]);
  }
}

const nodeModules = join(root, "node_modules");
const store = join(nodeModules, ".bun");

// Find an installed JSR package: the newest version in Bun's isolated store,
// or, with the hoisted linker, node_modules/@jsr/<scope>__<name> or an alias
// directory (e.g. node_modules/@std/testing) whose manifest names it.
function packageDir(scope: string, name: string): string {
  const jsrName = `@jsr/${scope}__${name}`;
  if (existsSync(store)) {
    const prefix = `@jsr+${scope}__${name}@`;
    const candidates = readdirSync(store)
      .filter((d) => d.startsWith(prefix))
      .sort((a, b) =>
        Bun.semver.order(a.slice(prefix.length), b.slice(prefix.length))
      );
    if (candidates.length > 0) {
      return join(store, candidates.at(-1)!, "node_modules", jsrName);
    }
  }
  for (
    const dir of [
      join(nodeModules, jsrName),
      join(nodeModules, `@${scope}`, name),
    ]
  ) {
    const manifest = join(dir, "package.json");
    if (
      existsSync(manifest) &&
      JSON.parse(readFileSync(manifest, "utf8")).name === jsrName
    ) {
      return dir;
    }
  }
  throw new Error(`not installed: @${scope}/${name}`);
}

// Resolve "@scope/name[/sub]" to the package dir and the .ts source file.
function resolveJsr(spec: string): { pkg: string; key: string; file: string } {
  const m = spec.match(/^@jsr\/([^_]+)__([^/]+)(?:\/(.+))?$/) ??
    spec.match(/^(?:jsr:)?@([^/]+)\/([^@/]+)(?:@[^/]+)?(?:\/(.+))?$/);
  if (!m) throw new Error(`cannot parse JSR specifier: ${spec}`);
  const [, scope, name, sub] = m;
  const dir = packageDir(scope, name);
  const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  const exp = manifest.exports[sub ? `./${sub}` : "."];
  if (!exp) throw new Error(`${spec}: no export ${sub ?? "."}`);
  const js = typeof exp === "string" ? exp : exp.default;
  const file = join(dir, js.replace(/\.js$/, ".ts"));
  return { pkg: `${scope}_${name}`, key: dir, file };
}

const pkgOf = new Map<string, string>(); // package dir -> vendored folder name
const queue: string[] = [];
const seen = new Set<string>();
const outPath = (file: string): string => {
  for (const [dir, name] of pkgOf) {
    if (file.startsWith(dir + "/")) {
      return join(dest, name, relative(dir, file));
    }
  }
  throw new Error(`file outside known packages: ${file}`);
};

function enqueue(spec: string): string {
  const { pkg, key, file } = resolveJsr(spec);
  pkgOf.set(key, pkg);
  if (!seen.has(file)) {
    seen.add(file);
    queue.push(file);
  }
  return file;
}

for (const entry of entries) enqueue(entry);

const IMPORT = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(["'])([^"']+)\2/g;

while (queue.length > 0) {
  const file = queue.shift()!;
  const src = readFileSync(file, "utf8");
  // Doc examples live in comments; leave them untouched.
  const code = src.replace(/\/\*[\s\S]*?\*\//g, (c) => " ".repeat(c.length));
  const edits: Array<[number, number, string]> = [];
  for (const m of code.matchAll(IMPORT)) {
    const spec = m[3];
    const start = m.index! + m[1].length + 1;
    const end = start + spec.length;
    let target: string;
    if (maps.has(spec)) {
      edits.push([start, end, maps.get(spec)!]);
      continue;
    } else if (spec.startsWith(".")) {
      target = join(dirname(file), spec).replace(/\.js$/, ".ts");
      if (!existsSync(target)) throw new Error(`${file}: missing ${spec}`);
      if (!seen.has(target)) {
        seen.add(target);
        queue.push(target);
      }
    } else if (/^(jsr:)?@|^@jsr\//.test(spec)) {
      target = enqueue(spec);
    } else {
      continue; // node:, npm packages, etc.
    }
    let rel = relative(dirname(outPath(file)), outPath(target));
    if (!rel.startsWith(".")) rel = `./${rel}`;
    edits.push([start, end, rel]);
  }
  let out = src;
  for (const [s, e, r] of edits.sort((a, b) => b[0] - a[0])) {
    out = out.slice(0, s) + r + out.slice(e);
  }
  const target = outPath(file);
  if (nocheck.has(relative(dest, target))) {
    out =
      `// @ts-nocheck -- relies on runtime-specific typings; checked upstream\n${out}`;
  }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, out);
}

for (const [dir, name] of pkgOf) {
  const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  const count = [...seen].filter((f) => f.startsWith(dir + "/")).length;
  console.log(
    `${name}: ${manifest.homepage ?? ""} ${manifest.version} (${count} files)`,
  );
}
