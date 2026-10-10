import { assertEquals } from "@std/assert";
import { test } from "@probitas-test/internal-testing";
import { _internal } from "./lint.ts";

const { createLinter, formatFinding } = _internal;

test("createLinter", async (t) => {
  const lint = await createLinter();

  await t.step("reports Biome's recommended rules with positions", () => {
    const findings = lint(
      "a.probitas.ts",
      'const s = "ä";\nif (s == "x") { debugger; }\n',
    );
    assertEquals(
      findings.map(({ line, column, category, severity }) => ({
        line,
        column,
        category,
        severity,
      })),
      [
        {
          line: 2,
          column: 7,
          category: "lint/suspicious/noDoubleEquals",
          severity: "error",
        },
        {
          line: 2,
          column: 17,
          category: "lint/suspicious/noDebugger",
          severity: "error",
        },
      ],
    );
  });

  await t.step("honours biome-ignore comments", () => {
    const source = [
      "// biome-ignore lint/suspicious/noDebugger: probe",
      "debugger;",
      "",
    ].join("\n");
    assertEquals(lint("a.ts", source), []);
  });

  await t.step("leaves out assist actions such as import sorting", () => {
    const source =
      'import { b } from "./b.ts";\nimport { a } from "./a.ts";\n' +
      "export { a, b };\n";
    assertEquals(lint("a.ts", source), []);
  });

  await t.step("reports code that does not parse", () => {
    const [finding] = lint("a.ts", "const = ;\n");
    assertEquals(finding?.severity, "error");
  });
});

test("formatFinding", () => {
  assertEquals(
    formatFinding("api/a.probitas.ts", {
      line: 2,
      column: 7,
      category: "lint/suspicious/noDoubleEquals",
      severity: "error",
      message: "Using == may be unsafe.",
    }),
    "api/a.probitas.ts:2:7 lint/suspicious/noDoubleEquals\n" +
      "  error: Using == may be unsafe.",
  );
});
