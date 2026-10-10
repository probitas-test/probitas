import { assertEquals } from "@std/assert";
import { stub } from "@std/testing/mock";
import { writeFile } from "node:fs/promises";
import { sandbox, test } from "@probitas-test/internal-testing";
import { EXIT_CODE } from "../constants.ts";
import { runToolCommand, type ToolInvocation } from "./_tool.ts";

test("runToolCommand", async (t) => {
  await t.step("hands the discovered files and flags to plan", async () => {
    await using sbox = await sandbox();
    const scenario = sbox.resolve("a.probitas.ts");
    await writeFile(scenario, "export {};\n");
    const ran: ToolInvocation[] = [];

    const code = await runToolCommand(["-q", "--check"], sbox.path, {
      name: "fmt",
      flags: ["check"],
      async plan({ flags, discover }) {
        const files = await discover();
        return { args: [String(flags.check), ...files ?? []], cwd: "/x" };
      },
      run: (invocation) => {
        ran.push(invocation);
        return Promise.resolve(EXIT_CODE.SUCCESS);
      },
    });

    assertEquals(code, EXIT_CODE.SUCCESS);
    assertEquals(ran, [{ args: ["true", scenario], cwd: "/x" }]);
  });

  await t.step("reports no scenario files as NOT_FOUND", async () => {
    await using sbox = await sandbox();
    using _warn = stub(console, "warn", () => {});

    const code = await runToolCommand(["-q"], sbox.path, {
      name: "lint",
      async plan({ discover }) {
        const files = await discover();
        return files ? { args: files, cwd: "/" } : EXIT_CODE.NOT_FOUND;
      },
    });

    assertEquals(code, EXIT_CODE.NOT_FOUND);
  });

  await t.step("rejects unknown options before running", async () => {
    using _error = stub(console, "error", () => {});
    let planned = false;

    const code = await runToolCommand(["--chek"], "/", {
      name: "fmt",
      flags: ["check"],
      plan() {
        planned = true;
        return Promise.resolve(EXIT_CODE.SUCCESS);
      },
    });

    assertEquals(code, EXIT_CODE.USAGE_ERROR);
    assertEquals(planned, false);
  });

  await t.step("shows the command's usage with --help", async () => {
    const output: string[] = [];
    using _log = stub(console, "log", (text: string) => {
      output.push(text);
    });

    const code = await runToolCommand(["--help"], "/", {
      name: "lint",
      plan: () => Promise.resolve(EXIT_CODE.FAILURE),
    });

    assertEquals(code, EXIT_CODE.SUCCESS);
    assertEquals(output[0]?.startsWith("probitas lint"), true);
  });
});
