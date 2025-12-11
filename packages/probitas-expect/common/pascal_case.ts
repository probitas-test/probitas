/**
 * Utility function to convert strings to PascalCase.
 *
 * @module
 */

export type ToPascalCase<S extends string> = S extends
  `${infer Head}_${infer Tail}`
  ? `${ToPascalCase<Head>}${ToPascalCase<Capitalize<Tail>>}`
  : S extends `${infer Head}-${infer Tail}`
    ? `${ToPascalCase<Head>}${ToPascalCase<Capitalize<Tail>>}`
  : S extends `${infer Head} ${infer Tail}`
    ? `${ToPascalCase<Head>}${ToPascalCase<Capitalize<Tail>>}`
  : Capitalize<S>;

/**
 * Converts a string to PascalCase.
 *
 * Handles various input formats including:
 * - snake_case
 * - kebab-case
 * - space separated
 * - camelCase
 * - mixed formats
 *
 * @param value - The string to convert
 * @returns The PascalCase version of the string
 *
 * @example
 * ```ts
 * toPascalCase("hello_world"); // "HelloWorld"
 * toPascalCase("hello-world"); // "HelloWorld"
 * toPascalCase("hello world"); // "HelloWorld"
 * toPascalCase("helloWorld");  // "HelloWorld"
 * toPascalCase("error count"); // "ErrorCount"
 * ```
 */
export function toPascalCase<const S extends string>(
  value: S,
): ToPascalCase<S> {
  // Handle empty string
  if (!value) return value as unknown as ToPascalCase<S>;

  // Split on common delimiters: underscore, hyphen, space
  const words = value.split(/[_\-\s]+/);

  // If no delimiters found, treat as single word or already PascalCase
  if (words.length === 1) {
    // Convert first character to uppercase
    return value.charAt(0).toUpperCase() +
      value.slice(1) as ToPascalCase<S>;
  }

  // Convert to PascalCase: all words capitalized
  return words
    .map((word) => {
      // Capitalize first letter, lowercase rest
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join("") as ToPascalCase<S>;
}
