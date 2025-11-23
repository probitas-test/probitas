/**
 * Tests for Error classes
 *
 * @module
 */

import { assertEquals, assertExists, assertStrictEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { ScenarioError, StepError, TimeoutError } from "./errors.ts";
import type { ScenarioDefinition, StepDefinition } from "./types.ts";

describe("ScenarioError", () => {
  describe("constructor and properties", () => {
    it("should create ScenarioError with message and scenario", () => {
      const scenario: ScenarioDefinition = {
        name: "Test Scenario",
        options: {
          tags: [],
          skip: null,
          setup: null,
          teardown: null,
          stepOptions: {
            timeout: 5000,
            retry: { maxAttempts: 1, backoff: "linear" },
          },
        },
        steps: [],
      };

      const error = new ScenarioError("Test failed", scenario);

      assertEquals(error.message, "Test failed");
      assertStrictEquals(error.scenario, scenario);
      assertEquals(error.name, "ScenarioError");
    });

    it("should include cause when provided", () => {
      const scenario: ScenarioDefinition = {
        name: "Test Scenario",
        options: {
          tags: [],
          skip: null,
          setup: null,
          teardown: null,
          stepOptions: {
            timeout: 5000,
            retry: { maxAttempts: 1, backoff: "linear" },
          },
        },
        steps: [],
      };
      const cause = new Error("Underlying error");

      const error = new ScenarioError("Test failed", scenario, cause);

      assertEquals(error.message, "Test failed");
      assertEquals(error.cause, cause);
      assertEquals(error.cause?.message, "Underlying error");
    });

    it("should not include cause when not provided", () => {
      const scenario: ScenarioDefinition = {
        name: "Test Scenario",
        options: {
          tags: [],
          skip: null,
          setup: null,
          teardown: null,
          stepOptions: {
            timeout: 5000,
            retry: { maxAttempts: 1, backoff: "linear" },
          },
        },
        steps: [],
      };

      const error = new ScenarioError("Test failed", scenario);

      assertEquals(error.cause, undefined);
    });

    it("should be instanceof Error", () => {
      const scenario: ScenarioDefinition = {
        name: "Test Scenario",
        options: {
          tags: [],
          skip: null,
          setup: null,
          teardown: null,
          stepOptions: {
            timeout: 5000,
            retry: { maxAttempts: 1, backoff: "linear" },
          },
        },
        steps: [],
      };

      const error = new ScenarioError("Test failed", scenario);

      assertEquals(error instanceof Error, true);
      assertEquals(error instanceof ScenarioError, true);
    });

    it("should have scenario property accessible", () => {
      const scenario: ScenarioDefinition = {
        name: "My Test Scenario",
        options: {
          tags: ["smoke"],
          skip: null,
          setup: null,
          teardown: null,
          stepOptions: {
            timeout: 10000,
            retry: { maxAttempts: 3, backoff: "exponential" },
          },
        },
        steps: [],
      };

      const error = new ScenarioError("Test failed", scenario);

      assertEquals(error.scenario.name, "My Test Scenario");
      assertEquals(error.scenario.options.tags, ["smoke"]);
    });
  });
});

describe("StepError", () => {
  describe("constructor and properties", () => {
    it("should create StepError with message, step, and attempt", () => {
      const step: StepDefinition = {
        name: "Test Step",
        fn: () => {},
        options: {
          timeout: 5000,
          retry: { maxAttempts: 1, backoff: "linear" },
        },
      };

      const error = new StepError("Step failed", step, 1);

      assertEquals(error.message, "Step failed");
      assertStrictEquals(error.step, step);
      assertEquals(error.attempt, 1);
      assertEquals(error.name, "StepError");
    });

    it("should support different attempt numbers", () => {
      const step: StepDefinition = {
        name: "Test Step",
        fn: () => {},
        options: {
          timeout: 5000,
          retry: { maxAttempts: 3, backoff: "linear" },
        },
      };

      const error1 = new StepError("Failed on attempt 1", step, 1);
      const error2 = new StepError("Failed on attempt 2", step, 2);
      const error3 = new StepError("Failed on attempt 3", step, 3);

      assertEquals(error1.attempt, 1);
      assertEquals(error2.attempt, 2);
      assertEquals(error3.attempt, 3);
    });

    it("should include cause when provided", () => {
      const step: StepDefinition = {
        name: "Test Step",
        fn: () => {},
        options: {
          timeout: 5000,
          retry: { maxAttempts: 1, backoff: "linear" },
        },
      };
      const cause = new Error("Underlying error");

      const error = new StepError("Step failed", step, 1, cause);

      assertEquals(error.message, "Step failed");
      assertEquals(error.cause, cause);
      assertEquals(error.cause?.message, "Underlying error");
    });

    it("should not include cause when not provided", () => {
      const step: StepDefinition = {
        name: "Test Step",
        fn: () => {},
        options: {
          timeout: 5000,
          retry: { maxAttempts: 1, backoff: "linear" },
        },
      };

      const error = new StepError("Step failed", step, 1);

      assertEquals(error.cause, undefined);
    });

    it("should be instanceof Error", () => {
      const step: StepDefinition = {
        name: "Test Step",
        fn: () => {},
        options: {
          timeout: 5000,
          retry: { maxAttempts: 1, backoff: "linear" },
        },
      };

      const error = new StepError("Step failed", step, 1);

      assertEquals(error instanceof Error, true);
      assertEquals(error instanceof StepError, true);
    });

    it("should have step property accessible with all metadata", () => {
      const step: StepDefinition = {
        name: "Complex Step",
        fn: () => ({ result: "test" }),
        options: {
          timeout: 10000,
          retry: { maxAttempts: 5, backoff: "exponential" },
        },
        location: { file: "/test/step.ts", line: 42 },
      };

      const error = new StepError("Complex step failed", step, 2);

      assertEquals(error.step.name, "Complex Step");
      assertEquals(error.step.options.timeout, 10000);
      assertEquals(error.step.options.retry.maxAttempts, 5);
      assertEquals(error.step.options.retry.backoff, "exponential");
      assertEquals(error.step.location?.file, "/test/step.ts");
      assertEquals(error.step.location?.line, 42);
    });
  });
});

describe("TimeoutError", () => {
  describe("constructor and properties", () => {
    it("should create TimeoutError with message and timeout", () => {
      const error = new TimeoutError("Request timed out", 5000);

      assertEquals(error.message, "Request timed out");
      assertEquals(error.timeout, 5000);
      assertEquals(error.name, "TimeoutError");
    });

    it("should support different timeout values", () => {
      const error1 = new TimeoutError("Timeout", 1000);
      const error2 = new TimeoutError("Timeout", 5000);
      const error3 = new TimeoutError("Timeout", 30000);

      assertEquals(error1.timeout, 1000);
      assertEquals(error2.timeout, 5000);
      assertEquals(error3.timeout, 30000);
    });

    it("should be instanceof Error", () => {
      const error = new TimeoutError("Timeout", 5000);

      assertEquals(error instanceof Error, true);
      assertEquals(error instanceof TimeoutError, true);
    });

    it("should have timeout property accessible", () => {
      const error = new TimeoutError(
        "Step execution exceeded timeout",
        10000,
      );

      assertEquals(error.timeout, 10000);
    });

    it("should allow accessing error properties", () => {
      const error = new TimeoutError("Custom timeout message", 2500);

      assertEquals(error.message, "Custom timeout message");
      assertEquals(error.timeout, 2500);
      assertExists(error.stack);
    });
  });
});

describe("Error inheritance and behavior", () => {
  it("should preserve stack traces", () => {
    const scenario: ScenarioDefinition = {
      name: "Test",
      options: {
        tags: [],
        skip: null,
        setup: null,
        teardown: null,
        stepOptions: {
          timeout: 5000,
          retry: { maxAttempts: 1, backoff: "linear" },
        },
      },
      steps: [],
    };

    const error = new ScenarioError("Test", scenario);

    assertExists(error.stack);
    assertEquals(error.stack?.includes("ScenarioError"), true);
  });

  it("should work with error chaining", () => {
    const cause = new Error("Original error");
    const step: StepDefinition = {
      name: "Test",
      fn: () => {},
      options: {
        timeout: 5000,
        retry: { maxAttempts: 1, backoff: "linear" },
      },
    };

    const error = new StepError("Step failed", step, 1, cause);

    assertEquals(error.cause?.message, "Original error");
    assertEquals(error.cause instanceof Error, true);
  });

  it("should support custom error messages", () => {
    const scenario: ScenarioDefinition = {
      name: "Test",
      options: {
        tags: [],
        skip: null,
        setup: null,
        teardown: null,
        stepOptions: {
          timeout: 5000,
          retry: { maxAttempts: 1, backoff: "linear" },
        },
      },
      steps: [],
    };

    const customMessage =
      "This is a custom error message with special chars: @#$%";
    const error = new ScenarioError(customMessage, scenario);

    assertEquals(error.message, customMessage);
  });

  it("should work with try-catch", () => {
    const step: StepDefinition = {
      name: "Test",
      fn: () => {},
      options: {
        timeout: 5000,
        retry: { maxAttempts: 1, backoff: "linear" },
      },
    };

    let caughtError: StepError | null = null;

    try {
      throw new StepError("Caught error", step, 1);
    } catch (error) {
      if (error instanceof StepError) {
        caughtError = error;
      }
    }

    assertExists(caughtError);
    assertEquals(caughtError?.message, "Caught error");
    assertEquals(caughtError?.attempt, 1);
  });

  it("should support instanceof checks", () => {
    const scenario: ScenarioDefinition = {
      name: "Test",
      options: {
        tags: [],
        skip: null,
        setup: null,
        teardown: null,
        stepOptions: {
          timeout: 5000,
          retry: { maxAttempts: 1, backoff: "linear" },
        },
      },
      steps: [],
    };

    const scenarioError = new ScenarioError("Test", scenario);
    const timeoutError = new TimeoutError("Test", 5000);

    assertEquals(scenarioError instanceof ScenarioError, true);
    assertEquals(scenarioError instanceof TimeoutError, false);
    assertEquals(timeoutError instanceof TimeoutError, true);
    assertEquals(timeoutError instanceof ScenarioError, false);
  });
});
