import type { Theme } from "./theme.ts";

/**
 * Configuration options for reporter initialization.
 *
 * @example Basic usage
 * ```ts
 * const reporter = new ListReporter({
 *   output: Deno.stdout.writable
 * });
 * ```
 *
 * @example Custom output stream
 * ```ts
 * const file = await Deno.open("results.txt", { write: true });
 * const reporter = new ListReporter({
 *   output: file.writable
 * });
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
}
