/**
 * BigInt Serialization Test Scenario
 */
import { scenario } from "jsr:@probitas/probitas@^0";

export default scenario("BigInt Serialization")
  .step("Return BigInt value", () => {
    // BigInt cannot be serialized by JSON.stringify
    return {
      value: BigInt(9007199254740991),
      timestamp: BigInt(Date.now()),
    };
  })
  .step("This step should also run", (ctx) => {
    // This step accesses the BigInt values
    return {
      received: typeof ctx.previous.value === "bigint",
    };
  })
  .build();
