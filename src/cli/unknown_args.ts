/**
 * Unknown CLI arguments detection and hint generation
 *
 * @module
 */

import { closestString } from "@std/text/closest-string";
import { levenshteinDistance } from "@std/text/levenshtein-distance";

/**
 * Maximum Levenshtein distance for suggesting similar options
 */
const MAX_SUGGESTION_DISTANCE = 3;

/**
 * Represents an unknown argument detected during parsing
 */
export interface UnknownArg {
  /** The full argument string (e.g., "--tag" or "--tag=foo") */
  arg: string;
  /** The option name without dashes (e.g., "tag") */
  key: string;
  /** The value if provided with = (e.g., "foo" for "--tag=foo") */
  value: unknown;
}

/**
 * Configuration for the unknown argument handler
 */
export interface UnknownArgHandlerOptions {
  /** List of known option names (without dashes) */
  knownOptions: readonly string[];
  /** The command name for help text (e.g., "run" or "list") */
  commandName: string;
}

/**
 * Result from unknown argument collection
 */
export interface UnknownArgResult {
  /** List of unknown arguments detected */
  unknownArgs: UnknownArg[];
  /** Whether any unknown arguments were found */
  hasErrors: boolean;
}

/**
 * Creates a handler for detecting unknown arguments in parseArgs
 *
 * The returned object contains:
 * - `handler`: The callback to pass to parseArgs `unknown` option
 * - `result`: The collection of unknown arguments after parsing
 *
 * @example Usage with parseArgs
 * ```ts
 * import { parseArgs } from "@std/cli";
 * import { createUnknownArgHandler, formatUnknownArgError } from "./unknown_args.ts";
 *
 * const knownOptions = ["help", "verbose", "selector"];
 * const { handler, result } = createUnknownArgHandler({
 *   knownOptions,
 *   commandName: "run",
 * });
 *
 * const args = ["--unknown", "--help"];
 * const parsed = parseArgs(args, {
 *   boolean: ["help"],
 *   unknown: handler,
 * });
 *
 * if (result.hasErrors) {
 *   for (const unknown of result.unknownArgs) {
 *     console.error(formatUnknownArgError(unknown, {
 *       knownOptions,
 *       commandName: "run",
 *     }));
 *   }
 * }
 * ```
 */
export function createUnknownArgHandler(
  _options: UnknownArgHandlerOptions,
): {
  handler: (arg: string, key?: string, value?: unknown) => boolean;
  result: UnknownArgResult;
} {
  const result: UnknownArgResult = {
    unknownArgs: [],
    hasErrors: false,
  };

  const handler = (arg: string, key?: string, value?: unknown): boolean => {
    // Only handle option arguments (starting with -)
    if (!arg.startsWith("-")) {
      return true; // Allow positional arguments
    }

    // key is undefined for malformed arguments, extract from arg
    const actualKey = key ?? extractKeyFromArg(arg);

    result.unknownArgs.push({
      arg,
      key: actualKey,
      value,
    });
    result.hasErrors = true;

    // Return false to exclude from parse result
    return false;
  };

  return { handler, result };
}

/**
 * Extracts the option key from an argument string
 */
function extractKeyFromArg(arg: string): string {
  // Handle --option=value or --option
  const match = arg.match(/^--?([^=]+)/);
  return match?.[1] ?? arg;
}

/**
 * Generates a contextual hint for an unknown argument
 *
 * Provides helpful suggestions for common mistakes like:
 * - --tag → suggests -s 'tag:<value>'
 * - --name → suggests -s 'name:<value>'
 * - --filter → suggests -s '<value>'
 * - Typos → suggests closest known option
 */
export function generateHint(
  unknown: UnknownArg,
  options: UnknownArgHandlerOptions,
): string {
  const { key, value } = unknown;
  const { knownOptions, commandName } = options;

  // Check for tag/tags pattern
  if (key === "tag" || key === "tags") {
    const tagValue = value ?? "<value>";
    return `Did you mean '-s "tag:${tagValue}"'? Use the selector option to filter by tag.`;
  }

  // Check for name/names pattern
  if (key === "name" || key === "names") {
    const nameValue = value ?? "<value>";
    return `Did you mean '-s "name:${nameValue}"'? Use the selector option to filter by name.`;
  }

  // Check for filter-like options
  if (key === "filter" || key === "select" || key === "match") {
    const filterValue = value ?? "<value>";
    return `Did you mean '-s "${filterValue}"'? Use the selector option to filter scenarios.`;
  }

  // Check for similar options using Levenshtein distance
  const similar = findSimilarOption(key, knownOptions);
  if (similar) {
    return `Did you mean '--${similar}'?`;
  }

  // Fallback to generic help message
  return `Run 'probitas ${commandName} --help' for available options.`;
}

/**
 * Finds a similar known option using Levenshtein distance
 *
 * Returns the closest match if within MAX_SUGGESTION_DISTANCE, otherwise undefined.
 * This is the same approach used by Cliffy for production-quality suggestions.
 */
export function findSimilarOption(
  unknown: string,
  knownOptions: readonly string[],
): string | undefined {
  if (knownOptions.length === 0) {
    return undefined;
  }

  // Use closestString from @std/text (same as Cliffy)
  const closest = closestString(unknown, knownOptions as string[]);

  // Only suggest if within threshold
  const distance = levenshteinDistance(unknown, closest);
  if (distance <= MAX_SUGGESTION_DISTANCE) {
    return closest;
  }

  return undefined;
}

/**
 * Formats an error message for an unknown argument
 */
export function formatUnknownArgError(
  unknown: UnknownArg,
  options: UnknownArgHandlerOptions,
): string {
  const hint = generateHint(unknown, options);
  return `Unknown option: ${unknown.arg}\n${hint}`;
}

/**
 * Extracts all known options from parseArgs configuration
 *
 * Combines string options, boolean options, and their aliases.
 * Also handles --no-* variants for boolean options.
 */
export function extractKnownOptions(config: {
  string?: readonly string[];
  boolean?: readonly string[];
  alias?: Record<string, string | string[]>;
}): string[] {
  const known = new Set<string>();

  // Add string options
  for (const opt of config.string ?? []) {
    known.add(opt);
  }

  // Add boolean options and their --no-* variants
  for (const opt of config.boolean ?? []) {
    known.add(opt);
    // Boolean options also accept --no-<option> form
    if (!opt.startsWith("no-")) {
      known.add(`no-${opt}`);
    }
  }

  // Add aliases
  for (const [alias, target] of Object.entries(config.alias ?? {})) {
    known.add(alias);
    if (typeof target === "string") {
      known.add(target);
    } else {
      for (const t of target) {
        known.add(t);
      }
    }
  }

  return [...known];
}
