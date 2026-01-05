/**
 * Undefined Serialization Test Scenario
 */
import { scenario } from "jsr:@probitas/probitas@^0";

export default scenario("Undefined Serialization")
  .step("Return undefined values", () => {
    // undefined values in object properties are omitted by JSON.stringify
    // undefined in arrays becomes null
    return {
      explicit: undefined,
      nested: {
        value: undefined,
        defined: "exists",
      },
      array: [1, undefined, 3],
    };
  })
  .step("This step should also run", (ctx) => {
    // This step accesses the undefined values
    return {
      hasExplicit: "explicit" in ctx.previous,
      explicitIsUndefined: ctx.previous.explicit === undefined,
      nestedValueIsUndefined: ctx.previous.nested.value === undefined,
      nestedDefinedExists: ctx.previous.nested.defined === "exists",
      arraySecondIsUndefined: ctx.previous.array[1] === undefined,
    };
  })
  .build();
