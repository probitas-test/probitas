/**
 * Source source in a file for error reporting and debugging.
 *
 * Captured automatically when defining scenarios, steps, and setups.
 * Used by reporters to show meaningful stack traces.
 *
 * @example
 * ```ts
 * // Example source object
 * const source: Source = {
 *   file: "/project/tests/auth.probitas.ts",
 *   line: 42
 * };
 * ```
 */
export interface Source {
  /** Absolute file path where the element was defined */
  readonly file: string;

  /** Line number in the file (1-indexed) */
  readonly line?: number;

  /** Column number in the file (1-indexed) */
  readonly column?: number;
}
