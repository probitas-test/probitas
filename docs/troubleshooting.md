# Troubleshooting Guide

Common issues and their solutions.

## Installation Issues

### Command Not Found After Installation

**Problem**: `probitas: command not found` after running `deno install`

**Solution**:

1. Make sure Deno's bin directory is in your PATH:
   ```bash
   # Add to ~/.bashrc or ~/.zshrc
   export PATH="$HOME/.deno/bin:$PATH"
   ```

2. Reload your shell:
   ```bash
   source ~/.bashrc  # or ~/.zshrc
   ```

3. Verify installation:
   ```bash
   probitas --version
   ```

### Permission Denied

**Problem**: Permission errors when installing

**Solution**:

Use the `-f` flag to force overwrite:

```bash
deno install -A -g -f -n probitas jsr:@lambdalisue/probitas/cli
```

## Runtime Issues

### Module Not Found

**Problem**: `Module not found: probitas` or similar import errors

**Solution**:

1. Ensure `scenarios/deno.jsonc` exists with correct import map:
   ```jsonc
   {
     "imports": {
       "probitas": "jsr:@lambdalisue/probitas"
     }
   }
   ```

2. Run scenarios from the correct directory (project root)

3. Clear Deno cache and reload:
   ```bash
   deno cache --reload scenarios/your-scenario.scenario.ts
   ```

### No Scenarios Found

**Problem**: `No scenarios found` when running `probitas run`

**Solution**:

1. Check your scenario files match the pattern `**/*.scenario.ts`

2. Verify scenario files export default:
   ```typescript
   export default myScenario; // Must export default
   ```

3. Check `deno.json` includes pattern:
   ```json
   {
     "probitas": {
       "includes": ["scenarios/**/*.scenario.ts"]
     }
   }
   ```

### Timeout Errors

**Problem**: Steps timing out

**Solution**:

1. Increase timeout for specific step:
   ```typescript
   .step("Slow operation", async () => {
     // ...
   }, { timeout: 60000 })  // 60 seconds
   ```

2. Increase default timeout in config:
   ```json
   {
     "probitas": {
       "stepOptions": {
         "timeout": 60000
       }
     }
   }
   ```

3. For debugging, disable timeout temporarily:
   ```typescript
   .step("Debug", async () => {
     // ...
   }, { timeout: Infinity })
   ```

## HTTP Client Issues

### Connection Refused

**Problem**: `Connection refused` or `Network error`

**Solution**:

1. Verify the API is running:
   ```bash
   curl https://api.example.com/health
   ```

2. Check base URL is correct:
   ```typescript
   await using api = client.http("https://api.example.com"); // Not http://
   ```

3. Add retry for transient failures:
   ```typescript
   return await retry(
     async () => await api.get("/endpoint"),
     { maxAttempts: 3, backoff: "exponential" },
   );
   ```

### Cookies Not Persisting

**Problem**: Session cookies not maintained across steps

**Solution**:

Create HTTP client at script root, NOT in each step:

**❌ Wrong:**

```typescript
scenario("Test")
  .step("Step 1", async () => {
    await using api = client.http("..."); // Creates new client each time
  });
```

**✅ Correct:**

```typescript
await using api = client.http("..."); // Create once at root

scenario("Test")
  .step("Step 1", async () => {
    await api.get("/endpoint"); // Reuses same client
  });
```

### Response Body Already Consumed

**Problem**: `Body has already been read` error

**Solution**:

Access response body properties only once. They are lazy-evaluated:

```typescript
const result = await api.get("/users");

// ✅ Correct - access once
const data = result.json;
expect(data.users).toBeDefined();

// ❌ Wrong - accessing twice
const data1 = result.json;
const data2 = result.json; // Error!
```

## Test Failures

### Flaky Tests

**Problem**: Tests pass sometimes, fail sometimes

**Solution**:

1. Add retry for flaky operations:
   ```typescript
   await retry(
     async () => {
       const result = await api.get("/endpoint");
       expect(result.status).toBe(200);
     },
     { maxAttempts: 3, backoff: "exponential" },
   );
   ```

2. Add explicit waits:
   ```typescript
   await new Promise((resolve) => setTimeout(resolve, 1000));
   ```

3. Check for race conditions in concurrent scenarios

### Assertion Failures

**Problem**: `expect()` assertions failing unexpectedly

