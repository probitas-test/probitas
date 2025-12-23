import { expect as stdExpect } from "@std/expect";
import { createExpectationError } from "../error.ts";
import {
  Any,
  buildMatchingExpected,
  buildPropertyExpected,
  ensureNonNullish,
  formatValue,
  toPascalCase,
  tryOk,
  xor,
} from "../utils.ts";
import type {
  ExtractMethodBase,
  MixinApplied,
  MixinConfig,
  MixinDefinition,
} from "./types.ts";

/**
 * Type definition for the object-value mixin, providing object-specific validation methods.
 *
 * ## keyPath Parameter
 *
 * Methods that accept `keyPath` support two formats for accessing nested properties:
 *
 * - **String format** (`string`): Dot-separated path that splits on `.` to traverse nested objects
 *   - Example: `"user.address.city"` accesses `obj.user.address.city`
 *   - Limitation: Cannot access properties that contain dots in their name
 *
 * - **Array format** (`string[]`): Array where each element is treated as a single property key
 *   - Example: `["user", "address", "city"]` accesses `obj.user.address.city`
 *   - Example: `["config.env"]` accesses `obj["config.env"]` (property name contains dot)
 *   - Example: `["items", "0"]` accesses `obj.items["0"]` (numeric string key)
 *
 * Use array format when property names contain special characters like dots.
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
    (
      this: T,
      keyPath: string | string[],
      // deno-lint-ignore no-explicit-any
      matcher: (value: any) => void,
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
 * ## keyPath Parameter
 *
 * Methods 2-5 accept a `keyPath` parameter to access nested properties:
 *
 * - **String format**: `"user.address.city"` splits on dots to traverse `obj.user.address.city`
 * - **Array format**: `["user", "address", "city"]` treats each element as a property key
 *
 * Use array format for properties containing dots (e.g., `["config.env"]` for `obj["config.env"]`).
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
 * import { createObjectValueMixin } from "./object_value_mixin.ts";
 *
 * const response = { user: { name: "Alice", email: "alice@example.com" } };
 * const negate = () => false;
 *
 * const objectMixin = createObjectValueMixin(
 *   () => response.user,
 *   negate,
 *   { valueName: "user", methodBase: "User" }
 * );
 * const expectation = objectMixin({});
 * expectation.toHaveUserMatching({ name: "Alice" });
 * expectation.toHaveUserProperty("name", "Alice"); // string keyPath
 * expectation.toHaveUserProperty(["email"], "alice@example.com"); // array keyPath
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

        // Build expected object for diff (uses actual values for non-pattern keys)
        const expected = Array.isArray(subset) || Array.isArray(value)
          ? subset
          : buildMatchingExpected(
            value as Record<string, unknown>,
            subset as Record<string, unknown>,
          );

        throw createExpectationError({
          message: isNegated
            ? `Expected ${valueName} to not match ${subsetStr}, but it did`
            : `Expected ${valueName} to match ${subsetStr}, but got ${valueStr}`,
          expectOrigin: config.expectOrigin,
          theme: config.theme,
          diff: { actual: value, expected, negated: isNegated },
          subject: config.subject,
        });
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

        // Build expected object for diff
        // Uses [Any] marker when no expected value is specified
        const expected = buildPropertyExpected(
          obj as Record<string, unknown>,
          keyPathStr,
          value !== undefined ? value : Any,
        );

        if (value !== undefined) {
          const valueStr = formatValue(value);
          throw createExpectationError({
            message: isNegated
              ? `Expected ${valueName} to not have property "${keyPathStr}" with value ${valueStr}, but it did`
              : `Expected ${valueName} to have property "${keyPathStr}" with value ${valueStr}`,
            expectOrigin: config.expectOrigin,
            theme: config.theme,
            diff: { actual: obj, expected, negated: isNegated },
            subject: config.subject,
          });
        } else {
          throw createExpectationError({
            message: isNegated
              ? `Expected ${valueName} to not have property "${keyPathStr}", but it did`
              : `Expected ${valueName} to have property "${keyPathStr}"`,
            expectOrigin: config.expectOrigin,
            theme: config.theme,
            diff: { actual: obj, expected, negated: isNegated },
            subject: config.subject,
          });
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
          // @std/expect mutates array keyPath, so we need to copy it
          const keyPathCopy = Array.isArray(keyPath) ? [...keyPath] : keyPath;
          stdExpect(obj).toHaveProperty(keyPathCopy);
          const value = getPropertyValue(obj, keyPath);
          stdExpect(value).toContain(expected);
        }),
      );

      if (!passes) {
        const keyPathStr = Array.isArray(keyPath) ? keyPath.join(".") : keyPath;
        const expectedStr = formatValue(expected);

        throw createExpectationError({
          message: isNegated
            ? `Expected ${valueName} property "${keyPathStr}" to not contain ${expectedStr}, but it did`
            : `Expected ${valueName} property "${keyPathStr}" to contain ${expectedStr}`,
          expectOrigin: config.expectOrigin,
          theme: config.theme,
          subject: config.subject,
        });
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
          // @std/expect mutates array keyPath, so we need to copy it
          const keyPathCopy = Array.isArray(keyPath) ? [...keyPath] : keyPath;
          stdExpect(obj).toHaveProperty(keyPathCopy);
          const value = getPropertyValue(obj, keyPath);
          stdExpect(value).toMatchObject(subset);
        }),
      );

      if (!passes) {
        const keyPathStr = Array.isArray(keyPath) ? keyPath.join(".") : keyPath;
        const subsetStr = formatValue(subset);

        throw createExpectationError({
          message: isNegated
            ? `Expected ${valueName} property "${keyPathStr}" to not match ${subsetStr}, but it did`
            : `Expected ${valueName} property "${keyPathStr}" to match ${subsetStr}`,
          expectOrigin: config.expectOrigin,
          theme: config.theme,
          subject: config.subject,
        });
      }
      return this;
    },

    [`toHave${methodBase}PropertySatisfying`](
      this: T,
      keyPath: string | string[],
      // deno-lint-ignore no-explicit-any
      matcher: (value: any) => void,
    ): T {
      const isNegated = negate();
      const obj = getter.call(this);

      let matcherError: Error | undefined;
      let propertyExists = false;

      try {
        // @std/expect mutates array keyPath, so we need to copy it
        const keyPathCopy = Array.isArray(keyPath) ? [...keyPath] : keyPath;
        stdExpect(obj).toHaveProperty(keyPathCopy);
        propertyExists = true;
        const keyPathStr = Array.isArray(keyPath) ? keyPath.join(".") : keyPath;
        const value = ensureNonNullish(
          getPropertyValue(obj, keyPath),
          keyPathStr,
        );
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
          throw createExpectationError({
            message:
              `Expected ${valueName} property "${keyPathStr}" to exist and satisfy the matcher, but it does not exist`,
            expectOrigin: config.expectOrigin,
            theme: config.theme,
            subject: config.subject,
          });
        }

        throw createExpectationError({
          message: isNegated
            ? `Expected ${valueName} property "${keyPathStr}" to not satisfy the matcher, but it did`
            : `Expected ${valueName} property "${keyPathStr}" to satisfy the matcher, but it failed: ${matcherError?.message}`,
          expectOrigin: config.expectOrigin,
          theme: config.theme,
          subject: config.subject,
        });
      }
      return this;
    },
  })) as ObjectValueMixin<C>;
}

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
