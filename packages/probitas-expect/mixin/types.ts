import type { Origin } from "@probitas/core/origin";
import type { Theme } from "@probitas/core/theme";
import type { ToPascalCase } from "../utils.ts";
import type { PatchTypedChainMethod, Simplify } from "./_typeutils.ts";

/**
 * Configuration for a mixin that defines value type assertions and method naming.
 *
 * This interface is used to configure mixin generation, specifying the value type name
 * and optionally the base name for generated methods. The method base determines the
 * prefix for assertion methods like `toBe{MethodBase}`, `toEqual{MethodBase}`, etc.
 *
 * @template ValueName - The name of the value type (e.g., "string", "number", "array")
 * @template MethodBase - The base name for methods (defaults to PascalCase of ValueName)
 *
 * @example
 * ```ts
 * const config: MixinConfig<"string"> = { valueName: "string" };
 * // Generates methods like: toBeString(), toEqualString()
 *
 * const customConfig: MixinConfig<"array", "Array"> = {
 *   valueName: "array",
 *   methodBase: "Array"
 * };
 * // Generates methods like: toBeArray(), toEqualArray()
 * ```
 */
export interface MixinConfig<
  ValueName extends string = string,
  MethodBase extends string = ToPascalCase<ValueName>,
> {
  readonly valueName: ValueName;
  readonly methodBase?: MethodBase;
  /** Origin of the expect() call site for error context */
  readonly expectOrigin?: Origin;
  /** Theme for styling error messages */
  readonly theme?: Theme;
  /** The subject (value being tested) for error messages */
  readonly subject?: unknown;
}

/**
 * Extracts the method base name from a MixinConfig.
 *
 * This utility type extracts the method base from a configuration. If `methodBase` is
 * explicitly provided in the config, it uses that value. Otherwise, it converts the
 * `valueName` to PascalCase and uses it as the method base.
 *
 * @template C - The MixinConfig to extract from
 *
 * @example
 * ```ts
 * type Config1 = { valueName: "string" };
 * type Base1 = ExtractMethodBase<Config1>; // "String"
 *
 * type Config2 = { valueName: "custom_type", methodBase: "CustomType" };
 * type Base2 = ExtractMethodBase<Config2>; // "CustomType"
 * ```
 */
export type ExtractMethodBase<C extends MixinConfig> = C extends {
  readonly methodBase: infer MethodBase;
} ? MethodBase extends string ? MethodBase
  : never
  : C extends {
    readonly valueName: infer ValueName;
  } ? ValueName extends string ? ToPascalCase<ValueName> : never
  : never;

/**
 * Converts a tuple of key-value pairs into an object type definition for a mixin.
 *
 * This utility type transforms an array of key-value pair tuples into a proper object
 * type. It's used to define the shape of methods and properties that a mixin adds to
 * the base expectation object.
 *
 * @template A - Array of readonly tuples representing key-value pairs
 *
 * @example
 * ```ts
 * type Methods = MixinDefinition<[
 *   ["toBeString", () => void],
 *   ["toHaveLength", (length: number) => void]
 * ]>;
 * // Result: { toBeString: () => void; toHaveLength: (length: number) => void }
 * ```
 */
export type MixinDefinition<
  A extends [key: string, value: unknown][] = [],
> = {
  [K in A[number][0]]: Extract<A[number], readonly [K, unknown]>[1];
};

/**
 * Applies a mixin to a base type with proper method chain type patching.
 *
 * This type combines a base type with a mixin definition, ensuring that all chainable
 * methods have their types properly updated to reflect the full combined interface.
 * It's the final step in mixin composition that ensures type safety and proper IDE
 * autocomplete across method chains.
 *
 * @template T - The base type to extend
 * @template M - The mixin definition to apply
 *
 * @example
 * ```ts
 * type Base = { value: unknown };
 * type StringMixin = MixinDefinition<[
 *   ["toBeString", (this: Base & StringMixin) => Base & StringMixin]
 * ]>;
 * type Extended = MixinApplied<Base, StringMixin>;
 * // Extended has both Base properties and StringMixin methods with proper chaining
 * ```
 */
export type MixinApplied<T extends object, M extends MixinDefinition> =
  Simplify<
    PatchTypedChainMethod<T & M>
  >;
