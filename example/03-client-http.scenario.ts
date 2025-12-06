/**
 * HTTP Client Scenario Example
 *
 * This example demonstrates the @probitas/client-http package:
 * - Creating an HTTP client with base URL
 * - Making GET/POST/PUT/PATCH/DELETE requests
 * - Using expectHttpResponse for fluent assertions
 * - Working with JSON request/response bodies
 * - Query parameters and custom headers
 * - Status code testing
 * - Cookie management
 * - Basic and Bearer authentication
 *
 * Target: echo-http service on port 18080 (compose.yaml)
 * API Reference: https://github.com/jsr-probitas/echo-servers/blob/main/echo-http/docs/api.md
 */
import { scenario } from "probitas";
import { createHttpClient, expectHttpResponse } from "@probitas/client-http";

export default scenario("HTTP Client Example", {
  tags: ["integration", "http"],
})
  .resource("http", () =>
    createHttpClient({
      baseUrl: "http://localhost:18080",
    }))
  .step("GET /get - echo request info", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/get?name=probitas&version=1");

    expectHttpResponse(res)
      .ok()
      .status(200)
      .contentType(/application\/json/)
      .jsonContains({ args: { name: "probitas", version: "1" } });
  })
  .step("POST /post - send JSON body", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.post("/post", {
      message: "Hello from probitas",
      count: 42,
    });

    expectHttpResponse(res)
      .ok()
      .contentType(/application\/json/)
      .jsonContains({ json: { message: "Hello from probitas", count: 42 } });
  })
  .step("PUT /put - update resource", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.put("/put", { id: 1, name: "updated" });

    expectHttpResponse(res)
      .ok()
      .jsonContains({ json: { id: 1, name: "updated" } });
  })
  .step("PATCH /patch - partial update", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.patch("/patch", { name: "patched" });

    expectHttpResponse(res)
      .ok()
      .jsonContains({ json: { name: "patched" } });
  })
  .step("DELETE /delete - remove resource", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.delete("/delete?id=123");

    expectHttpResponse(res)
      .ok()
      .jsonContains({ args: { id: "123" } });
  })
  .step("GET /headers - custom headers", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/headers", {
      headers: {
        "X-Custom-Header": "custom-value",
        "X-Request-Id": "req-12345",
      },
    });

    expectHttpResponse(res)
      .ok()
      .jsonContains({
        headers: {
          "X-Custom-Header": "custom-value",
          "X-Request-Id": "req-12345",
        },
      });
  })
  .step("GET /status/200 - success status", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/status/200", { throwOnError: false });

    expectHttpResponse(res).ok().status(200);
  })
  .step("GET /status/201 - created status", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/status/201", { throwOnError: false });

    expectHttpResponse(res).ok().status(201);
  })
  .step("GET /status/400 - bad request", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/status/400", { throwOnError: false });

    expectHttpResponse(res).notOk().status(400);
  })
  .step("GET /status/404 - not found", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/status/404", { throwOnError: false });

    expectHttpResponse(res).notOk().status(404);
  })
  .step("GET /status/500 - server error", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/status/500", { throwOnError: false });

    expectHttpResponse(res).notOk().status(500);
  })
  .step("GET /basic-auth - valid credentials", async (ctx) => {
    const { http } = ctx.resources;
    const credentials = btoa("testuser:testpass");
    const res = await http.get("/basic-auth/testuser/testpass", {
      headers: { Authorization: `Basic ${credentials}` },
    });

    expectHttpResponse(res)
      .ok()
      .jsonContains({ authenticated: true, user: "testuser" });
  })
  .step("GET /basic-auth - invalid credentials", async (ctx) => {
    const { http } = ctx.resources;
    const credentials = btoa("wronguser:wrongpass");
    const res = await http.get("/basic-auth/testuser/testpass", {
      headers: { Authorization: `Basic ${credentials}` },
      throwOnError: false,
    });

    expectHttpResponse(res).notOk().status(401);
  })
  .step("GET /bearer - valid token", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/bearer", {
      headers: { Authorization: "Bearer my-secret-token" },
    });

    expectHttpResponse(res)
      .ok()
      .jsonContains({ authenticated: true, token: "my-secret-token" });
  })
  .step("GET /bearer - missing token", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/bearer", { throwOnError: false });

    expectHttpResponse(res).notOk().status(401);
  })
  .step("GET /cookies - echo cookies", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/cookies", {
      headers: { Cookie: "session=abc123; user=probitas" },
    });

    expectHttpResponse(res)
      .ok()
      .jsonContains({ cookies: { session: "abc123", user: "probitas" } });
  })
  .step("ANY /anything - echo everything", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.post("/anything/custom/path?key=value", {
      data: "test",
    });

    expectHttpResponse(res)
      .ok()
      .contentType(/application\/json/)
      .jsonContains({ method: "POST", args: { key: "value" } });
  })
  .step("GET /ip - get client IP", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/ip");

    expectHttpResponse(res).ok().hasContent();
  })
  .step("GET /user-agent - get user agent", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/user-agent");

    expectHttpResponse(res).ok().hasContent();
  })
  .step("GET /health - health check", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/health");

    expectHttpResponse(res).ok().jsonContains({ status: "ok" });
  })
  .step("GET /bytes/{n} - random bytes", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/bytes/100");

    expectHttpResponse(res)
      .ok()
      .contentType(/application\/octet-stream/)
      .bodyMatch((body) => body?.byteLength === 100);
  })
  .build();
