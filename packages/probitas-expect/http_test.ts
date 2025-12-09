import { assertThrows } from "@std/assert";
import { expectHttpResponse } from "./http.ts";
import type { HttpResponse } from "@probitas/client-http";

// Mock helper
const mockHttpResponse = (
  overrides: Partial<HttpResponse> = {},
): HttpResponse => {
  const body = overrides.body ?? new TextEncoder().encode('{"success":true}');
  const text = () => new TextDecoder().decode(body);
  const data = () => JSON.parse(text());

  return {
    type: "http" as const,
    url: "https://api.example.com",
    status: 200,
    statusText: "OK",
    ok: true,
    headers: new Headers({ "content-type": "application/json" }),
    body,
    data,
    text,
    arrayBuffer: () => {
      if (!body) return new ArrayBuffer(0);
      return body.buffer instanceof ArrayBuffer
        ? body.buffer
        : new ArrayBuffer(0);
    },
    blob: () => {
      if (!body) return new Blob([]);
      const ab = body.buffer instanceof ArrayBuffer
        ? body.buffer
        : new ArrayBuffer(0);
      return new Blob([ab]);
    },
    raw: new Response(
      body && body.buffer instanceof ArrayBuffer
        ? new Uint8Array(body.buffer)
        : null,
    ),
    duration: 100,
    ...overrides,
  };
};

