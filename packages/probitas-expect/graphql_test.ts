import { assertThrows } from "@std/assert";
import { expectGraphqlResponse } from "./graphql.ts";
import type { GraphqlResponse } from "@probitas/client-graphql";

// Mock helper
const mockGraphqlResponse = (
  overrides: Partial<GraphqlResponse> = {},
): GraphqlResponse => {
  return {
    type: "graphql" as const,
    ok: true,
    errors: null,
    data: <T = unknown>() => ({ user: { id: "1", name: "Alice" } }) as T | null,
    extensions: {},
    headers: new Headers(),
    status: 200,
    raw: new Response(),
    duration: 100,
    ...overrides,
  };
};

Deno.test("expectGraphqlResponse", async (t) => {
  await t.step("toBeSuccessful", async (t) => {
    await t.step("passes when ok is true", () => {
      const response = mockGraphqlResponse({ ok: true, errors: null });
      expectGraphqlResponse(response).toBeSuccessful();
    });

    await t.step("fails when ok is false", () => {
      const response = mockGraphqlResponse({
        ok: false,
        errors: [{ message: "Field error", path: ["user"], locations: [] }],
      });
      assertThrows(
        () => expectGraphqlResponse(response).toBeSuccessful(),
        Error,
        "Expected successful response, got errors: Field error",
      );
    });

    await t.step("negated - fails when ok is true", () => {
      const response = mockGraphqlResponse({ ok: true });
      assertThrows(
        () => expectGraphqlResponse(response).not.toBeSuccessful(),
        Error,
        "Expected response with errors, but got successful response",
      );
    });

    await t.step("negated - passes when ok is false", () => {
      const response = mockGraphqlResponse({
        ok: false,
        errors: [{ message: "Error", path: [], locations: [] }],
      });
      expectGraphqlResponse(response).not.toBeSuccessful();
    });
  });

  await t.step("toHaveErrorCount", async (t) => {
    await t.step("passes for matching count", () => {
      const response = mockGraphqlResponse({
        errors: [
          { message: "Error 1", path: [], locations: [] },
          { message: "Error 2", path: [], locations: [] },
        ],
      });
      expectGraphqlResponse(response).toHaveErrorCount(2);
    });

    await t.step("fails for non-matching count", () => {
      const response = mockGraphqlResponse({
        errors: [{ message: "Error 1", path: [], locations: [] }],
      });
      assertThrows(
        () => expectGraphqlResponse(response).toHaveErrorCount(2),
        Error,
        "Expected 2 errors, got 1",
      );
    });

    await t.step("negated - passes for non-matching count", () => {
      const response = mockGraphqlResponse({
        errors: [{ message: "Error 1", path: [], locations: [] }],
      });
      expectGraphqlResponse(response).not.toHaveErrorCount(2);
    });
  });

  await t.step("toHaveErrorCountGreaterThan", async (t) => {
    await t.step("passes when count is greater", () => {
      const response = mockGraphqlResponse({
        errors: [
          { message: "Error 1", path: [], locations: [] },
          { message: "Error 2", path: [], locations: [] },
        ],
      });
      expectGraphqlResponse(response).toHaveErrorCountGreaterThan(1);
    });

    await t.step("fails when count is equal", () => {
      const response = mockGraphqlResponse({
        errors: [{ message: "Error 1", path: [], locations: [] }],
      });
      assertThrows(
        () => expectGraphqlResponse(response).toHaveErrorCountGreaterThan(1),
        Error,
        "Expected error count > 1, but got 1",
      );
    });

    await t.step("negated - passes when count is not greater", () => {
      const response = mockGraphqlResponse({
        errors: [{ message: "Error 1", path: [], locations: [] }],
      });
      expectGraphqlResponse(response).not.toHaveErrorCountGreaterThan(1);
    });
  });

  await t.step("toHaveErrorCountGreaterThanOrEqual", async (t) => {
    await t.step("passes when count is greater", () => {
      const response = mockGraphqlResponse({
        errors: [
          { message: "Error 1", path: [], locations: [] },
          { message: "Error 2", path: [], locations: [] },
        ],
      });
      expectGraphqlResponse(response).toHaveErrorCountGreaterThanOrEqual(1);
    });

    await t.step("passes when count is equal", () => {
      const response = mockGraphqlResponse({
        errors: [{ message: "Error 1", path: [], locations: [] }],
      });
      expectGraphqlResponse(response).toHaveErrorCountGreaterThanOrEqual(1);
    });

    await t.step("fails when count is less", () => {
      const response = mockGraphqlResponse({ errors: null });
      assertThrows(
        () =>
          expectGraphqlResponse(response).toHaveErrorCountGreaterThanOrEqual(1),
        Error,
        "Expected error count >= 1, but got 0",
      );
    });
  });

  await t.step("toHaveErrorCountLessThan", async (t) => {
    await t.step("passes when count is less", () => {
      const response = mockGraphqlResponse({
        errors: [{ message: "Error 1", path: [], locations: [] }],
      });
      expectGraphqlResponse(response).toHaveErrorCountLessThan(2);
    });

    await t.step("fails when count is equal", () => {
      const response = mockGraphqlResponse({
        errors: [{ message: "Error 1", path: [], locations: [] }],
      });
      assertThrows(
        () => expectGraphqlResponse(response).toHaveErrorCountLessThan(1),
        Error,
        "Expected error count < 1, but got 1",
      );
    });
  });

  await t.step("toHaveErrorCountLessThanOrEqual", async (t) => {
    await t.step("passes when count is less", () => {
      const response = mockGraphqlResponse({ errors: null });
      expectGraphqlResponse(response).toHaveErrorCountLessThanOrEqual(1);
    });

    await t.step("passes when count is equal", () => {
      const response = mockGraphqlResponse({
        errors: [{ message: "Error 1", path: [], locations: [] }],
      });
      expectGraphqlResponse(response).toHaveErrorCountLessThanOrEqual(1);
    });

    await t.step("fails when count is greater", () => {
      const response = mockGraphqlResponse({
        errors: [
          { message: "Error 1", path: [], locations: [] },
          { message: "Error 2", path: [], locations: [] },
        ],
      });
      assertThrows(
        () =>
          expectGraphqlResponse(response).toHaveErrorCountLessThanOrEqual(1),
        Error,
        "Expected error count <= 1, but got 2",
      );
    });
  });

  await t.step("toHaveErrorContaining", async (t) => {
    await t.step("passes when error contains message", () => {
      const response = mockGraphqlResponse({
        errors: [{ message: "User not found", path: [], locations: [] }],
      });
      expectGraphqlResponse(response).toHaveErrorContaining("not found");
    });

    await t.step("fails when error does not contain message", () => {
      const response = mockGraphqlResponse({
        errors: [{ message: "Invalid input", path: [], locations: [] }],
      });
      assertThrows(
        () =>
          expectGraphqlResponse(response).toHaveErrorContaining("not found"),
        Error,
        'Expected an error containing "not found", but none found',
      );
    });

    await t.step("negated - passes when error does not contain", () => {
      const response = mockGraphqlResponse({
        errors: [{ message: "Invalid input", path: [], locations: [] }],
      });
      expectGraphqlResponse(response).not.toHaveErrorContaining("not found");
    });
  });

  await t.step("toHaveError", async (t) => {
    await t.step("passes for string match", () => {
      const response = mockGraphqlResponse({
        errors: [{ message: "User not found", path: [], locations: [] }],
      });
      expectGraphqlResponse(response).toHaveError("not found");
    });

    await t.step("passes for regex match", () => {
      const response = mockGraphqlResponse({
        errors: [{ message: "Error: code 123", path: [], locations: [] }],
      });
      expectGraphqlResponse(response).toHaveError(/code \d+/);
    });

    await t.step("fails when no match", () => {
      const response = mockGraphqlResponse({
        errors: [{ message: "Invalid input", path: [], locations: [] }],
      });
      assertThrows(
        () => expectGraphqlResponse(response).toHaveError("not found"),
        Error,
        'Expected an error matching "not found", but none found',
      );
    });
  });

  await t.step("toHaveErrorMatching", async (t) => {
    await t.step("passes when matcher succeeds", () => {
      const response = mockGraphqlResponse({
        errors: [{ message: "Error 1", path: [], locations: [] }],
      });
      expectGraphqlResponse(response).toHaveErrorMatching((errors) => {
        if (errors.length !== 1) throw new Error("Expected 1 error");
      });
    });

    await t.step("fails when matcher throws", () => {
      const response = mockGraphqlResponse({
        errors: [
          { message: "Error 1", path: [], locations: [] },
          { message: "Error 2", path: [], locations: [] },
        ],
      });
      assertThrows(
        () =>
          expectGraphqlResponse(response).toHaveErrorMatching((errors) => {
            if (errors.length !== 1) throw new Error("Expected 1 error");
          }),
        Error,
        "Expected 1 error",
      );
    });
  });

  await t.step("toHaveContent", async (t) => {
    await t.step("passes when data is not null", () => {
      const response = mockGraphqlResponse({
        data: <T = unknown>() => ({ id: "1" }) as T | null,
      });
      expectGraphqlResponse(response).toHaveContent();
    });

    await t.step("fails when data is null", () => {
      const response = mockGraphqlResponse({
        data: <T = unknown>() => null as T | null,
      });
      assertThrows(
        () => expectGraphqlResponse(response).toHaveContent(),
        Error,
        "Expected content, but data is null",
      );
    });

    await t.step("negated - passes when data is null", () => {
      const response = mockGraphqlResponse({
        data: <T = unknown>() => null as T | null,
      });
      expectGraphqlResponse(response).not.toHaveContent();
    });
  });

  await t.step("toMatchObject", async (t) => {
    await t.step("passes when data contains subset", () => {
      const response = mockGraphqlResponse({
        data: <T = unknown>() =>
          ({ user: { id: "1", name: "Alice", age: 30 } }) as T | null,
      });
      expectGraphqlResponse(response).toMatchObject({
        user: { name: "Alice" },
      });
    });

    await t.step("fails when data does not contain subset", () => {
      const response = mockGraphqlResponse({
        data: <T = unknown>() =>
          ({ user: { id: "1", name: "Bob" } }) as T | null,
      });
      assertThrows(
        () =>
          expectGraphqlResponse(response).toMatchObject({
            user: { name: "Alice" },
          }),
        Error,
      );
    });

    await t.step("negated - passes when data does not contain", () => {
      const response = mockGraphqlResponse({
        data: <T = unknown>() =>
          ({ user: { id: "1", name: "Bob" } }) as T | null,
      });
      expectGraphqlResponse(response).not.toMatchObject({
        user: { name: "Alice" },
      });
    });
  });

  await t.step("toSatisfy", async (t) => {
    await t.step("passes when matcher succeeds", () => {
      const response = mockGraphqlResponse({
        data: <T = unknown>() =>
          ({ user: { id: "1", name: "Alice" } }) as T | null,
      });
      expectGraphqlResponse(response).toSatisfy(
        (data: { user: { name: string } }) => {
          if (data.user.name !== "Alice") throw new Error("Expected Alice");
        },
      );
    });

    await t.step("fails when matcher throws", () => {
      const response = mockGraphqlResponse({
        data: <T = unknown>() =>
          ({ user: { id: "1", name: "Bob" } }) as T | null,
      });
      assertThrows(
        () =>
          expectGraphqlResponse(response).toSatisfy(
            (data: { user: { name: string } }) => {
              if (data.user.name !== "Alice") throw new Error("Expected Alice");
            },
          ),
        Error,
        "Expected Alice",
      );
    });
  });

  await t.step("toHaveExtension", async (t) => {
    await t.step("passes when extension exists", () => {
      const response = mockGraphqlResponse({
        extensions: { tracing: { duration: 100 } },
      });
      expectGraphqlResponse(response).toHaveExtension("tracing");
    });

    await t.step("fails when extension does not exist", () => {
      const response = mockGraphqlResponse({ extensions: {} });
      assertThrows(
        () => expectGraphqlResponse(response).toHaveExtension("tracing"),
        Error,
        'Expected extension "tracing" to exist',
      );
    });

    await t.step("negated - passes when extension does not exist", () => {
      const response = mockGraphqlResponse({ extensions: {} });
      expectGraphqlResponse(response).not.toHaveExtension("tracing");
    });
  });

  await t.step("toHaveExtensionMatching", async (t) => {
    await t.step("passes when matcher succeeds", () => {
      const response = mockGraphqlResponse({
        extensions: { tracing: { duration: 100 } },
      });
      expectGraphqlResponse(response).toHaveExtensionMatching(
        "tracing",
        (value) => {
          if ((value as { duration: number }).duration !== 100) {
            throw new Error("Expected duration 100");
          }
        },
      );
    });

    await t.step("fails when matcher throws", () => {
      const response = mockGraphqlResponse({
        extensions: { tracing: { duration: 200 } },
      });
      assertThrows(
        () =>
          expectGraphqlResponse(response).toHaveExtensionMatching(
            "tracing",
            (value) => {
              if ((value as { duration: number }).duration !== 100) {
                throw new Error("Expected duration 100");
              }
            },
          ),
        Error,
        "Expected duration 100",
      );
    });
  });

  await t.step("toHaveStatus", async (t) => {
    await t.step("passes for matching status", () => {
      const response = mockGraphqlResponse({ status: 200 });
      expectGraphqlResponse(response).toHaveStatus(200);
    });

    await t.step("fails for non-matching status", () => {
      const response = mockGraphqlResponse({ status: 500 });
      assertThrows(
        () => expectGraphqlResponse(response).toHaveStatus(200),
        Error,
        "Expected status 200, got 500",
      );
    });

    await t.step("negated - passes for non-matching", () => {
      const response = mockGraphqlResponse({ status: 500 });
      expectGraphqlResponse(response).not.toHaveStatus(200);
    });
  });

  await t.step("toHaveStatusOneOf", async (t) => {
    await t.step("passes when status is in list", () => {
      const response = mockGraphqlResponse({ status: 200 });
      expectGraphqlResponse(response).toHaveStatusOneOf([200, 201, 204]);
    });

    await t.step("fails when status is not in list", () => {
      const response = mockGraphqlResponse({ status: 500 });
      assertThrows(
        () =>
          expectGraphqlResponse(response).toHaveStatusOneOf([200, 201, 204]),
        Error,
        "Expected status in [200, 201, 204], got 500",
      );
    });

    await t.step("negated - passes when status not in list", () => {
      const response = mockGraphqlResponse({ status: 500 });
      expectGraphqlResponse(response).not.toHaveStatusOneOf([200, 201, 204]);
    });
  });

  await t.step("toHaveDurationLessThan", async (t) => {
    await t.step("passes when duration is less", () => {
      const response = mockGraphqlResponse({ duration: 50 });
      expectGraphqlResponse(response).toHaveDurationLessThan(100);
    });

    await t.step("fails when duration is equal", () => {
      const response = mockGraphqlResponse({ duration: 100 });
      assertThrows(
        () => expectGraphqlResponse(response).toHaveDurationLessThan(100),
        Error,
        "Expected duration < 100ms, got 100ms",
      );
    });

    await t.step("negated - passes when duration is not less", () => {
      const response = mockGraphqlResponse({ duration: 100 });
      expectGraphqlResponse(response).not.toHaveDurationLessThan(100);
    });
  });

  await t.step("toHaveDurationLessThanOrEqual", async (t) => {
    await t.step("passes when duration is less", () => {
      const response = mockGraphqlResponse({ duration: 50 });
      expectGraphqlResponse(response).toHaveDurationLessThanOrEqual(100);
    });

    await t.step("passes when duration is equal", () => {
      const response = mockGraphqlResponse({ duration: 100 });
      expectGraphqlResponse(response).toHaveDurationLessThanOrEqual(100);
    });

    await t.step("fails when duration is greater", () => {
      const response = mockGraphqlResponse({ duration: 150 });
      assertThrows(
        () =>
          expectGraphqlResponse(response).toHaveDurationLessThanOrEqual(100),
        Error,
        "Expected duration <= 100ms, got 150ms",
      );
    });
  });

  await t.step("toHaveDurationGreaterThan", async (t) => {
    await t.step("passes when duration is greater", () => {
      const response = mockGraphqlResponse({ duration: 150 });
      expectGraphqlResponse(response).toHaveDurationGreaterThan(100);
    });

    await t.step("fails when duration is equal", () => {
      const response = mockGraphqlResponse({ duration: 100 });
      assertThrows(
        () => expectGraphqlResponse(response).toHaveDurationGreaterThan(100),
        Error,
        "Expected duration > 100ms, got 100ms",
      );
    });

    await t.step("negated - passes when duration is not greater", () => {
      const response = mockGraphqlResponse({ duration: 100 });
      expectGraphqlResponse(response).not.toHaveDurationGreaterThan(100);
    });
  });

  await t.step("toHaveDurationGreaterThanOrEqual", async (t) => {
    await t.step("passes when duration is greater", () => {
      const response = mockGraphqlResponse({ duration: 150 });
      expectGraphqlResponse(response).toHaveDurationGreaterThanOrEqual(100);
    });

    await t.step("passes when duration is equal", () => {
      const response = mockGraphqlResponse({ duration: 100 });
      expectGraphqlResponse(response).toHaveDurationGreaterThanOrEqual(100);
    });

    await t.step("fails when duration is less", () => {
      const response = mockGraphqlResponse({ duration: 50 });
      assertThrows(
        () =>
          expectGraphqlResponse(response).toHaveDurationGreaterThanOrEqual(100),
        Error,
        "Expected duration >= 100ms, got 50ms",
      );
    });
  });

  await t.step("method chaining", () => {
    const response = mockGraphqlResponse({
      ok: true,
      errors: null,
      data: <T = unknown>() =>
        ({ user: { id: "1", name: "Alice" } }) as T | null,
      extensions: { tracing: { duration: 100 } },
      status: 200,
      duration: 50,
    });

    expectGraphqlResponse(response)
      .toBeSuccessful()
      .toHaveStatus(200)
      .toHaveContent()
      .toMatchObject({ user: { name: "Alice" } })
      .toHaveExtension("tracing")
      .toHaveDurationLessThan(100);
  });
});
