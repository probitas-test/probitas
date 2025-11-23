/**
 * Defer helper - executes cleanup function when scope exits
 * Similar to Go's defer statement
 *
 * @example Synchronous cleanup
 * ```ts
 * import { defer } from "probitas/helper/defer";
 *
 * function processFile() {
 *   using _cleanup = defer(() => console.log("File processing completed"));
 *   console.log("Processing file...");
 *   // File processing logic here
 *   // cleanup function will be called automatically when scope exits
 * }
 * ```
 *
 * @example Asynchronous cleanup
 * ```ts
 * import { defer } from "probitas/helper/defer";
 *
 * async function connectToDatabase() {
 *   const connection = await openConnection();
 *   await using _cleanup = defer(async () => {
 *     console.log("Closing database connection...");
 *     await connection.close();
 *   });
 *
 *   // Use connection here
 *   await connection.query("SELECT * FROM users");
 *   // connection will be closed automatically when scope exits
 * }
 * ```
 *
 * @example Multiple defers (executes in reverse order)
 * ```ts
 * import { defer } from "probitas/helper/defer";
 *
 * function multipleCleanups() {
 *   using _cleanup1 = defer(() => console.log("Third"));
 *   using _cleanup2 = defer(() => console.log("Second"));
 *   using _cleanup3 = defer(() => console.log("First"));
 *   console.log("Executing main logic");
 *   // Output:
 *   // Executing main logic
 *   // First
 *   // Second
 *   // Third
 * }
 * ```
 */

export function defer(fn: () => void): Disposable;
export function defer(fn: () => Promise<void>): AsyncDisposable;
export function defer(
  fn: (() => void) | (() => Promise<void>),
): Disposable | AsyncDisposable {
  // Both symbols are provided to allow flexibility in usage
  // TypeScript's overloads ensure type-safe usage at compile time
  return {
    [Symbol.dispose]: fn as () => void,
    [Symbol.asyncDispose]: fn as () => Promise<void>,
  } as Disposable | AsyncDisposable;
}
