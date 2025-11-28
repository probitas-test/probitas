/**
 * Implementation of the `probitas init` command
 *
 * @module
 */

import { alterElse } from "@core/errorutil/alter-else";
import { ensure, is } from "@core/unknownutil";
import { parseArgs } from "@std/cli";
import { parse as parseJsonc } from "@std/jsonc";
import { resolve } from "@std/path";
import { EXIT_CODE } from "../constants.ts";
import {
  findDenoConfigFile,
  getVersion,
  readAsset,
  readTemplate,
} from "../utils.ts";
import expectedConfigTemplate from "../../assets/templates/deno.json" with {
  type: "json",
};

/**
 * Check if file has comments (simple heuristic)
 */
function hasComments(content: string): boolean {
  return content.includes("//") || content.includes("/*");
}

/**
 * Execute the init command
 *
 * @param args - Command-line arguments
 * @param cwd - Current working directory
 * @returns Exit code (0 = success, 2 = usage error)
 *
 * @requires --allow-write Permission to write config and scenario files
 */
export async function initCommand(
  args: string[],
  cwd: string,
): Promise<number> {
  try {
    // Parse command-line arguments
    const parsed = parseArgs(args, {
      boolean: ["help", "force"],
      alias: {
        h: "help",
        f: "force",
      },
    });

    // Show help if requested
    if (parsed.help) {
      try {
        const helpText = await readAsset("usage-init.txt");
        console.log(helpText);
        return EXIT_CODE.SUCCESS;
      } catch (err: unknown) {
        const m = err instanceof Error ? err.message : String(err);
        console.error(`Error reading help file: ${m}`);
        return EXIT_CODE.USAGE_ERROR;
      }
    }

    const force = parsed.force ?? false;
    const version = getVersion();

    // Prepare expected config from template
    const versionSpec = version ? `@^${version}` : "";
    const expectedConfig = {
      ...expectedConfigTemplate,
      imports: {
        ...expectedConfigTemplate.imports,
        probitas: expectedConfigTemplate.imports.probitas.replaceAll(
          "{{VERSION}}",
          versionSpec,
        ),
      },
    };

    // Find existing deno.json/deno.jsonc
    const existingPath = await findDenoConfigFile(cwd);

    if (!existingPath) {
      // No deno.json exists - create new deno.json
      const denoJsonPath = resolve(cwd, "deno.json");
      await Deno.writeTextFile(
        denoJsonPath,
        JSON.stringify(expectedConfig, null, 2) + "\n",
      );
      console.log("Created deno.json");
    } else {
      // deno.json or deno.jsonc exists
      const content = await Deno.readTextFile(existingPath);
      const isJsonc = existingPath.endsWith(".jsonc");

      // Check for comments in .jsonc files
      if (isJsonc && hasComments(content) && !force) {
        console.error(
          `${existingPath} contains comments which would be lost. Use --force to overwrite.`,
        );
        return EXIT_CODE.USAGE_ERROR;
      }

      // Parse existing config
      const existing = alterElse(
        () => ensure(parseJsonc(content), is.Record),
        (err) => {
          const m = err instanceof Error ? err.message : String(err);
          throw new Error(
            `${existingPath} is not valid deno.json/deno.jsonc: ${m}`,
          );
        },
      );

      // Check if probitas section already exists
      if (existing.probitas && !force) {
        console.error(
          `probitas configuration already exists in ${existingPath}. Use --force to overwrite.`,
        );
        return EXIT_CODE.USAGE_ERROR;
      }

      // Add/update imports.probitas if not exists
      if (!existing.imports) {
        existing.imports = {};
      }
      const imports = alterElse(
        () => ensure(existing.imports, is.RecordOf(is.String)),
        (err) => {
          const m = err instanceof Error ? err.message : String(err);
          throw new Error(
            `imports attribute in ${examplePath} is not valid: ${m}`,
          );
        },
      );
      if (!imports.probitas) {
        imports.probitas = expectedConfig.imports.probitas;
      }

      // Add probitas section (only if not exists or force)
      if (!existing.probitas || force) {
        existing.probitas = expectedConfig.probitas;
      }

      // Write back
      await Deno.writeTextFile(
        existingPath,
        JSON.stringify(existing, null, 2) + "\n",
      );
      console.log(`Updated ${existingPath}`);
    }

    // Create scenarios directory
    const scenariosDir = resolve(cwd, "scenarios");
    await Deno.mkdir(scenariosDir, { recursive: true });

    // Create scenarios/example.scenario.ts
    const examplePath = resolve(scenariosDir, "example.scenario.ts");

    if (!force) {
      try {
        await Deno.stat(examplePath);
        console.error(
          "scenarios/example.scenario.ts already exists. Use --force to overwrite.",
        );
        return EXIT_CODE.USAGE_ERROR;
      } catch {
        // File doesn't exist, continue
      }
    }

    const exampleContent = await readTemplate("example.scenario.ts");
    await Deno.writeTextFile(examplePath, exampleContent);
    console.log("Created scenarios/example.scenario.ts");

    console.log(
      "\nInitialization complete! Run 'probitas run' to execute the example scenario.",
    );

    return EXIT_CODE.SUCCESS;
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : String(err);
    console.error(`Unexpected error: ${m}`);
    return EXIT_CODE.USAGE_ERROR;
  }
}
