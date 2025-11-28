/**
 * Configuration file loader for Probitas
 *
 * @module
 */

import { parse as parseJsonc } from "@std/jsonc";
import { ensure, is } from "@core/unknownutil";
import type { ProbitasConfig } from "./types.ts";

const isStringArray = is.ArrayOf(is.String);
const isReporter = is.LiteralOneOf(["dot", "list", "json", "tap"] as const);

const isProbitasConfig = is.PartialOf(is.ObjectOf({
  reporter: isReporter,
  includes: isStringArray,
  excludes: isStringArray,
  selectors: isStringArray,
  maxConcurrency: is.Number,
  maxFailures: is.Number,
}));

/**
 * Load Probitas configuration from deno.json/deno.jsonc
 *
 * @param configPath - Path to deno.json or deno.jsonc file
 * @returns Probitas configuration from the "probitas" section
 *
 * @requires --allow-read Permission to read config file
 *
 * @example
 * const config = await loadConfig("/project/deno.json");
 */
export async function loadConfig(
  configPath: string,
): Promise<ProbitasConfig> {
  const content = await Deno.readTextFile(configPath);
  const parsed = ensure(parseJsonc(content), is.Record);
  const probitasSection = parsed.probitas;

  if (probitasSection === undefined) {
    return {};
  }

  return ensure(probitasSection, isProbitasConfig);
}
