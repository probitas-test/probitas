/**
 * Symbol Serialization Test Scenario
 */
import { scenario } from "jsr:@probitas/probitas@^0";

export default scenario("Symbol Serialization")
  .step("Return Symbol value", () => {
    // Symbols are omitted when serialized by JSON.stringify
    return {
      id: Symbol("unique-id"),
      tag: Symbol.for("global-tag"),
      iterator: Symbol.iterator,
    };
  })
  .step("This step should also run", (ctx) => {
    // This step accesses the Symbol values
    return {
      hasId: typeof ctx.previous.id === "symbol",
      hasTag: typeof ctx.previous.tag === "symbol",
      hasIterator: typeof ctx.previous.iterator === "symbol",
    };
  })
  .build();
