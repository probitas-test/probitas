/**
 * ConnectRPC Client Scenario Example
 *
 * Target: echo-connectrpc service on port 18082 (compose.yaml)
 * API Reference: https://github.com/jsr-probitas/echo-servers/blob/main/echo-connectrpc/docs/api.md
 */
import { client, expect, scenario } from "jsr:@probitas/probitas@^0";

export default scenario("ConnectRPC Client Example", {
  tags: ["integration", "connectrpc"],
})
  .resource("rpc", () =>
    client.connectrpc.createConnectRpcClient({
      url: "localhost:18082",
    }))
  .step("Echo - simple message", async (ctx) => {
    const { rpc } = ctx.resources;
    const res = await rpc.call("echo.v1.Echo", "Echo", {
      message: "Hello ConnectRPC",
    });

    expect(res)
      .toBeOk()
      .toHaveDataMatching({ message: "Hello ConnectRPC" });
  })
  .step("EchoWithDelay - delayed response", async (ctx) => {
    const { rpc } = ctx.resources;
    const res = await rpc.call("echo.v1.Echo", "EchoWithDelay", {
      message: "delayed",
      delayMs: 100,
    });

    expect(res)
      .toBeOk()
      .toHaveDataMatching({ message: "delayed" });
  })
  .step("EchoError - NOT_FOUND", async (ctx) => {
    const { rpc } = ctx.resources;
    const res = await rpc.call(
      "echo.v1.Echo",
      "EchoError",
      { message: "test", code: 5, details: "not found" },
      { throwOnError: false },
    );

    expect(res)
      .not.toBeOk()
      .toHaveStatusCode(5);
  })
  .step("EchoError - UNAUTHENTICATED", async (ctx) => {
    const { rpc } = ctx.resources;
    const res = await rpc.call(
      "echo.v1.Echo",
      "EchoError",
      { message: "test", code: 16, details: "unauthenticated" },
      { throwOnError: false },
    );

    expect(res)
      .not.toBeOk()
      .toHaveStatusCode(16);
  })
  .step("EchoRequestMetadata - custom headers", async (ctx) => {
    const { rpc } = ctx.resources;
    const res = await rpc.call(
      "echo.v1.Echo",
      "EchoRequestMetadata",
      { keys: ["authorization"] },
      { metadata: { authorization: "Bearer my-token" } },
    );

    expect(res).toBeOk();
  })
  .step("EchoLargePayload - payload generation", async (ctx) => {
    const { rpc } = ctx.resources;
    const res = await rpc.call("echo.v1.Echo", "EchoLargePayload", {
      sizeBytes: 2048,
      pattern: "ABC",
    });

    expect(res)
      .toBeOk()
      .toHaveDataMatching({ actualSize: 2048 });
  })
  .step("EchoDeadline - timeout propagation", async (ctx) => {
    const { rpc } = ctx.resources;
    const res = await rpc.call(
      "echo.v1.Echo",
      "EchoDeadline",
      { message: "timeout test" },
      { timeout: 5000 },
    );

    expect(res)
      .toBeOk()
      .toHaveDataMatching({ hasDeadline: true });
  })
  .step("Health check", async (ctx) => {
    const { rpc } = ctx.resources;
    const res = await rpc.call("grpc.health.v1.Health", "Check", {
      service: "",
    });

    expect(res)
      .toBeOk()
      .toHaveDataMatching({ status: 1 });
  })
  .build();
