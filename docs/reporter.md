# Reporter Layer

The Reporter layer formats and displays test execution results. It receives
lifecycle events from the Runner and presents them to users.

## Design Philosophy

### Event-Driven Architecture

Reporters implement a simple event interface. The Runner calls event methods at
appropriate times, and reporters decide how to present the information.

This decoupling enables:

- Multiple output formats without changing Runner
- Real-time output as tests execute
- Custom reporters for specific needs (CI/CD, IDEs, dashboards)

### Semantic Coloring via Theme

Reporters use the Theme layer for coloring. Instead of hardcoding colors,
reporters call semantic methods like `theme.success()` or `theme.failure()`.

Benefits:

- Reporters remain color-agnostic
- Users can customize themes without modifying reporters
- Automatic NO_COLOR environment variable support

### Console Control

Reporters can suppress console output from test code during execution. This
prevents test `console.log` calls from interfering with formatted output.

## Core Concepts

### Reporter Interface

All event methods are optional. Implement only the ones you need:

| Method             | When Called                  |
| ------------------ | ---------------------------- |
| `onRunStart?`      | Before any scenario executes |
| `onScenarioStart?` | Before a scenario executes   |
| `onStepStart?`     | Before a step executes       |
| `onStepEnd?`       | After a step succeeds        |
| `onStepError?`     | After a step fails           |
| `onScenarioEnd?`   | After a scenario completes   |
| `onRunEnd?`        | After all scenarios complete |

### ReporterOptions

Common configuration for all reporters:

| Option      | Description                                  |
| ----------- | -------------------------------------------- |
| `output`    | WritableStream destination (default: stderr) |
| `verbosity` | quiet / normal / verbose / debug             |
| `noColor`   | Disable ANSI colors                          |
| `theme`     | Custom Theme implementation                  |

## Built-in Reporters

### ListReporter

Detailed list format showing each step result. Best for development.

```
✓ User Login > Navigate (12ms)
✓ User Login > Submit (145ms)
✗ API Test > Create User
  Connection timeout

Summary
  ✓ 1 passed
  ✗ 1 failed
```

### DotReporter

Compact dots for large test suites.

```
...F....

7 passed, 1 failed (245ms)
```

- `.` = passed scenario
- `F` = failed scenario

### TAPReporter

Test Anything Protocol format for CI/CD integration.

```
TAP version 14
1..2
ok 1 - User Login
not ok 2 - API Test
```

### JSONReporter

JSON Lines format for machine parsing. One event per line in real-time.

## Custom Reporters

Implement the Reporter interface to create custom reporters. Extend
`BaseReporter` for common functionality like output stream management and
console control.

Key considerations:

1. **Real-time output** - Write immediately, don't buffer
2. **Use Theme** - Call `this.theme.success()` not color codes
3. **Implement only needed methods** - All event methods are optional

## Best Practices

1. **Choose appropriate reporter** - List for dev, Dot for CI, JSON for tooling
2. **Use verbosity levels** - Control output detail without changing reporter
3. **Respect NO_COLOR** - Pass `noColor: Deno.env.has("NO_COLOR")` when needed

## Related

- [Architecture](./architecture.md) - Overall design
- [Theme](./theme.md) - Semantic coloring
- [Runner](./runner.md) - Event source
- [Guide](./guide.md) - Practical examples
