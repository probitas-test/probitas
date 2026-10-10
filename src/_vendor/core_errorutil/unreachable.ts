/**
 * Error indicating that this part is unreachable.
 */
export class UnreachableError extends Error {
  readonly args: unknown[];

  constructor(args: unknown[]) {
    super(`unreachable: ${args}`);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UnreachableError);
    }

    this.name = this.constructor.name;
    this.args = args;
  }
}

/**
 * Function indicating that this part is unreachable.
 *
 * For example, the following code passed type checking.
 *
 * ```ts
 * import { unreachable } from "@core/errorutil/unreachable";
 *
 * type Animal = "dog" | "cat";
 *
 * function say(animal: Animal): void {
 *   switch (animal) {
 *     case "dog":
 *       console.log("dog");
 *       break;
 *     case "cat":
 *       console.log("dog");
 *       break;
 *     default:
 *       unreachable(animal);
 *   }
 * }
 * say("dog");
 * ```
 *
 * But the following code because a case for "bird" is missing.
 *
 * ```ts
 * import { unreachable } from "@core/errorutil/unreachable";
 *
 * type Animal = "dog" | "cat" | "bird";
 *
 * function say(animal: Animal): void {
 *   switch (animal) {
 *     case "dog":
 *       console.log("dog");
 *       break;
 *     case "cat":
 *       console.log("dog");
 *       break;
 *     default: {
 *       // The line below causes a type error if we uncomment it.
 *       // error: TS2345 [ERROR]: Argument of type 'string' is not assignable to parameter of type 'never'.
 *       //unreachable(animal);
 *     }
 *   }
 * }
 * say("dog");
 * ```
 */
export function unreachable(...args: never[]): never {
  throw new UnreachableError(args);
}
