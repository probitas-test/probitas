/**
 * Special marker for diff output representing "any value".
 *
 * Used in expected side when no specific value is required,
 * such as in `toHaveProperty("foo")` without a value check.
 *
 * @module
 */

/**
 * Internal class for the Any marker.
 * Uses Deno.customInspect to display as `<Any>`.
 */
class DiffAny {
  [Symbol.for("Deno.customInspect")](): string {
    return "<Any>";
  }
}

/**
 * Singleton marker representing any value in diff output.
 *
 * @example
 * ```ts
 * const expected = { foo: Any };
 * Deno.inspect(expected); // "{ foo: <Any> }"
 * ```
 */
export const Any = new DiffAny();
