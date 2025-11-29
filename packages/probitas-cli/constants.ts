/**
 * CLI exit codes
 *
 * @module
 */

/**
 * Exit code constants for CLI commands
 */
export const EXIT_CODE = {
  /** All scenarios succeeded */
  SUCCESS: 0,

  /** One or more scenarios failed */
  FAILURE: 1,

  /** CLI usage error (invalid options, file conflicts, etc.) */
  USAGE_ERROR: 2,

  /** Scenario files not found */
  NOT_FOUND: 4,
} as const;

export type ExitCode = typeof EXIT_CODE[keyof typeof EXIT_CODE];
