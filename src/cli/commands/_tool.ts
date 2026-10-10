/**
 * Shared runner for the commands that hand scenario files to a tool
 *
 * fmt, lint and check discover scenario files the same way run/list do, then
 * either process them in-process or run a tool through the Bun embedded in
 * the CLI: with `BUN_BE_BUN=1` the compiled binary behaves as the `bun` CLI,
 * so `bun check` works without a separate Bun install. From source
 * `process.execPath` already is `bun`, which ignores the variable.
 *
 * @module
 */

import { spawn } from "node:child_process";
import { resolve } from "node:path";
import process from "node:process";
import { parseArgs } from "@std/cli";
import { getLogger, type LogLevel } from "@logtape/logtape";
import { discoverScenarioFiles } from "@probitas-test/discover";
import { EXIT_CODE } from "../constants.ts";
import { findProbitasConfigFile, loadConfig } from "../config.ts";
import { createDiscoveryProgress } from "../progress.ts";
import {
  createUnknownArgHandler,
  extractKnownOptions,
  formatUnknownArgError,
} from "../unknown_args.ts";
import { configureLogging, readAsset } from "../utils.ts";

const logger = getLogger(["probitas", "cli", "tool"]);

export interface ToolContext {
  cwd: string;
  flags: Readonly<Record<string, boolean>>;
  quiet: boolean;
  /** Scenario files to process; undefined (after a warning) when none. */
  discover(): Promise<string[] | undefined>;
}

/** Arguments for the embedded `bun`, and where to run it. */
export interface ToolInvocation {
  args: string[];
  cwd: string;
}

export interface ToolCommandOptions {
  /** Command name, for help and error messages. */
  name: string;
  /** Command-specific boolean flags, besides the common ones. */
  flags?: readonly string[];
  /** What to run, or the exit code when the command finished by itself. */
  plan(context: ToolContext): Promise<ToolInvocation | number>;
  /** Runs the planned invocation; replaced in tests. */
  run?: (invocation: ToolInvocation) => Promise<number>;
}

function runEmbeddedBun(invocation: ToolInvocation): Promise<number> {
  logger.debug("Running embedded bun", { ...invocation });
  return new Promise((resolvePromise) => {
    const child = spawn(process.execPath, invocation.args, {
      cwd: invocation.cwd,
      stdio: "inherit",
      env: { ...process.env, BUN_BE_BUN: "1" },
    });
    child.once("exit", (code) => {
      // Tools exit with their own codes;
      // report any failure as a probitas failure.
      resolvePromise(code === 0 ? EXIT_CODE.SUCCESS : EXIT_CODE.FAILURE);
    });
    child.once("error", (err) => {
      console.error(`Error: failed to start ${process.execPath}: ${err}`);
      resolvePromise(EXIT_CODE.FAILURE);
    });
  });
}

export async function runToolCommand(
  args: string[],
  cwd: string,
  options: ToolCommandOptions,
): Promise<number> {
  try {
    const config = {
      string: ["config", "include", "exclude"],
      boolean: ["help", "quiet", "verbose", "debug", ...(options.flags ?? [])],
      collect: ["include", "exclude"],
      alias: { h: "help", v: "verbose", q: "quiet", d: "debug" },
      default: { include: undefined, exclude: undefined },
    };
    const knownOptions = extractKnownOptions(config);
    const { handler, result } = createUnknownArgHandler({
      knownOptions,
      commandName: options.name,
    });
    const parsed = parseArgs(args, { ...config, unknown: handler });
    if (result.hasErrors) {
      for (const unknown of result.unknownArgs) {
        console.error(
          formatUnknownArgError(unknown, {
            knownOptions,
            commandName: options.name,
          }),
        );
      }
      return EXIT_CODE.USAGE_ERROR;
    }

    if (parsed.help) {
      console.log(await readAsset(`usage-${options.name}.txt`));
      return EXIT_CODE.SUCCESS;
    }

    const logLevel: LogLevel = parsed.debug
      ? "debug"
      : parsed.verbose
      ? "info"
      : parsed.quiet
      ? "fatal"
      : "warning";
    try {
      await configureLogging(logLevel);
    } catch {
      // Logging may already be configured
    }

    const discover = async () => {
      const configPath = typeof parsed.config === "string"
        ? parsed.config
        : await findProbitasConfigFile(cwd, { parentLookup: true });
      const probitasConfig = configPath ? await loadConfig(configPath) : {};
      const paths = parsed._.map(String).map((p) => resolve(cwd, p));
      const progress = parsed.quiet ? null : createDiscoveryProgress();
      const files = await discoverScenarioFiles(paths.length ? paths : [cwd], {
        includes: parsed.include ?? probitasConfig?.includes,
        excludes: parsed.exclude ?? probitasConfig?.excludes,
        onProgress: progress?.onProgress,
      });
      progress?.complete(files.length);
      if (files.length === 0) {
        console.warn("No scenario files found");
        return undefined;
      }
      return files;
    };

    const flags = Object.fromEntries(
      (options.flags ?? []).map((name) => [name, Boolean(parsed[name])]),
    );
    const planned = await options.plan({
      cwd,
      flags,
      quiet: Boolean(parsed.quiet),
      discover,
    });
    if (typeof planned === "number") return planned;
    return await (options.run ?? runEmbeddedBun)(planned);
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${m}`);
    return EXIT_CODE.FAILURE;
  }
}
