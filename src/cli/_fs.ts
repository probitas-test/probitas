/**
 * Filesystem helpers replacing `@std/fs` and `@std/dotenv/load`, which call
 * Deno APIs directly.
 *
 * @module
 * @internal
 */

import { access, readFile } from "node:fs/promises";
import process from "node:process";
import { parse } from "@std/dotenv/parse";

export async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse a dotenv file and export its variables to `process.env`
 *
 * Existing variables are kept, matching `@std/dotenv`'s `load()`.
 */
export async function loadEnvFile(
  path: string,
): Promise<Record<string, string>> {
  const env = parse(await readFile(path, "utf8"));
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
  return env;
}
