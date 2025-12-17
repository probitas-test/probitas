import type { Theme } from "@probitas/core/theme";

/**
 * Configuration options for reporter initialization.
 *
 * @example Basic usage
 * ```ts
 * import { ListReporter } from "@probitas/reporter";
 *
 * const reporter = new ListReporter({
 *   output: Deno.stdout.writable
 * });
 * void reporter;
 * ```
 *
 * @example Custom output stream (using a buffer)
 * ```ts
 * import { ListReporter } from "@probitas/reporter";
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
   * @default Deno.stderr.writable
   */
  readonly output?: WritableStream;

  /**
   * Custom theme for styling output.
   *
   * If not provided, uses {@linkcode defaultTheme} (or {@linkcode noColorTheme}
   * if `Deno.noColor` is true).
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
