/**
 * Tests for error builder functions.
 *
 * @module
 */

import { assertEquals } from "@std/assert";
import {
  buildCountAtLeastError,
  buildCountAtMostError,
  buildCountError,
  buildDurationError,
  buildDurationGreaterThanError,
  buildDurationGreaterThanOrEqualError,
  buildDurationLessThanOrEqualError,
} from "./error_builders.ts";

Deno.test("buildCountError", async (t) => {
  await t.step("builds error with default item name", () => {
    const message = buildCountError(5, 3);
    assertEquals(message, "Expected 5 items, got 3");
  });

  await t.step("builds error with custom item name", () => {
    const message = buildCountError(10, 7, "rows");
    assertEquals(message, "Expected 10 rows, got 7");
  });

  await t.step("builds error with zero expected", () => {
    const message = buildCountError(0, 5, "documents");
    assertEquals(message, "Expected 0 documents, got 5");
  });

  await t.step("builds error with zero actual", () => {
    const message = buildCountError(3, 0, "messages");
    assertEquals(message, "Expected 3 messages, got 0");
  });

  await t.step("builds error with large numbers", () => {
    const message = buildCountError(1000, 999, "records");
    assertEquals(message, "Expected 1000 records, got 999");
  });
});

Deno.test("buildCountAtLeastError", async (t) => {
  await t.step("builds error with default item name", () => {
    const message = buildCountAtLeastError(5, 3);
    assertEquals(message, "Expected at least 5 items, got 3");
  });

  await t.step("builds error with custom item name", () => {
    const message = buildCountAtLeastError(10, 7, "entries");
    assertEquals(message, "Expected at least 10 entries, got 7");
  });

  await t.step("builds error with zero minimum", () => {
    const message = buildCountAtLeastError(0, 5, "results");
    assertEquals(message, "Expected at least 0 results, got 5");
  });

  await t.step("builds error with one minimum", () => {
    const message = buildCountAtLeastError(1, 0, "errors");
    assertEquals(message, "Expected at least 1 errors, got 0");
  });
});

Deno.test("buildCountAtMostError", async (t) => {
  await t.step("builds error with default item name", () => {
    const message = buildCountAtMostError(5, 8);
    assertEquals(message, "Expected at most 5 items, got 8");
  });

  await t.step("builds error with custom item name", () => {
    const message = buildCountAtMostError(3, 5, "warnings");
    assertEquals(message, "Expected at most 3 warnings, got 5");
  });

  await t.step("builds error with zero maximum", () => {
    const message = buildCountAtMostError(0, 2, "failures");
    assertEquals(message, "Expected at most 0 failures, got 2");
  });

  await t.step("builds error with large numbers", () => {
    const message = buildCountAtMostError(100, 150, "requests");
    assertEquals(message, "Expected at most 100 requests, got 150");
  });
});

Deno.test("buildDurationError", async (t) => {
  await t.step("builds error with normal values", () => {
    const message = buildDurationError(1000, 1500);
    assertEquals(message, "Expected duration < 1000ms, got 1500ms");
  });

  await t.step("builds error with zero threshold", () => {
    const message = buildDurationError(0, 100);
    assertEquals(message, "Expected duration < 0ms, got 100ms");
  });

  await t.step("builds error with small durations", () => {
    const message = buildDurationError(10, 15);
    assertEquals(message, "Expected duration < 10ms, got 15ms");
  });

  await t.step("builds error with large durations", () => {
    const message = buildDurationError(10000, 12000);
    assertEquals(message, "Expected duration < 10000ms, got 12000ms");
  });

  await t.step("builds error with fractional values", () => {
    const message = buildDurationError(100.5, 150.75);
    assertEquals(message, "Expected duration < 100.5ms, got 150.75ms");
  });
});

Deno.test("buildDurationLessThanOrEqualError", async (t) => {
  await t.step("builds error with normal values", () => {
    const message = buildDurationLessThanOrEqualError(1000, 1500);
    assertEquals(message, "Expected duration <= 1000ms, got 1500ms");
  });

  await t.step("builds error with zero threshold", () => {
    const message = buildDurationLessThanOrEqualError(0, 100);
    assertEquals(message, "Expected duration <= 0ms, got 100ms");
  });

  await t.step("builds error with equal values", () => {
    const message = buildDurationLessThanOrEqualError(100, 100);
    assertEquals(message, "Expected duration <= 100ms, got 100ms");
  });

  await t.step("builds error with small difference", () => {
    const message = buildDurationLessThanOrEqualError(100, 101);
    assertEquals(message, "Expected duration <= 100ms, got 101ms");
  });
});

Deno.test("buildDurationGreaterThanError", async (t) => {
  await t.step("builds error with normal values", () => {
    const message = buildDurationGreaterThanError(1000, 500);
    assertEquals(message, "Expected duration > 1000ms, got 500ms");
  });

  await t.step("builds error with zero threshold", () => {
    const message = buildDurationGreaterThanError(0, 0);
    assertEquals(message, "Expected duration > 0ms, got 0ms");
  });

  await t.step("builds error with equal values", () => {
    const message = buildDurationGreaterThanError(100, 100);
    assertEquals(message, "Expected duration > 100ms, got 100ms");
  });

  await t.step("builds error with small values", () => {
    const message = buildDurationGreaterThanError(10, 5);
    assertEquals(message, "Expected duration > 10ms, got 5ms");
  });

  await t.step("builds error with large values", () => {
    const message = buildDurationGreaterThanError(5000, 3000);
    assertEquals(message, "Expected duration > 5000ms, got 3000ms");
  });
});

Deno.test("buildDurationGreaterThanOrEqualError", async (t) => {
  await t.step("builds error with normal values", () => {
    const message = buildDurationGreaterThanOrEqualError(1000, 500);
    assertEquals(message, "Expected duration >= 1000ms, got 500ms");
  });

  await t.step("builds error with zero threshold", () => {
    const message = buildDurationGreaterThanOrEqualError(100, 0);
    assertEquals(message, "Expected duration >= 100ms, got 0ms");
  });

  await t.step("builds error with equal values", () => {
    const message = buildDurationGreaterThanOrEqualError(100, 100);
    assertEquals(message, "Expected duration >= 100ms, got 100ms");
  });

  await t.step("builds error with negative threshold", () => {
    const message = buildDurationGreaterThanOrEqualError(-50, -100);
    assertEquals(message, "Expected duration >= -50ms, got -100ms");
  });

  await t.step("builds error with small difference", () => {
    const message = buildDurationGreaterThanOrEqualError(100, 99);
    assertEquals(message, "Expected duration >= 100ms, got 99ms");
  });
});
