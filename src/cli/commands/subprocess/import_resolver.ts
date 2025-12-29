/**
 * Import resolver for subprocess templates
 *
 * @module
 */

/**
 * Dynamically resolve imports using import.meta.resolve()
 *
 * Extracts import statements from template files and resolves each specifier.
 * No pre-definition required, no maintenance needed when templates change.
 */
export class ImportResolver {
  /**
   * Convert bare specifier to fully-qualified form
   *
   * @param specifier - Specifier to resolve
   * @returns Resolved specifier (or original if unresolvable)
   */
  resolve(specifier: string): string {
    // 1. Already fully-qualified, no conversion needed
    if (/^(https?:|jsr:|npm:|data:|file:)/i.test(specifier)) {
      return specifier;
    }

    // 2. Relative path, no conversion needed
    if (specifier.startsWith("./") || specifier.startsWith("../")) {
      return specifier;
    }

    // 3. Resolve using import.meta.resolve()
    //    Works with import map (deno.json) without needing dynamic import
    try {
      const resolved = import.meta.resolve(specifier);
      return resolved;
    } catch {
      // Return as-is if unresolvable (e.g., internal scenario imports)
      return specifier;
    }
  }
}
