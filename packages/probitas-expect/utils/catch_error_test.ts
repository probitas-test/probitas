import { assertEquals, assertThrows } from "@std/assert";
import { catchError } from "./catch_error.ts";

Deno.test("catchError - catches Error object", () => {
  const error = catchError(() => {
    throw new Error("test error");
  });

  assertEquals(error instanceof Error, true);
  assertEquals(error.message, "test error");
});

Deno.test("catchError - wraps non-Error values", () => {
  const error = catchError(() => {
    throw "string error";
  });

  assertEquals(error instanceof Error, true);
  assertEquals(error.message, "string error");
});

Deno.test("catchError - throws when function does not throw", () => {
  assertThrows(
    () => catchError(() => {}),
    Error,
    "Expected function to throw an error, but it did not throw",
  );
});
