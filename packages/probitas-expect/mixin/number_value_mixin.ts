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
 * Type definition for the number-value mixin, providing number-specific validation methods.
 */
type Definition<T, MethodBase extends string> = MixinDefinition<[
  [`toHave${MethodBase}NaN`, (this: T) => T],
  [`toHave${MethodBase}GreaterThan`, (this: T, expected: number) => T],
  [
    `toHave${MethodBase}GreaterThanOrEqual`,
    (this: T, expected: number) => T,
  ],
  [`toHave${MethodBase}LessThan`, (this: T, expected: number) => T],
  [`toHave${MethodBase}LessThanOrEqual`, (this: T, expected: number) => T],
  [
    `toHave${MethodBase}CloseTo`,
    (this: T, expected: number, numDigits?: number) => T,
  ],
]>;

/**
 * Mixin type that adds number-specific validation to an expectation object.
 *
 * This mixin provides methods for common number assertions:
 * - `toHave{MethodBase}NaN()`: Check if value is NaN
 * - `toHave{MethodBase}GreaterThan(n)`: Check if value > n
 * - `toHave{MethodBase}GreaterThanOrEqual(n)`: Check if value >= n
 * - `toHave{MethodBase}LessThan(n)`: Check if value < n
 * - `toHave{MethodBase}LessThanOrEqual(n)`: Check if value <= n
 * - `toHave{MethodBase}CloseTo(n, digits?)`: Check if value is close to n
 *
 * Method names are dynamically generated based on the config's method base
 * (e.g., `toHaveScoreGreaterThan`, `toHaveCountCloseTo`).
 *
 * @template C - The mixin configuration type
 */
export type NumberValueMixin<C extends MixinConfig> = <T extends object>(
  base: Readonly<T>,
) => MixinApplied<T, Definition<T, ExtractMethodBase<C>>>;

/**
 * Creates a number-value mixin that adds number-specific validation methods.
 *
 * The created mixin adds six methods for number validation:
 * 1. `toHave{MethodBase}NaN()`: Validates value is NaN
 * 2. `toHave{MethodBase}GreaterThan(n)`: Validates value > n
 * 3. `toHave{MethodBase}GreaterThanOrEqual(n)`: Validates value >= n
 * 4. `toHave{MethodBase}LessThan(n)`: Validates value < n
 * 5. `toHave{MethodBase}LessThanOrEqual(n)`: Validates value <= n
 * 6. `toHave{MethodBase}CloseTo(n, digits?)`: Validates value ≈ n within precision
 *
 * All methods leverage @std/expect internally for robust comparison
 * and support negation through the `.not` chain.
 *
 * @template V - The number type being validated
 * @template C - The mixin configuration type
 * @param getter - Function to retrieve the number value to validate
 * @param negate - Whether to negate assertions (true for `.not` chains)
 * @param config - Mixin configuration (valueName and optional methodBase)
 * @returns A mixin function that adds number validation capabilities
 *
 * @example
 * ```ts
 * import { createNumberValueMixin } from "./number_value_mixin.ts";
 *
 * const response = { score: 95 };
 * const negate = () => false;
 *
 * const numberMixin = createNumberValueMixin(
 *   () => response.score,
 *   negate,
 *   { valueName: "score", methodBase: "Score" }
 * );
 * const expectation = numberMixin({});
 * expectation.toHaveScoreGreaterThan(90);
 * ```
 */
export function createNumberValueMixin<
  V extends number = number,
  const C extends MixinConfig = MixinConfig,
