/**
 * Shared formatting utilities for reporters
 *
 * Contains common formatting functions used by reporters to render
 * step results, error details, and summary statistics.
 *
 * @module
 */

import type { ScenarioMetadata, StepMetadata } from "@probitas/core";
import { formatOrigin, type Origin } from "@probitas/core/origin";
import type { RunResult, StepResult } from "@probitas/runner";
import { isExpectationError } from "@probitas/expect";
import type { Theme, ThemeFunction } from "@probitas/core/theme";

/**
 * Context for formatting operations
 */
export interface FormatContext {
  readonly theme: Theme;
  readonly cwd?: string;
}

/**
 * Format step origin location as dimmed parenthesized string
 */
export function formatStepOrigin(ctx: FormatContext, origin?: Origin): string {
  return ctx.theme.dim(formatOrigin(origin, {
    prefix: "(",
    suffix: ")",
    cwd: ctx.cwd,
  }));
}

/**
 * Format step execution time as bracketed info-colored string
 */
export function formatStepTime(ctx: FormatContext, duration: number): string {
  return ctx.theme.info(`[${duration.toFixed(3)}ms]`);
}

/**
 * Get character representation for step kind
 */
export function getKindChar(kind: "resource" | "setup" | "step"): string {
  switch (kind) {
    case "resource":
      return "r";
    case "setup":
      return "s";
    case "step":
      return "T";
    default:
      return "T";
  }
}

/**
 * Format kind prefix (e.g., "T┆")
 */
export function formatKindPrefix(
  ctx: FormatContext,
  kind: "resource" | "setup" | "step",
): string {
  const kindChar = getKindChar(kind);
  return `${ctx.theme.dim(kindChar + "┆")}`;
}

/**
 * Format status icon for a step result
 */
export function formatStatusIcon(
  ctx: FormatContext,
  status: "passed" | "failed" | "skipped",
): string {
  switch (status) {
    case "passed":
      return ctx.theme.success("✓");
    case "failed":
      return ctx.theme.failure("✗");
    case "skipped":
      return ctx.theme.skip("⊘");
  }
}

/**
 * Get human-readable error message from an error value
 *
 * ExpectationError messages are returned as-is (already styled).
 * Other errors include the error name prefix.
 */
export function getErrorMessage(err: unknown): string {
  // ExpectationError: use message directly (already styled)
  if (isExpectationError(err)) {
    return (err as Error).message;
  }
  // Other errors: include error name prefix
  if (err instanceof Error) {
    if (err.message) {
      return `${err.name}: ${err.message}`;
    }
    if (err.cause) {
      return `${err.name}: ${getErrorMessage(err.cause)}`;
    }
    return err.name;
  }
  return String(err);
}

/**
 * Format error line with kind prefix gutter and color
 */
export function formatErrorLine(
  ctx: FormatContext,
  message: string,
  color: ThemeFunction,
): string {
  return `${ctx.theme.dim(" ┆")}${color(" └ " + message)}`;
}

/**
 * Format step end output lines
 *
 * Returns the lines for a step result, including error/skip messages.
 */
export function formatStepEndLines(
  ctx: FormatContext,
  scenario: ScenarioMetadata,
  step: StepMetadata,
  result: StepResult,
): string[] {
  const kind = step.kind as "resource" | "setup" | "step";
  const kindPrefix = formatKindPrefix(ctx, kind);
  const icon = formatStatusIcon(ctx, result.status);
  const source = formatStepOrigin(ctx, result.metadata.origin);
  const time = formatStepTime(ctx, result.duration);

  // Format scenario and step names based on kind
  const scenarioName = kind === "step"
    ? scenario.name
    : `${ctx.theme.title(ctx.theme.lightGray(scenario.name))}`;
  const stepName = kind === "step"
    ? result.metadata.name
    : `${ctx.theme.title(ctx.theme.lightGray(result.metadata.name))}`;

  const lines: string[] = [];

  lines.push(
    `${kindPrefix} ${icon} ${scenarioName} ${
      ctx.theme.dim(">")
    } ${stepName} ${source} ${time}`,
  );

  // Add error or skip message on next line if needed
  if (result.status === "failed" && "error" in result && result.error) {
    const errorMessage = getErrorMessage(result.error)
      .split("\n")
      .at(0) ?? "No error message";
    // ExpectationError is already styled, other errors need failure color
    const styledMessage = isExpectationError(result.error)
      ? errorMessage
      : ctx.theme.failure(errorMessage);
    lines.push(formatErrorLine(ctx, styledMessage, (s) => s));
  } else if (
    result.status === "skipped" && "error" in result && result.error
  ) {
    const skipMessage = getErrorMessage(result.error)
      .split("\n")
      .at(0) ?? "Skipped";
    lines.push(formatErrorLine(ctx, skipMessage, ctx.theme.skip));
  }

  return lines;
}

