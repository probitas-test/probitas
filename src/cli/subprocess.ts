/**
 * Subprocess utilities for scenario execution (Parent Process Side)
 *
 * Re-spawns the current executable as a worker (`__worker <name>`) and talks
 * to it over TCP with length-prefixed CBOR frames, so user code may use
 * stdout/stderr freely. `_templates/utils.ts` is the worker side.
 *
 * @module
 */

import { type ChildProcess, spawn } from "node:child_process";
import { createServer, type Server, type Socket } from "node:net";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { decodeFrames, encodeFrame } from "./_templates/frame.ts";

/**
 * Spawned worker process plus a promise of its exit code
 */
export interface WorkerProcess {
  readonly child: ChildProcess;
  readonly status: Promise<{ code: number }>;
}

/**
 * Options for spawning the worker
 */
export interface SpawnWorkerOptions {
  /** Worker name (`run` or `list`) */
  name: string;
  /** Current working directory */
  cwd: string;
  /** TCP port for IPC communication */
  ipcPort: number;
  /** Optional AbortSignal for cancellation */
  signal?: AbortSignal;
}

const CLI_ENTRY = new URL("../cli.ts", import.meta.url);

/**
 * Whether this module runs from inside a `bun build --compile` binary
 */
function isCompiled(url: URL): boolean {
  return url.pathname.includes("/$bunfs/") || url.pathname.includes("/~BUN/");
}

/**
 * Spawn the current executable as a worker
 *
 * In a compiled binary `process.execPath` is the binary itself. From source,
 * `process.execPath` is `bun` and the CLI entry must be passed explicitly;
 * `process.argv[1]` is not used because under `bun test` it names the test
 * file rather than the CLI.
 */
export function spawnWorker(options: SpawnWorkerOptions): WorkerProcess {
  const { name, cwd, ipcPort, signal } = options;
  const script = isCompiled(CLI_ENTRY) ? [] : [fileURLToPath(CLI_ENTRY)];
  const child = spawn(
    process.execPath,
    [...script, "__worker", name, "--ipc-port", String(ipcPort)],
    { cwd, stdio: ["ignore", "inherit", "inherit"], signal },
  );
  const status = new Promise<{ code: number }>((resolve) => {
    child.once("exit", (code) => resolve({ code: code ?? 1 }));
    child.once("error", () => resolve({ code: 1 }));
  });
  return { child, status };
}

/**
 * IPC connection to the worker
 */
export interface IpcConnection {
  /** Raw socket, consumed as an async iterable of bytes */
  readonly socket: Socket;
  /** Close the connection */
  close(): Promise<void>;
}

/**
 * Start TCP server for IPC
 */
export async function startIpcServer(): Promise<
  { listener: Server; port: number }
> {
  const listener = createServer();
  await new Promise<void>((resolve, reject) => {
    listener.once("error", reject);
    listener.listen(0, "127.0.0.1", () => resolve());
  });
  const addr = listener.address();
  if (addr === null || typeof addr === "string") {
    throw new Error("Failed to allocate IPC port");
  }
  return { listener, port: addr.port };
}

/** Default timeout for IPC connection (30 seconds) */
const DEFAULT_IPC_TIMEOUT_MS = 30_000;

/**
 * Wait for the worker to connect to the IPC server
 *
 * @throws Error if connection times out or the worker exits before connecting
 */
