import type { Theme } from "@probitas-test/core/theme";

/**
 * Configuration options for reporter initialization.
 *
 * @example Basic usage
 * ```ts
 * import process from "node:process";
 * import { Writable } from "node:stream";
 * import { ListReporter } from "./list_reporter.ts";
 *
 * const reporter = new ListReporter({
 *   output: Writable.toWeb(process.stdout) as WritableStream<Uint8Array>
 * });
 * void reporter;
 * ```
 *
 * @example Custom output stream (using a buffer)
 * ```ts
 * import { ListReporter } from "./list_reporter.ts";
 * import { Buffer } from "@std/streams";
 *
 * const buffer = new Buffer();
 * const reporter = new ListReporter({
 *   output: buffer.writable
 * });
 * void reporter;
 * ```
 */
export interface ReporterOptions {
  /**
   * Output stream for writing results.
   *
   * @default `Writable.toWeb(process.stderr)`
   */
  readonly output?: WritableStream<Uint8Array>;

  /**
   * Custom theme for styling output.
   *
   * If not provided, uses {@linkcode defaultTheme} (or {@linkcode noColorTheme}
   * if `NO_COLOR` is set).
   */
  readonly theme?: Theme;

  /**
   * Base directory for making paths relative in output.
   *
   * If provided, absolute paths in source locations will be displayed
   * relative to this directory.
   */
  readonly cwd?: string;
}
