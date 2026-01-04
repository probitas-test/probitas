/**
 * Subprocess template resolution utilities
 *
 * Resolves bare specifiers in subprocess template code to versioned URLs
 * so that subprocess can run without deno.json.
 *
 * @module
 */

import { createGraph, type ModuleGraphJson } from "@deno/graph";

/**
 * Resolved template files
 *
 * A map from relative paths to resolved source code.
 * The entry point is always at "subprocess.ts".
 */
export type ResolvedTemplateFiles = Map<string, string>;

/**
 * Resolve bare specifiers in subprocess template and all its local dependencies
 *
 * This function:
 * 1. Builds a dependency graph from the template file
 * 2. Identifies all local (file://) modules in the graph
 * 3. Resolves bare specifiers in each local module to absolute URLs
 * 4. Rewrites relative imports between local files to use the new relative paths
 *
 * @param templateUrl - URL to the subprocess template file (file://, https://, jsr:)
 * @returns Map of relative paths to resolved source code
 */
export async function resolveSubprocessTemplate(
  templateUrl: URL,
): Promise<ResolvedTemplateFiles> {
  // Build dependency graph to find all imports
  const graph = await createGraph(templateUrl.href);

  // Collect all local (file://) modules from the graph
  const localModules = graph.modules.filter(
    (m) => m.specifier.startsWith("file://") && !m.error,
  );

  if (localModules.length === 0) {
    throw new Error(`No local modules found in graph for: ${templateUrl.href}`);
  }

  // Find common base directory for all local modules
  const baseDir = findCommonBaseDir(localModules.map((m) => m.specifier));

  // Map from original specifier to new relative path
  const specifierToPath = new Map<string, string>();

  // First pass: calculate relative paths for all local modules
  for (const mod of localModules) {
    const relativePath = mod.specifier === templateUrl.href
      ? "subprocess.ts"
      : mod.specifier.substring(baseDir.length);
    specifierToPath.set(mod.specifier, relativePath);
  }

  const files: ResolvedTemplateFiles = new Map();

  // Second pass: resolve imports in each module
  for (const mod of localModules) {
    const relativePath = specifierToPath.get(mod.specifier)!;

    // Fetch the source
    const response = await fetch(mod.specifier);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch module "${mod.specifier}": ${response.status} ${response.statusText}`,
      );
    }
    let source = await response.text();

    // Resolve all dependencies in this module
    source = resolveModuleDependencies(
      source,
      mod,
      specifierToPath,
      relativePath,
    );

    files.set(relativePath, source);
  }

  return files;
}

/**
 * Find the common base directory for a list of file:// URLs
 */
function findCommonBaseDir(specifiers: string[]): string {
  if (specifiers.length === 0) return "";
  if (specifiers.length === 1) {
    return specifiers[0].substring(0, specifiers[0].lastIndexOf("/") + 1);
  }

  // Get directory paths
  const dirs = specifiers.map((s) => s.substring(0, s.lastIndexOf("/") + 1));

  // Find common prefix
  let common = dirs[0];
  for (let i = 1; i < dirs.length; i++) {
    while (!dirs[i].startsWith(common)) {
      // Remove last directory component
      common = common.substring(
        0,
        common.lastIndexOf("/", common.length - 2) + 1,
      );
      if (!common) break;
    }
  }

  return common;
}

/**
 * Calculate relative path from one file to another
 */
function calculateRelativePath(from: string, to: string): string {
  const fromParts = from.split("/").slice(0, -1); // Directory of 'from'
  const toParts = to.split("/");

  // Find common prefix length
  let commonLength = 0;
  while (
    commonLength < fromParts.length &&
    commonLength < toParts.length - 1 &&
    fromParts[commonLength] === toParts[commonLength]
  ) {
    commonLength++;
  }

  // Build relative path
  const upCount = fromParts.length - commonLength;
  const downPath = toParts.slice(commonLength).join("/");

  if (upCount === 0) {
    return "./" + downPath;
  }

  return "../".repeat(upCount) + downPath;
}

/**
 * Replacement entry with position information
 */
interface Replacement {
  /** Start offset in the source */
  start: number;
  /** End offset in the source */
  end: number;
  /** New text to replace with */
  newText: string;
}

/**
 * Convert line/character position to byte offset
 */
function positionToOffset(
  source: string,
  line: number,
  character: number,
): number {
  const lines = source.split("\n");
  let offset = 0;
  for (let i = 0; i < line && i < lines.length; i++) {
    offset += lines[i].length + 1; // +1 for newline
  }
  return offset + character;
}

/**
 * Resolve dependencies in a single module using position-based replacement
 *
 * Uses span information from @deno/graph to precisely replace import specifiers
 * at their exact positions in the source code, avoiding issues with string
 * replacement affecting comments or string literals.
 */
function resolveModuleDependencies(
  source: string,
  mod: ModuleGraphJson["modules"][0],
  specifierToPath: Map<string, string>,
  currentPath: string,
): string {
  const replacements: Replacement[] = [];

  for (const dep of mod.dependencies ?? []) {
    const specifier = dep.specifier;

    // Skip already-resolved URL specifiers (jsr:, https:, npm:, etc.)
    // but process relative paths (which don't have a protocol)
    if (specifier.includes(":") && !specifier.startsWith("file:")) continue;

    // Get the resolved dependency info (code or type)
    const resolvedDep = dep.code ?? dep.type;
    if (!resolvedDep?.span) continue;

    // Find the resolved URL for this dependency
    let resolvedSpec = resolvedDep.specifier;

    if (!resolvedSpec) {
      // Bare specifier - resolve using Probitas's deno.json
      try {
        resolvedSpec = import.meta.resolve(specifier);
      } catch {
        // Can't resolve - skip this dependency
        continue;
      }
    }

    let newImport: string;

    const targetPath = specifierToPath.get(resolvedSpec);
    if (targetPath) {
      // Local file - calculate relative path from current file
      newImport = calculateRelativePath(currentPath, targetPath);
    } else {
      // External dependency - use the resolved URL
      newImport = resolvedSpec;
    }

    // Calculate byte offsets from line/character positions
    // The span covers the entire import specifier including quotes
    const start = positionToOffset(
      source,
      resolvedDep.span.start.line,
      resolvedDep.span.start.character,
    );
    const end = positionToOffset(
      source,
      resolvedDep.span.end.line,
      resolvedDep.span.end.character,
    );

    // Extract the original text to determine quote style
    const originalText = source.slice(start, end);
    const quote = originalText.startsWith('"') ? '"' : "'";

    replacements.push({
      start,
      end,
      newText: `${quote}${newImport}${quote}`,
    });
  }

  // Sort replacements in reverse order (from end to start)
  // This ensures earlier replacements don't shift positions of later ones
  replacements.sort((a, b) => b.start - a.start);

  // Apply replacements
  let resolved = source;
  for (const { start, end, newText } of replacements) {
    resolved = resolved.slice(0, start) + newText + resolved.slice(end);
  }

  return resolved;
}
