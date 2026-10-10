/**
 * Type-check command for Probitas CLI
 *
 * Delegates to the TypeScript compiler installed in the user's project (or on
 * PATH): `tsgo` when available, otherwise `tsc`. With a `tsconfig.json` in the
 * working directory the project's own settings win; without one, the
 * discovered scenario files are checked with options matching how the Bun
 * worker loads them.
 *
 * @module
 */

import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parseArgs } from "@std/cli";
import { getLogger, type LogLevel } from "@logtape/logtape";
import { discoverScenarioFiles } from "@probitas-test/discover";
import { EXIT_CODE } from "../constants.ts";
import { findProbitasConfigFile, loadConfig } from "../config.ts";
import { createDiscoveryProgress } from "../progress.ts";
import { configureLogging, readAsset } from "../utils.ts";

const logger = getLogger(["probitas", "cli", "check"]);

/** Lookups used to locate a type checker; injectable for tests. */
interface ResolveOptions {
  exists: (path: string) => Promise<boolean>;
  which: (command: string) => string | null;
}

const defaultResolveOptions: ResolveOptions = {
  exists: (path) => access(path).then(() => true, () => false),
  which: (command) => Bun.which(command),
};

async function resolveTypeChecker(
  cwd: string,
  options: ResolveOptions = defaultResolveOptions,
): Promise<string | undefined> {
  for (const name of ["tsgo", "tsc"]) {
    const local = join(cwd, "node_modules", ".bin", name);
    if (await options.exists(local)) return local;
  }
  for (const name of ["tsgo", "tsc"]) {
    const found = options.which(name);
    if (found) return found;
  }
  return undefined;
}

function buildTypeCheckArgs(
  options: { tsconfig?: string; files: readonly string[] },
): string[] {
  if (options.tsconfig) {
    return ["-p", options.tsconfig, "--noEmit"];
  }
  return [
    "--noEmit",
    "--strict",
    "--skipLibCheck",
    "--target",
    "ESNext",
    "--module",
    "Preserve",
    "--moduleResolution",
    "bundler",
    "--allowImportingTsExtensions",
    ...options.files,
  ];
}

/** @internal */
export const _internal = { resolveTypeChecker, buildTypeCheckArgs };

/**
 * Run the check command
 *
 * @param args - Command-line arguments
 * @param cwd - Current working directory
 * @returns Exit code from the type checker
 */
export async function checkCommand(
  args: string[],
  cwd: string,
): Promise<number> {
  try {
    const parsed = parseArgs(args, {
      string: ["config", "include", "exclude"],
      boolean: ["help", "quiet", "verbose", "debug"],
      collect: ["include", "exclude"],
      alias: { h: "help", v: "verbose", q: "quiet", d: "debug" },
      default: { include: undefined, exclude: undefined },
    });

    if (parsed.help) {
      console.log(await readAsset("usage-check.txt"));
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

    const checker = await resolveTypeChecker(cwd);
    if (!checker) {
      console.error(
        "probitas check needs TypeScript. Install it in your project " +
          "(e.g. `bun add -d typescript`) or put `tsc`/`tsgo` on PATH.",
      );
      return EXIT_CODE.FAILURE;
    }

    const tsconfig = join(cwd, "tsconfig.json");
    let checkerArgs: string[];
    if (await defaultResolveOptions.exists(tsconfig)) {
      checkerArgs = buildTypeCheckArgs({ tsconfig, files: [] });
    } else {
      const configPath = parsed.config ??
        await findProbitasConfigFile(cwd, { parentLookup: true });
      const config = configPath ? await loadConfig(configPath) : {};
      const paths = parsed._.map(String).map((p) => resolve(cwd, p));
      const progress = parsed.quiet ? null : createDiscoveryProgress();
      const files = await discoverScenarioFiles(
        paths.length ? paths : [cwd],
        {
          includes: parsed.include ?? config?.includes,
          excludes: parsed.exclude ?? config?.excludes,
          onProgress: progress?.onProgress,
        },
      );
      progress?.complete(files.length);
      if (files.length === 0) {
        console.warn("No scenario files found");
        return EXIT_CODE.NOT_FOUND;
      }
      checkerArgs = buildTypeCheckArgs({ files });
    }

    logger.debug("Running type checker", { checker, args: checkerArgs });
    return await new Promise<number>((resolvePromise) => {
      const child = spawn(checker, checkerArgs, { cwd, stdio: "inherit" });
      child.once("exit", (code) => resolvePromise(code ?? EXIT_CODE.FAILURE));
      child.once("error", (err) => {
        logger.debug("Failed to start type checker", { checker, err });
        resolvePromise(EXIT_CODE.FAILURE);
      });
    });
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${m}`);
    return EXIT_CODE.FAILURE;
  }
}
