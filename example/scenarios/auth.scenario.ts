/**
 * Authentication scenario example
 *
 * Demonstrates:
 * - Login/logout flow
 * - Session management with cookies
 * - Protected route access
 * - Top-level HTTP client usage
 *
 * Run with:
 *   probitas run example/scenarios/auth.scenario.ts
 */

import { client, expect, scenario } from "probitas";

// Create HTTP client at script root for session persistence
await using api = client.http("http://localhost:8080");

const authScenario = scenario("Authentication Flow", {
  tags: ["auth", "session", "example"],
})
  .step("Login", async () => {
    // Simulate login request - httpbin uses GET with query params to set cookies
    // Must disable redirect following to capture Set-Cookie headers
    const result = await api.get(
      "/cookies/set?session_token=abc123&user_id=42",
      {
        followRedirects: false,
      },
    );

    expect(result.status).toBe(302); // Redirect after setting cookie
    return "Logged in";
  })
  .step("Access Protected Route", async () => {
    // Cookies automatically included
    const result = await api.get("/cookies");
    expect(result.status).toBe(200);

    const cookies = result.json.cookies;
    expect(cookies.session_token).toBe("abc123");
    expect(cookies.user_id).toBe("42");
  })
  .step("Get User Profile", async () => {
    // Another protected route with session
    const result = await api.get("/headers");
    expect(result.status).toBe(200);
    expect(result.json.headers.Cookie).toContain("session_token");
  })
  .step("Logout", async () => {
    // Clear session
    api.clearCookies();

    const result = await api.get("/cookies");
    expect(result.status).toBe(200);
    expect(result.json.cookies).toEqual({});
  })
  .build();

export default authScenario;