export async function waitForIpcConnection(
  listener: Server,
  options?: {
    /** Worker to race against (detects early exit) */
    subprocess?: WorkerProcess;
    /** Connection timeout in milliseconds (default: 30000) */
    timeoutMs?: number;
  },
): Promise<IpcConnection> {
  const { subprocess, timeoutMs = DEFAULT_IPC_TIMEOUT_MS } = options ?? {};

  let connected = false;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      if (!connected) {
        reject(new Error(`IPC connection timeout after ${timeoutMs}ms`));
      }
    }, timeoutMs);
  });

  const subprocessPromise = subprocess
    ? subprocess.status.then((status) => {
      if (!connected) {
        throw new Error(
          `Subprocess exited before IPC connection (code: ${status.code})`,
        );
      }
      return new Promise<never>(() => {});
    })
    : null;

  const accept = new Promise<Socket>((resolve) =>
    listener.once("connection", resolve)
  );
  const racers: Promise<Socket>[] = [accept, timeoutPromise];
  if (subprocessPromise) {
    racers.push(subprocessPromise);
  }

  try {
    const socket = await Promise.race(racers);
    connected = true;
    return {
      socket,
      close: () => {
        socket.destroy();
        return Promise.resolve();
      },
    };
  } finally {
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
 * Decode and validate worker outputs
 *
 * @throws Error if a decoded frame fails validation
 */
export async function* createOutputStream<T extends SubprocessOutput>(
  socket: Socket,
  validator: (chunk: unknown) => chunk is T,
): AsyncGenerator<T> {
  for await (const decoded of decodeFrames(socket)) {
    if (!validator(decoded)) {
      let decodedStr: string;
      try {
        decodedStr = JSON.stringify(decoded);
      } catch {
        decodedStr = String(decoded);
      }
      throw new Error(`Invalid subprocess output: ${decodedStr}`);
    }
    yield decoded;
  }
}

/**
 * Send one input frame to the worker
 */
export function sendInput(socket: Socket, input: unknown): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    socket.write(encodeFrame(input), (err) => err ? reject(err) : resolve());
  });
}

/**
 * Resources to clean up after subprocess execution
 */
export interface SubprocessResources {
  /** Spawned worker */
  proc: WorkerProcess;
  /** IPC connection to the worker */
  ipc: IpcConnection;
  /** TCP listener for IPC */
  listener: Server;
}

/**
 * Clean up subprocess resources
 *
 * Waits for the worker to exit before closing IPC so pending writes from the
 * worker are not cut off.
 */
export async function cleanupSubprocess(
  resources: SubprocessResources,
): Promise<void> {
  const { proc, ipc, listener } = resources;
  await proc.status;
  await ipc.close();
  listener.close();
}

/**
 * Options for running a subprocess
 */
export interface RunSubprocessOptions<I> {
  /** Worker name (`run` or `list`) */
  templateName: string;
  /** Input to send to subprocess */
  input: I;
  /** Current working directory */
  cwd: string;
  /** Optional AbortSignal for cancellation */
  signal?: AbortSignal;
}

/**
 * Result of starting a subprocess
 */
export interface SubprocessResult<O extends SubprocessOutput> {
  /** Output stream from subprocess */
  outputStream: AsyncIterable<O>;
  /** Resources for cleanup (use cleanupSubprocess when done) */
  resources: SubprocessResources;
}

/**
 * Start a worker and return the output stream
 *
 * Caller must iterate `outputStream` and call `cleanupSubprocess(resources)`
 * in a finally block. Prefer `runSubprocessToCompletion()`.
 */
export async function startSubprocess<I, O extends SubprocessOutput>(
  options: RunSubprocessOptions<I>,
  validator: (value: unknown) => value is O,
): Promise<SubprocessResult<O>> {
  const { templateName, input, cwd, signal } = options;

  const { listener, port } = await startIpcServer();
  const proc = spawnWorker({ name: templateName, cwd, ipcPort: port, signal });
  const ipc = await waitForIpcConnection(listener, { subprocess: proc });
  const outputStream = createOutputStream(ipc.socket, validator);
  await sendInput(ipc.socket, input);

  return {
    outputStream,
    resources: { proc, ipc, listener },
  };
}

/**
 * Handler for subprocess output messages
 *
 * Return a value to finish; return `undefined` to keep reading.
 */
export type SubprocessOutputHandler<O, R> = (
  output: O,
) => Promise<R | undefined>;

/**
 * Run a subprocess to completion
 *
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

    if (options.signal?.aborted) {
      throw new Error("Subprocess aborted");
    }

    throw new Error("Subprocess ended without sending result");
  } finally {
    await cleanupSubprocess(resources);
  }
}
