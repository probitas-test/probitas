/**
 * Serve release archives the way GitHub Releases does, for testing install.sh
 *
 * Usage: bun scripts/serve_release_mirror.ts <dir> <version> [port]
 *
 * Point `PROBITAS_RELEASE_BASE_URL` at `http://127.0.0.1:<port>`:
 *
 * - `/latest` redirects to `/tag/v<version>`
 * - `/download/v<version>/<file>` serves `<dir>/<file>`
 *
 * @module
 */

import { join } from "node:path";
import process from "node:process";

const [dir, version, port = "18765"] = process.argv.slice(2);
if (!dir || !version) {
  console.error(
    "usage: bun scripts/serve_release_mirror.ts <dir> <version> [port]",
  );
  process.exit(1);
}

const tag = `/tag/v${version}`;
const downloads = `/download/v${version}/`;
Bun.serve({
  port: Number(port),
  hostname: "127.0.0.1",
  async fetch(req) {
    const { pathname } = new URL(req.url);
    if (pathname === "/latest") {
      return Response.redirect(new URL(tag, req.url).toString(), 302);
    }
    if (pathname === tag) return new Response("ok");
    if (pathname.startsWith(downloads)) {
      const name = pathname.slice(downloads.length);
      const file = Bun.file(join(dir, name));
      if (!name.includes("/") && await file.exists()) return new Response(file);
    }
    return new Response("not found", { status: 404 });
  },
});
console.log(`serving ${dir} as v${version} on http://127.0.0.1:${port}`);
