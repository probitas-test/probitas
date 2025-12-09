# Migration Guide from 0.3.6 to 0.4.0

This guide helps you migrate from Probitas 0.3.6 to 0.4.0, which includes
significant breaking changes to the expectation API.

## Breaking Changes Overview

Version 0.4.0 introduces a major overhaul of the expectation API to improve
consistency and clarity across all client types. All expectation methods have
been renamed to follow a uniform naming convention.

## Expectation Method Renaming

All expectation methods have been renamed to follow the pattern `toXxx` or
`toHaveXxx`, consistent with Jest/Vitest conventions and @std/expect.

### HTTP Response Expectations

| Old Method                        | New Method                                | Notes                            |
| --------------------------------- | ----------------------------------------- | -------------------------------- |
| `ok()`                            | `toBeSuccessful()`                        | More explicit and clearer intent |
| `status(code)`                    | `toHaveStatus(code)`                      | Consistent naming pattern        |
| `statusOneOf(codes)`              | `toHaveStatusOneOf(codes)`                | Consistent naming pattern        |
| `header(name, value?)`            | `toHaveHeader(name, value?)`              | Consistent naming pattern        |
| `headerContains(name, substring)` | `toHaveHeaderContaining(name, substring)` | More descriptive                 |
| `body(expected)`                  | `toHaveBody(expected)`                    | Consistent naming pattern        |
| `bodyContains(substring)`         | `toHaveBodyContaining(substring)`         | More descriptive                 |
| `bodyMatches(pattern)`            | `toHaveBodyMatching(pattern)`             | More descriptive                 |
| `data(expected?)`                 | `toHaveContent(expected?)`                | More generic term                |
| `dataContains(subset)`            | `toHaveContentContaining(subset)`         | More descriptive                 |
| `duration()`                      | `toHaveDuration()`                        | Consistent naming pattern        |
| `durationLessThan(ms)`            | `toHaveDurationLessThan(ms)`              | More descriptive                 |
| `durationLessThanOrEqual(ms)`     | `toHaveDurationLessThanOrEqual(ms)`       | More descriptive                 |

**Before (0.3.6):**

```typescript
import { client, expect, scenario } from "probitas";

export default scenario("API Test")
  .resource(
    "http",
    () => client.http.createHttpClient({ url: "http://localhost:3000" }),
  )
  .step("GET /api/users", async (ctx) => {
    const { http } = ctx.resources;
    const response = await http.get("/api/users");

    expect(response)
      .ok()
      .status(200)
      .header("content-type", "application/json")
      .dataContains({ id: 123 });
  })
  .build();
```

**After (0.4.0):**

```typescript
import { client, expect, scenario } from "probitas";

export default scenario("API Test")
  .resource(
    "http",
    () => client.http.createHttpClient({ url: "http://localhost:3000" }),
  )
  .step("GET /api/users", async (ctx) => {
    const { http } = ctx.resources;
    const response = await http.get("/api/users");

    expect(response)
      .toBeSuccessful()
      .toHaveStatus(200)
      .toHaveHeader("content-type", "application/json")
      .toHaveContentContaining({ id: 123 });
  })
  .build();
```

### GraphQL Response Expectations

| Old Method                            | New Method                                  |
| ------------------------------------- | ------------------------------------------- |
| `ok()`                                | `toBeSuccessful()`                          |
| `data(expected?)`                     | `toHaveContent(expected?)`                  |
| `dataContains(subset)`                | `toHaveContentContaining(subset)`           |
| `errorCount(count)`                   | `toHaveErrorCount(count)`                   |
| `errorCountGreaterThan(count)`        | `toHaveErrorCountGreaterThan(count)`        |
| `errorCountGreaterThanOrEqual(count)` | `toHaveErrorCountGreaterThanOrEqual(count)` |
| `errorCountLessThan(count)`           | `toHaveErrorCountLessThan(count)`           |
| `errorCountLessThanOrEqual(count)`    | `toHaveErrorCountLessThanOrEqual(count)`    |
| `errors(expected)`                    | `toHaveErrors(expected)`                    |
| `errorsContain(subset)`               | `toHaveErrorsContaining(subset)`            |
| `duration()`                          | `toHaveDuration()`                          |
| `durationLessThan(ms)`                | `toHaveDurationLessThan(ms)`                |
| `durationLessThanOrEqual(ms)`         | `toHaveDurationLessThanOrEqual(ms)`         |

