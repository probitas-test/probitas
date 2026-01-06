/**
 * HTTP Client OIDC (OpenID Connect) Scenario Example
 *
 * This example demonstrates the @probitas/client-http/oidc package:
 * - Creating an OIDC HTTP client with discovery
 * - Authorization Code Grant flow with automated login
 * - Automatic token management and Authorization header injection
 * - Making authenticated requests after login
 * - Testing OIDC discovery endpoints
 * - Manual OIDC configuration
 *
 * Target: echo-http service on port 8080 (compose.yaml)
 * API Reference: https://github.com/probitas-test/echo-servers/blob/main/echo-http/docs/api.md#oidc-endpoints
 */
import { client, expect, scenario, Skip } from "jsr:@probitas/probitas@^0";

const BASE_URL = Deno.env.get("ECHO_HTTP_URL") ?? "http://localhost:8080";
const TEST_USER = "testuser";
const TEST_PASS = "testpass";
const ISSUER = BASE_URL;

export default scenario("HTTP Client OIDC Example", {
  tags: ["integration", "http", "oidc"],
})
  .setup("Check HTTP server availability", async () => {
    try {
      await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(1000) });
    } catch {
      throw new Skip(`HTTP server not available at ${BASE_URL}`);
    }
  })
  .resource(
    "http-client",
    () => client.http.createHttpClient({ url: BASE_URL }),
  )
  .step(
    "GET /.well-known/openid-configuration - OIDC discovery",
    async (ctx) => {
      const { "http-client": http } = ctx.resources;
      const res = await http.get(
        `/.well-known/openid-configuration`,
      );

      expect(res)
        .toBeOk()
        .toHaveStatus(200)
        .toHaveJsonMatching({
          issuer: ISSUER,
          authorization_endpoint: `${ISSUER}/oauth2/authorize`,
          token_endpoint: `${ISSUER}/oauth2/token`,
        });
    },
  )
  .resource(
    "oidc-http-with-discovery",
    async () =>
      await client.http.oidc.createOidcHttpClient({
        url: BASE_URL,
        oidc: {
          issuer: ISSUER,
          clientId: "test-client",
        },
      }),
  )
  .step(
    "Login with authorization_code grant - auto discovery",
    async (ctx) => {
      const { "oidc-http-with-discovery": http } = ctx.resources;
      const result = await http.login({
        type: "authorization_code",
        username: TEST_USER,
        password: TEST_PASS,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.token.accessToken).toBeDefined();
        expect(result.token.tokenType).toBe("Bearer");
        expect(result.token.expiresIn).toBeGreaterThan(0);
      }

      return result;
    },
  )
  .step(
    "GET /oauth2/userinfo - authenticated request with auto header",
    async (ctx) => {
      const { "oidc-http-with-discovery": http } = ctx.resources;
      const res = await http.get("/oauth2/userinfo");

      expect(res)
        .toBeOk()
        .toHaveStatus(200)
        .toHaveJsonMatching({
          sub: TEST_USER,
        });
    },
  )
  .resource(
    "oidc-http-manual",
    async () =>
      await client.http.oidc.createOidcHttpClient({
        url: BASE_URL,
        oidc: {
          authUrl: `/oauth2/authorize`,
          tokenUrl: `/oauth2/token`,
          clientId: "test-client-manual",
        },
      }),
  )
  .step("Login with manual OIDC configuration", async (ctx) => {
    const { "oidc-http-manual": http } = ctx.resources;
    const result = await http.login({
      type: "authorization_code",
      username: TEST_USER,
      password: TEST_PASS,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.token.accessToken).toBeDefined();
      expect(result.token.tokenType).toBe("Bearer");
    }

    return result;
  })
  .step(
    "GET /oauth2/userinfo - authenticated with manual config",
    async (ctx) => {
      const { "oidc-http-manual": http } = ctx.resources;
      const res = await http.get("/oauth2/userinfo");

      expect(res)
        .toBeOk()
        .toHaveJsonMatching({
          sub: TEST_USER,
        });
    },
  )
  .step("Login failure - invalid credentials", async () => {
    const http = await client.http.oidc.createOidcHttpClient({
      url: BASE_URL,
      oidc: {
        issuer: BASE_URL,
        clientId: "test-client",
      },
    });

    const result = await http.login({
      type: "authorization_code",
      username: "wronguser",
      password: "wrongpass",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeDefined();
    }

    await http.close();
  })
  .step("Multiple authenticated requests", async (ctx) => {
    const { "oidc-http-with-discovery": http } = ctx.resources;

    // First request
    const res1 = await http.get("/oauth2/userinfo");
    expect(res1).toBeOk().toHaveJsonMatching({ sub: TEST_USER });

    // Second request - token should still be valid
    const res2 = await http.get("/oauth2/userinfo");
    expect(res2).toBeOk().toHaveJsonMatching({ sub: TEST_USER });

    // Third request with query parameters
    const res3 = await http.get("/oauth2/userinfo?foo=bar");
    expect(res3).toBeOk().toHaveJsonMatching({ sub: TEST_USER });
  })
  .step("POST request with authentication", async (ctx) => {
    const { "oidc-http-with-discovery": http } = ctx.resources;
    const res = await http.post("/post", {
      body: { message: "authenticated post" },
    });

    expect(res)
      .toBeOk()
      .toHaveJsonMatching({
        json: { message: "authenticated post" },
      });
  })
  .build();
