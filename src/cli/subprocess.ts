/**
 * Subprocess utilities for scenario execution
 *
 * Spawns deno subprocess with TCP-based IPC communication.
 * This avoids stdin/stdout pollution from user code (e.g., console.log).
 *
 * @module
 */

import { JsonParseStream } from "@std/json/parse-stream";
import { dirname, join } from "@std/path";
import { TextLineStream } from "@std/streams";
import {
  type ResolvedTemplateFiles,
  resolveSubprocessTemplate,
} from "./subprocess_template.ts";

/**
 * Embedded templates type for compiled binaries
 *
 * Maps template name to a record of relative paths to resolved source code.
 */
export type EmbeddedTemplates = Record<string, Record<string, string>>;

// Try to import embedded templates (available in compiled binary)
let embeddedTemplates: EmbeddedTemplates | null = null;
try {
  const mod = await import("./_embedded_templates.ts");
  embeddedTemplates = mod.embeddedTemplates;
} catch {
  // Not available (development mode)
}

/**
 * Options for spawning deno subprocess with IPC
 */
export interface SpawnDenoOptions {
  /** Additional deno arguments (e.g., --config, --lock) */
  denoArgs: string[];
  /** Path to the subprocess script */
  scriptPath: string;
  /** Current working directory */
  cwd: string;
  /** TCP port for IPC communication */
  ipcPort: number;
  /** Optional AbortSignal for cancellation */
  signal?: AbortSignal;
}

/**
 * Result of preparing subprocess script
 */
export interface PreparedScript {
  /** Path to the prepared script entry point */
  scriptPath: string;
  /** Path to the temporary directory (for cleanup) */
  tempDir: string;
}

/**
 * Prepare subprocess script by resolving imports and writing to temp directory
 *
 * @param templateUrl - URL to the subprocess template file
 * @param templateName - Name of the template (for embedded templates lookup)
 * @returns Prepared script info including path and temp directory for cleanup
 */
export async function prepareSubprocessScript(
  templateUrl: URL,
  templateName: string,
): Promise<PreparedScript> {
  // Get resolved files - either from embedded templates or resolve at runtime
  let files: ResolvedTemplateFiles;
  const embedded = embeddedTemplates?.[templateName];
  if (embedded) {
    // Convert embedded record to Map
    files = new Map(Object.entries(embedded));
  } else {
    // Resolve at runtime (development mode)
    files = await resolveSubprocessTemplate(templateUrl);
  }

  // Write all files to temp directory
  const tempDir = await Deno.makeTempDir({ prefix: "probitas-" });

  for (const [relativePath, source] of files) {
    const filePath = join(tempDir, relativePath);

    // Ensure parent directory exists
    const dir = dirname(filePath);
    if (dir !== tempDir) {
      await Deno.mkdir(dir, { recursive: true });
    }

    await Deno.writeTextFile(filePath, source);
  }

  // Return script path and temp directory for cleanup
  return {
    scriptPath: join(tempDir, "subprocess.ts"),
    tempDir,
  };
}

/**
 * Spawn deno subprocess with the given options
 *
 * The subprocess communicates via TCP IPC, not stdin/stdout.
 * This allows subprocess to use console.log freely without corrupting IPC.
 *
 * @param options - Subprocess options
 * @returns Spawned child process
 */
export function spawnDenoSubprocess(
  options: SpawnDenoOptions,
): Deno.ChildProcess {
  const { denoArgs, scriptPath, cwd, ipcPort, signal } = options;

  const command = new Deno.Command("deno", {
    args: [
      "run",
      "--unstable-kv", // Allow DenoKV
      "--allow-all", // Scenarios may need various permissions
      ...denoArgs,
      scriptPath,
      "--ipc-port",
      String(ipcPort),
    ],
    cwd,
    stdin: "null", // No stdin needed - IPC uses TCP
    stdout: "inherit", // Allow subprocess console.log
    stderr: "inherit", // Allow subprocess console.error
    signal,
  });

  return command.spawn();
}

/**
 * IPC connection from subprocess
 *
 * Provides read/write streams for NDJSON communication.
 */
export interface IpcConnection {
  /** Readable stream for receiving NDJSON from subprocess */
  readable: ReadableStream<Uint8Array>;
  /** Writable stream for sending JSON to subprocess */
  writable: WritableStream<Uint8Array>;
  /** Close the connection */
  close(): void;
}

/**
 * Start TCP server for IPC and wait for subprocess connection
 *
 * @returns Listener and allocated port
 */
export function startIpcServer(): { listener: Deno.Listener; port: number } {
  const listener = Deno.listen({ port: 0, hostname: "127.0.0.1" });
  const addr = listener.addr as Deno.NetAddr;
  return { listener, port: addr.port };
}

/**
 * Wait for subprocess to connect to IPC server
 *
 * @param listener - TCP listener from startIpcServer
 * @returns IPC connection streams
 */
export async function waitForIpcConnection(
  listener: Deno.Listener,
): Promise<IpcConnection> {
  const conn = await listener.accept();
  return {
    readable: conn.readable,
    writable: conn.writable,
    close: () => {
      try {
        conn.close();
      } catch {
        // Already closed
      }
    },
  };
}

/**
 * Output type constraint for subprocess protocol
 *
 * All subprocess outputs must have a `type` discriminator field.
 */
export interface SubprocessOutput {
  type: string;
}

/**
 * Create NDJSON stream from IPC connection
 *
 * Transforms raw byte stream into parsed and validated JSON objects.
 *
 * @typeParam T - Output type (must have `type` discriminator)
 * @param readable - Raw readable stream from IPC connection
 * @param validator - Type guard function to validate each output
 * @returns Typed readable stream of validated outputs
 */
export function createNdjsonStream<T extends SubprocessOutput>(
  readable: ReadableStream<Uint8Array>,
  validator: (chunk: unknown) => chunk is T,
): ReadableStream<T> {
  return readable
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream())
    .pipeThrough(new JsonParseStream())
    .pipeThrough(
      new TransformStream<unknown, T>({
        transform(chunk, controller) {
          if (!validator(chunk)) {
            throw new Error(
              `Invalid subprocess output: ${JSON.stringify(chunk)}`,
            );
          }
          controller.enqueue(chunk);
        },
      }),
    );
}

/**
 * Send JSON input to subprocess via IPC
 *
 * Serializes input as JSON line and writes to IPC connection.
 * Does NOT close the stream (allows for further communication).
 *
 * @param writable - IPC writable stream
 * @param input - Input data to serialize and send
 */
export async function sendJsonInput(
  writable: WritableStream<Uint8Array>,
  input: unknown,
): Promise<void> {
  const encoder = new TextEncoder();
  const writer = writable.getWriter();
  try {
    // Send as NDJSON (newline-delimited JSON)
    await writer.write(encoder.encode(JSON.stringify(input) + "\n"));
  } finally {
    writer.releaseLock();
  }
}