**Before (0.3.6):**

```typescript
import { client, expect, scenario } from "probitas";

export default scenario("GraphQL Test")
  .resource("gql", () =>
    client.graphql.createGraphQLClient({
      endpoint: "http://localhost:4000/graphql",
    }))
  .step("Query user", async (ctx) => {
    const { gql } = ctx.resources;
    const response = await gql.query("{ user(id: 1) { name } }");

    expect(response)
      .ok()
      .data({ user: { id: 1 } })
      .errorCount(0);
  })
  .build();
```

**After (0.4.0):**

```typescript
import { client, expect, scenario } from "probitas";

export default scenario("GraphQL Test")
  .resource("gql", () =>
    client.graphql.createGraphQLClient({
      endpoint: "http://localhost:4000/graphql",
    }))
  .step("Query user", async (ctx) => {
    const { gql } = ctx.resources;
    const response = await gql.query("{ user(id: 1) { name } }");

    expect(response)
      .toBeSuccessful()
      .toHaveContent({ user: { id: 1 } })
      .toHaveErrorCount(0);
  })
  .build();
```

### ConnectRPC Response Expectations

| Old Method                    | New Method                          |
| ----------------------------- | ----------------------------------- |
| `ok()`                        | `toBeSuccessful()`                  |
| `code(code)`                  | `toHaveCode(code)`                  |
| `codeOneOf(codes)`            | `toHaveCodeOneOf(codes)`            |
| `error(expected)`             | `toHaveError(expected)`             |
| `data(expected?)`             | `toHaveContent(expected?)`          |
| `dataContains(subset)`        | `toHaveContentContaining(subset)`   |
| `metadata(expected)`          | `toHaveMetadata(expected)`          |
| `metadataContains(subset)`    | `toHaveMetadataContaining(subset)`  |
| `duration()`                  | `toHaveDuration()`                  |
| `durationLessThan(ms)`        | `toHaveDurationLessThan(ms)`        |
| `durationLessThanOrEqual(ms)` | `toHaveDurationLessThanOrEqual(ms)` |

### SQL Query Result Expectations

| Old Method                          | New Method                                |
| ----------------------------------- | ----------------------------------------- |
| `ok()`                              | `toBeSuccessful()`                        |
| `data(expected?)`                   | `toHaveContent(expected?)`                |
| `dataContains(subset)`              | `toHaveContentContaining(subset)`         |
| `length(count)`                     | `toHaveLength(count)`                     |
| `lengthGreaterThan(count)`          | `toHaveLengthGreaterThan(count)`          |
| `lengthGreaterThanOrEqual(count)`   | `toHaveLengthGreaterThanOrEqual(count)`   |
| `lengthLessThan(count)`             | `toHaveLengthLessThan(count)`             |
| `lengthLessThanOrEqual(count)`      | `toHaveLengthLessThanOrEqual(count)`      |
| `rowCount(count)`                   | `toHaveRowCount(count)`                   |
| `rowCountGreaterThan(count)`        | `toHaveRowCountGreaterThan(count)`        |
| `rowCountGreaterThanOrEqual(count)` | `toHaveRowCountGreaterThanOrEqual(count)` |
| `rowCountLessThan(count)`           | `toHaveRowCountLessThan(count)`           |
| `rowCountLessThanOrEqual(count)`    | `toHaveRowCountLessThanOrEqual(count)`    |
| `duration()`                        | `toHaveDuration()`                        |
| `durationLessThan(ms)`              | `toHaveDurationLessThan(ms)`              |
| `durationLessThanOrEqual(ms)`       | `toHaveDurationLessThanOrEqual(ms)`       |

### Redis Result Expectations

