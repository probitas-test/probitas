import type { Origin } from "@probitas/core/origin";
import type {
  IntersectReturnTypes,
  PatchTypedChainMethod,
} from "./_typeutils.ts";
import { captureOrigin } from "../context.ts";

/**
 * A function that takes a base object and returns an extended object with additional methods.
 *
 * Mixins are composable units that add functionality to a base object. Each mixin receives
 * the current state of the object (potentially already extended by previous mixins) and
 * returns a new object with additional properties or methods.
 *
 * @template T - The base object type that the mixin accepts
 * @template R - The return type of the mixin (typically T extended with new properties)
 */
export type Mixin<T, R> = (base: Readonly<T>) => R;

/**
 * Computes the final type after applying a sequence of mixins to a base type.
 *
 * This type utility combines the base type with all mixin return types into a single
 * intersection type, then patches all chainable methods to ensure they return the
 * fully composed type. This enables proper type inference and autocomplete for
 * method chaining across multiple mixins.
 *
 * @template T - The base object type
 * @template M - Readonly array of mixin functions
 */
type ApplyMixins<
  T extends object,
  M extends readonly Mixin<object, unknown>[],
> = PatchTypedChainMethod<T & IntersectReturnTypes<M>>;

/**
 * Creates an expectation object by applying mixins with automatic negation support.
 *
 * This function is the primary way to construct expectation objects in the Probitas
 * testing framework. It takes a factory function that produces an array of mixins
 * based on a negation getter function, applies them sequentially to build up the
 * expectation object, and automatically adds a `not` property for assertion negation.
 *
 * ## Negation Behavior
 *
 * The `not` property toggles a negation flag that is consumed by **the immediately following method call only**.
 * After the method executes, the negation flag is automatically reset to `false`, ensuring that subsequent
 * method calls in the chain are not affected.
 *
 * Each access to `.not` **toggles** the negation state:
 * - `.not` → negated (true)
 * - `.not.not` → positive (false, toggled twice)
 * - `.not.not.not` → negated (true, toggled three times)
 *
 * This toggle-based negation behavior allows for intuitive chaining:
 * - `.not.toBeOk()` - Only `toBeOk()` is negated
 * - `.not.toBeOk().toHaveValue(y)` - Only `toBeOk()` is negated, `toHaveValue(y)` is positive
 * - `.not.not.toBeOk()` - Positive (double negation cancels out)
 * - `.not.toBeOk().not.toHaveValue(y)` - Both are negated independently
 *
 * **Important**: Accessing `.not` without calling a method (e.g., in `assertExists(exp.not)`)
 * will toggle the negation flag for the next method call, which may cause unexpected behavior.
 *
 * @template M - Readonly tuple of mixin functions inferred from the factory
 * @param mixins - Factory function that receives a negation getter and returns an array of mixins to apply
 * @returns Fully composed expectation object with all mixin methods and negation support
 *
 * @example
 * ```ts
 * import { defineExpectation } from "./define.ts";
 * import { createOkMixin } from "./ok_mixin.ts";
 *
 * const result = { ok: true, value: "test" };
 *
 * const expectation = defineExpectation((negate, expectOrigin) => [
 *   createOkMixin(() => result.ok, negate, { valueName: "result", expectOrigin }),
 * ]);
 *
 * expectation.toBeOk();
 * ```
 */
export function defineExpectation<
  const M extends readonly Mixin<object, unknown>[],
>(
  mixins: (negate: () => boolean, expectOrigin: Origin | undefined) => M,
) {
  type Result = ApplyMixins<{ readonly not: Result }, M>;

  // Capture the expect() call site origin
  const expectOrigin = captureOrigin();

  // State to track whether the next method call should be negated
  const state = { nextNegate: false };

  // Getter function that returns and consumes the negation flag
  const getNegate = () => {
    const result = state.nextNegate;
    state.nextNegate = false; // Reset after consumption
    return result;
  };

  // deno-lint-ignore no-explicit-any
  let applied: any = {};
  for (const mixin of mixins(getNegate, expectOrigin)) {
    applied = mixin(applied);
  }

  // Add the 'not' property that toggles the negation flag
  Object.defineProperty(applied, "not", {
    get() {
      state.nextNegate = !state.nextNegate;
      return applied; // Return the same object
    },
  });

  return applied as Result;
}
