/**
 * Data validation scenario example
 *
 * Demonstrates:
 * - Response schema validation
 * - Data type checking
 * - Format validation (email, UUID, etc.)
 * - Nested object validation
 *
 * Run with:
 *   probitas run example/scenarios/validation.scenario.ts
 */

import { client, expect, scenario } from "probitas";

await using api = client.http("http://localhost:8080");

const validationScenario = scenario("Data Validation", {
  tags: ["validation", "schema", "example"],
})
  .step("Validate Response Structure", async () => {
    const result = await api.get("/get");

    expect(result.status).toBe(200);

    // Validate top-level structure
    expect(result.json).toHaveProperty("args");
    expect(result.json).toHaveProperty("headers");
    expect(result.json).toHaveProperty("url");

    expect(typeof result.json.args).toBe("object");
    expect(typeof result.json.headers).toBe("object");
    expect(typeof result.json.url).toBe("string");

    return result.json;
  })
  .step("Validate UUID Format", async () => {
    const result = await api.get("/uuid");

    expect(result.status).toBe(200);
    expect(result.json).toHaveProperty("uuid");

    const uuid = result.json.uuid;
    expect(typeof uuid).toBe("string");

    // UUID v4 format validation
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuid).toMatch(uuidRegex);

    return uuid;
  })
  .step("Validate JSON Types", async () => {
    const testData = {
      string: "hello",
      number: 42,
      boolean: true,
      null: null,
      array: [1, 2, 3],
      object: { nested: "value" },
    };

    const result = await api.post("/anything", {
      json: testData,
    });

    expect(result.status).toBe(200);

    const received = result.json.json;

    expect(typeof received.string).toBe("string");
    expect(typeof received.number).toBe("number");
    expect(typeof received.boolean).toBe("boolean");
    expect(received.null).toBe(null);
    expect(Array.isArray(received.array)).toBe(true);
    expect(typeof received.object).toBe("object");
    expect(received.object.nested).toBe("value");
  })
  .step("Validate Headers", async () => {
    const result = await api.get("/headers");

    expect(result.status).toBe(200);
    expect(result.json).toHaveProperty("headers");

    const headers = result.json.headers;

    // Validate common headers exist
    expect(headers).toHaveProperty("Host");
    expect(headers.Host).toBe("localhost:8080");

    // Validate header values are strings
    Object.entries(headers).forEach(([key, value]) => {
      expect(typeof key).toBe("string");
      expect(typeof value).toBe("string");
    });
  })
  .step("Validate URL Format", async () => {
    const result = await api.get("/get?foo=bar&page=1");

    expect(result.status).toBe(200);

    const url = result.json.url;
    expect(url).toMatch(/^https?:\/\//);
    expect(url).toContain("localhost");
    expect(url).toContain("foo=bar");
    expect(url).toContain("page=1");
  })
  .step("Validate Query Parameters", async () => {
    const params = {
      page: "1",
      limit: "10",
      sort: "name",
      order: "asc",
    };

    const queryString = new URLSearchParams(params).toString();
    const result = await api.get(`/get?${queryString}`);

    expect(result.status).toBe(200);

    const receivedArgs = result.json.args;
    expect(receivedArgs).toEqual(params);
  })
  .step("Validate Array Response", async () => {
    const arrayData = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
      { id: 3, name: "Charlie" },
    ];

    const result = await api.post("/anything", {
      json: arrayData,
    });

    expect(result.status).toBe(200);

    const received = result.json.json;
    expect(Array.isArray(received)).toBe(true);
    expect(received).toHaveLength(3);

    received.forEach((item: { id: number; name: string }, index: number) => {
      expect(typeof item.id).toBe("number");
      expect(typeof item.name).toBe("string");
      expect(item.id).toBe(index + 1);
    });
  })
  .step("Validate Nested Objects", async () => {
    const nestedData = {
      user: {
        id: 1,
        profile: {
          name: "Alice",
          contact: {
            email: "alice@example.com",
            phone: "+1234567890",
          },
        },
      },
    };

    const result = await api.post("/anything", {
      json: nestedData,
    });

    expect(result.status).toBe(200);

    const received = result.json.json;

    expect(received.user).toBeDefined();
    expect(received.user.id).toBe(1);
    expect(received.user.profile).toBeDefined();
    expect(received.user.profile.name).toBe("Alice");
    expect(received.user.profile.contact).toBeDefined();
    expect(received.user.profile.contact.email).toBe("alice@example.com");

    // Email format validation
    expect(received.user.profile.contact.email).toMatch(/^[^@]+@[^@]+\.[^@]+$/);
  })
  .build();

export default validationScenario;
