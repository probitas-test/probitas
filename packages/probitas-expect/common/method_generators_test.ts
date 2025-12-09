/**
 * Tests for method generator functions.
 *
 * @module
 */

import { assertEquals, assertThrows } from "@std/assert";
import {
  createCountMethods,
  createDurationMethods,
} from "./method_generators.ts";

Deno.test("createDurationMethods", async (t) => {
  await t.step("toHaveDurationLessThan: passes when duration is less", () => {
    const methods = createDurationMethods(100);
    const context = { value: "test" };
    const result = methods.toHaveDurationLessThan.call(context, 200);
    assertEquals(result, context);
  });

  await t.step(
    "toHaveDurationLessThan: throws when duration is not less",
    () => {
      const methods = createDurationMethods(300);
      assertThrows(
        () => methods.toHaveDurationLessThan(200),
        Error,
        "Expected duration < 200ms, got 300ms",
      );
    },
  );

  await t.step("toHaveDurationLessThan: throws when duration is equal", () => {
    const methods = createDurationMethods(200);
    assertThrows(
      () => methods.toHaveDurationLessThan(200),
      Error,
      "Expected duration < 200ms, got 200ms",
    );
  });

  await t.step(
    "toHaveDurationLessThan with negate: throws when duration is less",
    () => {
      const methods = createDurationMethods(100, true);
      assertThrows(
        () => methods.toHaveDurationLessThan(200),
        Error,
        "Expected duration to not be < 200ms, but got 100ms",
      );
    },
  );

  await t.step(
    "toHaveDurationLessThan with negate: passes when duration is not less",
    () => {
      const methods = createDurationMethods(300, true);
      const context = { value: "test" };
      const result = methods.toHaveDurationLessThan.call(context, 200);
      assertEquals(result, context);
    },
  );

  await t.step(
    "toHaveDurationLessThanOrEqual: passes when duration is less",
    () => {
      const methods = createDurationMethods(100);
      const context = { value: "test" };
      const result = methods.toHaveDurationLessThanOrEqual.call(context, 200);
      assertEquals(result, context);
    },
  );

  await t.step(
    "toHaveDurationLessThanOrEqual: passes when duration is equal",
    () => {
      const methods = createDurationMethods(200);
      const context = { value: "test" };
      const result = methods.toHaveDurationLessThanOrEqual.call(context, 200);
      assertEquals(result, context);
    },
  );

  await t.step(
    "toHaveDurationLessThanOrEqual: throws when duration is greater",
    () => {
      const methods = createDurationMethods(300);
      assertThrows(
        () => methods.toHaveDurationLessThanOrEqual(200),
        Error,
        "Expected duration <= 200ms, got 300ms",
      );
    },
  );

  await t.step(
    "toHaveDurationLessThanOrEqual with negate: throws when condition passes",
    () => {
      const methods = createDurationMethods(100, true);
      assertThrows(
        () => methods.toHaveDurationLessThanOrEqual(200),
        Error,
        "Expected duration to not be <= 200ms, but got 100ms",
      );
    },
  );

  await t.step(
    "toHaveDurationLessThanOrEqual with negate: passes when condition fails",
    () => {
      const methods = createDurationMethods(300, true);
      const context = { value: "test" };
      const result = methods.toHaveDurationLessThanOrEqual.call(context, 200);
      assertEquals(result, context);
    },
  );

  await t.step(
    "toHaveDurationGreaterThan: passes when duration is greater",
    () => {
      const methods = createDurationMethods(300);
      const context = { value: "test" };
      const result = methods.toHaveDurationGreaterThan.call(context, 200);
      assertEquals(result, context);
    },
  );

  await t.step(
    "toHaveDurationGreaterThan: throws when duration is not greater",
    () => {
      const methods = createDurationMethods(100);
      assertThrows(
        () => methods.toHaveDurationGreaterThan(200),
        Error,
        "Expected duration > 200ms, got 100ms",
      );
    },
  );

  await t.step(
    "toHaveDurationGreaterThan: throws when duration is equal",
    () => {
      const methods = createDurationMethods(200);
      assertThrows(
        () => methods.toHaveDurationGreaterThan(200),
        Error,
        "Expected duration > 200ms, got 200ms",
      );
    },
  );

  await t.step(
    "toHaveDurationGreaterThan with negate: throws when duration is greater",
    () => {
      const methods = createDurationMethods(300, true);
      assertThrows(
        () => methods.toHaveDurationGreaterThan(200),
        Error,
        "Expected duration to not be > 200ms, but got 300ms",
      );
    },
  );

  await t.step(
    "toHaveDurationGreaterThan with negate: passes when duration is not greater",
    () => {
      const methods = createDurationMethods(100, true);
      const context = { value: "test" };
      const result = methods.toHaveDurationGreaterThan.call(context, 200);
      assertEquals(result, context);
    },
  );

  await t.step(
    "toHaveDurationGreaterThanOrEqual: passes when duration is greater",
    () => {
      const methods = createDurationMethods(300);
      const context = { value: "test" };
      const result = methods.toHaveDurationGreaterThanOrEqual.call(
        context,
        200,
      );
      assertEquals(result, context);
    },
  );

  await t.step(
    "toHaveDurationGreaterThanOrEqual: passes when duration is equal",
    () => {
      const methods = createDurationMethods(200);
      const context = { value: "test" };
      const result = methods.toHaveDurationGreaterThanOrEqual.call(
        context,
        200,
      );
      assertEquals(result, context);
    },
  );

  await t.step(
    "toHaveDurationGreaterThanOrEqual: throws when duration is less",
    () => {
      const methods = createDurationMethods(100);
      assertThrows(
        () => methods.toHaveDurationGreaterThanOrEqual(200),
        Error,
        "Expected duration >= 200ms, got 100ms",
      );
    },
  );

  await t.step(
    "toHaveDurationGreaterThanOrEqual with negate: throws when condition passes",
    () => {
      const methods = createDurationMethods(300, true);
      assertThrows(
        () => methods.toHaveDurationGreaterThanOrEqual(200),
        Error,
        "Expected duration to not be >= 200ms, but got 300ms",
      );
    },
  );

  await t.step(
    "toHaveDurationGreaterThanOrEqual with negate: passes when condition fails",
    () => {
      const methods = createDurationMethods(100, true);
      const context = { value: "test" };
      const result = methods.toHaveDurationGreaterThanOrEqual.call(
        context,
        200,
      );
      assertEquals(result, context);
    },
  );

  await t.step("handles zero duration", () => {
    const methods = createDurationMethods(0);
    assertThrows(
      () => methods.toHaveDurationGreaterThan(0),
      Error,
      "Expected duration > 0ms, got 0ms",
    );
    const context = { value: "test" };
    assertEquals(
      methods.toHaveDurationLessThanOrEqual.call(context, 0),
      context,
    );
  });

  await t.step("handles fractional durations", () => {
    const methods = createDurationMethods(100.5);
    const context = { value: "test" };
    assertEquals(
      methods.toHaveDurationLessThan.call(context, 100.6),
      context,
    );
    assertThrows(
      () => methods.toHaveDurationLessThan(100.4),
      Error,
      "Expected duration < 100.4ms, got 100.5ms",
    );
  });
});

