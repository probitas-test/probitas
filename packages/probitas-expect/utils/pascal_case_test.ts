import { assertEquals } from "@std/assert";
import { assertType, type IsExact } from "@std/testing/types";
import { type ToPascalCase, toPascalCase } from "./pascal_case.ts";

Deno.test("toPascalCase - converts snake_case to PascalCase", () => {
  assertEquals(toPascalCase("hello_world"), "HelloWorld");
  assertEquals(toPascalCase("error_count"), "ErrorCount");
  assertEquals(toPascalCase("my_long_variable_name"), "MyLongVariableName");
});

Deno.test("toPascalCase - type-level test for snake_case", () => {
  assertType<IsExact<ToPascalCase<"hello_world">, "HelloWorld">>(true);
  assertType<IsExact<ToPascalCase<"error_count">, "ErrorCount">>(true);
  assertType<
    IsExact<
      ToPascalCase<"my_long_variable_name">,
      "MyLongVariableName"
    >
  >(true);
});

Deno.test("toPascalCase - converts kebab-case to PascalCase", () => {
  assertEquals(toPascalCase("hello-world"), "HelloWorld");
  assertEquals(toPascalCase("error-count"), "ErrorCount");
  assertEquals(toPascalCase("my-long-variable-name"), "MyLongVariableName");
});

Deno.test("toPascalCase - type-level test for kebab-case", () => {
  assertType<IsExact<ToPascalCase<"hello-world">, "HelloWorld">>(true);
  assertType<IsExact<ToPascalCase<"error-count">, "ErrorCount">>(true);
  assertType<
    IsExact<
      ToPascalCase<"my-long-variable-name">,
      "MyLongVariableName"
    >
  >(true);
});

Deno.test("toPascalCase - converts space separated to PascalCase", () => {
  assertEquals(toPascalCase("hello world"), "HelloWorld");
  assertEquals(toPascalCase("error count"), "ErrorCount");
  assertEquals(toPascalCase("my long variable name"), "MyLongVariableName");
});

Deno.test("toPascalCase - type-level test for space separated", () => {
  assertType<IsExact<ToPascalCase<"hello world">, "HelloWorld">>(true);
  assertType<IsExact<ToPascalCase<"error count">, "ErrorCount">>(true);
  assertType<
    IsExact<
      ToPascalCase<"my long variable name">,
      "MyLongVariableName"
    >
  >(true);
});

Deno.test("toPascalCase - converts camelCase to PascalCase", () => {
  assertEquals(toPascalCase("helloWorld"), "HelloWorld");
  assertEquals(toPascalCase("errorCount"), "ErrorCount");
  assertEquals(toPascalCase("myLongVariableName"), "MyLongVariableName");
});

Deno.test("toPascalCase - type-level test for camelCase", () => {
  assertType<IsExact<ToPascalCase<"helloWorld">, "HelloWorld">>(true);
  assertType<IsExact<ToPascalCase<"errorCount">, "ErrorCount">>(true);
  assertType<
    IsExact<
      ToPascalCase<"myLongVariableName">,
      "MyLongVariableName"
    >
  >(true);
});

Deno.test("toPascalCase - handles single word", () => {
  assertEquals(toPascalCase("hello"), "Hello");
  assertEquals(toPascalCase("Hello"), "Hello");
  assertEquals(toPascalCase("HELLO"), "HELLO");
});

Deno.test("toPascalCase - type-level test for single word", () => {
  assertType<IsExact<ToPascalCase<"hello">, "Hello">>(true);
  assertType<IsExact<ToPascalCase<"Hello">, "Hello">>(true);
  assertType<IsExact<ToPascalCase<"HELLO">, "HELLO">>(true);
});

Deno.test("toPascalCase - handles empty string", () => {
  assertEquals(toPascalCase(""), "");
});

Deno.test("toPascalCase - type-level test for empty string", () => {
  assertType<IsExact<ToPascalCase<"">, "">>(true);
});

Deno.test("toPascalCase - handles mixed delimiters", () => {
  assertEquals(toPascalCase("hello_world-test case"), "HelloWorldTestCase");
  assertEquals(toPascalCase("error-count_test case"), "ErrorCountTestCase");
});

Deno.test("toPascalCase - type-level test for mixed delimiters", () => {
  assertType<
    IsExact<
      ToPascalCase<"hello_world-test case">,
      "HelloWorldTestCase"
    >
  >(true);
  assertType<
    IsExact<
      ToPascalCase<"error-count_test case">,
      "ErrorCountTestCase"
    >
  >(true);
});

Deno.test("toPascalCase - preserves already PascalCase", () => {
  assertEquals(toPascalCase("HelloWorld"), "HelloWorld");
  assertEquals(toPascalCase("ErrorCount"), "ErrorCount");
});

Deno.test("toPascalCase - type-level test for already PascalCase", () => {
  assertType<IsExact<ToPascalCase<"HelloWorld">, "HelloWorld">>(true);
  assertType<IsExact<ToPascalCase<"ErrorCount">, "ErrorCount">>(true);
});
