// Bun resolves `import path from "x.wasm" with { type: "file" }` to a path
// (inside the compiled binary, an embedded one); its typings only cover the
// text-like extensions.
declare module "*.wasm" {
  const path: string;
  export default path;
}
