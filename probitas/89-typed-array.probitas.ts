/**
 * TypedArray Serialization Test Scenario
 */
import { scenario } from "jsr:@probitas/probitas@^0";

export default scenario("TypedArray Serialization")
  .step("Return TypedArray values", () => {
    // TypedArrays are serialized via CBOR tagged value
    return {
      uint8: new Uint8Array([1, 2, 3, 4]),
      int32: new Int32Array([100, 200, -300]),
      float64: new Float64Array([1.5, 2.5, 3.5]),
      buffer: new ArrayBuffer(8),
      dataView: new DataView(new ArrayBuffer(4)),
    };
  })
  .step("This step should also run", (ctx) => {
    // This step accesses the TypedArray values
    return {
      uint8IsTypedArray: ctx.previous.uint8 instanceof Uint8Array,
      uint8Length: ctx.previous.uint8.length,
      uint8FirstValue: ctx.previous.uint8[0],
      int32IsTypedArray: ctx.previous.int32 instanceof Int32Array,
      float64Sum: ctx.previous.float64[0] + ctx.previous.float64[1],
      bufferIsArrayBuffer: ctx.previous.buffer instanceof ArrayBuffer,
      bufferByteLength: ctx.previous.buffer.byteLength,
    };
  })
  .build();
