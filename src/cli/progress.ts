/**
 * Progress display utilities for CLI
 *
 * Provides real-time progress feedback during long-running operations
 * like file discovery and scenario loading.
 *
 * @module
 */

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/**
 * Output stream interface for progress display
 */
export interface OutputStream {
  writeSync(p: Uint8Array): number;
  isTerminal(): boolean;
}

/**
 * Progress information during file discovery.
 *
 * This type matches `DiscoverProgress` from `@probitas/discover`.
 */
export interface DiscoverProgress {
  /** The directory or file path currently being processed */
  currentPath: string;
  /** Total number of matching files found so far */
  filesFound: number;
}

/**
 * Options for creating a progress display
 */
export interface ProgressDisplayOptions {
  /**
   * Output stream to write progress to
   * @default Deno.stderr
   */
  output?: OutputStream;

  /**
   * Maximum width for the display (for truncating long paths)
   * @default 80
   */
  maxWidth?: number;
}

/**
 * Progress display controller
 */
export interface ProgressDisplay {
  /**
   * Callback to handle discovery progress events
   */
  onProgress: (progress: DiscoverProgress) => void;

  /**
   * Mark the progress display as complete and clear the status line
   *
   * @param filesFound - Optional total file count to show in completion message
   */
  complete: (filesFound?: number) => void;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const encoder = new TextEncoder();

/** Spinner animation frames using braille pattern dots */
const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

/** Spinner animation interval in milliseconds */
const SPINNER_INTERVAL_MS = 80;

/** Default maximum width for progress display */
const DEFAULT_MAX_WIDTH = 80;

// -----------------------------------------------------------------------------
// Line Writer
// -----------------------------------------------------------------------------

/**
 * Line writer for single-line status updates using carriage return
 */
class LineWriter {
  #output: OutputStream;
  #lastLineLength = 0;

  constructor(output: OutputStream) {
    this.#output = output;
  }

  /**
   * Write text to the current line, overwriting previous content
   */
  write(text: string): void {
    const padding = this.#lastLineLength > text.length
      ? " ".repeat(this.#lastLineLength - text.length)
      : "";
    this.#output.writeSync(encoder.encode(`\r${text}${padding}`));
    this.#lastLineLength = text.length;
  }

  /**
   * Clear the current line
   */
  clear(): void {
    if (this.#lastLineLength > 0) {
      this.#output.writeSync(
        encoder.encode(`\r${" ".repeat(this.#lastLineLength)}\r`),
      );
      this.#lastLineLength = 0;
    }
  }
}

// -----------------------------------------------------------------------------
// Spinner
// -----------------------------------------------------------------------------

/**
 * Animated spinner with constant-speed rotation
 */
class Spinner {
  #frameIndex = 0;
  #timerId: number | undefined;
  #onTick: () => void;

  constructor(onTick: () => void) {
    this.#onTick = onTick;
  }

  /**
   * Get the current spinner frame character
   */
  get frame(): string {
    return SPINNER_FRAMES[this.#frameIndex % SPINNER_FRAMES.length];
  }

  /**
   * Start the spinner animation
   */
  start(): void {
    this.#onTick();
    this.#timerId = setInterval(() => {
      this.#frameIndex++;
      this.#onTick();
    }, SPINNER_INTERVAL_MS);
  }

  /**
   * Stop the spinner animation
   */
  stop(): void {
    if (this.#timerId !== undefined) {
      clearInterval(this.#timerId);
      this.#timerId = undefined;
    }
  }
}

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

/**
 * Truncate a path to fit within maxLength, keeping the end visible
 */
function truncatePath(path: string, maxLength: number): string {
  if (maxLength <= 3) return path.length > 0 ? "..." : "";
  if (path.length <= maxLength) return path;
  return "..." + path.slice(-(maxLength - 3));
}

/**
 * Format file count with proper pluralization
 */
function formatFileCount(count: number): string {
  return `(${count} ${count === 1 ? "file" : "files"})`;
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Create a progress display for file discovery
 *
 * Displays real-time progress during file discovery:
 * - TTY mode: Single-line spinner animation with path and count
 * - Non-TTY mode: No output (to avoid polluting redirected output)
 *
 * @param options - Configuration options
 * @returns Progress display controller, or null if output should be suppressed
 *
 * @example
 * ```ts ignore
 * const progress = createDiscoveryProgress();
 * if (progress) {
 *   const files = await discoverScenarioFiles(paths, {
 *     onProgress: progress.onProgress,
 *   });
 *   progress.complete();
 * }
 * ```
 */
export function createDiscoveryProgress(
  options: ProgressDisplayOptions = {},
): ProgressDisplay | null {
  const output = options.output ?? Deno.stderr;
  const maxWidth = options.maxWidth ?? DEFAULT_MAX_WIDTH;

  if (!output.isTerminal()) {
    return null;
  }

  const lineWriter = new LineWriter(output);

  // Progress state
  let currentPath = "";
  let filesFound = 0;

  const render = (spinner: Spinner): void => {
    const prefix = "Discovering scenario files... ";
    const suffix = formatFileCount(filesFound);
    // Layout: "{spinner} {prefix}{path} {suffix}"
    const reservedWidth = 1 + 1 + prefix.length + 1 + suffix.length;
    const availableForPath = maxWidth - reservedWidth;
    const path = truncatePath(currentPath, availableForPath);

    lineWriter.write(`${spinner.frame} ${prefix}${path} ${suffix}`);
  };

  const spinner = new Spinner(() => render(spinner));
  spinner.start();

  return {
    onProgress: (progress) => {
      currentPath = progress.currentPath;
      filesFound = progress.filesFound;
    },

    complete: () => {
      spinner.stop();
      lineWriter.clear();
    },
  };
}

/**
 * Write a status message to the output
 *
 * Writes a status line that can be cleared later.
 * Only outputs in TTY environments.
 *
 * @param message - Status message to display
 * @param output - Output stream (default: Deno.stderr)
 * @returns Function to clear the status line, or null if suppressed
 */
export function writeStatus(
  message: string,
  output: OutputStream = Deno.stderr,
): (() => void) | null {
  if (!output.isTerminal()) {
    return null;
  }

  const lineWriter = new LineWriter(output);
  lineWriter.write(message);

  return () => lineWriter.clear();
}
