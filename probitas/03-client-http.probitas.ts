/**
 * HTTP Client Scenario Example
 *
 * This example demonstrates the @probitas/client-http package:
 * - Creating an HTTP client with base URL
 * - Making GET/POST/PUT/PATCH/DELETE requests
 * - Using expect for fluent assertions
 * - Working with JSON request/response bodies
 * - Query parameters and custom headers
 * - Status code testing
 * - Cookie management
 * - Basic and Bearer authentication
 *
 * Target: echo-http service on port 18080 (compose.yaml)
 * API Reference: https://github.com/jsr-probitas/echo-servers/blob/main/echo-http/docs/api.md
 */
import { client, expect, scenario } from "probitas";

export default scenario("HTTP Client Example", {
  tags: ["integration", "http"],
})
  .resource("http", () =>
    client.http.createHttpClient({
      url: "http://localhost:18080",
    }))
  .step("GET /get - echo request info", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/get?name=probitas&version=1");

    expect(res)
      .toBeSuccessful()
      .toHaveStatus(200)
      .toHaveContentType(/application\/json/)
      .toMatchObject({ args: { name: "probitas", version: "1" } });
  })
  .step("POST /post - send JSON body", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.post("/post", {
      message: "Hello from probitas",
      count: 42,
    });

    expect(res)
      .toBeSuccessful()
      .toHaveContentType(/application\/json/)
      .toMatchObject({ json: { message: "Hello from probitas", count: 42 } });
  })
  .step("PUT /put - update resource", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.put("/put", { id: 1, name: "updated" });

    expect(res)
      .toBeSuccessful()
      .toMatchObject({ json: { id: 1, name: "updated" } });
  })
  .step("PATCH /patch - partial update", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.patch("/patch", { name: "patched" });

    expect(res)
      .toBeSuccessful()
      .toMatchObject({ json: { name: "patched" } });
  })
  .step("DELETE /delete - remove resource", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.delete("/delete?id=123");

    expect(res)
      .toBeSuccessful()
      .toMatchObject({ args: { id: "123" } });
  })
  .step("GET /headers - custom headers", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/headers", {
      headers: {
        "X-Custom-Header": "custom-value",
        "X-Request-Id": "req-12345",
      },
    });

    expect(res)
      .toBeSuccessful()
      .toMatchObject({
        headers: {
          "X-Custom-Header": "custom-value",
          "X-Request-Id": "req-12345",
        },
      });
  })
  .step("GET /status/200 - success status", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/status/200", { throwOnError: false });

    expect(res).toBeSuccessful().toHaveStatus(200);
  })
  .step("GET /status/201 - created status", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/status/201", { throwOnError: false });

    expect(res).toBeSuccessful().toHaveStatus(201);
  })
  .step("GET /status/400 - bad request", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/status/400", { throwOnError: false });

    expect(res).not.toBeSuccessful().toHaveStatus(400);
  })
  .step("GET /status/404 - not found", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/status/404", { throwOnError: false });

    expect(res).not.toBeSuccessful().toHaveStatus(404);
  })
  .step("GET /status/500 - server error", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/status/500", { throwOnError: false });

    expect(res).not.toBeSuccessful().toHaveStatus(500);
  })
  .step("GET /basic-auth - valid credentials", async (ctx) => {
    const { http } = ctx.resources;
    const credentials = btoa("testuser:testpass");
    const res = await http.get("/basic-auth/testuser/testpass", {
      headers: { Authorization: `Basic ${credentials}` },
    });

    expect(res)
      .toBeSuccessful()
      .toMatchObject({ authenticated: true, user: "testuser" });
  })
  .step("GET /basic-auth - invalid credentials", async (ctx) => {
    const { http } = ctx.resources;
    const credentials = btoa("wronguser:wrongpass");
    const res = await http.get("/basic-auth/testuser/testpass", {
      headers: { Authorization: `Basic ${credentials}` },
      throwOnError: false,
    });

    expect(res).not.toBeSuccessful().toHaveStatus(401);
  })
  .step("GET /bearer - valid token", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/bearer", {
      headers: { Authorization: "Bearer my-secret-token" },
    });

    expect(res)
      .toBeSuccessful()
      .toMatchObject({ authenticated: true, token: "my-secret-token" });
  })
  .step("GET /bearer - missing token", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/bearer", { throwOnError: false });

    expect(res).not.toBeSuccessful().toHaveStatus(401);
  })
  .step("GET /cookies - echo cookies", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/cookies", {
      headers: { Cookie: "session=abc123; user=probitas" },
    });

    expect(res)
      .toBeSuccessful()
      .toMatchObject({ cookies: { session: "abc123", user: "probitas" } });
  })
  .step("ANY /anything - echo everything", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.post("/anything/custom/path?key=value", {
      data: "test",
    });

    expect(res)
      .toBeSuccessful()
      .toHaveContentType(/application\/json/)
      .toMatchObject({ method: "POST", args: { key: "value" } });
  })
  .step("GET /ip - get client IP", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/ip");

    expect(res).toBeSuccessful().toHaveContent();
  })
  .step("GET /user-agent - get user agent", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/user-agent");

    expect(res).toBeSuccessful().toHaveContent();
  })
  .step("GET /health - health check", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/health");

    expect(res).toBeSuccessful().toMatchObject({ status: "ok" });
  })
  .step("GET /bytes/{n} - random bytes", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/bytes/100");

    expect(res)
      .toBeSuccessful()
      .toHaveContentType(/application\/octet-stream/)
      .toSatisfy((body) => {
        if (body instanceof Uint8Array && body.byteLength !== 100) {
          throw new Error(`Expected 100 bytes, got ${body.byteLength}`);
        }
      });
  })
  .build();
