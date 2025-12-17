import { expect as stdExpect } from "@std/expect";
import { createExpectationError } from "../error.ts";
import { formatValue, toPascalCase, tryOk, xor } from "../utils.ts";
import type {
  ExtractMethodBase,
  MixinApplied,
  MixinConfig,
  MixinDefinition,
} from "./types.ts";

/**
 * Type definition for the string-value mixin, providing string-specific validation methods.
 */
type Definition<T, MethodBase extends string> = MixinDefinition<[
  [`toHave${MethodBase}Containing`, (this: T, substr: string) => T],
  [`toHave${MethodBase}Matching`, (this: T, expected: RegExp) => T],
]>;

/**
 * Mixin type that adds string-specific validation to an expectation object.
 *
 * This mixin provides methods for common string assertions:
 * - `toHave{MethodBase}Containing(substr)`: Check for substring presence
 * - `toHave{MethodBase}Matching(pattern)`: Check for regex pattern match
 *
 * Method names are dynamically generated based on the config's method base
 * (e.g., `toHaveStringContaining`, `toHaveMessageMatching`).
 *
 * @template C - The mixin configuration type
 */
export type StringValueMixin<C extends MixinConfig> = <T extends object>(
  base: Readonly<T>,
) => MixinApplied<T, Definition<T, ExtractMethodBase<C>>>;

/**
 * Creates a string-value mixin that adds string-specific validation methods.
 *
 * The created mixin adds two methods for string validation:
 * 1. `toHave{MethodBase}Containing(substr)`: Validates substring presence
 * 2. `toHave{MethodBase}Matching(pattern)`: Validates regex pattern match
 *
 * Both methods leverage @std/expect internally for robust string comparison
 * and support negation through the `.not` chain.
 *
 * @template V - The string type being validated
 * @template C - The mixin configuration type
 * @param getter - Function to retrieve the string value to validate
 * @param negate - Whether to negate assertions (true for `.not` chains)
 * @param config - Mixin configuration (valueName and optional methodBase)
 * @returns A mixin function that adds string validation capabilities
 *
 * @example
 * ```ts
 * import { createStringValueMixin } from "./string_value_mixin.ts";
 *
 * const response = { message: "Operation success" };
 * const negate = () => false;
 *
 * const stringMixin = createStringValueMixin(
 *   () => response.message,
 *   negate,
 *   { valueName: "message", methodBase: "Message" }
 * );
 * const expectation = stringMixin({});
 * expectation.toHaveMessageContaining("success");
 * ```
 */
export function createStringValueMixin<
  V extends string = string,
  const C extends MixinConfig = MixinConfig,
>(
  getter: () => V,
  negate: () => boolean,
  config: C,
): StringValueMixin<C> {
  const valueName = config.valueName;
  const methodBase = config.methodBase ?? toPascalCase(valueName);

  return (<T>(base: Readonly<T>) => ({
    ...base,
    [`toHave${methodBase}Containing`](this: T, substr: string): T {
      const isNegated = negate();
      const value = getter.call(this);
      const passes = xor(
        isNegated,
        tryOk(() => stdExpect(value).toContain(substr)),
      );

      if (!passes) {
        const valueStr = formatValue(value);
        const substrStr = formatValue(substr);

        throw createExpectationError({
          message: isNegated
            ? `Expected ${valueName} to not contain ${substrStr}, but got ${valueStr}`
            : `Expected ${valueName} to contain ${substrStr}, but got ${valueStr}`,
          expectOrigin: config.expectOrigin,
          theme: config.theme,
          subject: config.subject,
        });
      }
      return this;
    },

    [`toHave${methodBase}Matching`](this: T, expected: RegExp): T {
      const isNegated = negate();
      const value = getter.call(this);
      const passes = xor(
        isNegated,
        tryOk(() => stdExpect(value).toMatch(expected)),
      );

      if (!passes) {
        const valueStr = formatValue(value);
        const expectedStr = formatValue(expected);

        throw createExpectationError({
          message: isNegated
            ? `Expected ${valueName} to not match ${expectedStr}, but got ${valueStr}`
            : `Expected ${valueName} to match ${expectedStr}, but got ${valueStr}`,
          expectOrigin: config.expectOrigin,
          theme: config.theme,
          subject: config.subject,
        });
      }
      return this;
    },
  })) as StringValueMixin<C>;
}