>(
  getter: () => V,
  negate: () => boolean,
  config: C,
): NumberValueMixin<C> {
  const valueName = config.valueName;
  const methodBase = config.methodBase ?? toPascalCase(valueName);

  return (<T>(base: Readonly<T>) => ({
    ...base,
    [`toHave${methodBase}NaN`](this: T): T {
      const isNegated = negate();
      const value = getter.call(this);
      const passes = xor(
        isNegated,
        tryOk(() => stdExpect(value).toBeNaN()),
      );

      if (!passes) {
        const valueStr = formatValue(value);
        throw createExpectationError({
          message: isNegated
            ? `Expected ${valueName} to not be NaN, but got ${valueStr}`
            : `Expected ${valueName} to be NaN, but got ${valueStr}`,
          expectOrigin: config.expectOrigin,
          theme: config.theme,
          subject: config.subject,
        });
      }
      return this;
    },

    [`toHave${methodBase}GreaterThan`](this: T, expected: number): T {
      const isNegated = negate();
      const value = getter.call(this);
      const passes = xor(
        isNegated,
        tryOk(() => stdExpect(value).toBeGreaterThan(expected)),
      );

      if (!passes) {
        throw createExpectationError({
          message: isNegated
            ? `Expected ${valueName} to not be greater than ${expected}, but got ${value}`
            : `Expected ${valueName} to be greater than ${expected}, but got ${value}`,
          expectOrigin: config.expectOrigin,
          theme: config.theme,
          subject: config.subject,
        });
      }
      return this;
    },

    [`toHave${methodBase}GreaterThanOrEqual`](this: T, expected: number): T {
      const isNegated = negate();
      const value = getter.call(this);
      const passes = xor(
        isNegated,
        tryOk(() => stdExpect(value).toBeGreaterThanOrEqual(expected)),
      );

      if (!passes) {
        throw createExpectationError({
          message: isNegated
            ? `Expected ${valueName} to not be greater than or equal to ${expected}, but got ${value}`
            : `Expected ${valueName} to be greater than or equal to ${expected}, but got ${value}`,
          expectOrigin: config.expectOrigin,
          theme: config.theme,
          subject: config.subject,
        });
      }
      return this;
    },

    [`toHave${methodBase}LessThan`](this: T, expected: number): T {
      const isNegated = negate();
      const value = getter.call(this);
      const passes = xor(
        isNegated,
        tryOk(() => stdExpect(value).toBeLessThan(expected)),
      );

      if (!passes) {
        throw createExpectationError({
          message: isNegated
            ? `Expected ${valueName} to not be less than ${expected}, but got ${value}`
            : `Expected ${valueName} to be less than ${expected}, but got ${value}`,
          expectOrigin: config.expectOrigin,
          theme: config.theme,
          subject: config.subject,
        });
      }
      return this;
    },

    [`toHave${methodBase}LessThanOrEqual`](this: T, expected: number): T {
      const isNegated = negate();
      const value = getter.call(this);
      const passes = xor(
        isNegated,
        tryOk(() => stdExpect(value).toBeLessThanOrEqual(expected)),
      );

      if (!passes) {
        throw createExpectationError({
          message: isNegated
            ? `Expected ${valueName} to not be less than or equal to ${expected}, but got ${value}`
            : `Expected ${valueName} to be less than or equal to ${expected}, but got ${value}`,
          expectOrigin: config.expectOrigin,
          theme: config.theme,
          subject: config.subject,
        });
      }
      return this;
    },

    [`toHave${methodBase}CloseTo`](
      this: T,
      expected: number,
      numDigits?: number,
    ): T {
      const isNegated = negate();
      const value = getter.call(this);
      const passes = xor(
        isNegated,
        tryOk(() => stdExpect(value).toBeCloseTo(expected, numDigits)),
      );

      if (!passes) {
        const digits = numDigits ?? 2;
        throw createExpectationError({
          message: isNegated
            ? `Expected ${valueName} to not be close to ${expected} (within ${digits} digits), but got ${value}`
            : `Expected ${valueName} to be close to ${expected} (within ${digits} digits), but got ${value}`,
          expectOrigin: config.expectOrigin,
          theme: config.theme,
          subject: config.subject,
        });
      }
      return this;
    },
  })) as NumberValueMixin<C>;
}
