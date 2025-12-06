/**
 * ConnectRPC Client Scenario Example
 *
 * Target: echo-connectrpc service on port 18082 (compose.yaml)
 * API Reference: https://github.com/jsr-probitas/echo-servers/blob/main/echo-connectrpc/docs/api.md
 */
import { scenario } from "probitas";
import {
  createConnectRpcClient,
  expectConnectRpcResponse,
} from "@probitas/client-connectrpc";

export default scenario("ConnectRPC Client Example", {
  tags: ["integration", "connectrpc"],
})
  .resource("rpc", () =>
    createConnectRpcClient({
      address: "localhost:18082",
    }))
  .step("Echo - simple message", async (ctx) => {
    const { rpc } = ctx.resources;
    const res = await rpc.call("echo.v1.Echo", "Echo", {
      message: "Hello ConnectRPC",
    });

    expectConnectRpcResponse(res)
      .ok()
      .dataContains({ message: "Hello ConnectRPC" });
  })
  .step("EchoWithDelay - delayed response", async (ctx) => {
    const { rpc } = ctx.resources;
    const res = await rpc.call("echo.v1.Echo", "EchoWithDelay", {
      message: "delayed",
      delayMs: 100,
    });

    expectConnectRpcResponse(res)
      .ok()
      .dataContains({ message: "delayed" });
  })
  .step("EchoError - NOT_FOUND", async (ctx) => {
    const { rpc } = ctx.resources;
    const res = await rpc.call(
      "echo.v1.Echo",
      "EchoError",
      { message: "test", code: 5, details: "not found" },
      { throwOnError: false },
    );

    expectConnectRpcResponse(res)
      .notOk()
      .code(5);
  })
  .step("EchoError - UNAUTHENTICATED", async (ctx) => {
    const { rpc } = ctx.resources;
    const res = await rpc.call(
      "echo.v1.Echo",
      "EchoError",
      { message: "test", code: 16, details: "unauthenticated" },
      { throwOnError: false },
    );

    expectConnectRpcResponse(res)
      .notOk()
      .code(16);
  })
  .step("EchoRequestMetadata - custom headers", async (ctx) => {
    const { rpc } = ctx.resources;
    const res = await rpc.call(
      "echo.v1.Echo",
      "EchoRequestMetadata",
      { keys: ["authorization"] },
      { metadata: { authorization: "Bearer my-token" } },
    );

    expectConnectRpcResponse(res).ok();
  })
  .step("EchoLargePayload - payload generation", async (ctx) => {
    const { rpc } = ctx.resources;
    const res = await rpc.call("echo.v1.Echo", "EchoLargePayload", {
      sizeBytes: 2048,
      pattern: "ABC",
    });

    expectConnectRpcResponse(res)
      .ok()
      .dataContains({ actualSize: 2048 });
  })
  .step("EchoDeadline - timeout propagation", async (ctx) => {
    const { rpc } = ctx.resources;
    const res = await rpc.call(
      "echo.v1.Echo",
      "EchoDeadline",
      { message: "timeout test" },
      { timeout: 5000 },
    );

    expectConnectRpcResponse(res)
      .ok()
      .dataContains({ hasDeadline: true });
  })
  .step("Health check", async (ctx) => {
    const { rpc } = ctx.resources;
    const res = await rpc.call("grpc.health.v1.Health", "Check", {
      service: "",
    });

    expectConnectRpcResponse(res)
      .ok()
      .dataContains({ status: 1 });
  })
  .build();
