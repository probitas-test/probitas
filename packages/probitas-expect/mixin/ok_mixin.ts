import { createExpectationError } from "../error.ts";
import type { MixinApplied, MixinConfig, MixinDefinition } from "./types.ts";

/**
 * Type definition for the ok mixin, providing the toBeOk method.
 */
type Definition<T> = MixinDefinition<[
  ["toBeOk", (this: T) => T],
]>;

/**
 * Mixin type that adds ok/success validation to an expectation object.
 *
 * This mixin provides the `toBeOk()` method for asserting that a boolean
 * value represents a successful state (true for positive assertions, false
 * for negative assertions with `not`).
 *
 * @template T - The base expectation object type
 */
export type OkMixin = <T extends object>(
  base: Readonly<T>,
) => MixinApplied<T, Definition<T>>;

/**
 * Creates an ok mixin that validates boolean success/failure states.
 *
 * The created mixin adds a `toBeOk()` method that checks if a boolean value
 * represents a successful state. When used with `not`, it inverts the assertion
 * to check for failure states.
 *
 * @param getter - Function to retrieve the boolean value to check
 * @param negate - Whether to negate the assertion (true for `.not` chains)
 * @param config - Mixin configuration (valueName for error messages)
 * @returns A mixin function that adds ok validation capabilities
 *
 * @example
 * ```ts
 * import { createOkMixin } from "./ok_mixin.ts";
 *
 * const result = { success: true };
 * const negate = () => false;
 *
 * const okMixin = createOkMixin(
 *   () => result.success,
 *   negate,
 *   { valueName: "operation" }
 * );
 * const expectation = okMixin({});
 * expectation.toBeOk();
 * ```
 */
export function createOkMixin(
  getter: () => boolean,
  negate: () => boolean,
  config: Omit<MixinConfig, "methodBase">,
): OkMixin {
  const valueName = config.valueName;
  return (<T>(base: Readonly<T>) => ({
    ...base,
    toBeOk(this: T) {
      const isNegated = negate();
      const isOk = getter.call(this);

      if (isNegated ? isOk : !isOk) {
        throw createExpectationError({
          message: isNegated
            ? `Expected ${valueName} to not be ok, but it succeeded`
            : `Expected ${valueName} to be ok, but it failed`,
          expectOrigin: config.expectOrigin,
          theme: config.theme,
          subject: config.subject,
        });
      }
      return this;
    },
  })) as OkMixin;
}