| Old Method                    | New Method                          |
| ----------------------------- | ----------------------------------- |
| `ok()`                        | `toBeSuccessful()`                  |
| `value(expected)`             | `toHaveValue(expected)`             |
| `valueContains(subset)`       | `toHaveValueContaining(subset)`     |
| `duration()`                  | `toHaveDuration()`                  |
| `durationLessThan(ms)`        | `toHaveDurationLessThan(ms)`        |
| `durationLessThanOrEqual(ms)` | `toHaveDurationLessThanOrEqual(ms)` |

### MongoDB Result Expectations

| Old Method                               | New Method                                     |
| ---------------------------------------- | ---------------------------------------------- |
| `ok()`                                   | `toBeSuccessful()`                             |
| `data(expected?)`                        | `toHaveContent(expected?)`                     |
| `dataContains(subset)`                   | `toHaveContentContaining(subset)`              |
| `length(count)`                          | `toHaveLength(count)`                          |
| `lengthGreaterThan(count)`               | `toHaveLengthGreaterThan(count)`               |
| `lengthGreaterThanOrEqual(count)`        | `toHaveLengthGreaterThanOrEqual(count)`        |
| `lengthLessThan(count)`                  | `toHaveLengthLessThan(count)`                  |
| `lengthLessThanOrEqual(count)`           | `toHaveLengthLessThanOrEqual(count)`           |
| `insertedId(id)`                         | `toHaveInsertedId(id)`                         |
| `matchedCount(count)`                    | `toHaveMatchedCount(count)`                    |
| `matchedCountGreaterThan(count)`         | `toHaveMatchedCountGreaterThan(count)`         |
| `matchedCountGreaterThanOrEqual(count)`  | `toHaveMatchedCountGreaterThanOrEqual(count)`  |
| `matchedCountLessThan(count)`            | `toHaveMatchedCountLessThan(count)`            |
| `matchedCountLessThanOrEqual(count)`     | `toHaveMatchedCountLessThanOrEqual(count)`     |
| `modifiedCount(count)`                   | `toHaveModifiedCount(count)`                   |
| `modifiedCountGreaterThan(count)`        | `toHaveModifiedCountGreaterThan(count)`        |
| `modifiedCountGreaterThanOrEqual(count)` | `toHaveModifiedCountGreaterThanOrEqual(count)` |
| `modifiedCountLessThan(count)`           | `toHaveModifiedCountLessThan(count)`           |
| `modifiedCountLessThanOrEqual(count)`    | `toHaveModifiedCountLessThanOrEqual(count)`    |
| `upsertedId(id)`                         | `toHaveUpsertedId(id)`                         |
| `duration()`                             | `toHaveDuration()`                             |
| `durationLessThan(ms)`                   | `toHaveDurationLessThan(ms)`                   |
| `durationLessThanOrEqual(ms)`            | `toHaveDurationLessThanOrEqual(ms)`            |

### Deno KV Result Expectations

| Old Method                    | New Method                          |
| ----------------------------- | ----------------------------------- |
| `ok()`                        | `toBeSuccessful()`                  |
| `data(expected?)`             | `toHaveContent(expected?)`          |
| `dataContains(subset)`        | `toHaveContentContaining(subset)`   |
| `versionstamp(stamp)`         | `toHaveVersionstamp(stamp)`         |
| `duration()`                  | `toHaveDuration()`                  |
| `durationLessThan(ms)`        | `toHaveDurationLessThan(ms)`        |
| `durationLessThanOrEqual(ms)` | `toHaveDurationLessThanOrEqual(ms)` |

### RabbitMQ Result Expectations

| Old Method                    | New Method                          |
| ----------------------------- | ----------------------------------- |
| `ok()`                        | `toBeSuccessful()`                  |
| `data(expected?)`             | `toHaveContent(expected?)`          |
| `body(expected)`              | `toHaveBody(expected)`              |
| `bodyContaining(subset)`      | `toHaveBodyContaining(subset)`      |
| `properties(expected)`        | `toHaveProperties(expected)`        |
| `propertyContaining(subset)`  | `toHavePropertyContaining(subset)`  |
| `routingKey(key)`             | `toHaveRoutingKey(key)`             |
| `exchange(name)`              | `toHaveExchange(name)`              |
| `duration()`                  | `toHaveDuration()`                  |
| `durationLessThan(ms)`        | `toHaveDurationLessThan(ms)`        |
| `durationLessThanOrEqual(ms)` | `toHaveDurationLessThanOrEqual(ms)` |

