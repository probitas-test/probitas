/**
 * Tests for subprocess runner
 *
 * @module
 */

import outdent from "@cspotcode/outdent";
import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { sandbox } from "@lambdalisue/sandbox";
import { createTempSubprocessConfig } from "../../utils.ts";

describe("runner_subprocess", { sanitizeResources: false }, () => {
  it("runs scenario files and returns exit code 0 on success", async () => {
    await using sbox = await sandbox();
    await using stack = new AsyncDisposableStack();

    const configPath = await createTempSubprocessConfig();
    stack.defer(async () => {
      await Deno.remove(configPath);
    });

    // Create a simple passing scenario
    const scenarioPath = sbox.resolve("test.scenario.ts");
    await Deno.writeTextFile(
      scenarioPath,
      outdent`
        import { scenario } from "probitas";

        export default scenario("Test Scenario")
          .step("Passing step", () => {
            // Always passes
          })
          .build();
      `,
    );

    // Create subprocess input
    const input = {
      files: [scenarioPath],
      selectors: [],
      reporter: "dot",
      noColor: true,
      verbosity: "quiet" as const,
    };

    // Run the subprocess runner
    const runnerPath = new URL("./runner.ts", import.meta.url).href;
    const cmd = new Deno.Command("deno", {
      args: ["run", "-A", "--config", configPath, runnerPath],
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    });

    const child = cmd.spawn();
    const writer = child.stdin.getWriter();
    await writer.write(
      new TextEncoder().encode(JSON.stringify(input)),
    );
    await writer.close();

    const result = await child.output();
    const stdout = new TextDecoder().decode(result.stdout);
    const stderr = new TextDecoder().decode(result.stderr);

    if (result.code !== 0) {
      console.log("stdout:", stdout);
      console.log("stderr:", stderr);
    }

    assertEquals(result.code, 0);
  });

  it("returns exit code 1 on scenario failure", async () => {
    await using sbox = await sandbox();
    await using stack = new AsyncDisposableStack();

    const configPath = await createTempSubprocessConfig();
    stack.defer(async () => {
      await Deno.remove(configPath);
    });

    // Create a failing scenario
    const scenarioPath = sbox.resolve("test.scenario.ts");
    await Deno.writeTextFile(
      scenarioPath,
      outdent`
        import { scenario } from "probitas";

        export default scenario("Test Scenario")
          .step("Failing step", () => {
            throw new Error("Test failure");
          })
          .build();
      `,
    );

    const input = {
      files: [scenarioPath],
      selectors: [],
      reporter: "dot",
      noColor: true,
      verbosity: "quiet" as const,
    };

    const runnerPath = new URL("./runner.ts", import.meta.url).href;
    const cmd = new Deno.Command("deno", {
      args: ["run", "-A", "--config", configPath, runnerPath],
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    });

    const child = cmd.spawn();
    const writer = child.stdin.getWriter();
    await writer.write(
      new TextEncoder().encode(JSON.stringify(input)),
    );
    await writer.close();

    const result = await child.status;
    assertEquals(result.code, 1);
  });

  it("returns exit code 4 when no scenarios match selector", async () => {
    await using sbox = await sandbox();
    await using stack = new AsyncDisposableStack();

    const configPath = await createTempSubprocessConfig();
    stack.defer(async () => {
      await Deno.remove(configPath);
    });

    // Create a scenario with tags
    const scenarioPath = sbox.resolve("test.scenario.ts");
    await Deno.writeTextFile(
      scenarioPath,
      outdent`
        import { scenario } from "probitas";

        export default scenario("Test Scenario", { tags: ["api"] })
          .step("Step", () => {})
          .build();
      `,
    );

    const input = {
      files: [scenarioPath],
      selectors: ["tag:nonexistent"],
      reporter: "dot",
      noColor: true,
      verbosity: "quiet" as const,
    };

    const runnerPath = new URL("./runner.ts", import.meta.url).href;
    const cmd = new Deno.Command("deno", {
      args: ["run", "-A", "--config", configPath, runnerPath],
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    });

    const child = cmd.spawn();
    const writer = child.stdin.getWriter();
    await writer.write(
      new TextEncoder().encode(JSON.stringify(input)),
    );
    await writer.close();

    const result = await child.status;
    assertEquals(result.code, 4);
  });

  it("applies selectors correctly", async () => {
    await using sbox = await sandbox();
    await using stack = new AsyncDisposableStack();

    const configPath = await createTempSubprocessConfig();
    stack.defer(async () => {
      await Deno.remove(configPath);
    });

    // Create scenarios with different tags
    const scenarioPath = sbox.resolve("test.scenario.ts");
    await Deno.writeTextFile(
      scenarioPath,
      outdent`
        import { scenario } from "probitas";

        export default [
          scenario("API Scenario", { tags: ["api"] })
            .step("Step", () => {})
            .build(),
          scenario("DB Scenario", { tags: ["db"] })
            .step("Step", () => {})
            .build(),
        ];
      `,
    );

    const input = {
      files: [scenarioPath],
      selectors: ["tag:api"],
      reporter: "dot",
      noColor: true,
      verbosity: "quiet" as const,
    };

    const runnerPath = new URL("./runner.ts", import.meta.url).href;
    const cmd = new Deno.Command("deno", {
      args: ["run", "-A", "--config", configPath, runnerPath],
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    });

    const child = cmd.spawn();
    const writer = child.stdin.getWriter();
    await writer.write(
      new TextEncoder().encode(JSON.stringify(input)),
    );
    await writer.close();

    const result = await child.status;
    // Should pass because only API scenario runs
    assertEquals(result.code, 0);
  });

  it("returns exit code 1 on invalid input format", async () => {
    await using stack = new AsyncDisposableStack();

    const configPath = await createTempSubprocessConfig();
    stack.defer(async () => {
      await Deno.remove(configPath);
    });

    const invalidInput = {
      // Missing required 'files' field
      reporter: "dot",
    };

    const runnerPath = new URL("./runner.ts", import.meta.url).href;
    const cmd = new Deno.Command("deno", {
      args: ["run", "-A", "--config", configPath, runnerPath],
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    });

    const child = cmd.spawn();
    const writer = child.stdin.getWriter();
    await writer.write(
      new TextEncoder().encode(JSON.stringify(invalidInput)),
    );
    await writer.close();

    const result = await child.output();
    const stderr = new TextDecoder().decode(result.stderr);

    assertEquals(result.code, 1);
    assertEquals(
      stderr.includes("Failed to parse stdin JSON as SubprocessInput"),
      true,
    );
  });
});
