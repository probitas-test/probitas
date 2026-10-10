/**
 * CLI assets embedded at build time so the compiled binary needs no files
 * beside it.
 *
 * @module
 * @internal
 */

import example from "../../assets/example.probitas.ts" with { type: "text" };
import probitasJsonc from "../../assets/probitas.jsonc" with { type: "text" };
import tsconfigJson from "../../assets/tsconfig.json" with { type: "text" };
import usage from "../../assets/usage.txt" with { type: "text" };
import usageCheck from "../../assets/usage-check.txt" with { type: "text" };
import usageInit from "../../assets/usage-init.txt" with { type: "text" };
import usageList from "../../assets/usage-list.txt" with { type: "text" };
import usageRun from "../../assets/usage-run.txt" with { type: "text" };

/**
 * TypeScript types an import by the file it resolves to and ignores
 * `with { type: "text" }`, so `.ts` and `.json` assets look like modules to the
 * checker while Bun hands over their source text.
 */
function asText(imported: unknown): string {
  if (typeof imported !== "string") {
    throw new TypeError("Asset was not imported as text");
  }
  return imported;
}

export const assets: Readonly<Record<string, string>> = {
  "example.probitas.ts": asText(example),
  "probitas.jsonc": probitasJsonc,
  "tsconfig.json": asText(tsconfigJson),
  "usage.txt": usage,
  "usage-check.txt": usageCheck,
  "usage-init.txt": usageInit,
  "usage-list.txt": usageList,
  "usage-run.txt": usageRun,
};
