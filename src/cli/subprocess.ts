/**
 * Subprocess utilities for scenario execution (Parent Process Side)
 *
 * Spawns deno subprocess with TCP-based IPC communication.
 * This avoids stdin/stdout pollution from user code (e.g., console.log).
 *
 * ## Architecture: Parent vs Subprocess IPC
 *
 * This module handles the **parent process** side of IPC, while
 * `_templates/utils.ts` handles the **subprocess** side.
 *
 * The two sides have intentionally different stream patterns:
 *
 * ### Parent Process (this module)
 * - Uses raw `Uint8Array` streams from TCP connection
 * - Manual CBOR encoding via `encodeToCbor()` for one-shot input sending
 * - Manual CBOR decoding via `createCborStream()` for validated output streaming
 * - Manages lifecycle: spawn → connect → send → receive → cleanup
 *
 * ### Subprocess (`_templates/utils.ts`)
 * - Uses pre-acquired `reader`/`writer` with piped CBOR streams
 * - Automatic encoding: write CborStreamInput → encoder → TCP
 * - Automatic decoding: TCP → decoder → read CborStreamOutput
 * - Simpler API since subprocess lifecycle is managed by parent
 *
 * This asymmetry exists because:
 * 1. Parent needs fine-grained control for validation and multiple outputs
 * 2. Subprocess can use simpler fire-and-forget streaming
 * 3. Parent manages resources; subprocess just uses them
 *
 * @module
 */

import {
  CborSequenceDecoderStream,
  CborSequenceEncoderStream,
} from "@std/cbor";
import {
  fromCborStreamOutput,
  toCborStreamInput,
} from "./_templates/serializer.ts";
import { dirname, join } from "@std/path";
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
 * Check if --config or --no-config is already specified in deno args
 */
function hasConfigOption(denoArgs: readonly string[]): boolean {
  return denoArgs.some((arg) =>
    arg === "--config" ||
    arg.startsWith("--config=") ||
    arg === "--no-config"
  );
}

/**
 * Find deno.json or deno.jsonc by searching upward from the specified directory
 *
 * Mimics Deno's behavior (since v1.18): recursively searches the current
 * directory and all parent directories until a config file is found or
 * the filesystem root is reached.
 *
 * @param cwd - Directory to start searching from
 * @returns Path to config file if found, undefined otherwise
 */
function findDenoConfig(cwd: string): string | undefined {
  const configCandidates = ["deno.json", "deno.jsonc"];
  let currentDir = cwd;

  // Search upward through parent directories
  while (true) {
    for (const candidate of configCandidates) {
      const configPath = join(currentDir, candidate);
      try {
        const stat = Deno.statSync(configPath);
        if (stat.isFile) {
          return configPath;
        }
      } catch {
        // File doesn't exist, try next candidate
      }
    }

    // Move to parent directory
    const parentDir = dirname(currentDir);

    // Stop if we've reached the filesystem root
    if (parentDir === currentDir) {
      break;
    }

    currentDir = parentDir;
  }

  return undefined;
}

/**
 * Ensure --config option is present if not explicitly disabled
 *
 * If neither --config nor --no-config is specified, automatically
 * searches for deno.json/deno.jsonc starting from cwd and recursively
 * checking parent directories (matching Deno's auto-detection behavior).
 *
 * @param denoArgs - Original deno arguments
 * @param cwd - Current working directory to start searching from
 * @returns Updated deno arguments with --config if applicable
 */
function ensureConfigOption(
  denoArgs: readonly string[],
  cwd: string,
): string[] {
  // If --config or --no-config is already specified, don't modify
  if (hasConfigOption(denoArgs)) {
    return [...denoArgs];
  }

  // Try to find deno.json or deno.jsonc
  const configPath = findDenoConfig(cwd);
  if (configPath) {
    return [...denoArgs, `--config=${configPath}`];
  }

  // No config file found, return original args
  return [...denoArgs];
}

