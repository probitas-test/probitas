import { scenario } from "probitas";

export default scenario("Example Scenario")
  .step("Step 1: Setup", () => {
    return { initialized: true };
  })
  .step("Step 2: Execute", (ctx) => {
    return { value: ctx.previous.initialized ? "success" : "failed" };
  })
  .step("Step 3: Verify", (ctx) => {
    if (ctx.previous.value !== "success") {
      throw new Error("Verification failed");
    }
  })
  .build();
