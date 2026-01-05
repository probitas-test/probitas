/**
 * Shared utilities for subprocess templates
 *
 * These utilities are used by subprocess entry points (run.ts, list.ts)
 * for TCP-based IPC communication with the parent process.
 *
 * Using TCP instead of stdin/stdout allows subprocess to use console.log
 * freely without corrupting IPC messages.
 *
 * IMPORTANT: This module must be self-contained with no relative imports
 * outside of _templates/. External dependencies are resolved at template
 * build time via JSR specifiers.
 *
 * @module
 * @internal
 */

import { JsonParseStream } from "@std/json/parse-stream";
import { TextLineStream } from "@std/streams";

export { configureLogging } from "./logging.ts";

/**
 * IPC connection to parent process
 */
export interface IpcConnection {
  /** Readable stream for receiving NDJSON from parent */
  readable: ReadableStream<unknown>;
  /** Writer for sending NDJSON to parent (exclusive access) */
  writer: WritableStreamDefaultWriter<Uint8Array>;
  /** Text encoder for converting strings to bytes */
  encoder: TextEncoder;
  /** Close the underlying TCP connection (async to properly flush writes) */
  close: () => Promise<void>;
}

/**
 * Parse --ipc-port from command line arguments
 *
 * @param args - Command line arguments (typically Deno.args)
 * @returns IPC port number
 * @throws If --ipc-port is not provided or invalid
 */
export function parseIpcPort(args: string[]): number {
  const portIndex = args.indexOf("--ipc-port");
  if (portIndex === -1 || portIndex + 1 >= args.length) {
    throw new Error("Missing required --ipc-port argument");
  }

  const port = parseInt(args[portIndex + 1], 10);
  if (isNaN(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid --ipc-port value: ${args[portIndex + 1]}`);
  }

  return port;
}

/**
 * Connect to parent process IPC server
 *
 * @param port - TCP port to connect to
 * @returns IPC connection with typed streams
 */
export async function connectIpc(port: number): Promise<IpcConnection> {
  const conn = await Deno.connect({ port, hostname: "127.0.0.1" });

  // Create NDJSON readable stream from connection
  const readable = conn.readable
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream())
    .pipeThrough(new JsonParseStream());

  // Get exclusive writer for the writable stream
  const writer = conn.writable.getWriter();

  return {
    readable,
    writer,
    encoder: new TextEncoder(),
    close: async () => {
      try {
        // Await writer.close() to ensure all pending writes are flushed
        await writer.close();
      } catch {
        // Already closed or errored
      }
      try {
        conn.close();
      } catch {
        // Already closed
      }
    },
  };
}

/**
 * Read input from parent process via IPC
 *
 * Reads and parses the first JSON message from the IPC connection.
 *
 * @param ipc - IPC connection
 * @returns Parsed input object
 */
export async function readInput(ipc: IpcConnection): Promise<unknown> {
  const reader = ipc.readable.getReader();
  try {
    const result = await reader.read();
    if (result.done) {
      throw new Error("IPC connection closed before receiving input");
    }
    return result.value;
  } finally {
    reader.releaseLock();
  }
}

/**
 * Write output to parent process via IPC (NDJSON format)
 *
 * Serializes the output object to JSON and writes to the IPC connection.
 * Each output is a single line for streaming.
 * Uses the exclusive writer from IpcConnection to ensure serialized writes.
 *
 * @param ipc - IPC connection
 * @param output - Object to serialize and write
 */
export async function writeOutput(
  ipc: IpcConnection,
  output: unknown,
): Promise<void> {
  const data = ipc.encoder.encode(JSON.stringify(output) + "\n");
  await ipc.writer.write(data);
}

/**
 * Close IPC connection
 *
 * @param ipc - IPC connection to close
 */
export async function closeIpc(ipc: IpcConnection): Promise<void> {
  await ipc.close();
}
