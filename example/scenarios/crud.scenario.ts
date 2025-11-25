/**
 * CRUD operations scenario example
 *
 * Demonstrates:
 * - Create, Read, Update, Delete operations
 * - Passing data between steps
 * - Response validation
 * - Using context.results to access multiple previous results
 *
 * Run with:
 *   probitas run example/scenarios/crud.scenario.ts
 */

import { client, expect, scenario } from "probitas";

await using api = client.http("http://localhost:8080");

const crudScenario = scenario("User CRUD Operations", {
  tags: ["crud", "api", "example"],
})
  .step("Create User", async () => {
    const userData = {
      name: "Alice Johnson",
      email: "alice@example.com",
      role: "developer",
    };

    const result = await api.post("/anything", {
      json: userData,
    });

    expect(result.status).toBe(200);
    expect(result.json.json).toEqual(userData);

    // Simulate returning created user ID
    return {
      id: 123,
      ...userData,
    };
  })
  .step("Read User", async (ctx) => {
    const user = ctx.previous;

    const result = await api.get(`/anything/${user.id}`);
    expect(result.status).toBe(200);

    // Verify the URL contains the user ID
    expect(result.json.url).toContain(user.id.toString());

    return user;
  })
  .step("Update User", async (ctx) => {
    const user = ctx.previous;
    const updatedData = {
      ...user,
      name: "Alice Smith",
      role: "senior developer",
    };

    const result = await api.put(`/anything/${user.id}`, {
      json: updatedData,
    });

    expect(result.status).toBe(200);
    expect(result.json.json.name).toBe("Alice Smith");
    expect(result.json.json.role).toBe("senior developer");

    return updatedData;
  })
  .step("Verify Update", async (ctx) => {
    const updatedUser = ctx.previous;

    const result = await api.get(`/anything/${updatedUser.id}`);
    expect(result.status).toBe(200);

    return updatedUser;
  })
  .step("Delete User", async (ctx) => {
    const user = ctx.previous;

    const result = await api.delete(`/anything/${user.id}`);
    expect(result.status).toBe(200);
    expect(result.json.url).toContain(user.id.toString());
  })
  .step("Verify Deletion", async (ctx) => {
    // Access the first step's result
    const originalUser = ctx.results[0];

    // In real API, this would return 404
    const result = await api.get(`/anything/${originalUser.id}`);

    // httpbin always returns 200, but we can verify the URL
    expect(result.json.url).toContain(originalUser.id.toString());
  })
  .build();

export default crudScenario;
