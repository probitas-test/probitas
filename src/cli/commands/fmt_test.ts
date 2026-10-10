import { assertEquals, assertThrows } from "@std/assert";
import { outdent } from "outdent";
import { test } from "@probitas-test/internal-testing";
import { _internal } from "./fmt.ts";

const { createTypeScriptFormatter } = _internal;

test("createTypeScriptFormatter", async (t) => {
  const format = await createTypeScriptFormatter();

  await t.step("formats in the deno fmt style", () => {
    assertEquals(
      format("a.ts", "const a = {b:1,'c':2}\nlet x = 'y'"),
      'const a = { b: 1, "c": 2 };\nlet x = "y";\n',
    );
  });

  await t.step("keeps deno fmt output unchanged", () => {
    const formatted = outdent`
      export default scenario("Example")
        .resource("http", () =>
          client.http.createHttpClient({
            url: BASE_URL,
          }))
        .step("Check", async (ctx) => {
          expect(res)
            .toBeOk()
            .toHaveRowCount(1);
        })
        .build();

    `;
    assertEquals(format("a.probitas.ts", formatted), formatted);
  });

  await t.step("throws on code that does not parse", () => {
    assertThrows(() => format("a.ts", "const = ;"));
  });
});
