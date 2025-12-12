import { expect as stdExpect } from "@std/expect";
import { getNonNull } from "../common/assertions.ts";
import { formatValue } from "../common/format_value.ts";
import { toPascalCase } from "../common/pascal_case.ts";
import { tryOk } from "../common/try_ok.ts";
import { xor } from "../common/xor.ts";
import type {
  ExtractMethodBase,
  MixinApplied,
  MixinConfig,
  MixinDefinition,
} from "./types.ts";

/**
 * Type definition for the object-value mixin, providing object-specific validation methods.
 */
type Definition<T, MethodBase extends string> = MixinDefinition<[
  [
    `toHave${MethodBase}Matching`,
    (
      this: T,
      subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
    ) => T,
  ],
  [
    `toHave${MethodBase}Property`,
    (this: T, keyPath: string | string[], value?: unknown) => T,
  ],
  [
    `toHave${MethodBase}PropertyContaining`,
    (this: T, keyPath: string | string[], expected: unknown) => T,
  ],
  [
    `toHave${MethodBase}PropertyMatching`,
    (
      this: T,
      keyPath: string | string[],
      subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
    ) => T,
  ],
  [
    `toHave${MethodBase}PropertySatisfying`,
    // deno-lint-ignore no-explicit-any
    <I extends any>(
      this: T,
      keyPath: string | string[],
      matcher: (value: I) => void,
    ) => T,
  ],
]>;

/**
 * Mixin type that adds object-specific validation to an expectation object.
 *
 * This mixin provides methods for common object assertions:
 * - `toHave{MethodBase}Matching(subset)`: Check partial object match
 * - `toHave{MethodBase}Property(keyPath, value?)`: Check property existence/value
 * - `toHave{MethodBase}PropertyContaining(keyPath, expected)`: Check property contains value
 * - `toHave{MethodBase}PropertyMatching(keyPath, subset)`: Check property matches subset
 * - `toHave{MethodBase}PropertySatisfying(keyPath, matcher)`: Check property passes matcher
 *
 * Method names are dynamically generated based on the config's method base
 * (e.g., `toHaveUserMatching`, `toHaveDataProperty`).
 *
 * @template C - The mixin configuration type
 */
export type ObjectValueMixin<C extends MixinConfig> = <T extends object>(
  base: Readonly<T>,
) => MixinApplied<T, Definition<T, ExtractMethodBase<C>>>;

/**
 * Creates an object-value mixin that adds object-specific validation methods.
 *
 * The created mixin adds five methods for object validation:
 * 1. `toHave{MethodBase}Matching(subset)`: Validates partial object match
 * 2. `toHave{MethodBase}Property(keyPath, value?)`: Validates property existence and optional value
 * 3. `toHave{MethodBase}PropertyContaining(keyPath, expected)`: Validates property contains item/substring
 * 4. `toHave{MethodBase}PropertyMatching(keyPath, subset)`: Validates nested property matches subset
 * 5. `toHave{MethodBase}PropertySatisfying(keyPath, matcher)`: Validates property passes custom matcher
 *
 * All methods leverage @std/expect internally for robust comparison
 * and support negation through the `.not` chain.
 *
 * @template V - The object type being validated
 * @template C - The mixin configuration type
 * @param getter - Function to retrieve the object value to validate
 * @param negate - Whether to negate assertions (true for `.not` chains)
 * @param config - Mixin configuration (valueName and optional methodBase)
 * @returns A mixin function that adds object validation capabilities
 *
 * @example
 * ```ts
 * const objectMixin = createObjectValueMixin(
 *   () => response.user,
 *   false,
 *   { valueName: "user", methodBase: "User" }
 * );
 * const expectation = applyMixins(base, [objectMixin]);
 * expectation.toHaveUserMatching({ name: "Alice" });
 * expectation.toHaveUserProperty("email");
 * expectation.toHaveUserProperty("age", 30);
 * expectation.toHaveUserPropertyContaining("tags", "admin");
 * expectation.toHaveUserPropertyMatching("profile", { verified: true });
 * ```
 */
export function createObjectValueMixin<
  V extends object = object,
  const C extends MixinConfig = MixinConfig,
