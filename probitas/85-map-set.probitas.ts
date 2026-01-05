/**
 * Map/Set Serialization Test Scenario
 */
import { scenario } from "jsr:@probitas/probitas@^0";

export default scenario("Map/Set Serialization")
  .step("Return Map and Set values", () => {
    // Map and Set are serialized via CBOR tagged value
    const map = new Map<string, number>([
      ["a", 1],
      ["b", 2],
    ]);
    const set = new Set([1, 2, 3]);
    return {
      map,
      set,
      weakMap: new WeakMap(),
      weakSet: new WeakSet(),
    };
  })
  .step("This step should also run", (ctx) => {
    // This step accesses the Map and Set values
    return {
      mapIsMap: ctx.previous.map instanceof Map,
      mapSize: ctx.previous.map.size,
      setIsSet: ctx.previous.set instanceof Set,
      setSize: ctx.previous.set.size,
    };
  })
  .build();
