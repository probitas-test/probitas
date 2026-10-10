/**
 * Length-prefixed CBOR framing for parent/worker IPC
 *
 * Each frame is a 4-byte big-endian length followed by one CBOR item. This
 * avoids `@std/cbor`'s sequence stream classes, which need
 * `ReadableStream.from` (missing in Bun) and stream every array/map/string.
 *
 * @module
 * @internal
 */

import { decodeCbor, encodeCbor } from "@std/cbor";
import { fromCborType, toCborType } from "./serializer.ts";

const HEADER_SIZE = 4;

export function encodeFrame(value: unknown): Uint8Array {
  const body = encodeCbor(toCborType(value));
  const frame = new Uint8Array(HEADER_SIZE + body.length);
  new DataView(frame.buffer).setUint32(0, body.length);
  frame.set(body, HEADER_SIZE);
  return frame;
}

/**
 * Decode frames from a byte stream
 *
 * @throws Error if the stream ends in the middle of a frame
 */
export async function* decodeFrames(
  source: AsyncIterable<Uint8Array>,
): AsyncGenerator<unknown> {
  let buffer = new Uint8Array(0);
  for await (const chunk of source) {
    const next = new Uint8Array(buffer.length + chunk.length);
    next.set(buffer);
    next.set(chunk, buffer.length);
    buffer = next;
    while (buffer.length >= HEADER_SIZE) {
      const length = new DataView(buffer.buffer, buffer.byteOffset)
        .getUint32(0);
      if (buffer.length < HEADER_SIZE + length) break;
      const body = buffer.subarray(HEADER_SIZE, HEADER_SIZE + length);
      yield fromCborType(decodeCbor(body));
      buffer = buffer.slice(HEADER_SIZE + length);
    }
  }
  if (buffer.length > 0) {
    throw new Error(
      `IPC stream ended with ${buffer.length} byte(s) of an incomplete frame`,
    );
  }
}
