/**
 * gRPC Client Scenario Example
 *
 * Target: echo-grpc service on port 50051 (compose.yaml)
 * API Reference: https://github.com/jsr-probitas/echo-servers/blob/main/echo-grpc/docs/api.md
 */
import { client, expect, scenario } from "probitas";

export default scenario("gRPC Client Example", {
  tags: ["integration", "grpc"],
})
  .resource("grpc", () =>
    client.grpc.createGrpcClient({
      url: "localhost:50051",
    }))
  .step("Echo - simple message", async (ctx) => {
    const { grpc } = ctx.resources;
    const res = await grpc.call("echo.v1.Echo", "Echo", {
      message: "Hello from probitas",
    });

    expect(res)
      .ok()
      .dataContains({ message: "Hello from probitas" });
  })
  .step("EchoWithDelay - delayed response", async (ctx) => {
    const { grpc } = ctx.resources;
    const res = await grpc.call("echo.v1.Echo", "EchoWithDelay", {
      message: "delayed",
      delayMs: 100,
    });

    expect(res)
      .ok()
      .dataContains({ message: "delayed" })
      .durationLessThan(5000);
  })
  .step("EchoError - NOT_FOUND error", async (ctx) => {
    const { grpc } = ctx.resources;
    const res = await grpc.call(
      "echo.v1.Echo",
      "EchoError",
      { message: "test", code: 5, details: "resource not found" },
      { throwOnError: false },
    );

    expect(res)
      .notOk()
      .code(5);
  })
  .step("EchoError - INVALID_ARGUMENT error", async (ctx) => {
    const { grpc } = ctx.resources;
    const res = await grpc.call(
      "echo.v1.Echo",
      "EchoError",
      { message: "test", code: 3, details: "invalid argument" },
      { throwOnError: false },
    );

    expect(res)
      .notOk()
      .code(3);
  })
  .step("EchoRequestMetadata - echo headers", async (ctx) => {
    const { grpc } = ctx.resources;
    const res = await grpc.call(
      "echo.v1.Echo",
      "EchoRequestMetadata",
      { keys: [] },
      { metadata: { "x-custom-header": "custom-value" } },
    );

    expect(res).ok();
  })
  .step("EchoLargePayload - generate bytes", async (ctx) => {
    const { grpc } = ctx.resources;
    const res = await grpc.call("echo.v1.Echo", "EchoLargePayload", {
      sizeBytes: 1024,
      pattern: "X",
    });

    expect(res)
      .ok()
      .dataContains({ actualSize: 1024 });
  })
  .step("EchoDeadline - check deadline info", async (ctx) => {
    const { grpc } = ctx.resources;
    const res = await grpc.call(
      "echo.v1.Echo",
      "EchoDeadline",
      { message: "deadline test" },
      { timeout: 10000 },
    );

    expect(res)
      .ok()
      .dataContains({ message: "deadline test", hasDeadline: true });
  })
  .step("Health check", async (ctx) => {
    const { grpc } = ctx.resources;
    const res = await grpc.call("grpc.health.v1.Health", "Check", {
      service: "",
    });

    expect(res)
      .ok()
      .dataContains({ status: 1 });
  })
  .build();
