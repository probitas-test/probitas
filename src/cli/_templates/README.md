# Worker Templates

Worker-side logic for `probitas run` and `probitas list`. The CLI re-spawns
itself as `__worker <run|list>` (see `../_worker.ts`), which imports the
matching module here.

## Files

| File               | Description                                      |
| ------------------ | ------------------------------------------------ |
| `run.ts`           | Worker for `probitas run`                        |
| `list.ts`          | Worker for `probitas list`                       |
| `run_protocol.ts`  | Protocol types for run communication             |
| `list_protocol.ts` | Protocol types for list communication            |
| `utils.ts`         | Shared utilities (TCP-based IPC)                 |
| `frame.ts`         | Length-prefixed CBOR framing used over that link |
| `serializer.ts`    | CBOR encoding of values CBOR cannot represent    |

## Rules

- **Parent/worker boundary**: everything crossing the IPC link goes through
  `frame.ts`, so values survive serialization (errors, symbols, cycles, ...)
- **No user output on the link**: user code may write to stdout/stderr freely;
  results travel only over TCP
