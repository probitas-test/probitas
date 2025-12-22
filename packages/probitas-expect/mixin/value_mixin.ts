import { expect as stdExpect } from "@std/expect";
import { createExpectationError } from "../error.ts";
import { formatValue } from "../utils.ts";
import { toPascalCase } from "../utils.ts";
import { tryOk } from "../utils.ts";
import { xor } from "../utils.ts";
import type {
  ExtractMethodBase,
  MixinApplied,
  MixinConfig,
  MixinDefinition,
} from "./types.ts";

/**
 * Type definition for the value mixin, providing basic value comparison methods.
 */
type Definition<V, T, MethodBase extends string> = MixinDefinition<[
  [`toHave${MethodBase}`, (this: T, expected: unknown) => T],
  [`toHave${MethodBase}Equal`, (this: T, expected: unknown) => T],
  [`toHave${MethodBase}StrictEqual`, (this: T, expected: unknown) => T],
  [
    `toHave${MethodBase}Satisfying`,
    (this: T, matcher: (value: V) => void) => T,
  ],
]>;

/**
 * Mixin type that adds basic value comparison to an expectation object.
 *
 * This mixin provides methods for fundamental value assertions:
 * - `toHave{MethodBase}(expected)`: Check reference equality (===)
 * - `toHave{MethodBase}Equal(expected)`: Check deep equality
 * - `toHave{MethodBase}StrictEqual(expected)`: Check strict deep equality
 * - `toHave{MethodBase}Satisfying(matcher)`: Check custom matcher function
 *
 * Method names are dynamically generated based on the config's method base
 * (e.g., `toHaveStatus`, `toHaveValueEqual`).
 *
 * @template C - The mixin configuration type
 */
export type ValueMixin<V, C extends MixinConfig> = <T extends object>(
  base: Readonly<T>,
) => MixinApplied<T, Definition<V, T, ExtractMethodBase<C>>>;

/**
 * Creates a value mixin that adds basic value comparison methods.
 *
 * The created mixin adds four methods for value comparison:
 * 1. `toHave{MethodBase}(expected)`: Validates reference equality using ===
 * 2. `toHave{MethodBase}Equal(expected)`: Validates deep equality
 * 3. `toHave{MethodBase}StrictEqual(expected)`: Validates strict deep equality
 * 4. `toHave{MethodBase}Satisfying(matcher)`: Validates custom condition via matcher
 *
 * All methods leverage @std/expect internally for robust comparison
 * and support negation through the `.not` chain.
 *
 * @template V - The value type being validated
 * @template C - The mixin configuration type
 * @param getter - Function to retrieve the value to validate
 * @param negate - Whether to negate assertions (true for `.not` chains)
 * @param config - Mixin configuration (valueName and optional methodBase)
 * @returns A mixin function that adds value comparison capabilities
 *
 * @example
 * ```ts
 * import { createValueMixin } from "./value_mixin.ts";
 *
 * const response = { status: 200 };
 * const negate = () => false;
 *
 * const valueMixin = createValueMixin(
 *   () => response.status,
 *   negate,
 *   { valueName: "status", methodBase: "Status" }
 * );
 * const expectation = valueMixin({});
 * expectation.toHaveStatus(200);
 * ```
 */
export function createValueMixin<
  // deno-lint-ignore no-explicit-any
  V extends any = any,
  const C extends MixinConfig = MixinConfig,
>(
  getter: () => V,
  negate: () => boolean,
  config: C,
): ValueMixin<V, C> {
  const valueName = config.valueName;
  const methodBase = config.methodBase ?? toPascalCase(valueName);

  return (<T>(base: Readonly<T>) => ({
    ...base,
    [`toHave${methodBase}`](this: T, expected: unknown): T {
      const isNegated = negate();
      const value = getter.call(this);
      const passes = xor(
        isNegated,
        tryOk(() => stdExpect(value).toBe(expected)),
      );

      if (!passes) {
        const valueStr = formatValue(value);
        const expectedStr = formatValue(expected);

        throw createExpectationError({
          message: isNegated
            ? `Expected ${valueName} to not be ${expectedStr}, but got ${valueStr}`
            : `Expected ${valueName} to be ${expectedStr}, but got ${valueStr}`,
          expectOrigin: config.expectOrigin,
          theme: config.theme,
          subject: config.subject,
        });
      }
      return this;
    },

    [`toHave${methodBase}Equal`](this: T, expected: unknown): T {
      const isNegated = negate();
      const value = getter.call(this);
      const passes = xor(
        isNegated,
        tryOk(() => stdExpect(value).toEqual(expected)),
      );

      if (!passes) {
        const valueStr = formatValue(value);
        const expectedStr = formatValue(expected);

        throw createExpectationError({
          message: isNegated
            ? `Expected ${valueName} to not equal ${expectedStr}, but it did`
            : `Expected ${valueName} to equal ${expectedStr}, but got ${valueStr}`,
          expectOrigin: config.expectOrigin,
          theme: config.theme,
          diff: { actual: value, expected, negated: isNegated },
          subject: config.subject,
        });
      }
      return this;
    },

    [`toHave${methodBase}StrictEqual`](this: T, expected: unknown): T {
      const isNegated = negate();
      const value = getter.call(this);
      const passes = xor(
        isNegated,
        tryOk(() => stdExpect(value).toStrictEqual(expected)),
      );

      if (!passes) {
        const valueStr = formatValue(value);
        const expectedStr = formatValue(expected);

        throw createExpectationError({
          message: isNegated
            ? `Expected ${valueName} to not strictly equal ${expectedStr}, but it did`
            : `Expected ${valueName} to strictly equal ${expectedStr}, but got ${valueStr}`,
          expectOrigin: config.expectOrigin,
          theme: config.theme,
          diff: { actual: value, expected, negated: isNegated },
          subject: config.subject,
        });
      }
      return this;
    },

    [`toHave${methodBase}Satisfying`](
      this: T,
      matcher: (value: V) => void,
    ): T {
      const isNegated = negate();
      const value = getter.call(this);

      let matcherError: Error | undefined;
      try {
        matcher(value);
      } catch (error) {
        if (error instanceof Error) {
          matcherError = error;
        } else {
          matcherError = new Error(String(error));
        }
      }

      const passes = matcherError === undefined;

      if (isNegated ? passes : !passes) {
        throw createExpectationError({
          message: isNegated
            ? `Expected ${valueName} to not satisfy the matcher, but it did`
            : `Expected ${valueName} to satisfy the matcher, but it failed: ${matcherError?.message}`,
          expectOrigin: config.expectOrigin,
          theme: config.theme,
          subject: config.subject,
        });
      }
      return this;
    },
  })) as ValueMixin<V, C>;
}