**Solution**:

1. Add debug logging:
   ```typescript
   console.log("Result:", result);
   expect(result.status).toBe(200);
   ```

2. Use verbosity flag:
   ```bash
   probitas run -d  # Debug mode
   ```

3. Run with `--fail-fast` to stop on first failure:
   ```bash
   probitas run --fail-fast
   ```

## Configuration Issues

### Config File Not Loaded

**Problem**: Configuration not being applied

**Solution**:

1. Ensure file is named `deno.json` or `deno.jsonc`

2. Verify file is in project root

3. Check JSON syntax is correct:
   ```json
   {
     "probitas": {
       "reporter": "list",
       "includes": ["**/*.scenario.ts"]
     }
   }
   ```

4. Specify config explicitly:
   ```bash
   probitas run --config deno.json
   ```

### Selectors Not Working

**Problem**: Tag selectors not filtering scenarios

**Solution**:

1. Verify tag format:
   ```bash
   probitas run -s tag:api  # Correct
   probitas run -s api      # Also works (defaults to name match)
   ```

2. Check scenario has tags:
   ```typescript
   scenario("Test", { tags: ["api"] }); // Must have tags array
   ```

3. Use debug mode to see which scenarios are loaded:
   ```bash
   probitas list -s tag:api
   ```

## Performance Issues

### Slow Test Execution

**Problem**: Tests running slowly

**Solution**:

1. Run scenarios in parallel (default):
   ```bash
   probitas run  # Unlimited concurrency
   ```

2. Limit concurrency if causing issues:
   ```bash
   probitas run --max-concurrency 10
   ```

3. Skip slow tests during development:
   ```bash
   probitas run -s "!tag:slow"
   ```

4. Use faster reporter:
   ```bash
   probitas run --reporter dot
   ```

### High Memory Usage

**Problem**: Memory usage growing during test run

**Solution**:

1. Ensure resources are cleaned up:
   ```typescript
   await using api = client.http("..."); // Auto cleanup
   ```

2. Limit concurrent scenarios:
   ```bash
   probitas run --max-concurrency 5
   ```

3. Run scenarios sequentially:
   ```bash
   probitas run --sequential
   ```

## TypeScript Issues

### Type Errors in Scenarios

**Problem**: TypeScript compilation errors

**Solution**:

1. Ensure `deno.jsonc` has correct config:
   ```jsonc
   {
     "compilerOptions": {
       "lib": ["deno.window", "deno.unstable"]
     }
   }
   ```

2. Add type annotations explicitly:
   ```typescript
   .step("Typed step", async (): Promise<number> => {
     return 42;
   })
   ```

3. Use type assertion if needed:
   ```typescript
   const api = ctx.store.get("api") as HTTPClient;
   ```

### Context Type Inference Issues

**Problem**: `ctx.previous` or `ctx.results` type is `unknown`

**Solution**:

TypeScript should infer types automatically. If not:

```typescript
.step("Step 1", () => {
  return { id: 1, name: "test" };
})
.step("Step 2", (ctx) => {
  // TypeScript infers ctx.previous: { id: number, name: string }
  const id = ctx.previous.id;
})
```

If inference fails, add explicit type:

```typescript
.step("Step 2", (ctx: StepContext<{ id: number, name: string }>) => {
  const id = ctx.previous.id;
})
```

## Debugging Tips

### Enable Debug Output

```bash
probitas run -d  # Debug verbosity
```

### Run Single Scenario

```bash
probitas run scenarios/specific-test.scenario.ts
```

### Use Dot Reporter for CI

```bash
probitas run --reporter tap  # TAP format
probitas run --reporter json  # JSON for parsing
```

### Check Scenario Metadata

```bash
probitas list --json
```

### Inspect HTTP Requests

Add logging to see requests:

```typescript
.step("Debug request", async () => {
  const result = await api.get("/users");
  console.log("Status:", result.status);
  console.log("Headers:", result.headers);
  console.log("Body:", result.text);
  return result;
})
```

## Getting Help

If you're still stuck:

1. Check existing [documentation](../docs/)
2. Search [GitHub issues](https://github.com/lambdalisue/deno-probitas/issues)
3. Create a new issue with:
   - Probitas version (`probitas --version`)
   - Deno version (`deno --version`)
   - Minimal reproduction code
   - Error messages