Deno.test("expectHttpResponse", async (t) => {
  await t.step("toBeSuccessful", async (t) => {
    await t.step("passes for 200 status", () => {
      const response = mockHttpResponse({ status: 200, ok: true });
      expectHttpResponse(response).toBeSuccessful();
    });

    await t.step("passes for 299 status", () => {
      const response = mockHttpResponse({ status: 299, ok: true });
      expectHttpResponse(response).toBeSuccessful();
    });

    await t.step("fails for 404 status", () => {
      const response = mockHttpResponse({ status: 404, ok: false });
      assertThrows(
        () => expectHttpResponse(response).toBeSuccessful(),
        Error,
        "Expected successful response (200-299), got status 404",
      );
    });

    await t.step("negated - fails for 200 status", () => {
      const response = mockHttpResponse({ status: 200, ok: true });
      assertThrows(
        () => expectHttpResponse(response).not.toBeSuccessful(),
        Error,
        "Expected non-successful response, got status 200",
      );
    });

    await t.step("negated - passes for 404 status", () => {
      const response = mockHttpResponse({ status: 404, ok: false });
      expectHttpResponse(response).not.toBeSuccessful();
    });
  });

  await t.step("toHaveStatus", async (t) => {
    await t.step("passes for matching status", () => {
      const response = mockHttpResponse({ status: 201 });
      expectHttpResponse(response).toHaveStatus(201);
    });

    await t.step("fails for non-matching status", () => {
      const response = mockHttpResponse({ status: 200 });
      assertThrows(
        () => expectHttpResponse(response).toHaveStatus(201),
        Error,
        "Expected status 201, got 200",
      );
    });

    await t.step("negated - passes for non-matching", () => {
      const response = mockHttpResponse({ status: 200 });
      expectHttpResponse(response).not.toHaveStatus(201);
    });

    await t.step("negated - fails for matching", () => {
      const response = mockHttpResponse({ status: 200 });
      assertThrows(
        () => expectHttpResponse(response).not.toHaveStatus(200),
        Error,
        "Expected status to not be 200",
      );
    });
  });

  await t.step("toHaveStatusOneOf", async (t) => {
    await t.step("passes when status is in list", () => {
      const response = mockHttpResponse({ status: 200 });
      expectHttpResponse(response).toHaveStatusOneOf([200, 201, 204]);
    });

    await t.step("fails when status is not in list", () => {
      const response = mockHttpResponse({ status: 400 });
      assertThrows(
        () => expectHttpResponse(response).toHaveStatusOneOf([200, 201, 204]),
        Error,
        "Expected status to be one of [200, 201, 204], got 400",
      );
    });

    await t.step("negated - passes when status not in list", () => {
      const response = mockHttpResponse({ status: 400 });
      expectHttpResponse(response).not.toHaveStatusOneOf([200, 201, 204]);
    });

    await t.step("negated - fails when status in list", () => {
      const response = mockHttpResponse({ status: 200 });
      assertThrows(
        () => expectHttpResponse(response).not.toHaveStatusOneOf([200, 201]),
        Error,
        "Expected status to not be one of [200, 201], got 200",
      );
    });
  });

  await t.step("toHaveHeaderValue", async (t) => {
    await t.step("passes for string match", () => {
      const response = mockHttpResponse({
        headers: new Headers({ "x-test": "value" }),
      });
      expectHttpResponse(response).toHaveHeaderValue("x-test", "value");
    });

    await t.step("passes for regex match", () => {
      const response = mockHttpResponse({
        headers: new Headers({ "x-test": "test-value-123" }),
      });
      expectHttpResponse(response).toHaveHeaderValue("x-test", /value-\d+/);
    });

    await t.step("fails for non-existent header", () => {
      const response = mockHttpResponse();
      assertThrows(
        () =>
          expectHttpResponse(response).toHaveHeaderValue("x-missing", "value"),
        Error,
        'Expected header "x-missing" to exist, but got null',
      );
    });

    await t.step("fails for non-matching value", () => {
      const response = mockHttpResponse({
        headers: new Headers({ "x-test": "value" }),
      });
      assertThrows(
        () => expectHttpResponse(response).toHaveHeaderValue("x-test", "wrong"),
        Error,
        'Expected header "x-test" "wrong", got "value"',
      );
    });
  });

  await t.step("toHaveHeader", async (t) => {
    await t.step("passes when header exists", () => {
      const response = mockHttpResponse({
        headers: new Headers({ "x-test": "value" }),
      });
      expectHttpResponse(response).toHaveHeader("x-test");
    });

    await t.step("fails when header does not exist", () => {
      const response = mockHttpResponse();
      assertThrows(
        () => expectHttpResponse(response).toHaveHeader("x-missing"),
        Error,
        'Expected header "x-missing" to exist',
      );
    });

    await t.step("negated - passes when header does not exist", () => {
      const response = mockHttpResponse();
      expectHttpResponse(response).not.toHaveHeader("x-missing");
    });

    await t.step("negated - fails when header exists", () => {
      const response = mockHttpResponse({
        headers: new Headers({ "x-test": "value" }),
      });
      assertThrows(
        () => expectHttpResponse(response).not.toHaveHeader("x-test"),
        Error,
        'Expected header "x-test" to not exist',
      );
    });
  });

  await t.step("toHaveHeaderContaining", async (t) => {
    await t.step("passes when header contains substring", () => {
      const response = mockHttpResponse({
        headers: new Headers({ "x-test": "test-value-123" }),
      });
      expectHttpResponse(response).toHaveHeaderContaining("x-test", "value");
    });

    await t.step("fails when header does not contain substring", () => {
      const response = mockHttpResponse({
        headers: new Headers({ "x-test": "value" }),
      });
      assertThrows(
        () =>
          expectHttpResponse(response).toHaveHeaderContaining(
            "x-test",
            "missing",
          ),
        Error,
        'Expected header "x-test" to contain "missing", got "value"',
      );
    });

    await t.step("fails when header does not exist", () => {
      const response = mockHttpResponse();
      assertThrows(
        () =>
          expectHttpResponse(response).toHaveHeaderContaining(
            "x-missing",
            "value",
          ),
        Error,
        'Expected header "x-missing" to exist, but got null',
      );
    });
  });

  await t.step("toHaveHeaderMatching", async (t) => {
    await t.step("passes when matcher succeeds", () => {
      const response = mockHttpResponse({
        headers: new Headers({ "x-test": "123" }),
      });
      expectHttpResponse(response).toHaveHeaderMatching("x-test", (value) => {
        if (Number(value) !== 123) throw new Error("Expected 123");
      });
    });

    await t.step("fails when matcher throws", () => {
      const response = mockHttpResponse({
        headers: new Headers({ "x-test": "456" }),
      });
      assertThrows(
        () =>
          expectHttpResponse(response).toHaveHeaderMatching(
            "x-test",
            (value) => {
              if (Number(value) !== 123) throw new Error("Expected 123");
            },
          ),
        Error,
        "Expected 123",
      );
    });

    await t.step("fails when header does not exist", () => {
      const response = mockHttpResponse();
      assertThrows(
        () =>
          expectHttpResponse(response).toHaveHeaderMatching(
            "x-missing",
            () => {},
          ),
        Error,
        'Expected header "x-missing" to exist, but got null',
      );
    });
  });

  await t.step("toHaveContentType", async (t) => {
    await t.step("passes for string match", () => {
      const response = mockHttpResponse({
        headers: new Headers({ "content-type": "application/json" }),
      });
      expectHttpResponse(response).toHaveContentType("application/json");
    });

    await t.step("passes for regex match", () => {
      const response = mockHttpResponse({
        headers: new Headers({
          "content-type": "application/json; charset=utf-8",
        }),
      });
      expectHttpResponse(response).toHaveContentType(/application\/json/);
    });
  });

  await t.step("toHaveContent", async (t) => {
    await t.step("passes when body is present", () => {
      const response = mockHttpResponse({ body: new Uint8Array([1, 2, 3]) });
      expectHttpResponse(response).toHaveContent();
    });

    await t.step("fails when body is null", () => {
      const response = mockHttpResponse({ body: null });
      assertThrows(
        () => expectHttpResponse(response).toHaveContent(),
        Error,
        "Expected content, but body is null",
      );
    });

    await t.step("negated - passes when body is null", () => {
      const response = mockHttpResponse({ body: null });
      expectHttpResponse(response).not.toHaveContent();
    });

    await t.step("negated - fails when body is present", () => {
      const response = mockHttpResponse({ body: new Uint8Array([1]) });
      assertThrows(
        () => expectHttpResponse(response).not.toHaveContent(),
        Error,
        "Expected no content, but body is present",
      );
    });
  });

  await t.step("toHaveBodyContaining", async (t) => {
    await t.step("passes when body contains subbody", () => {
      const response = mockHttpResponse({
        body: new TextEncoder().encode("hello world"),
      });
      expectHttpResponse(response).toHaveBodyContaining(
        new TextEncoder().encode("world"),
      );
    });

    await t.step("fails when body does not contain subbody", () => {
      const response = mockHttpResponse({
        body: new TextEncoder().encode("hello"),
      });
      assertThrows(
        () =>
          expectHttpResponse(response).toHaveBodyContaining(
            new TextEncoder().encode("world"),
          ),
        Error,
        "Body does not contain expected bytes",
      );
    });

    await t.step("fails when body is null", () => {
      const response = mockHttpResponse({ body: null });
      assertThrows(
        () =>
          expectHttpResponse(response).toHaveBodyContaining(
            new TextEncoder().encode("test"),
          ),
        Error,
        "Expected body to exist, but got null",
      );
    });

    await t.step("negated - passes when body does not contain", () => {
      const response = mockHttpResponse({
        body: new TextEncoder().encode("hello"),
      });
      expectHttpResponse(response).not.toHaveBodyContaining(
        new TextEncoder().encode("world"),
      );
    });
  });

  await t.step("toSatisfy", async (t) => {
    await t.step("passes when matcher succeeds", () => {
      const response = mockHttpResponse({
        body: new TextEncoder().encode('{"name":"Alice"}'),
      });
      expectHttpResponse(response).toSatisfy<{ name: string }>((data) => {
        if (data.name !== "Alice") throw new Error("Expected Alice");
      });
    });

    await t.step("fails when matcher throws", () => {
      const response = mockHttpResponse({
        body: new TextEncoder().encode('{"name":"Bob"}'),
      });
      assertThrows(
        () =>
          expectHttpResponse(response).toSatisfy<{ name: string }>((data) => {
            if (data.name !== "Alice") throw new Error("Expected Alice");
          }),
        Error,
        "Expected Alice",
      );
    });

    await t.step("fails when data is null", () => {
      const response = mockHttpResponse({
        data: () => null,
      });
      assertThrows(
        () => expectHttpResponse(response).toSatisfy(() => {}),
        Error,
        "Expected JSON data to exist, but got null",
      );
    });
  });

  await t.step("toSatisfyBody", async (t) => {
    await t.step("passes when matcher succeeds", () => {
      const response = mockHttpResponse({
        body: new Uint8Array([1, 2, 3]),
      });
      expectHttpResponse(response).toSatisfyBody((body) => {
        if (body.length !== 3) throw new Error("Expected length 3");
      });
    });

    await t.step("fails when matcher throws", () => {
      const response = mockHttpResponse({
        body: new Uint8Array([1, 2]),
      });
      assertThrows(
        () =>
          expectHttpResponse(response).toSatisfyBody((body) => {
            if (body.length !== 3) throw new Error("Expected length 3");
          }),
        Error,
        "Expected length 3",
      );
    });

    await t.step("fails when body is null", () => {
      const response = mockHttpResponse({ body: null });
      assertThrows(
        () => expectHttpResponse(response).toSatisfyBody(() => {}),
        Error,
        "Expected body to exist, but got null",
      );
    });
  });

  await t.step("toSatisfyText", async (t) => {
    await t.step("passes when matcher succeeds", () => {
      const response = mockHttpResponse({
        body: new TextEncoder().encode("hello world"),
      });
      expectHttpResponse(response).toSatisfyText((text) => {
        if (!text.includes("hello")) throw new Error("Expected hello");
      });
    });

    await t.step("fails when matcher throws", () => {
      const response = mockHttpResponse({
        body: new TextEncoder().encode("goodbye"),
      });
      assertThrows(
        () =>
          expectHttpResponse(response).toSatisfyText((text) => {
            if (!text.includes("hello")) throw new Error("Expected hello");
          }),
        Error,
        "Expected hello",
      );
    });

    await t.step("fails when text is null", () => {
      const response = mockHttpResponse({
        text: () => null as unknown as string,
      });
      assertThrows(
        () => expectHttpResponse(response).toSatisfyText(() => {}),
        Error,
        "Expected text to exist, but got null",
      );
    });
  });

  await t.step("toHaveTextContaining", async (t) => {
    await t.step("passes when text contains substring", () => {
      const response = mockHttpResponse({
        body: new TextEncoder().encode("hello world"),
      });
      expectHttpResponse(response).toHaveTextContaining("world");
    });

    await t.step("fails when text does not contain substring", () => {
      const response = mockHttpResponse({
        body: new TextEncoder().encode("hello"),
      });
      assertThrows(
        () => expectHttpResponse(response).toHaveTextContaining("world"),
        Error,
        'Text does not contain "world"',
      );
    });

    await t.step("fails when text is null", () => {
      const response = mockHttpResponse({
        text: () => null as unknown as string,
      });
      assertThrows(
        () => expectHttpResponse(response).toHaveTextContaining("test"),
        Error,
        "Expected text body to exist, but got null",
      );
    });

    await t.step("negated - passes when text does not contain", () => {
      const response = mockHttpResponse({
        body: new TextEncoder().encode("hello"),
      });
      expectHttpResponse(response).not.toHaveTextContaining("world");
    });
  });

  await t.step("toMatchObject", async (t) => {
    await t.step("passes when data contains subset", () => {
      const response = mockHttpResponse({
        body: new TextEncoder().encode('{"name":"Alice","age":30}'),
      });
      expectHttpResponse(response).toMatchObject({ name: "Alice" });
    });

    await t.step("passes for nested properties", () => {
      const response = mockHttpResponse({
        body: new TextEncoder().encode('{"user":{"name":"Alice","age":30}}'),
      });
      expectHttpResponse(response).toMatchObject({ user: { name: "Alice" } });
    });

    await t.step("fails when data does not contain subset", () => {
      const response = mockHttpResponse({
        body: new TextEncoder().encode('{"name":"Bob"}'),
      });
      assertThrows(
        () => expectHttpResponse(response).toMatchObject({ name: "Alice" }),
        Error,
        "Data does not contain expected properties",
      );
    });

    await t.step("fails when data is null", () => {
      const response = mockHttpResponse({
        data: () => null,
      });
      assertThrows(
        () => expectHttpResponse(response).toMatchObject({ name: "Alice" }),
        Error,
        "Expected JSON data to exist, but got null",
      );
    });

    await t.step("negated - passes when data does not contain", () => {
      const response = mockHttpResponse({
        body: new TextEncoder().encode('{"name":"Bob"}'),
      });
      expectHttpResponse(response).not.toMatchObject({ name: "Alice" });
    });
  });

  await t.step("toHaveDurationLessThan", async (t) => {
    await t.step("passes when duration is less", () => {
      const response = mockHttpResponse({ duration: 100 });
      expectHttpResponse(response).toHaveDurationLessThan(200);
    });

    await t.step("fails when duration is equal", () => {
      const response = mockHttpResponse({ duration: 100 });
      assertThrows(
        () => expectHttpResponse(response).toHaveDurationLessThan(100),
        Error,
        "Expected duration < 100ms, got 100ms",
      );
    });

    await t.step("fails when duration is greater", () => {
      const response = mockHttpResponse({ duration: 200 });
      assertThrows(
        () => expectHttpResponse(response).toHaveDurationLessThan(100),
        Error,
        "Expected duration < 100ms, got 200ms",
      );
    });

    await t.step("negated - passes when duration is greater or equal", () => {
      const response = mockHttpResponse({ duration: 100 });
      expectHttpResponse(response).not.toHaveDurationLessThan(100);
    });
  });

  await t.step("toHaveDurationLessThanOrEqual", async (t) => {
    await t.step("passes when duration is less", () => {
      const response = mockHttpResponse({ duration: 50 });
      expectHttpResponse(response).toHaveDurationLessThanOrEqual(100);
    });

    await t.step("passes when duration is equal", () => {
      const response = mockHttpResponse({ duration: 100 });
      expectHttpResponse(response).toHaveDurationLessThanOrEqual(100);
    });

    await t.step("fails when duration is greater", () => {
      const response = mockHttpResponse({ duration: 150 });
      assertThrows(
        () => expectHttpResponse(response).toHaveDurationLessThanOrEqual(100),
        Error,
        "Expected duration <= 100ms, got 150ms",
      );
    });

    await t.step("negated - passes when duration is greater", () => {
      const response = mockHttpResponse({ duration: 150 });
      expectHttpResponse(response).not.toHaveDurationLessThanOrEqual(100);
    });
  });

  await t.step("toHaveDurationGreaterThan", async (t) => {
    await t.step("passes when duration is greater", () => {
      const response = mockHttpResponse({ duration: 200 });
      expectHttpResponse(response).toHaveDurationGreaterThan(100);
    });

    await t.step("fails when duration is equal", () => {
      const response = mockHttpResponse({ duration: 100 });
      assertThrows(
        () => expectHttpResponse(response).toHaveDurationGreaterThan(100),
        Error,
        "Expected duration > 100ms, got 100ms",
      );
    });

    await t.step("fails when duration is less", () => {
      const response = mockHttpResponse({ duration: 50 });
      assertThrows(
        () => expectHttpResponse(response).toHaveDurationGreaterThan(100),
        Error,
        "Expected duration > 100ms, got 50ms",
      );
    });

    await t.step("negated - passes when duration is less or equal", () => {
      const response = mockHttpResponse({ duration: 100 });
      expectHttpResponse(response).not.toHaveDurationGreaterThan(100);
    });
  });

  await t.step("toHaveDurationGreaterThanOrEqual", async (t) => {
    await t.step("passes when duration is greater", () => {
      const response = mockHttpResponse({ duration: 150 });
      expectHttpResponse(response).toHaveDurationGreaterThanOrEqual(100);
    });

    await t.step("passes when duration is equal", () => {
      const response = mockHttpResponse({ duration: 100 });
      expectHttpResponse(response).toHaveDurationGreaterThanOrEqual(100);
    });

    await t.step("fails when duration is less", () => {
      const response = mockHttpResponse({ duration: 50 });
      assertThrows(
        () =>
          expectHttpResponse(response).toHaveDurationGreaterThanOrEqual(100),
        Error,
        "Expected duration >= 100ms, got 50ms",
      );
    });

    await t.step("negated - passes when duration is less", () => {
      const response = mockHttpResponse({ duration: 50 });
      expectHttpResponse(response).not.toHaveDurationGreaterThanOrEqual(100);
    });
  });

  await t.step("method chaining", () => {
    const response = mockHttpResponse({
      status: 200,
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      body: new TextEncoder().encode('{"name":"Alice"}'),
      duration: 50,
    });

    expectHttpResponse(response)
      .toBeSuccessful()
      .toHaveStatus(200)
      .toHaveContentType("application/json")
      .toHaveContent()
      .toMatchObject({ name: "Alice" })
      .toHaveDurationLessThan(100);
  });
});
