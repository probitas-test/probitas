---
paths: "**/*.ts"
---

# any vs unknown

This library is primarily used in tests, so we prioritize user ergonomics in
types that expose values to user code.

## Rules

1. **Values exposed to user code use `any`.**
   - Example: matcher callbacks like `toHave...Satisfying(matcher)` should use
     `(value: any) => void` so users can freely inspect and assert.
2. **Values received from user code use `unknown`.**
   - Example: `toHave...Equal(expected)` should take `expected: unknown` so the
     library validates and narrows safely.

## Examples

```ts
// Exposed value -> any
toHaveStatusSatisfying(matcher: (value: any) => void): this;

// User input -> unknown
toHaveStatusEqual(expected: unknown): this;
```