/**
 * Spawn deno subprocess with the given options
 *
 * The subprocess communicates via TCP IPC, not stdin/stdout.
 * This allows subprocess to use console.log freely without corrupting IPC.
 *
 * If neither --deno-config nor --deno-no-config is specified, this function
 * automatically detects and adds --config pointing to deno.json/deno.jsonc
 * by recursively searching from cwd upward through parent directories
 * (matching Deno's native auto-detection behavior since v1.18).
 *
 * @param options - Subprocess options
 * @returns Spawned child process
 */
export function spawnDenoSubprocess(
  options: SpawnDenoOptions,
): Deno.ChildProcess {
  const { denoArgs, scriptPath, cwd, ipcPort, signal } = options;

  // Auto-detect and add --config if not specified
  const finalDenoArgs = ensureConfigOption(denoArgs, cwd);

  const command = new Deno.Command("deno", {
    args: [
      "run",
      "--unstable-kv", // Allow DenoKV
      "--allow-all", // Scenarios may need various permissions
      ...finalDenoArgs,
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
 * Provides read/write streams for CBOR communication.
 */
export interface IpcConnection {
  /** Readable stream for receiving data from subprocess */
  readable: ReadableStream<Uint8Array>;
  /** Writable stream for sending data to subprocess */
  writable: WritableStream<Uint8Array>;
  /** Close the connection */
  close(): Promise<void>;
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

/** Default timeout for IPC connection (30 seconds) */
const DEFAULT_IPC_TIMEOUT_MS = 30_000;

/**
 * Wait for subprocess to connect to IPC server with timeout
 *
 * @param listener - TCP listener from startIpcServer
 * @param options - Optional configuration
 * @returns IPC connection streams
 * @throws Error if connection times out or subprocess exits before connecting
 */
export async function waitForIpcConnection(
  listener: Deno.Listener,
  options?: {
    /** Subprocess to race against (detects early exit) */
    subprocess?: Deno.ChildProcess;
    /** Connection timeout in milliseconds (default: 30000) */
    timeoutMs?: number;
  },
): Promise<IpcConnection> {
  const { subprocess, timeoutMs = DEFAULT_IPC_TIMEOUT_MS } = options ?? {};

  // Flag to track if connection was established
  let connected = false;

  // Create timeout promise with cleanup
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      if (!connected) {
        reject(new Error(`IPC connection timeout after ${timeoutMs}ms`));
      }
    }, timeoutMs);
  });

  // Create subprocess exit promise (if subprocess provided)
  // Only reject if subprocess exits BEFORE connection is established
  const subprocessPromise = subprocess
    ? subprocess.status.then((status) => {
      if (!connected) {
        throw new Error(
          `Subprocess exited before IPC connection (code: ${status.code})`,
        );
      }
      // If already connected, return a never-resolving promise to keep race going
      return new Promise<never>(() => {});
    })
    : null;

  // Race connection against timeout and subprocess exit
  const racers: Promise<Deno.Conn>[] = [
    listener.accept(),
    timeoutPromise,
  ];
  if (subprocessPromise) {
    racers.push(subprocessPromise as Promise<never>);
  }

  try {
    const conn = await Promise.race(racers);
    connected = true;
    return {
      readable: conn.readable,
      writable: conn.writable,
      close: () => {
        try {
          conn.close();
        } catch {
          // Already closed
        }
        return Promise.resolve();
      },
    };
  } finally {
    // Clean up timeout
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
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
 * Create CBOR stream from IPC connection
 *
 * @typeParam T - Output type (must have `type` discriminator)
 * @param readable - Raw readable stream from IPC connection
 * @param validator - Type guard function to validate each output
 * @returns Typed readable stream of validated outputs
 */
export function createCborStream<T extends SubprocessOutput>(
  readable: ReadableStream<Uint8Array>,
  validator: (chunk: unknown) => chunk is T,
): ReadableStream<T> {
  const cborStream = readable.pipeThrough(new CborSequenceDecoderStream());
  const reader = cborStream.getReader();

  return new ReadableStream<T>({
    async pull(controller) {
      try {
        const result = await reader.read();
        if (result.done) {
          controller.close();
          return;
        }

        // Convert CborStreamOutput to regular value with custom type restoration
        const decoded = await fromCborStreamOutput(result.value);

        // Validate
        if (!validator(decoded)) {
          let decodedStr: string;
          try {
            decodedStr = JSON.stringify(decoded);
          } catch {
            decodedStr = String(decoded);
          }
          throw new Error(`Invalid subprocess output: ${decodedStr}`);
        }

        controller.enqueue(decoded);
      } catch (error) {
        controller.error(error);
      }
    },

    cancel() {
      reader.releaseLock();
    },
  });
}

/**
 * Encode a value to CBOR bytes
 *
 * Uses CborSequenceEncoderStream to encode the value, then collects
 * the output bytes. This provides standalone encoding without requiring
 * a persistent stream connection.
 *
 * IMPORTANT: Reading and writing must happen concurrently to avoid
 * backpressure deadlock. The encoder may block writes until the
 * readable side is being consumed.
 *
 * @param input - Value to encode
 * @returns CBOR-encoded bytes
 */
async function encodeToCbor(input: unknown): Promise<Uint8Array> {
  // Convert to CborStreamInput (handles custom types via tagged values)
  const cborInput = toCborStreamInput(input);

  // Create encoder and get reader/writer
  const encoder = new CborSequenceEncoderStream();
  const writer = encoder.writable.getWriter();
  const reader = encoder.readable.getReader();

  // Start collecting output BEFORE writing to avoid backpressure deadlock
  const collectPromise = (async () => {
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    return chunks;
  })();

  // Write input and close to flush
  await writer.write(cborInput);
  await writer.close();

  // Wait for collection to complete
  const chunks = await collectPromise;

  // Concatenate chunks into single Uint8Array
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

/**
 * Send CBOR input to subprocess via IPC
 *
 * @param writable - IPC writable stream
 * @param input - Input data to serialize and send
 */
export async function sendCborInput(
  writable: WritableStream<Uint8Array>,
  input: unknown,
): Promise<void> {
  const writer = writable.getWriter();
  try {
    // Encode to CBOR bytes
    const cborData = await encodeToCbor(input);

    // Single atomic write
    await writer.write(cborData);
  } finally {
    writer.releaseLock();
  }
}

/**
 * Resources to clean up after subprocess execution
 */
export interface SubprocessResources {
  /** Spawned subprocess */
  proc: Deno.ChildProcess;
  /** IPC connection to subprocess */
  ipc: IpcConnection;
  /** TCP listener for IPC */
  listener: Deno.Listener;
  /** Temporary directory containing subprocess script */
  tempDir: string;
}

/**
 * Clean up subprocess resources in the correct order
 *
 * Order matters:
 * 1. Wait for subprocess to exit (allows proper cleanup)
 * 2. Close IPC connection (flushes pending writes)
 * 3. Close TCP listener
 * 4. Remove temporary directory
 *
 * @param resources - Resources to clean up
 */
export async function cleanupSubprocess(
  resources: SubprocessResources,
): Promise<void> {
  const { proc, ipc, listener, tempDir } = resources;

  // Wait for subprocess to exit first to allow proper cleanup.
  // This prevents closing IPC while the subprocess is still writing,
  // which could cause "BadResource: Bad resource ID" errors.
  await proc.status;
  await ipc.close();
  listener.close();
  // Clean up temporary directory (ignore errors if already removed)
  await Deno.remove(tempDir, { recursive: true }).catch(() => {});
}

/**
 * Options for running a subprocess
 */
export interface RunSubprocessOptions<I> {
  /** URL to the subprocess template file */
  templateUrl: URL;
  /** Name of the template (for embedded templates lookup) */
  templateName: string;
  /** Input to send to subprocess */
  input: I;
  /** Additional deno arguments */
  denoArgs: string[];
  /** Current working directory */
  cwd: string;
  /** Optional AbortSignal for cancellation */
  signal?: AbortSignal;
}

/**
 * Result of running a subprocess
 */
export interface SubprocessResult<O extends SubprocessOutput> {
  /** Output stream from subprocess */
  outputStream: ReadableStream<O>;
  /** Resources for cleanup (use cleanupSubprocess when done) */
  resources: SubprocessResources;
}

/**
 * Start a subprocess and return the output stream
 *
 * This is a low-level function that sets up the subprocess infrastructure.
 * Caller is responsible for:
 * 1. Iterating over outputStream to process messages
 * 2. Calling cleanupSubprocess(resources) in a finally block
 *
 * For most use cases, prefer runSubprocessToCompletion() which handles
 * the full lifecycle including cleanup.
 *
 * @typeParam I - Input type
 * @typeParam O - Output type (must have `type` discriminator)
 * @param options - Subprocess options
 * @param validator - Type guard to validate output messages
 * @returns Output stream and resources for cleanup
 */
export async function startSubprocess<I, O extends SubprocessOutput>(
  options: RunSubprocessOptions<I>,
  validator: (value: unknown) => value is O,
): Promise<SubprocessResult<O>> {
  const { templateUrl, templateName, input, denoArgs, cwd, signal } = options;

  // Start IPC server and get port
  const { listener, port } = startIpcServer();

  // Prepare subprocess script (resolve bare specifiers)
  const { scriptPath, tempDir } = await prepareSubprocessScript(
    templateUrl,
    templateName,
  );

  // Spawn subprocess
  const proc = spawnDenoSubprocess({
    denoArgs,
    scriptPath,
    cwd,
    ipcPort: port,
    signal,
  });

  // Wait for subprocess to connect (connection = ready)
  // Race against subprocess exit to detect early failures
  const ipc = await waitForIpcConnection(listener, { subprocess: proc });

  // Create CBOR stream from IPC connection
  const outputStream = createCborStream(ipc.readable, validator);

  // Send input to subprocess via IPC
  await sendCborInput(ipc.writable, input);

  return {
    outputStream,
    resources: { proc, ipc, listener, tempDir },
  };
}

/**
 * Handler for subprocess output messages
 *
 * Process each output message and optionally return a final result.
 * When a result is returned, the subprocess execution completes.
 *
 * @typeParam O - Output type
 * @typeParam R - Result type
 */
export type SubprocessOutputHandler<O, R> = (output: O) => Promise<R | void>;

/**
 * Run a subprocess to completion
 *
 * This high-level function handles the full subprocess lifecycle:
 * 1. Start subprocess and establish IPC connection
 * 2. Send input to subprocess
 * 3. Process output messages via handler
 * 4. Clean up resources automatically
 *
 * @typeParam I - Input type
 * @typeParam O - Output type (must have `type` discriminator)
 * @typeParam R - Result type returned by handler
 * @param options - Subprocess options
 * @param validator - Type guard to validate output messages
 * @param handler - Function to process each output message
 * @returns Result from handler
 * @throws Error if subprocess ends without returning a result
 */
export async function runSubprocessToCompletion<
  I,
  O extends SubprocessOutput,
  R,
>(
  options: RunSubprocessOptions<I>,
  validator: (value: unknown) => value is O,
  handler: SubprocessOutputHandler<O, R>,
): Promise<R> {
  const { outputStream, resources } = await startSubprocess(options, validator);

  try {
    for await (const output of outputStream) {
      const result = await handler(output);
      if (result !== undefined) {
        return result;
      }
    }

    // Handle abort case
    if (options.signal?.aborted) {
      throw new Error("Subprocess aborted");
    }

    throw new Error("Subprocess ended without sending result");
  } finally {
    await cleanupSubprocess(resources);
  }
}
