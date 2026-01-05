/**
 * Circular Reference Serialization Test Scenario
 */
import { scenario } from "jsr:@probitas/probitas@^0";

export default scenario("Circular Reference Serialization")
  .step("Return circular reference", () => {
    // Circular references cause TypeError in JSON.stringify
    const obj: Record<string, unknown> = { name: "parent" };
    obj.self = obj;
    return obj;
  })
  .step("This step should also run", (ctx) => {
    // This step accesses the circular reference
    return {
      hasName: ctx.previous.name === "parent",
      hasSelf: ctx.previous.self === ctx.previous,
    };
  })
  .build();
