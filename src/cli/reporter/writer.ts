import { getLogger } from "@logtape/logtape";

const logger = getLogger(["probitas", "reporter", "writer"]);

export interface WriterOptions {
  /**
   * Output stream for writing results.
   *
   * @default Deno.stderr.writable
   */
  readonly output?: WritableStream;
}

/**
 * Handles serialized, buffered output writing.
 *
 * Writer ensures that all output operations are serialized to prevent
 * "stream is already locked" errors when multiple scenarios run concurrently.
 * Each write is queued and executed in order, maintaining output consistency.
 *
 * @example
 * ```ts
 * import { Writer } from "./writer.ts";
 *
 * const writer = new Writer({ output: Deno.stdout.writable });
 * await writer.write("Test output\n");
 * ```
 */
export class Writer {
  #output: WritableStream;
  #writeQueue: Promise<void> = Promise.resolve();
  #encoder = new TextEncoder();

  /**
   * Create a new Writer.
   *
   * @param options - Configuration options (output stream)
   */
  constructor(options: WriterOptions = {}) {
    this.#output = options.output ?? Deno.stderr.writable;
  }

  /**
   * Write text to the output stream.
   *
   * Serializes all write operations to prevent "stream is already locked" errors
   * when multiple scenarios run concurrently. Each write is queued and executed
   * in order.
   *
   * @param text - Text to write (will be UTF-8 encoded)
   *
   * @example
   * ```ts
   * import { Writer } from "./writer.ts";
   *
   * const writer = new Writer({ output: Deno.stdout.writable });
   * await writer.write("✓ Test passed\n");
   * await writer.write("PASSED\n");
   * ```
   */
  async write(text: string): Promise<void> {
    logger.trace("Queueing write operation", {
      byteLength: text.length,
    });

    // Catch any errors from previous writes to prevent queue poisoning
    this.#writeQueue = this.#writeQueue.catch((err) => {
      logger.trace("Previous write failed, continuing queue", { error: err });
    }).then(async () => {
      logger.trace("Writing to stream", { byteLength: text.length });
      const writer = this.#output.getWriter();
      try {
        await writer.write(this.#encoder.encode(text));
        logger.trace("Write completed", { byteLength: text.length });
      } finally {
        writer.releaseLock();
      }
    });
    await this.#writeQueue;
  }
}