### SQS Result Expectations

| Old Method                        | New Method                              |
| --------------------------------- | --------------------------------------- |
| `ok()`                            | `toBeSuccessful()`                      |
| `data(expected?)`                 | `toHaveContent(expected?)`              |
| `length(count)`                   | `toHaveLength(count)`                   |
| `lengthGreaterThan(count)`        | `toHaveLengthGreaterThan(count)`        |
| `lengthGreaterThanOrEqual(count)` | `toHaveLengthGreaterThanOrEqual(count)` |
| `lengthLessThan(count)`           | `toHaveLengthLessThan(count)`           |
| `lengthLessThanOrEqual(count)`    | `toHaveLengthLessThanOrEqual(count)`    |
| `messageId(id)`                   | `toHaveMessageId(id)`                   |
| `successfulCount(count)`          | `toHaveSuccessfulCount(count)`          |
| `failedCount(count)`              | `toHaveFailedCount(count)`              |
| `allSuccessful()`                 | `toBeAllSuccessful()`                   |
| `duration()`                      | `toHaveDuration()`                      |
| `durationLessThan(ms)`            | `toHaveDurationLessThan(ms)`            |
| `durationLessThanOrEqual(ms)`     | `toHaveDurationLessThanOrEqual(ms)`     |

## New Feature: Chainable Expectations for Generic Values

Version 0.4.0 introduces `expectAnything`, a chainable wrapper around
@std/expect that enables method chaining for any value type.

**Example:**

```typescript
import { expect, scenario } from "probitas";

export default scenario("Value Test")
  .step("Validate number", () => {
    // Now you can chain @std/expect matchers
    expect(42)
      .toBe(42)
      .toBeGreaterThan(40)
      .toBeLessThan(50);
  })
  .step("Validate string", () => {
    // .not modifier works correctly
    expect("hello")
      .not.toBe("world")
      .not.toBeNull()
      .toContain("ello");
  })
  .build();
```

**Note:** `.resolves` and `.rejects` are intentionally not supported as they
require `.then()` chaining, which degrades the UX compared to synchronous method
chaining.

## Automated Migration

Use find-and-replace with your editor to migrate method calls:

### HTTP Response

- `.ok()` → `.toBeSuccessful()`
- `.status(` → `.toHaveStatus(`
- `.statusOneOf(` → `.toHaveStatusOneOf(`
- `.header(` → `.toHaveHeader(`
- `.headerContains(` → `.toHaveHeaderContaining(`
- `.body(` → `.toHaveBody(`
- `.bodyContains(` → `.toHaveBodyContaining(`
- `.bodyMatches(` → `.toHaveBodyMatching(`
- `.data(` → `.toHaveContent(`
- `.dataContains(` → `.toHaveContentContaining(`

### Other Response Types

For other response types (GraphQL, ConnectRPC, SQL, Redis, MongoDB, Deno KV,
RabbitMQ, SQS), apply similar transformations:

- `.ok()` → `.toBeSuccessful()`
- `.data(` → `.toHaveContent(`
- `.dataContains(` → `.toHaveContentContaining(`
- Property accessors → `.toHaveXxx(` pattern

## Why These Changes?

1. **Consistency**: All expectation methods now follow a uniform naming
   convention
2. **Clarity**: Method names are more explicit about their intent (e.g.,
   `toBeSuccessful()` vs `ok()`)
3. **Alignment**: Matches conventions from popular testing frameworks (Jest,
   Vitest, @std/expect)
4. **Discoverability**: The `toHave` prefix makes it easier to discover
   available expectations through IDE autocomplete

## Need Help?

If you encounter issues during migration or have questions, please:

- Check the [API documentation](https://jsr.io/@probitas/expect)
- Open an issue on [GitHub](https://github.com/jsr-probitas/probitas/issues)
