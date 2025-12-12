import { formatValue, toPascalCase } from "../utils.ts";
import type {
  ExtractMethodBase,
  MixinApplied,
  MixinConfig,
  MixinDefinition,
} from "./types.ts";

/**
 * Type definition for the one-of-value mixin, providing the toHaveXOneOf method.
 */
type Definition<T, MethodBase extends string> = MixinDefinition<[
  [`toHave${MethodBase}OneOf`, (this: T, values: unknown[]) => T],
]>;

/**
 * Mixin type that adds one-of validation to an expectation object.
 *
 * This mixin provides a method that checks if a value is one of the specified
 * allowed values. The method name is dynamically generated based on the config's
 * method base (e.g., `toHaveStringOneOf`, `toHaveNumberOneOf`).
 *
 * @template C - The mixin configuration type
 */
export type OneOfValueMixin<C extends MixinConfig> = <T extends object>(
  base: Readonly<T>,
) => MixinApplied<T, Definition<T, ExtractMethodBase<C>>>;

/**
 * Creates a one-of-value mixin that validates a value against allowed options.
 *
 * The created mixin adds a `toHave{MethodBase}OneOf(values)` method that checks
 * if the actual value matches any of the provided allowed values using strict
 * equality (===). This is useful for enum-like validations or checking against
 * a set of valid options.
 *
 * @template V - The type of value being validated
 * @template C - The mixin configuration type
 * @param getter - Function to retrieve the value to validate
 * @param negate - Whether to negate the assertion (true for `.not` chains)
 * @param config - Mixin configuration (valueName and optional methodBase)
 * @returns A mixin function that adds one-of validation capabilities
 *
 * @example
 * ```ts
 * const oneOfMixin = createOneOfValueMixin(
 *   () => user.role,
 *   false,
 *   { valueName: "role", methodBase: "Role" }
 * );
 * const expectation = applyMixins(base, [oneOfMixin]);
 * expectation.toHaveRoleOneOf(["admin", "user", "guest"]);
 * // Throws if user.role is not one of the allowed values
 * ```
 */
export function createOneOfValueMixin<
  V = unknown,
  const C extends MixinConfig = MixinConfig,
>(
  getter: () => V,
  negate: () => boolean,
  config: C,
): OneOfValueMixin<C> {
  const valueName = config.valueName;
  const methodBase = config.methodBase ?? toPascalCase(valueName);

  return (<T>(base: Readonly<T>) => ({
    ...base,
    [`toHave${methodBase}OneOf`](this: T, values: unknown[]) {
      const isNegated = negate();
      const value = getter.call(this);
      const passes = values.includes(value);

      const valueStr = formatValue(value);
      const valuesStr = formatValueList(values);

      if (isNegated ? passes : !passes) {
        throw new Error(
          isNegated
            ? `Expected ${valueName} to not be one of ${valuesStr}, but got ${valueStr}`
            : `Expected ${valueName} to be one of ${valuesStr}, but got ${valueStr}`,
        );
      }
      return this;
    },
  })) as OneOfValueMixin<C>;
}

/**
 * Formats an array of values into a human-readable list string.
 *
 * @param values - Array of values to format
 * @returns Comma-separated string of formatted values, or "(no values)" if empty
 */
function formatValueList(values: unknown[]): string {
  if (values.length === 0) {
    return "(no values)";
  }
  return `${values.map(formatValue).join(", ")}`;
}
