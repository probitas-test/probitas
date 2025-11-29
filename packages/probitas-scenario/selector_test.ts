/**
 * Tests for selector functions
 *
 * @module
 */

import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import type { ScenarioDefinition } from "./types.ts";
import { applySelectors, parseSelector } from "./selector.ts";

describe("selector", () => {
  // Test helper to create scenario
  const createScenario = (
    name: string,
    tags: string[] = [],
  ): ScenarioDefinition => ({
    name,
    options: {
      tags,
      stepOptions: {
        timeout: 5000,
        retry: { maxAttempts: 1, backoff: "linear" },
      },
    },
    entries: [],
  });

  describe("parseSelector", () => {
    it("parses tag selector without negation", () => {
      const selectors = parseSelector("tag:smoke");
      assertEquals(selectors.length, 1);
      assertEquals(selectors[0].type, "tag");
      assertEquals(selectors[0].negated, false);
    });

    it("parses name selector without negation", () => {
      const selectors = parseSelector("Login");
      assertEquals(selectors.length, 1);
      assertEquals(selectors[0].type, "name");
      assertEquals(selectors[0].negated, false);
    });

    it("parses selector with ! negation", () => {
      const selectors = parseSelector("!tag:slow");
      assertEquals(selectors.length, 1);
      assertEquals(selectors[0].type, "tag");
      assertEquals(selectors[0].negated, true);
    });

    it("parses multiple selectors with comma", () => {
      const selectors = parseSelector("tag:api,!tag:slow");
      assertEquals(selectors.length, 2);
      assertEquals(selectors[0].type, "tag");
      assertEquals(selectors[0].negated, false);
      assertEquals(selectors[1].type, "tag");
      assertEquals(selectors[1].negated, true);
    });

    it("handles whitespace around !", () => {
      const selectors = parseSelector("! tag:slow");
      assertEquals(selectors.length, 1);
      assertEquals(selectors[0].negated, true);
    });

    it("defaults to name type when no type specified", () => {
      const selectors = parseSelector("wip");
      assertEquals(selectors.length, 1);
      assertEquals(selectors[0].type, "name");
    });

    it("handles ! prefix with default type", () => {
      const selectors = parseSelector("!wip");
      assertEquals(selectors.length, 1);
      assertEquals(selectors[0].type, "name");
      assertEquals(selectors[0].negated, true);
    });
  });

  describe("applySelectors", () => {
    const scenarios = [
      createScenario("Login Test", ["api", "auth"]),
      createScenario("Logout Test", ["api"]),
      createScenario("User API Test", ["api", "user"]),
      createScenario("Smoke Test", ["smoke"]),
    ];

    it("applies single tag selector (OR)", () => {
      const result = applySelectors(scenarios, ["tag:smoke"]);
      assertEquals(result.length, 1);
      assertEquals(result[0].name, "Smoke Test");
    });

    it("applies multiple tag selectors (OR)", () => {
      const result = applySelectors(scenarios, ["tag:auth", "tag:smoke"]);
      assertEquals(result.length, 2);
      assertEquals(result.map((s) => s.name).sort(), [
        "Login Test",
        "Smoke Test",
      ]);
    });

    it("applies combined selectors (AND within selector)", () => {
      const result = applySelectors(scenarios, ["tag:api,tag:auth"]);
      assertEquals(result.length, 1);
      assertEquals(result[0].name, "Login Test");
    });

    it("applies name selector", () => {
      const result = applySelectors(scenarios, ["User"]);
      assertEquals(result.length, 1);
      assertEquals(result[0].name, "User API Test");
    });

    it("returns all scenarios when no selectors", () => {
      const result = applySelectors(scenarios, []);
      assertEquals(result.length, 4);
    });

    describe("with negation", () => {
      it("filters out scenarios with negated tag", () => {
        const result = applySelectors(scenarios, ["!tag:smoke"]);
        assertEquals(result.length, 3);
        assertEquals(result.map((s) => s.name).sort(), [
          "Login Test",
          "Logout Test",
          "User API Test",
        ]);
      });

      it("filters out scenarios with negated name", () => {
        const result = applySelectors(scenarios, ["!Logout"]);
        assertEquals(result.length, 3);
        assertEquals(result.map((s) => s.name).sort(), [
          "Login Test",
          "Smoke Test",
          "User API Test",
        ]);
      });

      it("applies AND condition with negation: tag:api,!tag:auth", () => {
        const result = applySelectors(scenarios, ["tag:api,!tag:auth"]);
        assertEquals(result.length, 2);
        assertEquals(result.map((s) => s.name).sort(), [
          "Logout Test",
          "User API Test",
        ]);
      });

      it("applies OR condition with negation: !tag:api -s !tag:smoke", () => {
        const result = applySelectors(scenarios, ["!tag:api", "!tag:smoke"]);
        // !tag:api matches Smoke Test
        // !tag:smoke matches Login Test, Logout Test, User API Test
        // OR => all 4 scenarios
        assertEquals(result.length, 4);
      });

      it("applies complex condition: tag:api,!tag:auth,User", () => {
        const result = applySelectors(scenarios, ["tag:api,!tag:auth,User"]);
        assertEquals(result.length, 1);
        assertEquals(result[0].name, "User API Test");
      });

      it("handles selector with only negation", () => {
        const result = applySelectors(scenarios, ["!tag:nonexistent"]);
        assertEquals(result.length, 4); // All scenarios pass (none have nonexistent tag)
      });
    });
  });
});
