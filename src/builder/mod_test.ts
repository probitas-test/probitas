/**
 * Tests for Builder module
 *
 * @module
 */

import { assertEquals, assertExists } from "@std/assert";
import { scenario } from "./mod.ts";
import { ScenarioBuilder } from "./scenario_builder.ts";

Deno.test("scenario() - creates ScenarioBuilder instance", () => {
  const builder = scenario("Test Scenario");
  assertExists(builder);
  assertEquals(builder instanceof ScenarioBuilder, true);
});

Deno.test("scenario() - initializes with empty result chain", () => {
  const definition = scenario("Test").build();
  assertEquals(definition.steps.length, 0);
});

Deno.test("scenario() - passes name to builder", () => {
  const definition = scenario("My Test Scenario").build();
  assertEquals(definition.name, "My Test Scenario");
});

Deno.test("scenario() - accepts optional scenario options", () => {
  const definition = scenario("Test", {
    tags: ["unit", "fast"],
    skip: false,
  }).build();
  assertEquals(definition.options.tags.length, 2);
  assertEquals(definition.options.tags[0], "unit");
  assertEquals(definition.options.tags[1], "fast");
});

Deno.test("scenario() - returns builder for chaining", () => {
  const definition = scenario("Test")
    .step("Step 1", () => 1)
    .step("Step 2", () => 2)
    .build();

  assertEquals(definition.steps.length, 2);
  assertEquals(definition.steps[0].name, "Step 1");
  assertEquals(definition.steps[1].name, "Step 2");
});

Deno.test("scenario() - exports ScenarioBuilder class", () => {
  assertExists(ScenarioBuilder);
});

Deno.test("scenario() - enables fluent API for scenario building", () => {
  const definition = scenario("Complete Flow")
    .step("Get ID", () => 123)
    .step("Fetch User", () => ({ id: 123, name: "Alice" }))
    .step("Verify", () => true)
    .build();

  assertEquals(definition.name, "Complete Flow");
  assertEquals(definition.steps.length, 3);
  assertEquals(definition.steps[0].name, "Get ID");
  assertEquals(definition.steps[1].name, "Fetch User");
  assertEquals(definition.steps[2].name, "Verify");
});
