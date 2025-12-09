import { assertThrows } from "@std/assert";
import { expectGrpcResponse } from "./grpc.ts";
import type { GrpcResponse } from "@probitas/client-grpc";

// Mock helper
const mockGrpcResponse = (
  overrides: Partial<GrpcResponse> = {},
): GrpcResponse => {
  return {
    type: "connectrpc" as const,
    code: 0,
    ok: true,
    message: "",
    headers: {},
    trailers: {},
    data: <T = unknown>() => ({ id: "1", name: "Alice" }) as T | null,
    raw: () => ({}),
    duration: 100,
    ...overrides,
  };
};

Deno.test("expectGrpcResponse", async (t) => {
  await t.step("toBeSuccessful", async (t) => {
    await t.step("passes for code 0", () => {
      const response = mockGrpcResponse({ code: 0, ok: true });
      expectGrpcResponse(response).toBeSuccessful();
    });

    await t.step("fails for non-zero code", () => {
      const response = mockGrpcResponse({
        code: 5,
        ok: false,
        message: "Not found",
      });
      assertThrows(
        () => expectGrpcResponse(response).toBeSuccessful(),
        Error,
        "Expected response to be successful (code 0), but got code 5: Not found",
      );
    });

    await t.step("negated - fails for code 0", () => {
      const response = mockGrpcResponse({ code: 0, ok: true });
      assertThrows(
        () => expectGrpcResponse(response).not.toBeSuccessful(),
        Error,
        "Expected response to not be successful, but got code 0 (OK)",
      );
    });

    await t.step("negated - passes for non-zero code", () => {
      const response = mockGrpcResponse({ code: 5, ok: false });
      expectGrpcResponse(response).not.toBeSuccessful();
    });
  });

  await t.step("toHaveCode", async (t) => {
    await t.step("passes for matching code", () => {
      const response = mockGrpcResponse({ code: 5 });
      expectGrpcResponse(response).toHaveCode(5);
    });

    await t.step("fails for non-matching code", () => {
      const response = mockGrpcResponse({ code: 0 });
      assertThrows(
        () => expectGrpcResponse(response).toHaveCode(5),
        Error,
        "Expected code 5, but got 0",
      );
    });

    await t.step("negated - passes for non-matching", () => {
      const response = mockGrpcResponse({ code: 0 });
      expectGrpcResponse(response).not.toHaveCode(5);
    });

    await t.step("negated - fails for matching", () => {
      const response = mockGrpcResponse({ code: 5 });
      assertThrows(
        () => expectGrpcResponse(response).not.toHaveCode(5),
        Error,
        "Expected code to not be 5, but got 5",
      );
    });
  });

  await t.step("toHaveCodeOneOf", async (t) => {
    await t.step("passes when code is in list", () => {
      const response = mockGrpcResponse({ code: 5 });
      expectGrpcResponse(response).toHaveCodeOneOf([0, 5, 14]);
    });

    await t.step("fails when code is not in list", () => {
      const response = mockGrpcResponse({ code: 3 });
      assertThrows(
        () => expectGrpcResponse(response).toHaveCodeOneOf([0, 5, 14]),
        Error,
        "Expected code to be one of [0, 5, 14], but got 3",
      );
    });

    await t.step("negated - passes when code not in list", () => {
      const response = mockGrpcResponse({ code: 3 });
      expectGrpcResponse(response).not.toHaveCodeOneOf([0, 5, 14]);
    });

    await t.step("negated - fails when code in list", () => {
      const response = mockGrpcResponse({ code: 5 });
      assertThrows(
        () => expectGrpcResponse(response).not.toHaveCodeOneOf([0, 5, 14]),
        Error,
        "Expected code to not be one of [0, 5, 14], but got 5",
      );
    });
  });

  await t.step("toHaveMessage", async (t) => {
    await t.step("passes for matching message", () => {
      const response = mockGrpcResponse({ message: "Error occurred" });
      expectGrpcResponse(response).toHaveMessage("Error occurred");
    });

    await t.step("fails for non-matching message", () => {
      const response = mockGrpcResponse({ message: "Something else" });
      assertThrows(
        () => expectGrpcResponse(response).toHaveMessage("Error occurred"),
        Error,
        'Expected message "Error occurred", but got "Something else"',
      );
    });

    await t.step("negated - passes for non-matching", () => {
      const response = mockGrpcResponse({ message: "Something else" });
      expectGrpcResponse(response).not.toHaveMessage("Error occurred");
    });

    await t.step("negated - fails for matching", () => {
      const response = mockGrpcResponse({ message: "Error occurred" });
      assertThrows(
        () => expectGrpcResponse(response).not.toHaveMessage("Error occurred"),
        Error,
        'Expected message to not be "Error occurred", but got "Error occurred"',
      );
    });
  });

  await t.step("toHaveMessageContaining", async (t) => {
    await t.step("passes when message contains substring", () => {
      const response = mockGrpcResponse({ message: "User not found" });
      expectGrpcResponse(response).toHaveMessageContaining("not found");
    });

    await t.step("fails when message does not contain substring", () => {
      const response = mockGrpcResponse({ message: "Invalid input" });
      assertThrows(
        () => expectGrpcResponse(response).toHaveMessageContaining("not found"),
        Error,
        'Expected message to contain "not found", but got "Invalid input"',
      );
    });

    await t.step("handles null message", () => {
      const response = mockGrpcResponse({ message: null as unknown as string });
      expectGrpcResponse(response).toHaveMessageContaining("");
    });

    await t.step("negated - passes when message does not contain", () => {
      const response = mockGrpcResponse({ message: "Invalid input" });
      expectGrpcResponse(response).not.toHaveMessageContaining("not found");
    });
  });

  await t.step("toHaveMessageMatching", async (t) => {
    await t.step("passes when message matches pattern", () => {
      const response = mockGrpcResponse({ message: "Error: code 123" });
      expectGrpcResponse(response).toHaveMessageMatching(/code \d+/);
    });

    await t.step("fails when message does not match pattern", () => {
      const response = mockGrpcResponse({ message: "Simple error" });
      assertThrows(
        () => expectGrpcResponse(response).toHaveMessageMatching(/code \d+/),
        Error,
        'Expected message to match /code \\d+/, but got "Simple error"',
      );
    });

    await t.step("negated - passes when message does not match", () => {
      const response = mockGrpcResponse({ message: "Simple error" });
      expectGrpcResponse(response).not.toHaveMessageMatching(/code \d+/);
    });

    await t.step("negated - fails when message matches", () => {
      const response = mockGrpcResponse({ message: "Error: code 123" });
      assertThrows(
        () =>
          expectGrpcResponse(response).not.toHaveMessageMatching(/code \d+/),
        Error,
        'Expected message to not match /code \\d+/, but got "Error: code 123"',
      );
    });
  });

  await t.step("toHaveTrailerValue", async (t) => {
    await t.step("passes when trailer value matches", () => {
      const response = mockGrpcResponse({
        trailers: { "x-trace-id": "abc123" },
      });
      expectGrpcResponse(response).toHaveTrailerValue("x-trace-id", "abc123");
    });

    await t.step("fails when trailer value does not match", () => {
      const response = mockGrpcResponse({
        trailers: { "x-trace-id": "def456" },
      });
      assertThrows(
        () =>
          expectGrpcResponse(response).toHaveTrailerValue(
            "x-trace-id",
            "abc123",
          ),
        Error,
        'Expected trailer "x-trace-id" to be "abc123", but got "def456"',
      );
    });

    await t.step("negated - passes when trailer value does not match", () => {
      const response = mockGrpcResponse({
        trailers: { "x-trace-id": "def456" },
      });
      expectGrpcResponse(response).not.toHaveTrailerValue(
        "x-trace-id",
        "abc123",
      );
    });
  });

  await t.step("toHaveTrailer", async (t) => {
    await t.step("passes when trailer exists", () => {
      const response = mockGrpcResponse({
        trailers: { "x-trace-id": "abc123" },
      });
      expectGrpcResponse(response).toHaveTrailer("x-trace-id");
    });

    await t.step("fails when trailer does not exist", () => {
      const response = mockGrpcResponse({ trailers: {} });
      assertThrows(
        () => expectGrpcResponse(response).toHaveTrailer("x-trace-id"),
        Error,
        'Expected trailer "x-trace-id" to exist, but it was missing',
      );
    });

    await t.step("negated - passes when trailer does not exist", () => {
      const response = mockGrpcResponse({ trailers: {} });
      expectGrpcResponse(response).not.toHaveTrailer("x-trace-id");
    });

    await t.step("negated - fails when trailer exists", () => {
      const response = mockGrpcResponse({
        trailers: { "x-trace-id": "abc123" },
      });
      assertThrows(
        () => expectGrpcResponse(response).not.toHaveTrailer("x-trace-id"),
        Error,
        'Expected trailer "x-trace-id" to not exist, but it was present',
      );
    });
  });

  await t.step("toHaveContent", async (t) => {
    await t.step("passes when data is not null", () => {
      const response = mockGrpcResponse({
        data: <T>() => ({ id: "1" }) as T,
      });
      expectGrpcResponse(response).toHaveContent();
    });

    await t.step("fails when data is null", () => {
      const response = mockGrpcResponse({
        data: <T>() => null as T,
      });
      assertThrows(
        () => expectGrpcResponse(response).toHaveContent(),
        Error,
        "Expected response to have content, but data is null",
      );
    });

    await t.step("fails when data is undefined", () => {
      const response = mockGrpcResponse({
        data: <T>() => undefined as T,
      });
      assertThrows(
        () => expectGrpcResponse(response).toHaveContent(),
        Error,
        "Expected response to have content, but data is undefined",
      );
    });

    await t.step("negated - passes when data is null", () => {
      const response = mockGrpcResponse({
        data: <T>() => null as T,
      });
      expectGrpcResponse(response).not.toHaveContent();
    });

    await t.step("negated - fails when data exists", () => {
      const response = mockGrpcResponse({
        data: <T>() => ({ id: "1" }) as T,
      });
      assertThrows(
        () => expectGrpcResponse(response).not.toHaveContent(),
        Error,
        'Expected response to not have content, but got: {"id":"1"}',
      );
    });
  });

  await t.step("toHaveBodyContaining", async (t) => {
    await t.step("passes when body contains subset", () => {
      const response = mockGrpcResponse({
        data: <T>() => ({ id: "1", name: "Alice", age: 30 }) as T,
      });
      expectGrpcResponse(response).toHaveBodyContaining({ name: "Alice" });
    });

    await t.step("fails when body does not contain subset", () => {
      const response = mockGrpcResponse({
        data: <T>() => ({ id: "1", name: "Bob" }) as T,
      });
      assertThrows(
        () =>
          expectGrpcResponse(response).toHaveBodyContaining({ name: "Alice" }),
        Error,
        "toHaveBodyContaining",
      );
    });

    await t.step("negated - passes when body does not contain", () => {
      const response = mockGrpcResponse({
        data: <T>() => ({ id: "1", name: "Bob" }) as T,
      });
      expectGrpcResponse(response).not.toHaveBodyContaining({ name: "Alice" });
    });
  });

  await t.step("toHaveBodyMatching", async (t) => {
    await t.step("passes when predicate succeeds", () => {
      const response = mockGrpcResponse({
        data: <T>() => ({ count: 5 }) as T,
      });
      expectGrpcResponse(response).toHaveBodyMatching(
        (body: unknown) => {
          if ((body as { count: number }).count !== 5) {
            throw new Error("Expected count 5");
          }
        },
      );
    });

    await t.step("fails when predicate throws", () => {
      const response = mockGrpcResponse({
        data: <T>() => ({ count: 3 }) as T,
      });
      assertThrows(
        () =>
          expectGrpcResponse(response).toHaveBodyMatching(
            (body: unknown) => {
              if ((body as { count: number }).count !== 5) {
                throw new Error("Expected count 5");
              }
            },
          ),
        Error,
        "Expected count 5",
      );
    });

    await t.step("negated - passes when predicate throws", () => {
      const response = mockGrpcResponse({
        data: <T>() => ({ count: 3 }) as T,
      });
      expectGrpcResponse(response).not.toHaveBodyMatching(
        (body: unknown) => {
          if ((body as { count: number }).count !== 5) {
            throw new Error("Expected count 5");
          }
        },
      );
    });
  });

  await t.step("toHaveDataContaining", async (t) => {
    await t.step("passes when data contains subset", () => {
      const response = mockGrpcResponse({
        data: <T>() => ({ id: "1", name: "Alice", age: 30 }) as T,
      });
      expectGrpcResponse(response).toHaveDataContaining({ name: "Alice" });
    });

    await t.step("passes for nested properties", () => {
      const response = mockGrpcResponse({
        data: <T>() => ({ user: { id: "1", name: "Alice" } }) as T,
      });
      expectGrpcResponse(response).toHaveDataContaining({
        user: { name: "Alice" },
      });
    });

    await t.step("fails when data does not contain subset", () => {
      const response = mockGrpcResponse({
        data: <T>() => ({ id: "1", name: "Bob" }) as T,
      });
      assertThrows(
        () =>
          expectGrpcResponse(response).toHaveDataContaining({ name: "Alice" }),
        Error,
        "toHaveDataContaining",
      );
    });

    await t.step("negated - passes when data does not contain", () => {
      const response = mockGrpcResponse({
        data: <T>() => ({ id: "1", name: "Bob" }) as T,
      });
      expectGrpcResponse(response).not.toHaveDataContaining({ name: "Alice" });
    });
  });

  await t.step("toHaveDataMatching", async (t) => {
    await t.step("passes when predicate succeeds", () => {
      const response = mockGrpcResponse({
        data: <T>() => ({ count: 5 }) as T,
      });
      expectGrpcResponse(response).toHaveDataMatching(
        (data: unknown) => {
          if ((data as { count: number }).count !== 5) {
            throw new Error("Expected count 5");
          }
        },
      );
    });

    await t.step("fails when predicate throws", () => {
      const response = mockGrpcResponse({
        data: <T>() => ({ count: 3 }) as T,
      });
      assertThrows(
        () =>
          expectGrpcResponse(response).toHaveDataMatching(
            (data: unknown) => {
              if ((data as { count: number }).count !== 5) {
                throw new Error("Expected count 5");
              }
            },
          ),
        Error,
        "Expected count 5",
      );
    });

    await t.step("negated - passes when predicate throws", () => {
      const response = mockGrpcResponse({
        data: <T>() => ({ count: 3 }) as T,
      });
      expectGrpcResponse(response).not.toHaveDataMatching(
        (data: unknown) => {
          if ((data as { count: number }).count !== 5) {
            throw new Error("Expected count 5");
          }
        },
      );
    });
  });

  await t.step("toHaveDurationLessThan", async (t) => {
    await t.step("passes when duration is less", () => {
      const response = mockGrpcResponse({ duration: 50 });
      expectGrpcResponse(response).toHaveDurationLessThan(100);
    });

    await t.step("fails when duration is equal", () => {
      const response = mockGrpcResponse({ duration: 100 });
      assertThrows(
        () => expectGrpcResponse(response).toHaveDurationLessThan(100),
        Error,
        "Expected duration < 100ms, got 100ms",
      );
    });

    await t.step("fails when duration is greater", () => {
      const response = mockGrpcResponse({ duration: 150 });
      assertThrows(
        () => expectGrpcResponse(response).toHaveDurationLessThan(100),
        Error,
        "Expected duration < 100ms, got 150ms",
      );
    });

    await t.step("negated - passes when duration is greater or equal", () => {
      const response = mockGrpcResponse({ duration: 100 });
      expectGrpcResponse(response).not.toHaveDurationLessThan(100);
    });
  });

  await t.step("toHaveDurationLessThanOrEqual", async (t) => {
    await t.step("passes when duration is less", () => {
      const response = mockGrpcResponse({ duration: 50 });
      expectGrpcResponse(response).toHaveDurationLessThanOrEqual(100);
    });

    await t.step("passes when duration is equal", () => {
      const response = mockGrpcResponse({ duration: 100 });
      expectGrpcResponse(response).toHaveDurationLessThanOrEqual(100);
    });

    await t.step("fails when duration is greater", () => {
      const response = mockGrpcResponse({ duration: 150 });
      assertThrows(
        () => expectGrpcResponse(response).toHaveDurationLessThanOrEqual(100),
        Error,
        "Expected duration <= 100ms, got 150ms",
      );
    });

    await t.step("negated - passes when duration is greater", () => {
      const response = mockGrpcResponse({ duration: 150 });
      expectGrpcResponse(response).not.toHaveDurationLessThanOrEqual(100);
    });
  });

  await t.step("toHaveDurationGreaterThan", async (t) => {
    await t.step("passes when duration is greater", () => {
      const response = mockGrpcResponse({ duration: 150 });
      expectGrpcResponse(response).toHaveDurationGreaterThan(100);
    });

    await t.step("fails when duration is equal", () => {
      const response = mockGrpcResponse({ duration: 100 });
      assertThrows(
        () => expectGrpcResponse(response).toHaveDurationGreaterThan(100),
        Error,
        "Expected duration > 100ms, got 100ms",
      );
    });

    await t.step("fails when duration is less", () => {
      const response = mockGrpcResponse({ duration: 50 });
      assertThrows(
        () => expectGrpcResponse(response).toHaveDurationGreaterThan(100),
        Error,
        "Expected duration > 100ms, got 50ms",
      );
    });

    await t.step("negated - passes when duration is less or equal", () => {
      const response = mockGrpcResponse({ duration: 100 });
      expectGrpcResponse(response).not.toHaveDurationGreaterThan(100);
    });
  });

  await t.step("toHaveDurationGreaterThanOrEqual", async (t) => {
    await t.step("passes when duration is greater", () => {
      const response = mockGrpcResponse({ duration: 150 });
      expectGrpcResponse(response).toHaveDurationGreaterThanOrEqual(100);
    });

    await t.step("passes when duration is equal", () => {
      const response = mockGrpcResponse({ duration: 100 });
      expectGrpcResponse(response).toHaveDurationGreaterThanOrEqual(100);
    });

    await t.step("fails when duration is less", () => {
      const response = mockGrpcResponse({ duration: 50 });
      assertThrows(
        () =>
          expectGrpcResponse(response).toHaveDurationGreaterThanOrEqual(100),
        Error,
        "Expected duration >= 100ms, got 50ms",
      );
    });

    await t.step("negated - passes when duration is less", () => {
      const response = mockGrpcResponse({ duration: 50 });
      expectGrpcResponse(response).not.toHaveDurationGreaterThanOrEqual(100);
    });
  });

  await t.step("method chaining", () => {
    const response = mockGrpcResponse({
      code: 0,
      ok: true,
      message: "",
      trailers: { "x-trace-id": "abc123" },
      data: <T>() => ({ id: "1", name: "Alice" }) as T,
      duration: 50,
    });

    expectGrpcResponse(response)
      .toBeSuccessful()
      .toHaveCode(0)
      .toHaveContent()
      .toHaveTrailer("x-trace-id")
      .toHaveDataContaining({ name: "Alice" })
      .toHaveDurationLessThan(100);
  });
});
