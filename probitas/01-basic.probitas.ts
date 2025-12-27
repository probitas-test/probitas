/**
 * Basic Scenario Example
 *
 * This example demonstrates fundamental probitas concepts:
 * - Creating a scenario with a name
 * - Defining steps with explicit names
 * - Passing data between steps via ctx.previous
 * - Validation using expect() assertions
 */
import { expect, scenario } from "jsr:@probitas/probitas@^0";

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
    expect(processed).toHaveLength(count);
    // Verify all items are uppercase
    const allUppercase = processed.every((item) => item === item.toUpperCase());
    expect(allUppercase).toBe(true);
    return { success: true };
  })
  .build();
