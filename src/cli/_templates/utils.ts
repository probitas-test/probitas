/**
 * Shared utilities for subprocess templates (Subprocess Side)
 *
 * These utilities are used by subprocess entry points (run.ts, list.ts)
 * for TCP-based IPC communication with the parent process.
 *
 * ## Architecture: Subprocess vs Parent IPC
 *
 * This module handles the **subprocess** side of IPC, while
 * `../subprocess.ts` handles the **parent process** side.
 *
 * Key design decisions for subprocess side:
 * - Pre-acquired `reader`/`writer` for consistent typed API
 * - Automatic CBOR stream piping (encoder.readable → TCP, TCP → decoder)
 * - `runSubprocess()` factory for standardized bootstrap
 * - Simpler error handling (errors propagate to parent)
 *
 * See `../subprocess.ts` module docs for the full architecture explanation.
 *
 * IMPORTANT: This module must be self-contained with no relative imports
 * outside of _templates/. External dependencies are resolved at template
 * build time via JSR specifiers.
 *
 * @module
 * @internal
 */

import {
  type ErrorObject,
  fromErrorObject,
  toErrorObject,
} from "@core/errorutil/error-object";
import { createConnection } from "node:net";
import process from "node:process";
import { decodeFrames, encodeFrame } from "./frame.ts";

export { configureLogging } from "./logging.ts";
export type { ErrorObject } from "@core/errorutil/error-object";

/**
 * Serialize an error for cross-process transmission
 *
 * Converts any error (or non-error value) to ErrorObject format
 * that can be safely transmitted via CBOR.
 *
 * @param error - Error or value to serialize
 * @returns Serialized error object
 */
export function serializeError(error: unknown): ErrorObject {
  const err = error instanceof Error ? error : new Error(String(error));
  return toErrorObject(err);
}

/**
 * Deserialize an error from cross-process transmission
 *
 * Restores Error instance from ErrorObject format.
 *
 * @param serialized - Serialized error object
 * @returns Restored Error instance
 */
export function deserializeError(serialized: ErrorObject): Error {
  return fromErrorObject(serialized);
}

/**
 * IPC connection to parent process
 */
export interface IpcConnection {
  /** Decoded frames from the parent */
  readonly frames: AsyncIterator<unknown>;
  /** Write one encoded frame, honoring socket backpressure */
  readonly write: (frame: Uint8Array) => Promise<void>;
  /** Flush pending writes and close the connection */
  readonly close: () => Promise<void>;
}

/**
 * Parse --ipc-port from command line arguments
 *
 * @throws If --ipc-port is not provided or invalid
 */
export function parseIpcPort(args: string[]): number {
  const portIndex = args.indexOf("--ipc-port");
  if (portIndex === -1 || portIndex + 1 >= args.length) {
    throw new Error("Missing required --ipc-port argument");
  }

  const port = parseInt(args[portIndex + 1], 10);
  if (Number.isNaN(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid --ipc-port value: ${args[portIndex + 1]}`);
  }

  return port;
}

/**
 * Connect to parent process IPC server
 */
export async function connectIpc(port: number): Promise<IpcConnection> {
  const sock = createConnection({ port, host: "127.0.0.1" });
  await new Promise<void>((resolve, reject) => {
    sock.once("connect", () => resolve());
    sock.once("error", reject);
  });
  const frames = decodeFrames(sock as AsyncIterable<Uint8Array>)[
    Symbol.asyncIterator
  ]();

  return {
    frames,
    write: (frame) =>
      new Promise<void>((resolve, reject) => {
        sock.write(frame, (err) => err ? reject(err) : resolve());
      }),
    close: () =>
      new Promise<void>((resolve) => {
        sock.end(() => resolve());
      }),
  };
}

/**
 * Read input from parent process via IPC
 */
export async function readInput(ipc: IpcConnection): Promise<unknown> {
  const result = await ipc.frames.next();
  if (result.done) {
    throw new Error("IPC connection closed before receiving input");
  }
  return result.value;
}

/**
 * Write output to parent process via IPC
 */
export async function writeOutput(
  ipc: IpcConnection,
  output: unknown,
): Promise<void> {
  await ipc.write(encodeFrame(output));
}

/**
 * Close IPC connection
 */
export async function closeIpc(ipc: IpcConnection): Promise<void> {
  await ipc.close();
}

/**
 * Create a type guard function for protocol output validation
 *
 * All subprocess outputs must have a `type` discriminator field.
 * This factory creates a validator that checks:
 * 1. Value is a non-null object
 * 2. Has a `type` property that is a string
 * 3. `type` is one of the valid types
 *
 * @param validTypes - Array of valid type discriminator values
 * @returns Type guard function
 *
 * @example
 * ```ts ignore
 * type MyOutput = { type: "result"; data: string } | { type: "error"; message: string };
 * const isMyOutput = createOutputValidator<MyOutput>(["result", "error"]);
 * ```
 */
export function createOutputValidator<T extends { type: string }>(
  validTypes: readonly string[],
): (value: unknown) => value is T {
  const typeSet = new Set(validTypes);
  return (value: unknown): value is T =>
    value !== null &&
    typeof value === "object" &&
    "type" in value &&
    typeof value.type === "string" &&
    typeSet.has(value.type);
}

/**
 * Handler function for subprocess execution
 *
 * Receives the IPC connection and parsed input, and is responsible
 * for processing and writing success outputs. Errors thrown are
 * caught by the bootstrap and written as error outputs.
 */
export type SubprocessHandler<I> = (
  ipc: IpcConnection,
  input: I,
) => Promise<void>;

/**
 * Run a subprocess with standardized bootstrap logic
 *
 * This factory handles the common subprocess lifecycle:
 * 1. Parse --ipc-port from command line arguments
 * 2. Connect to parent process IPC server
 * 3. Read input from IPC
 * 4. Execute the handler
 * 5. Catch errors and write error output
 * 6. Close IPC connection
 * 7. Exit process
 *
 * The handler is responsible for writing success outputs.
 * Any errors thrown by the handler are caught and written as
 * `{ type: "error", error: ErrorObject }`.
 *
 * @param handler - Function to process input and write outputs
 *
 * @example
 * ```ts ignore
 * runSubprocess<{ filePaths: string[] }>(async (ipc, input) => {
 *   const result = await doWork(input.filePaths);
 *   await writeOutput(ipc, { type: "result", data: result });
 * });
 * ```
 */
export function runSubprocess<I>(handler: SubprocessHandler<I>): void {
  const main = async (): Promise<void> => {
    // Parse IPC port from command line arguments
    const port = parseIpcPort(process.argv);

    // Connect to parent process IPC server
    const ipc = await connectIpc(port);

    try {
      // Read input from IPC (TCP connection establishes readiness)
      const input = await readInput(ipc) as I;

      // Execute handler (responsible for writing success outputs)
      await handler(ipc, input);
    } catch (error) {
      // Write error output
      try {
        await writeOutput(ipc, {
          type: "error",
          error: serializeError(error),
        });
      } catch {
        // Failed to write error to IPC, log to console as fallback
        console.error("Subprocess error:", error);
      }
    } finally {
      // Await close to ensure all pending writes are flushed
      await closeIpc(ipc);
    }
  };

  // Run main and exit explicitly to avoid async operations keeping process alive
  main().finally(() => {
    // Ensure process exits after output is flushed
    setTimeout(() => process.exit(0), 0);
  });
}
