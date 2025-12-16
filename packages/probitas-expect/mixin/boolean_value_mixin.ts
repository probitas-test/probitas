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
 * Type definition for the boolean-value mixin, providing truthy/falsy validation methods.
 */
type Definition<T, MethodBase extends string> = MixinDefinition<[
  [`toHave${MethodBase}Truthy`, (this: T) => T],
  [`toHave${MethodBase}Falsy`, (this: T) => T],
]>;

/**
 * Mixin type that adds truthy/falsy validation to an expectation object.
 *
 * This mixin provides methods for truthiness assertions:
 * - `toHave{MethodBase}Truthy()`: Check if value is truthy
 * - `toHave{MethodBase}Falsy()`: Check if value is falsy
 *
 * Method names are dynamically generated based on the config's method base
 * (e.g., `toHaveValueTruthy`, `toHaveResultFalsy`).
 *
 * @template C - The mixin configuration type
 */
export type BooleanValueMixin<C extends MixinConfig> = <T extends object>(
  base: Readonly<T>,
) => MixinApplied<T, Definition<T, ExtractMethodBase<C>>>;

/**
 * Creates a boolean-value mixin that adds truthy/falsy validation methods.
 *
 * The created mixin adds two methods for truthiness validation:
 * 1. `toHave{MethodBase}Truthy()`: Validates value is truthy (e.g., true, 1, "text", {}, [])
 * 2. `toHave{MethodBase}Falsy()`: Validates value is falsy (e.g., false, 0, "", null, undefined)
 *
 * Both methods leverage @std/expect internally for robust comparison
 * and support negation through the `.not` chain.
 *
 * @template V - The value type being validated
 * @template C - The mixin configuration type
 * @param getter - Function to retrieve the value to validate
 * @param negate - Whether to negate assertions (true for `.not` chains)
 * @param config - Mixin configuration (valueName and optional methodBase)
 * @returns A mixin function that adds boolean validation capabilities
 *
 * @example
 * ```ts
 * const booleanMixin = createBooleanValueMixin(
 *   () => response.success,
 *   false,
 *   { valueName: "success", methodBase: "Success" }
 * );
 * const expectation = applyMixins(base, [booleanMixin]);
 * expectation.toHaveSuccessTruthy();
 * expectation.not.toHaveSuccessFalsy();
 * ```
 */
export function createBooleanValueMixin<
  V = unknown,
  const C extends MixinConfig = MixinConfig,
>(
  getter: () => V,
  negate: () => boolean,
  config: C,
): BooleanValueMixin<C> {
  const valueName = config.valueName;
  const methodBase = config.methodBase ?? toPascalCase(valueName);

  return (<T>(base: Readonly<T>) => ({
    ...base,
    [`toHave${methodBase}Truthy`](this: T): T {
      const isNegated = negate();
      const value = getter.call(this);
      const passes = xor(
        isNegated,
        tryOk(() => stdExpect(value).toBeTruthy()),
      );

      if (!passes) {
        const valueStr = formatValue(value);
        throw createExpectationError({
          message: isNegated
            ? `Expected ${valueName} to not be truthy, but got ${valueStr}`
            : `Expected ${valueName} to be truthy, but got ${valueStr}`,
          expectOrigin: config.expectOrigin,
          theme: config.theme,
          subject: config.subject,
        });
      }
      return this;
    },

    [`toHave${methodBase}Falsy`](this: T): T {
      const isNegated = negate();
      const value = getter.call(this);
      const passes = xor(
        isNegated,
        tryOk(() => stdExpect(value).toBeFalsy()),
      );

      if (!passes) {
        const valueStr = formatValue(value);
        throw createExpectationError({
          message: isNegated
            ? `Expected ${valueName} to not be falsy, but got ${valueStr}`
            : `Expected ${valueName} to be falsy, but got ${valueStr}`,
          expectOrigin: config.expectOrigin,
          theme: config.theme,
          subject: config.subject,
        });
      }
      return this;
    },
  })) as BooleanValueMixin<C>;
}
