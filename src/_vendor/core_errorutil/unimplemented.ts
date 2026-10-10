/**
 * Error indicating that this part is unimplemented.
 */
export class UnimplementedError extends Error {
  constructor(message = "unimplemented") {
    super(message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UnimplementedError);
    }

    this.name = this.constructor.name;
  }
}

/**
 * Function indicating that this part is unimplemented.
 *
 * For example, defining a mock object with `unimplemented` function should look like this:
 *
 * ```ts
 * import { unimplemented } from "@core/errorutil/unimplemented";
 *
 * type Service = {
 *   get(id: string): Promise<string>;
 *   set(id: string, item: string): Promise<void>;
 * };
 *
 * const _mock: Service = {
 *   get: () => unimplemented(),
 *   set: () => unimplemented(),
 * };
 * ```
 */
export function unimplemented(message = "unimplemented"): never {
  throw new UnimplementedError(message);
}
