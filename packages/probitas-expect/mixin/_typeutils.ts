/**
 * Empty object type used as the identity element for intersection types.
 * Intersecting with Unit (`T & Unit`) has no runtime or type-level effect,
 * but helps trigger TypeScript's type simplification.
 */
// deno-lint-ignore ban-types
export type Unit = {};

/**
 * Simplifies complex intersection types for better IDE display and error messages.
 *
 * This type takes a potentially complex type (especially intersections) and produces
 * an equivalent type with simplified representation. It's particularly useful when
 * combining multiple mixins or type utilities.
 *
 * @template T - The type to simplify
 *
 * @example
 * ```ts
 * type Complex = { a: string } & { b: number } & { c: boolean };
 * type Simple = Simplify<Complex>; // { a: string; b: number; c: boolean }
 * ```
 */
export type Simplify<T> =
  & {
    [K in keyof T]: T[K];
  }
  & Unit;

/**
 * Represents a method that returns `this` for method chaining, with type information
 * about the `this` context and method arguments.
 *
 * @template T - The type of the `this` context
 * @template A - Tuple type of the method arguments
 */
export type TypedChainMethod<T extends object, A extends unknown[]> = (
  this: T,
  ...args: A
) => T;

/**
 * Recursively patches method chain types in an object to include accumulated type information.
 *
 * This utility is essential for mixin composition. When combining multiple mixins that add
 * chainable methods, this type ensures each method's return type includes all properties
 * from previously chained methods.
 *
 * @template T - The type to patch
 *
 * @example
 * ```ts
 * import type { PatchTypedChainMethod } from "./_typeutils.ts";
 *
 * type StringMixin = { toBeString(): StringMixin };
 * type ArrayMixin = { toHaveLength(n: number): ArrayMixin };
 * type Combined = StringMixin & ArrayMixin;
 * type Patched = PatchTypedChainMethod<Combined>;
 * ```
 */
export type PatchTypedChainMethod<
  T,
> = T extends object ? {
    [K in keyof T]: T[K] extends TypedChainMethod<infer U, infer A>
      ? TypedChainMethod<PatchTypedChainMethod<T & U>, A>
      : T[K];
  }
  : T;

/**
 * Any function type used as a constraint for generic function processing.
 */
// deno-lint-ignore no-explicit-any
export type AnyFunction = (...args: any[]) => any;

/**
 * Creates an intersection type from the return types of an array of functions.
 *
 * This type recursively processes a tuple of functions and combines all their return types
 * into a single intersection type. It's used to compose multiple mixin factory functions
 * and merge their resulting types.
 *
 * @template Funcs - Readonly tuple of functions whose return types will be intersected
 *
 * @example
 * ```ts
 * const mixins = [
 *   () => ({ a: 1 }),
 *   () => ({ b: 2 }),
 *   () => ({ c: 3 }),
 * ] as const;
 * type Combined = IntersectReturnTypes<typeof mixins>; // { a: number } & { b: number } & { c: number }
 * ```
 */
export type IntersectReturnTypes<Funcs extends readonly AnyFunction[]> =
  Funcs extends readonly [infer F, ...infer R] ?
      & (F extends AnyFunction ? ReturnType<F> : Unit)
      & (R extends readonly AnyFunction[] ? IntersectReturnTypes<R> : Unit)
    : Unit;