/**
 * Format Failed Tests section lines
 *
 * Returns empty array if there are no failures.
 * Includes the section title and detailed error information
 * with stack traces for each failed step.
 */
export function formatFailedTestsLines(
  ctx: FormatContext,
  result: RunResult,
): string[] {
  const { failed, scenarios: resultScenarios } = result;

  if (failed === 0) {
    return [];
  }

  const lines: string[] = [];
  lines.push("");
  lines.push(ctx.theme.title("Failed Tests"));

  const failedScenarios = resultScenarios.filter((s) => s.status === "failed");

  for (const scenario of failedScenarios) {
    // Show failed steps
    const failedSteps = scenario.steps.filter((s) => s.status === "failed");
    for (const step of failedSteps) {
      // Use the kind from the step metadata
      const kind = step.metadata.kind ?? "step";
      const kindPrefix = formatKindPrefix(
        ctx,
        kind as "resource" | "setup" | "step",
      );

      const source = formatStepOrigin(ctx, step.metadata.origin);
      const time = formatStepTime(ctx, step.duration);
      const icon = ctx.theme.failure("✗");

      lines.push(
        `${kindPrefix} ${icon} ${scenario.metadata.name} ${
          ctx.theme.dim(">")
        } ${step.metadata.name} ${source} ${time}`,
      );

      // Show error details for failed steps
      if (step.status === "failed" && "error" in step && step.error) {
        lines.push(`${ctx.theme.dim(" ┆")}`);
        const message = getErrorMessage(step.error);
        const isExpErr = isExpectationError(step.error);

        // Format error message lines
        for (const line of message.split("\n")) {
          // ExpectationError is already styled, other errors need failure color
          const styledLine = isExpErr
            ? `   ${line}`
            : ctx.theme.failure(`   ${line}`);
          lines.push(
            `${ctx.theme.dim(" ┆")}${styledLine}`,
          );
        }

        // Add stack trace section
        if (step.error instanceof Error && step.error.stack) {
          // Extract only "at ..." lines from stack (excludes message and Context)
          const stackLines = step.error.stack.split("\n")
            .filter((line) => line.trimStart().startsWith("at "));
          if (stackLines.length > 0) {
            lines.push(`${ctx.theme.dim(" ┆")}`);
            // Stack trace title (bold)
            lines.push(
              `${ctx.theme.dim(" ┆")}   ${ctx.theme.title("Stack trace")}`,
            );
            lines.push(`${ctx.theme.dim(" ┆")}`);
            // Stack trace body (dim, 2-space indent from title)
            for (const line of stackLines) {
              lines.push(
                `${ctx.theme.dim(" ┆")}     ${ctx.theme.dim(line.trim())}`,
              );
            }
          }
        }
        // Add empty line after each failed step in Failed Tests section
        lines.push("");
      }
    }
  }

  // Remove trailing empty line if present
  if (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  return lines;
}

/**
 * Format Summary section lines
 *
 * Always returns a non-empty array with the summary statistics.
 */
export function formatSummaryLines(
  ctx: FormatContext,
  result: RunResult,
): string[] {
  const { passed, skipped, failed, total, duration } = result;

  const lines: string[] = [];
  lines.push("");
  lines.push(ctx.theme.title("Summary"));
  lines.push(
    `  ${ctx.theme.success("✓")} ${passed} scenarios passed`,
  );

  if (skipped > 0) {
    lines.push(
      `  ${ctx.theme.skip("⊘")} ${skipped} scenarios skipped`,
    );
  }

  if (failed > 0) {
    lines.push(
      `  ${ctx.theme.failure("✗")} ${failed} scenarios failed`,
    );
  }

  lines.push("");
  lines.push(
    `${total} scenarios total ${ctx.theme.info(`[${duration.toFixed(3)}ms]`)}`,
  );

  return lines;
}
