/**
 * Function Serialization Test Scenario
 */
import { scenario } from "jsr:@probitas/probitas@^0";

export default scenario("Function Serialization")
  .step("Return Function value", () => {
    // Functions are serialized as placeholder via CBOR tagged value
    return {
      callback: () => "hello",
      method: function namedFn() {
        return 42;
      },
      arrow: (x: number) => x * 2,
    };
  })
  .step("This step should also run", (ctx) => {
    // This step accesses the Function values
    return {
      hasCallback: typeof ctx.previous.callback === "function",
      hasMethod: typeof ctx.previous.method === "function",
      hasArrow: typeof ctx.previous.arrow === "function",
    };
  })
  .build();
