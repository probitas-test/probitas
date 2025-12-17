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
 * Type definition for the nullish-value mixin, providing nullish-specific validation methods.
 */
type Definition<T, MethodBase extends string> = MixinDefinition<[
  [`toHave${MethodBase}Null`, (this: T) => T],
  [`toHave${MethodBase}Undefined`, (this: T) => T],
  [`toHave${MethodBase}Nullish`, (this: T) => T],
  [`toHave${MethodBase}Present`, (this: T) => T],
]>;

/**
 * Mixin type that adds nullish validation to an expectation object.
 *
 * This mixin provides methods for common number assertions:
 * - `toHave{MethodBase}Null()`: Check if value is null (strictly)
 * - `toHave{MethodBase}Undefined()`: Check if value is undefined (strictly)
 * - `toHave{MethodBase}Nullish()`: Check if value is null or undefined
 * - `toHave{MethodBase}Present()`: Check if value is not null nor undefined
 *
 * Method names are dynamically generated based on the config's method base
 * (e.g., `toHaveBodyNull`, `toHaveDataPresent`).
 *
 * @template C - The mixin configuration type
 */
export type NullishValueMixin<C extends MixinConfig> = <T extends object>(
  base: Readonly<T>,
) => MixinApplied<T, Definition<T, ExtractMethodBase<C>>>;

/**
 * Creates a nullish-value mixin that adds nullish-specific validation methods.
 *
 * The created mixin adds four methods for nullish validation:
 * 1. `toHave{MethodBase}Null()`: Check if value is null (strictly)
 * 2. `toHave{MethodBase}Undefined()`: Check if value is undefined (strictly)
 * 3. `toHave{MethodBase}Nullish()`: Check if value is null or undefined
 * 4. `toHave{MethodBase}Present()`: Check if value is not null nor undefined
 *
 * All methods leverage @std/expect internally for robust comparison
 * and support negation through the `.not` chain.
 *
 * @template V - The value type being validated (should include null)
 * @template C - The mixin configuration type
 * @param getter - Function to retrieve the value to validate
 * @param negate - Whether to negate the assertion (true for `.not` chains)
 * @param config - Mixin configuration (valueName and optional methodBase)
 * @returns A mixin function that adds null validation capabilities
 *
 * @example
 * ```ts
 * import { createNullishValueMixin } from "./nullish_value_mixin.ts";
 *
 * const response = { error: null as string | null };
 * const negate = () => false;
 *
 * const nullishMixin = createNullishValueMixin(
 *   () => response.error,
 *   negate,
 *   { valueName: "error", methodBase: "Error" }
 * );
 * const expectation = nullishMixin({});
 * expectation.toHaveErrorNull();
 * ```
 */
export function createNullishValueMixin<
  V extends unknown | null = unknown | null,
  const C extends MixinConfig = MixinConfig,
>(
  getter: () => V,
  negate: () => boolean,
  config: C,
): NullishValueMixin<C> {
  const valueName = config.valueName;
  const methodBase = config.methodBase ?? toPascalCase(valueName);

  return (<T>(base: Readonly<T>) => ({
    ...base,
    [`toHave${methodBase}Null`](this: T): T {
      const isNegated = negate();
      const value = getter.call(this);
      const passes = xor(
        isNegated,
        tryOk(() => stdExpect(value).toBeNull()),
      );

      if (!passes) {
        const valueStr = formatValue(value);
        throw createExpectationError({
          message: isNegated
            ? `Expected ${valueName} to not be null, but got ${valueStr}`
            : `Expected ${valueName} to be null, but got ${valueStr}`,
          expectOrigin: config.expectOrigin,
          theme: config.theme,
          subject: config.subject,
        });
      }
      return this;
    },
    [`toHave${methodBase}Undefined`](this: T): T {
      const isNegated = negate();
      const value = getter.call(this);
      const passes = xor(
        isNegated,
        tryOk(() => stdExpect(value).toBeUndefined()),
      );

      if (!passes) {
        const valueStr = formatValue(value);
        throw createExpectationError({
          message: isNegated
            ? `Expected ${valueName} to not be undefined, but got ${valueStr}`
            : `Expected ${valueName} to be undefined, but got ${valueStr}`,
          expectOrigin: config.expectOrigin,
          theme: config.theme,
          subject: config.subject,
        });
      }
      return this;
    },
    [`toHave${methodBase}Nullish`](this: T): T {
      const isNegated = negate();
      const value = getter.call(this);
      const passes = xor(isNegated, value == null);

      if (!passes) {
        const valueStr = formatValue(value);
        throw createExpectationError({
          message: isNegated
            ? `Expected ${valueName} to not be null nor undefined, but got ${valueStr}`
            : `Expected ${valueName} to be null or undefined, but got ${valueStr}`,
          expectOrigin: config.expectOrigin,
          theme: config.theme,
          subject: config.subject,
        });
      }
      return this;
    },
    [`toHave${methodBase}Present`](this: T): T {
      const isNegated = negate();
      const value = getter.call(this);
      const passes = xor(
        isNegated,
        tryOk(() => {
          stdExpect(value).not.toBeUndefined();
          stdExpect(value).not.toBeNull();
        }),
      );

      if (!passes) {
        const valueStr = formatValue(value);
        throw createExpectationError({
          message: isNegated
            ? `Expected ${valueName} to not be present, but got ${valueStr}`
            : `Expected ${valueName} to be present, but got ${valueStr}`,
          expectOrigin: config.expectOrigin,
          theme: config.theme,
          subject: config.subject,
        });
      }
      return this;
    },
  })) as NullishValueMixin<C>;
}