Deno.test("createCountMethods", async (t) => {
  await t.step("generates method with correct name", () => {
    const methods = createCountMethods(5, "error count");
    assertEquals(typeof methods.toHaveErrorCount, "function");
  });

  await t.step("toHave{CountName}: passes when count matches", () => {
    const methods = createCountMethods(5, "row count");
    const context = { value: "test" } as Record<string, unknown>;
    const result = methods.toHaveRowCount.call(context, 5);
    assertEquals(result, context);
  });

  await t.step("toHave{CountName}: throws when count does not match", () => {
    const methods = createCountMethods(5, "row count");
    assertThrows(
      () => methods.toHaveRowCount(10),
      Error,
      "Expected 10 row count, got 5",
    );
  });

  await t.step(
    "toHave{CountName}GreaterThan: passes when count is greater",
    () => {
      const methods = createCountMethods(10, "success count");
      const context = { value: "test" } as Record<string, unknown>;
      const result = methods.toHaveSuccessCountGreaterThan.call(context, 5);
      assertEquals(result, context);
    },
  );

  await t.step(
    "toHave{CountName}GreaterThan: throws when count is not greater",
    () => {
      const methods = createCountMethods(5, "success count");
      assertThrows(
        () => methods.toHaveSuccessCountGreaterThan(10),
        Error,
        "Expected success count > 10, but got 5",
      );
    },
  );

  await t.step(
    "toHave{CountName}GreaterThan: throws when count is equal",
    () => {
      const methods = createCountMethods(10, "success count");
      assertThrows(
        () => methods.toHaveSuccessCountGreaterThan(10),
        Error,
        "Expected success count > 10, but got 10",
      );
    },
  );

  await t.step(
    "toHave{CountName}GreaterThanOrEqual: passes when count is greater",
    () => {
      const methods = createCountMethods(10, "error count");
      const context = { value: "test" } as Record<string, unknown>;
      const result = methods.toHaveErrorCountGreaterThanOrEqual.call(
        context,
        5,
      );
      assertEquals(result, context);
    },
  );

  await t.step(
    "toHave{CountName}GreaterThanOrEqual: passes when count is equal",
    () => {
      const methods = createCountMethods(10, "error count");
      const context = { value: "test" } as Record<string, unknown>;
      const result = methods.toHaveErrorCountGreaterThanOrEqual.call(
        context,
        10,
      );
      assertEquals(result, context);
    },
  );

  await t.step(
    "toHave{CountName}GreaterThanOrEqual: throws when count is less",
    () => {
      const methods = createCountMethods(5, "error count");
      assertThrows(
        () => methods.toHaveErrorCountGreaterThanOrEqual(10),
        Error,
        "Expected error count >= 10, but got 5",
      );
    },
  );

  await t.step("toHave{CountName}LessThan: passes when count is less", () => {
    const methods = createCountMethods(5, "warning count");
    const context = { value: "test" } as Record<string, unknown>;
    const result = methods.toHaveWarningCountLessThan.call(context, 10);
    assertEquals(result, context);
  });

  await t.step(
    "toHave{CountName}LessThan: throws when count is not less",
    () => {
      const methods = createCountMethods(10, "warning count");
      assertThrows(
        () => methods.toHaveWarningCountLessThan(5),
        Error,
        "Expected warning count < 5, but got 10",
      );
    },
  );

  await t.step("toHave{CountName}LessThan: throws when count is equal", () => {
    const methods = createCountMethods(10, "warning count");
    assertThrows(
      () => methods.toHaveWarningCountLessThan(10),
      Error,
      "Expected warning count < 10, but got 10",
    );
  });

  await t.step(
    "toHave{CountName}LessThanOrEqual: passes when count is less",
    () => {
      const methods = createCountMethods(5, "retry count");
      const context = { value: "test" } as Record<string, unknown>;
      const result = methods.toHaveRetryCountLessThanOrEqual.call(context, 10);
      assertEquals(result, context);
    },
  );

  await t.step(
    "toHave{CountName}LessThanOrEqual: passes when count is equal",
    () => {
      const methods = createCountMethods(10, "retry count");
      const context = { value: "test" } as Record<string, unknown>;
      const result = methods.toHaveRetryCountLessThanOrEqual.call(context, 10);
      assertEquals(result, context);
    },
  );

  await t.step(
    "toHave{CountName}LessThanOrEqual: throws when count is greater",
    () => {
      const methods = createCountMethods(15, "retry count");
      assertThrows(
        () => methods.toHaveRetryCountLessThanOrEqual(10),
        Error,
        "Expected retry count <= 10, but got 15",
      );
    },
  );

  await t.step("handles single word count name", () => {
    const methods = createCountMethods(42, "rows");
    assertEquals(typeof methods.toHaveRows, "function");
    const context = { value: "test" } as Record<string, unknown>;
    assertEquals(methods.toHaveRows.call(context, 42), context);
  });

  await t.step("handles multi-word count name with capitalization", () => {
    const methods = createCountMethods(7, "total error count");
    assertEquals(typeof methods.toHaveTotalErrorCount, "function");
    const context = { value: "test" } as Record<string, unknown>;
    assertEquals(methods.toHaveTotalErrorCount.call(context, 7), context);
  });

  await t.step("handles zero count", () => {
    const methods = createCountMethods(0, "failures");
    const context = { value: "test" } as Record<string, unknown>;
    assertEquals(methods.toHaveFailures.call(context, 0), context);
    assertThrows(
      () => methods.toHaveFailuresGreaterThan(0),
      Error,
      "Expected failures > 0, but got 0",
    );
  });

  await t.step("returns this for method chaining", () => {
    const methods = createCountMethods(5, "items");
    type ContextType = Record<string, unknown> & {
      value: string;
      another: string;
    };
    const context = { value: "test", another: "method" } as ContextType;
    const result = methods.toHaveItems.call(context, 5) as ContextType;
    assertEquals(result, context);
    assertEquals(result.value, "test");
    assertEquals(result.another, "method");
  });
});
