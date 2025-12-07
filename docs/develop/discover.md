# Discover Layer

The Discover layer provides functions for finding scenario files in the
filesystem. It handles both direct file paths and directory traversal with glob
patterns.

## Design Philosophy

### Path Resolution Strategy

The discovery process follows a simple strategy:

- **File path** → Returns that file directly
- **Directory path** → Searches within using include patterns

This allows users to specify exact files or let the system discover them.

### Glob-Based Filtering

Uses standard glob patterns for flexible file matching:

- Include patterns determine which files to discover
- Exclude patterns filter out unwanted paths
- Patterns are evaluated relative to each directory

## Core Concepts

### Scenario File

A TypeScript file containing scenario definitions. By default, files matching
`**/*.probitas.ts` are considered scenario files.

### Include Patterns

Glob patterns that determine which files to discover within directories.
Multiple patterns are processed with OR logic.

### Exclude Patterns

Glob patterns for paths to skip. No patterns are excluded by default.

## API

### discoverScenarioFiles(paths, options?)

Discovers scenario files from the given paths.

**Parameters:**

| Parameter          | Type                | Description                                    |
| ------------------ | ------------------- | ---------------------------------------------- |
| `paths`            | `readonly string[]` | File or directory paths                        |
| `options.includes` | `readonly string[]` | Include patterns (default: `**/*.probitas.ts`) |
| `options.excludes` | `readonly string[]` | Exclude patterns                               |

**Returns:** `Promise<string[]>` - Sorted array of absolute file paths.

**Requires:** `--allow-read` permission.

```typescript
import { discoverScenarioFiles } from "@probitas/discover";

// Discover from current directory
const files = await discoverScenarioFiles(["."]);

// Discover with custom patterns
const apiFiles = await discoverScenarioFiles(["./api"], {
  includes: ["**/*.test.ts"],
  excludes: ["**/fixtures/**"],
});

// Mix of files and directories
const mixed = await discoverScenarioFiles([
  "./auth.probitas.ts", // Direct file
  "./api/", // Directory to search
]);
```

## Default Patterns

| Type    | Default Pattern    |
| ------- | ------------------ |
| Include | `**/*.probitas.ts` |
| Exclude | (none)             |

## Best Practices

1. **Use specific paths** - Limit scope when running subsets of tests
2. **Configure in deno.json** - Set project-wide patterns for consistency
3. **Exclude generated files** - Add patterns for build output directories
4. **Use semantic naming** - The `.probitas.ts` suffix makes intent clear

## Related

- [Architecture](./architecture.md) - Overall design
- [Command Reference](../command.md) - Command-line usage
- [Guide](../guide.md) - Practical examples
