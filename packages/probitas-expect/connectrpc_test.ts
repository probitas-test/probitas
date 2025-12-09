import { assertThrows } from "@std/assert";
import { expectConnectRpcResponse } from "./connectrpc.ts";
import type { ConnectRpcResponse } from "@probitas/client-connectrpc";

// Mock helper
const mockConnectRpcResponse = (
  overrides: Partial<ConnectRpcResponse> = {},
): ConnectRpcResponse => {
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

Deno.test("expectConnectRpcResponse", async (t) => {
  await t.step("toBeSuccessful", async (t) => {
    await t.step("passes for code 0", () => {
      const response = mockConnectRpcResponse({ code: 0, ok: true });
      expectConnectRpcResponse(response).toBeSuccessful();
    });

    await t.step("fails for non-zero code", () => {
      const response = mockConnectRpcResponse({ code: 5, ok: false });
      assertThrows(
        () => expectConnectRpcResponse(response).toBeSuccessful(),
        Error,
        "Expected successful response (code 0), got code 5",
      );
    });

    await t.step("negated - fails for code 0", () => {
      const response = mockConnectRpcResponse({ code: 0, ok: true });
      assertThrows(
        () => expectConnectRpcResponse(response).not.toBeSuccessful(),
        Error,
        "Expected non-successful response, got code 0",
      );
    });

    await t.step("negated - passes for non-zero code", () => {
      const response = mockConnectRpcResponse({ code: 5, ok: false });
      expectConnectRpcResponse(response).not.toBeSuccessful();
    });
  });

  await t.step("toHaveCode", async (t) => {
    await t.step("passes for matching code", () => {
      const response = mockConnectRpcResponse({ code: 5 });
      expectConnectRpcResponse(response).toHaveCode(5);
    });

    await t.step("fails for non-matching code", () => {
      const response = mockConnectRpcResponse({ code: 0 });
      assertThrows(
        () => expectConnectRpcResponse(response).toHaveCode(5),
        Error,
        "Expected code 5, got 0",
      );
    });

    await t.step("negated - passes for non-matching", () => {
      const response = mockConnectRpcResponse({ code: 0 });
      expectConnectRpcResponse(response).not.toHaveCode(5);
    });
  });

  await t.step("toHaveCodeOneOf", async (t) => {
    await t.step("passes when code is in list", () => {
      const response = mockConnectRpcResponse({ code: 5 });
      expectConnectRpcResponse(response).toHaveCodeOneOf([0, 5, 14]);
    });

    await t.step("fails when code is not in list", () => {
      const response = mockConnectRpcResponse({ code: 3 });
      assertThrows(
        () => expectConnectRpcResponse(response).toHaveCodeOneOf([0, 5, 14]),
        Error,
        "Expected code to be one of [0, 5, 14], got 3",
      );
    });

    await t.step("negated - passes when code not in list", () => {
      const response = mockConnectRpcResponse({ code: 3 });
      expectConnectRpcResponse(response).not.toHaveCodeOneOf([0, 5, 14]);
    });
  });

  await t.step("toHaveError", async (t) => {
    await t.step("passes for string match", () => {
      const response = mockConnectRpcResponse({ message: "Error occurred" });
      expectConnectRpcResponse(response).toHaveError("Error occurred");
    });

    await t.step("passes for regex match", () => {
      const response = mockConnectRpcResponse({ message: "Error: code 123" });
      expectConnectRpcResponse(response).toHaveError(/code \d+/);
    });

    await t.step("fails for non-matching message", () => {
      const response = mockConnectRpcResponse({ message: "Something else" });
      assertThrows(
        () => expectConnectRpcResponse(response).toHaveError("Error occurred"),
        Error,
        'Expected error "Error occurred", got "Something else"',
      );
    });
  });

  await t.step("toHaveErrorContaining", async (t) => {
    await t.step("passes when message contains substring", () => {
      const response = mockConnectRpcResponse({ message: "User not found" });
      expectConnectRpcResponse(response).toHaveErrorContaining("not found");
    });

    await t.step("fails when message does not contain substring", () => {
      const response = mockConnectRpcResponse({ message: "Invalid input" });
      assertThrows(
        () =>
          expectConnectRpcResponse(response).toHaveErrorContaining("not found"),
        Error,
        'Expected error to contain "not found"',
      );
    });

    await t.step("negated - passes when message does not contain", () => {
      const response = mockConnectRpcResponse({ message: "Invalid input" });
      expectConnectRpcResponse(response).not.toHaveErrorContaining("not found");
    });
  });

  await t.step("toHaveErrorMatching", async (t) => {
    await t.step("passes when matcher succeeds", () => {
      const response = mockConnectRpcResponse({ message: "Error occurred" });
      expectConnectRpcResponse(response).toHaveErrorMatching((message) => {
        if (!message.includes("Error")) throw new Error("Expected Error");
      });
    });

    await t.step("fails when matcher throws", () => {
      const response = mockConnectRpcResponse({ message: "Success" });
      assertThrows(
        () =>
          expectConnectRpcResponse(response).toHaveErrorMatching((message) => {
            if (!message.includes("Error")) throw new Error("Expected Error");
          }),
        Error,
        "Expected Error",
      );
    });
  });

  await t.step("toHaveHeaderValue", async (t) => {
    await t.step("passes for string match", () => {
      const response = mockConnectRpcResponse({
        headers: { "x-trace-id": "abc123" },
      });
      expectConnectRpcResponse(response).toHaveHeaderValue(
        "x-trace-id",
        "abc123",
      );
    });

    await t.step("passes for regex match", () => {
      const response = mockConnectRpcResponse({
        headers: { "x-trace-id": "trace-123" },
      });
      expectConnectRpcResponse(response).toHaveHeaderValue(
        "x-trace-id",
        /trace-\d+/,
      );
    });

    await t.step("fails for non-matching value", () => {
      const response = mockConnectRpcResponse({
        headers: { "x-trace-id": "def456" },
      });
      assertThrows(
        () =>
          expectConnectRpcResponse(response).toHaveHeaderValue(
            "x-trace-id",
            "abc123",
          ),
        Error,
        'Expected header "x-trace-id" to be "abc123", got "def456"',
      );
    });
  });

  await t.step("toHaveHeader", async (t) => {
    await t.step("passes when header exists", () => {
      const response = mockConnectRpcResponse({
        headers: { "x-trace-id": "abc123" },
      });
      expectConnectRpcResponse(response).toHaveHeader("x-trace-id");
    });

    await t.step("fails when header does not exist", () => {
      const response = mockConnectRpcResponse({ headers: {} });
      assertThrows(
        () => expectConnectRpcResponse(response).toHaveHeader("x-trace-id"),
        Error,
        'Expected header "x-trace-id" to exist',
      );
    });

    await t.step("negated - passes when header does not exist", () => {
      const response = mockConnectRpcResponse({ headers: {} });
      expectConnectRpcResponse(response).not.toHaveHeader("x-trace-id");
    });
  });

  await t.step("toHaveHeaderContaining", async (t) => {
    await t.step("passes when header contains substring", () => {
      const response = mockConnectRpcResponse({
        headers: { "x-trace-id": "trace-123-abc" },
      });
      expectConnectRpcResponse(response).toHaveHeaderContaining(
        "x-trace-id",
        "123",
      );
    });

    await t.step("fails when header does not contain substring", () => {
      const response = mockConnectRpcResponse({
        headers: { "x-trace-id": "trace-456" },
      });
      assertThrows(
        () =>
          expectConnectRpcResponse(response).toHaveHeaderContaining(
            "x-trace-id",
            "123",
          ),
        Error,
        'Expected header "x-trace-id" to contain "123", got "trace-456"',
      );
    });
  });

  await t.step("toHaveHeaderMatching", async (t) => {
    await t.step("passes when matcher succeeds", () => {
      const response = mockConnectRpcResponse({
        headers: { "x-count": "123" },
      });
      expectConnectRpcResponse(response).toHaveHeaderMatching(
        "x-count",
        (value) => {
          if (Number(value) !== 123) throw new Error("Expected 123");
        },
      );
    });

    await t.step("fails when matcher throws", () => {
      const response = mockConnectRpcResponse({
        headers: { "x-count": "456" },
      });
      assertThrows(
        () =>
          expectConnectRpcResponse(response).toHaveHeaderMatching(
            "x-count",
            (value) => {
              if (Number(value) !== 123) throw new Error("Expected 123");
            },
          ),
        Error,
        "Expected 123",
      );
    });
  });

  await t.step("toHaveTrailerValue", async (t) => {
    await t.step("passes for string match", () => {
      const response = mockConnectRpcResponse({
        trailers: { "grpc-status": "0" },
      });
      expectConnectRpcResponse(response).toHaveTrailerValue("grpc-status", "0");
    });

    await t.step("passes for regex match", () => {
      const response = mockConnectRpcResponse({
        trailers: { "grpc-message": "success-123" },
      });
      expectConnectRpcResponse(response).toHaveTrailerValue(
        "grpc-message",
        /success-\d+/,
      );
    });

    await t.step("fails for non-matching value", () => {
      const response = mockConnectRpcResponse({
        trailers: { "grpc-status": "1" },
      });
      assertThrows(
        () =>
          expectConnectRpcResponse(response).toHaveTrailerValue(
            "grpc-status",
            "0",
          ),
        Error,
        'Expected trailer "grpc-status" to be "0", got "1"',
      );
    });
  });

  await t.step("toHaveTrailer", async (t) => {
    await t.step("passes when trailer exists", () => {
      const response = mockConnectRpcResponse({
        trailers: { "grpc-status": "0" },
      });
      expectConnectRpcResponse(response).toHaveTrailer("grpc-status");
    });

    await t.step("fails when trailer does not exist", () => {
      const response = mockConnectRpcResponse({ trailers: {} });
      assertThrows(
        () => expectConnectRpcResponse(response).toHaveTrailer("grpc-status"),
        Error,
        'Expected trailer "grpc-status" to exist',
      );
    });

    await t.step("negated - passes when trailer does not exist", () => {
      const response = mockConnectRpcResponse({ trailers: {} });
      expectConnectRpcResponse(response).not.toHaveTrailer("grpc-status");
    });
  });

  await t.step("toHaveTrailerContaining", async (t) => {
    await t.step("passes when trailer contains substring", () => {
      const response = mockConnectRpcResponse({
        trailers: { "grpc-message": "success-message" },
      });
      expectConnectRpcResponse(response).toHaveTrailerContaining(
        "grpc-message",
        "success",
      );
    });

    await t.step("fails when trailer does not contain substring", () => {
      const response = mockConnectRpcResponse({
        trailers: { "grpc-message": "error-message" },
      });
      assertThrows(
        () =>
          expectConnectRpcResponse(response).toHaveTrailerContaining(
            "grpc-message",
            "success",
          ),
        Error,
        'Expected trailer "grpc-message" to contain "success", got "error-message"',
      );
    });
  });

  await t.step("toHaveTrailerMatching", async (t) => {
    await t.step("passes when matcher succeeds", () => {
      const response = mockConnectRpcResponse({
        trailers: { "grpc-status": "0" },
      });
      expectConnectRpcResponse(response).toHaveTrailerMatching(
        "grpc-status",
        (value) => {
          if (value !== "0") throw new Error("Expected 0");
        },
      );
    });

    await t.step("fails when matcher throws", () => {
      const response = mockConnectRpcResponse({
        trailers: { "grpc-status": "1" },
      });
      assertThrows(
        () =>
          expectConnectRpcResponse(response).toHaveTrailerMatching(
            "grpc-status",
            (value) => {
              if (value !== "0") throw new Error("Expected 0");
            },
          ),
        Error,
        "Expected 0",
      );
    });
  });

  await t.step("toHaveContent", async (t) => {
    await t.step("passes when data is not null", () => {
      const response = mockConnectRpcResponse({
        data: <T = unknown>() => ({ id: "1" }) as T | null,
      });
      expectConnectRpcResponse(response).toHaveContent();
    });

    await t.step("fails when data is null", () => {
      const response = mockConnectRpcResponse({
        data: <T = unknown>() => null as T | null,
      });
      assertThrows(
        () => expectConnectRpcResponse(response).toHaveContent(),
        Error,
        "Expected content, but data is null",
      );
    });

    await t.step("negated - passes when data is null", () => {
      const response = mockConnectRpcResponse({
        data: <T = unknown>() => null as T | null,
      });
      expectConnectRpcResponse(response).not.toHaveContent();
    });
  });

  await t.step("toMatchObject", async (t) => {
    await t.step("passes when data contains subset", () => {
      const response = mockConnectRpcResponse({
        data: <T = unknown>() =>
          ({ id: "1", name: "Alice", age: 30 }) as T | null,
      });
      expectConnectRpcResponse(response).toMatchObject({ name: "Alice" });
    });

    await t.step("fails when data does not contain subset", () => {
      const response = mockConnectRpcResponse({
        data: <T = unknown>() => ({ id: "1", name: "Bob" }) as T | null,
      });
      assertThrows(
        () =>
          expectConnectRpcResponse(response).toMatchObject({ name: "Alice" }),
        Error,
      );
    });

    await t.step("negated - passes when data does not contain", () => {
      const response = mockConnectRpcResponse({
        data: <T = unknown>() => ({ id: "1", name: "Bob" }) as T | null,
      });
      expectConnectRpcResponse(response).not.toMatchObject({ name: "Alice" });
    });
  });

  await t.step("toSatisfy", async (t) => {
    await t.step("passes when matcher succeeds", () => {
      const response = mockConnectRpcResponse({
        data: <T = unknown>() => ({ count: 5 }) as T | null,
      });
      expectConnectRpcResponse(response).toSatisfy(
        (data: { count: number }) => {
          if (data.count !== 5) throw new Error("Expected count 5");
        },
      );
    });

    await t.step("fails when matcher throws", () => {
      const response = mockConnectRpcResponse({
        data: <T = unknown>() => ({ count: 3 }) as T | null,
      });
      assertThrows(
        () =>
          expectConnectRpcResponse(response).toSatisfy(
            (data: { count: number }) => {
              if (data.count !== 5) throw new Error("Expected count 5");
            },
          ),
        Error,
        "Expected count 5",
      );
    });
  });

  await t.step("toHaveDurationLessThan", async (t) => {
    await t.step("passes when duration is less", () => {
      const response = mockConnectRpcResponse({ duration: 50 });
      expectConnectRpcResponse(response).toHaveDurationLessThan(100);
    });

    await t.step("fails when duration is equal", () => {
      const response = mockConnectRpcResponse({ duration: 100 });
      assertThrows(
        () => expectConnectRpcResponse(response).toHaveDurationLessThan(100),
        Error,
        "Expected duration < 100ms, got 100ms",
      );
    });

    await t.step("negated - passes when duration is not less", () => {
      const response = mockConnectRpcResponse({ duration: 100 });
      expectConnectRpcResponse(response).not.toHaveDurationLessThan(100);
    });
  });

  await t.step("toHaveDurationLessThanOrEqual", async (t) => {
    await t.step("passes when duration is less", () => {
      const response = mockConnectRpcResponse({ duration: 50 });
      expectConnectRpcResponse(response).toHaveDurationLessThanOrEqual(100);
    });

    await t.step("passes when duration is equal", () => {
      const response = mockConnectRpcResponse({ duration: 100 });
      expectConnectRpcResponse(response).toHaveDurationLessThanOrEqual(100);
    });

    await t.step("fails when duration is greater", () => {
      const response = mockConnectRpcResponse({ duration: 150 });
      assertThrows(
        () =>
          expectConnectRpcResponse(response).toHaveDurationLessThanOrEqual(100),
        Error,
        "Expected duration <= 100ms, got 150ms",
      );
    });
  });

  await t.step("toHaveDurationGreaterThan", async (t) => {
    await t.step("passes when duration is greater", () => {
      const response = mockConnectRpcResponse({ duration: 150 });
      expectConnectRpcResponse(response).toHaveDurationGreaterThan(100);
    });

    await t.step("fails when duration is equal", () => {
      const response = mockConnectRpcResponse({ duration: 100 });
      assertThrows(
        () => expectConnectRpcResponse(response).toHaveDurationGreaterThan(100),
        Error,
        "Expected duration > 100ms, got 100ms",
      );
    });

    await t.step("negated - passes when duration is not greater", () => {
      const response = mockConnectRpcResponse({ duration: 100 });
      expectConnectRpcResponse(response).not.toHaveDurationGreaterThan(100);
    });
  });

  await t.step("toHaveDurationGreaterThanOrEqual", async (t) => {
    await t.step("passes when duration is greater", () => {
      const response = mockConnectRpcResponse({ duration: 150 });
      expectConnectRpcResponse(response).toHaveDurationGreaterThanOrEqual(100);
    });

    await t.step("passes when duration is equal", () => {
      const response = mockConnectRpcResponse({ duration: 100 });
      expectConnectRpcResponse(response).toHaveDurationGreaterThanOrEqual(100);
    });

    await t.step("fails when duration is less", () => {
      const response = mockConnectRpcResponse({ duration: 50 });
      assertThrows(
        () =>
          expectConnectRpcResponse(response).toHaveDurationGreaterThanOrEqual(
            100,
          ),
        Error,
        "Expected duration >= 100ms, got 50ms",
      );
    });
  });

  await t.step("method chaining", () => {
    const response = mockConnectRpcResponse({
      code: 0,
      ok: true,
      message: "",
      headers: { "x-trace-id": "abc123" },
      trailers: { "grpc-status": "0" },
      data: <T = unknown>() => ({ id: "1", name: "Alice" }) as T | null,
      duration: 50,
    });

    expectConnectRpcResponse(response)
      .toBeSuccessful()
      .toHaveCode(0)
      .toHaveContent()
      .toHaveHeader("x-trace-id")
      .toHaveTrailer("grpc-status")
      .toMatchObject({ name: "Alice" })
      .toHaveDurationLessThan(100);
  });
});
