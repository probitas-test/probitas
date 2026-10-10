/**
 * Symbol Serialization Test Scenario
 */
import { scenario } from "@probitas-test/probitas";

export default scenario("Symbol Serialization")
  .step("Return Symbol value", () => {
    // Symbols are serialized via CBOR tagged value
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
