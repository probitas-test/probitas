/**
 * GraphQL Client Scenario Example
 *
 * Target: echo-graphql service on port 14000 (compose.yaml)
 * API Reference: https://github.com/jsr-probitas/echo-servers/blob/main/echo-graphql/docs/api.md
 */
import { client, expect, outdent, scenario } from "probitas";

export default scenario("GraphQL Client Example", {
  tags: ["integration", "graphql"],
})
  .resource("gql", () =>
    client.graphql.createGraphqlClient({
      endpoint: "http://localhost:14000/graphql",
    }))
  .step("echo - simple query", async (ctx) => {
    const { gql } = ctx.resources;
    const res = await gql.query(outdent`
      query {
        echo(message: "Hello GraphQL")
      }
    `);

    expect(res)
      .ok()
      .dataContains({ echo: "Hello GraphQL" });
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
      .ok()
      .dataContains({ echo: "variable message" });
  })
  .step("echoWithDelay - delayed query", async (ctx) => {
    const { gql } = ctx.resources;
    const res = await gql.query(outdent`
      query {
        echoWithDelay(message: "delayed", delayMs: 100)
      }
    `);

    expect(res)
      .ok()
      .dataContains({ echoWithDelay: "delayed" })
      .durationLessThan(5000);
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

    expect(res).hasErrors();
  })
  .step("echoNull - null handling", async (ctx) => {
    const { gql } = ctx.resources;
    const res = await gql.query(outdent`
      query {
        echoNull
      }
    `);

    expect(res)
      .ok()
      .dataContains({ echoNull: null });
  })
  .step("echoOptional - optional value", async (ctx) => {
    const { gql } = ctx.resources;
    const res = await gql.query(outdent`
      query {
        echoOptional(message: "optional", returnNull: false)
      }
    `);

    expect(res)
      .ok()
      .dataContains({ echoOptional: "optional" });
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

    expect(res).ok();
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

    expect(res).ok();
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

    expect(res).ok();
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

    expect(res).ok();
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

    expect(res).ok();
  })
  .build();
