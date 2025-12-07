/**
 * Basic Scenario Example
 *
 * This example demonstrates fundamental probitas concepts:
 * - Creating a scenario with a name
 * - Defining steps with explicit names
 * - Passing data between steps via ctx.previous
 * - Simple validation with thrown errors
 */
import { scenario } from "probitas";

export default scenario("Basic Example")
  .step("Initialize data", () => {
    return {
      items: ["apple", "banana", "cherry"],
      count: 3,
    };
  })
  .step("Process items", (ctx) => {
    const { items, count } = ctx.previous;
    const processed = items.map((item) => item.toUpperCase());
    return {
      original: items,
      processed,
      count,
    };
  })
  .step("Validate results", (ctx) => {
    const { processed, count } = ctx.previous;
    if (processed.length !== count) {
      throw new Error(
        `Expected ${count} items, got ${processed.length}`,
      );
    }
    if (!processed.every((item) => item === item.toUpperCase())) {
      throw new Error("Not all items are uppercase");
    }
    return { success: true };
  })
  .build();
