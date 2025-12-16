import { fromFileUrl } from "@std/path/from-file-url";

const STACK_FRAME_REGEX = /^\s*at\s+(?:(.+?)\s+\()?(.+?):(\d+)(?::(\d+))?\)?$/;

export interface StackFrame {
  readonly context: string;
  readonly path: string;
  readonly line?: number;
  readonly column?: number;
  readonly user?: boolean;
}

export function captureStack(): StackFrame[] {
  const err = new Error();
  if (!err.stack) {
    return [];
  }
  return parseStack(err.stack);
}

export function parseStack(stack: string): StackFrame[] {
  return stack.split("\n")
    .map(parseStackFrame)
    .filter((v) => !!v);
}

function parseStackFrame(stackFrame: string): StackFrame | null {
  const m = STACK_FRAME_REGEX.exec(stackFrame);
  if (!m) {
    return null;
  }

  const context = m[1] || "<anonymous>";
  const path = parsePath(m[2]);
  const line = m[3] ? parseInt(m[3], 10) : undefined;
  const column = m[4] ? parseInt(m[4], 10) : undefined;
  const user = isUserFrame(path);

  return {
    context,
    path,
    line,
    column,
    user,
  };
}

function parsePath(path: string): string {
  if (!isUserFrame(path)) {
    return path;
  }
  return path.startsWith("file://") ? fromFileUrl(path) : path;
}

function isUserFrame(path: string): boolean {
  const prefixes = [
    "ext:",
    "deno:",
    "node:",
    "npm:",
    "bun:",
    "cloudflare:",
    "http://",
    "https://",
  ];
  if (prefixes.some((prefix) => path.startsWith(prefix))) {
    return false;
  }
  return true;
}
