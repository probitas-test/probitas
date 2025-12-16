/**
 * GraphQL Client Scenario Example
 *
 * Target: echo-graphql service on port 14000 (compose.yaml)
 * API Reference: https://github.com/jsr-probitas/echo-servers/blob/main/echo-graphql/docs/api.md
 */
import {
  client,
  expect,
  outdent,
  scenario,
  Skip,
} from "jsr:@probitas/probitas@^0";

const BASE_URL = "http://localhost:14000";

export default scenario("GraphQL Client Example", {
  tags: ["integration", "graphql"],
})
  .setup("Check GraphQL server availability", async () => {
    try {
      await fetch(`${BASE_URL}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "{ __typename }" }),
        signal: AbortSignal.timeout(1000),
      });
    } catch {
      throw new Skip(`GraphQL server not available at ${BASE_URL}`);
    }
  })
  .resource("gql", () =>
    client.graphql.createGraphqlClient({
      url: `${BASE_URL}/graphql`,
    }))
  .step("echo - simple query", async (ctx) => {
    const { gql } = ctx.resources;
    const res = await gql.query(outdent`
      query {
        echo(message: "Hello GraphQL")
      }
    `);

    expect(res)
      .toBeOk()
      .toHaveDataProperty("echo", "Hello GraphQL");
  })
  .step("echo - with variables", async (ctx) => {
    const { gql } = ctx.resources;
    const res = await gql.query(
      outdent`
        query Echo($msg: String!) {
          echo(message: $msg)
        }
      `,
      { msg: "variable message" },
    );

    expect(res)
      .toBeOk()
      .toHaveDataProperty("echo", "variable message");
  })
  .step("echoWithDelay - delayed query", async (ctx) => {
    const { gql } = ctx.resources;
    const res = await gql.query(outdent`
      query {
        echoWithDelay(message: "delayed", delayMs: 100)
      }
    `);

    expect(res)
      .toBeOk()
      .toHaveDataProperty("echoWithDelay", "delayed")
      .toHaveDurationLessThan(5000);
  })
  .step("echoError - GraphQL error", async (ctx) => {
    const { gql } = ctx.resources;
    const res = await gql.query(
      outdent`
        query {
          echoError(message: "test error")
        }
      `,
      undefined,
      { throwOnError: false },
    );

    expect(res).not.toBeOk();
  })
  .step("echoNull - null handling", async (ctx) => {
    const { gql } = ctx.resources;
    const res = await gql.query(outdent`
      query {
        echoNull
      }
    `);

    expect(res)
      .toBeOk()
      .toHaveDataProperty("echoNull", null);
  })
  .step("echoOptional - optional value", async (ctx) => {
    const { gql } = ctx.resources;
    const res = await gql.query(outdent`
      query {
        echoOptional(message: "optional", returnNull: false)
      }
    `);

    expect(res)
      .toBeOk()
      .toHaveDataProperty("echoOptional", "optional");
  })
  .step("echoList - list query", async (ctx) => {
    const { gql } = ctx.resources;
    const res = await gql.query(outdent`
      query {
        echoList(message: "item", count: 3) {
          index
          message
        }
      }
    `);

    expect(res).toBeOk();
  })
  .step("echoNested - nested response", async (ctx) => {
    const { gql } = ctx.resources;
    const res = await gql.query(outdent`
      query {
        echoNested(message: "nested", depth: 2) {
          value
          child {
            value
          }
        }
      }
    `);

    expect(res).toBeOk();
  })
  .step("echoHeaders - header verification", async (ctx) => {
    const { gql } = ctx.resources;
    const res = await gql.query(
      outdent`
        query {
          echoHeaders {
            authorization
            all { name value }
          }
        }
      `,
      undefined,
      { headers: { Authorization: "Bearer test-token" } },
    );

    expect(res).toBeOk();
  })
  .step("createMessage - mutation", async (ctx) => {
    const { gql } = ctx.resources;
    const res = await gql.mutation(outdent`
      mutation {
        createMessage(text: "Hello from probitas") {
          id
          text
          createdAt
        }
      }
    `);

    expect(res).toBeOk();
  })
  .step("batchCreateMessages - batch mutation", async (ctx) => {
    const { gql } = ctx.resources;
    const res = await gql.mutation(outdent`
      mutation {
        batchCreateMessages(texts: ["first", "second", "third"]) {
          id
          text
        }
      }
    `);

    expect(res).toBeOk();
  })
  .build();
