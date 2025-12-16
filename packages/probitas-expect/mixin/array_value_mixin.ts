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
 * Type definition for the array-value mixin, providing array-specific validation methods.
 */
type Definition<T, MethodBase extends string> = MixinDefinition<[
  [`toHave${MethodBase}Containing`, (this: T, item: unknown) => T],
  [`toHave${MethodBase}ContainingEqual`, (this: T, item: unknown) => T],
  [
    `toHave${MethodBase}Matching`,
    (
      this: T,
      subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
    ) => T,
  ],
  [`toHave${MethodBase}Empty`, (this: T) => T],
]>;

/**
 * Mixin type that adds array-specific validation to an expectation object.
 *
 * This mixin provides methods for common array assertions:
 * - `toHave{MethodBase}Containing(item)`: Check item presence with ===
 * - `toHave{MethodBase}ContainingEqual(item)`: Check item presence with deep equality
 * - `toHave{MethodBase}Matching(subset)`: Check if array contains item matching subset
 * - `toHave{MethodBase}Empty()`: Check if array is empty
 *
 * Method names are dynamically generated based on the config's method base
 * (e.g., `toHaveItemsContaining`, `toHaveListEmpty`).
 *
 * @template C - The mixin configuration type
 */
export type ArrayValueMixin<C extends MixinConfig> = <T extends object>(
  base: Readonly<T>,
) => MixinApplied<T, Definition<T, ExtractMethodBase<C>>>;

/**
 * Creates an array-value mixin that adds array-specific validation methods.
 *
 * The created mixin adds four methods for array validation:
 * 1. `toHave{MethodBase}Containing(item)`: Validates item presence using ===
 * 2. `toHave{MethodBase}ContainingEqual(item)`: Validates item presence using deep equality
 * 3. `toHave{MethodBase}Matching(subset)`: Validates array contains item matching object subset
 * 4. `toHave{MethodBase}Empty()`: Validates array is empty (length === 0)
 *
 * All methods leverage @std/expect internally for robust comparison
 * and support negation through the `.not` chain.
 *
 * @template V - The array type being validated
 * @template C - The mixin configuration type
 * @param getter - Function to retrieve the array value to validate
 * @param negate - Whether to negate assertions (true for `.not` chains)
 * @param config - Mixin configuration (valueName and optional methodBase)
 * @returns A mixin function that adds array validation capabilities
 *
 * @example
 * ```ts
 * const arrayMixin = createArrayValueMixin(
 *   () => response.items,
 *   false,
 *   { valueName: "items", methodBase: "Items" }
 * );
 * const expectation = applyMixins(base, [arrayMixin]);
 * expectation.toHaveItemsContaining("apple");
 * expectation.toHaveItemsContainingEqual({ id: 1, name: "apple" });
 * expectation.toHaveItemsMatching({ id: 1 });
 * expectation.not.toHaveItemsEmpty();
 * ```
 */
export function createArrayValueMixin<
  V extends readonly unknown[] = unknown[],
  const C extends MixinConfig = MixinConfig,
>(
  getter: () => V,
  negate: () => boolean,
  config: C,
): ArrayValueMixin<C> {
  const valueName = config.valueName;
  const methodBase = config.methodBase ?? toPascalCase(valueName);

  return (<T>(base: Readonly<T>) => ({
    ...base,
    [`toHave${methodBase}Containing`](this: T, item: unknown): T {
      const isNegated = negate();
      const value = getter.call(this);
      const passes = xor(
        isNegated,
        tryOk(() => stdExpect(value).toContain(item)),
      );

      if (!passes) {
        const valueStr = formatValue(value);
        const itemStr = formatValue(item);

        throw createExpectationError({
          message: isNegated
            ? `Expected ${valueName} to not contain ${itemStr}, but got ${valueStr}`
            : `Expected ${valueName} to contain ${itemStr}, but got ${valueStr}`,
          expectOrigin: config.expectOrigin,
          theme: config.theme,
          subject: config.subject,
        });
      }
      return this;
    },

    [`toHave${methodBase}ContainingEqual`](this: T, item: unknown): T {
      const isNegated = negate();
      const value = getter.call(this);
      const passes = xor(
        isNegated,
        tryOk(() => stdExpect(value).toContainEqual(item)),
      );

      if (!passes) {
        const valueStr = formatValue(value);
        const itemStr = formatValue(item);

        // For containEqual, expected is the array with the expected item added
        const expected = [...value, item];

        throw createExpectationError({
          message: isNegated
            ? `Expected ${valueName} to not contain equal ${itemStr}, but it did`
            : `Expected ${valueName} to contain equal ${itemStr}, but got ${valueStr}`,
          expectOrigin: config.expectOrigin,
          theme: config.theme,
          diff: { actual: value, expected, negated: isNegated },
          subject: config.subject,
        });
      }
      return this;
    },

    [`toHave${methodBase}Matching`](
      this: T,
      subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
    ): T {
      const isNegated = negate();
      const value = getter.call(this);
      const found = (value as readonly unknown[]).find((item) =>
        tryOk(() => stdExpect(item).toMatchObject(subset))
      );
      const passes = xor(isNegated, found !== undefined);

      if (!passes) {
        const valueStr = formatValue(value);
        const subsetStr = formatValue(subset);

        // For matching, expected is the array with the expected subset added
        const expected = [...value, subset];

        throw createExpectationError({
          message: isNegated
            ? `Expected ${valueName} to not contain item matching ${subsetStr}, but it did`
            : `Expected ${valueName} to contain item matching ${subsetStr}, but got ${valueStr}`,
          expectOrigin: config.expectOrigin,
          theme: config.theme,
          diff: { actual: value, expected, negated: isNegated },
          subject: config.subject,
        });
      }
      return this;
    },

    [`toHave${methodBase}Empty`](this: T): T {
      const isNegated = negate();
      const value = getter.call(this);
      const passes = xor(
        isNegated,
        tryOk(() => stdExpect(value).toHaveLength(0)),
      );

      if (!passes) {
        throw createExpectationError({
          message: isNegated
            ? `Expected ${valueName} to not be empty, but it is`
            : `Expected ${valueName} to be empty, but got length ${value.length}`,
          expectOrigin: config.expectOrigin,
          theme: config.theme,
          subject: config.subject,
        });
      }
      return this;
    },
  })) as ArrayValueMixin<C>;
}