>(
  getter: () => V,
  negate: () => boolean,
  config: C,
): ObjectValueMixin<C> {
  const valueName = config.valueName;
  const methodBase = config.methodBase ?? toPascalCase(valueName);

  return (<T>(base: Readonly<T>) => ({
    ...base,
    [`toHave${methodBase}Matching`](
      this: T,
      subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
    ): T {
      const isNegated = negate();
      const value = getter.call(this);
      const passes = xor(
        isNegated,
        tryOk(() => stdExpect(value).toMatchObject(subset)),
      );

      if (!passes) {
        const valueStr = formatValue(value);
        const subsetStr = formatValue(subset);

        throw new Error(
          isNegated
            ? `Expected ${valueName} to not match ${subsetStr}, but it did`
            : `Expected ${valueName} to match ${subsetStr}, but got ${valueStr}`,
        );
      }
      return this;
    },

    [`toHave${methodBase}Property`](
      this: T,
      keyPath: string | string[],
      value?: unknown,
    ): T {
      const isNegated = negate();
      const obj = getter.call(this);
      const passes = xor(
        isNegated,
        tryOk(() => {
          if (value !== undefined) {
            stdExpect(obj).toHaveProperty(keyPath, value);
          } else {
            stdExpect(obj).toHaveProperty(keyPath);
          }
        }),
      );

      if (!passes) {
        const keyPathStr = Array.isArray(keyPath) ? keyPath.join(".") : keyPath;

        if (value !== undefined) {
          const valueStr = formatValue(value);
          throw new Error(
            isNegated
              ? `Expected ${valueName} to not have property "${keyPathStr}" with value ${valueStr}, but it did`
              : `Expected ${valueName} to have property "${keyPathStr}" with value ${valueStr}`,
          );
        } else {
          throw new Error(
            isNegated
              ? `Expected ${valueName} to not have property "${keyPathStr}", but it did`
              : `Expected ${valueName} to have property "${keyPathStr}"`,
          );
        }
      }
      return this;
    },

    [`toHave${methodBase}PropertyContaining`](
      this: T,
      keyPath: string | string[],
      expected: unknown,
    ): T {
      const isNegated = negate();
      const obj = getter.call(this);
      const passes = xor(
        isNegated,
        tryOk(() => {
          stdExpect(obj).toHaveProperty(keyPath);
          const value = getPropertyValue(obj, keyPath);
          stdExpect(value).toContain(expected);
        }),
      );

      if (!passes) {
        const keyPathStr = Array.isArray(keyPath) ? keyPath.join(".") : keyPath;
        const expectedStr = formatValue(expected);

        throw new Error(
          isNegated
            ? `Expected ${valueName} property "${keyPathStr}" to not contain ${expectedStr}, but it did`
            : `Expected ${valueName} property "${keyPathStr}" to contain ${expectedStr}`,
        );
      }
      return this;
    },

    [`toHave${methodBase}PropertyMatching`](
      this: T,
      keyPath: string | string[],
      subset: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
    ): T {
      const isNegated = negate();
      const obj = getter.call(this);
      const passes = xor(
        isNegated,
        tryOk(() => {
          stdExpect(obj).toHaveProperty(keyPath);
          const value = getPropertyValue(obj, keyPath);
          stdExpect(value).toMatchObject(subset);
        }),
      );

      if (!passes) {
        const keyPathStr = Array.isArray(keyPath) ? keyPath.join(".") : keyPath;
        const subsetStr = formatValue(subset);

        throw new Error(
          isNegated
            ? `Expected ${valueName} property "${keyPathStr}" to not match ${subsetStr}, but it did`
            : `Expected ${valueName} property "${keyPathStr}" to match ${subsetStr}`,
        );
      }
      return this;
    },

    // deno-lint-ignore no-explicit-any
    [`toHave${methodBase}PropertySatisfying`]<I extends any>(
      this: T,
      keyPath: string | string[],
      matcher: (value: I) => void,
    ): T {
      const isNegated = negate();
      const obj = getter.call(this);

      let matcherError: Error | undefined;
      let propertyExists = false;

      try {
        stdExpect(obj).toHaveProperty(keyPath);
        propertyExists = true;
        const keyPathStr = Array.isArray(keyPath) ? keyPath.join(".") : keyPath;
        const value = getNonNull(getPropertyValue<I>(obj, keyPath), keyPathStr);
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
        const keyPathStr = Array.isArray(keyPath) ? keyPath.join(".") : keyPath;

        if (!propertyExists && !isNegated) {
          throw new Error(
            `Expected ${valueName} property "${keyPathStr}" to exist and satisfy the matcher, but it does not exist`,
          );
        }

        throw new Error(
          isNegated
            ? `Expected ${valueName} property "${keyPathStr}" to not satisfy the matcher, but it did`
            : `Expected ${valueName} property "${keyPathStr}" to satisfy the matcher, but it failed: ${matcherError?.message}`,
        );
      }
      return this;
    },
  })) as ObjectValueMixin<C>;
}

/**
 * Helper function to get property value from an object using a key path.
 *
 * @param obj - The object to extract property from
 * @param keyPath - Dot-separated string or array of keys
 * @returns The property value or undefined if not found
 */
function getPropertyValue<T>(
  obj: unknown,
  keyPath: string | string[],
): T | undefined {
  const keys = Array.isArray(keyPath) ? keyPath : keyPath.split(".");
  // deno-lint-ignore no-explicit-any
  let current: any = obj;

  for (const key of keys) {
    if (current == null || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}
