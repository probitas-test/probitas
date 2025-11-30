/**
 * Test helpers for command-level tests.
 */

type CaptureFn = (args: string[]) => void;

const defaultStatus: Deno.CommandStatus = {
  success: true,
  code: 0,
  signal: null,
};

/**
 * Stub `Deno.Command` and capture args passed to the constructor.
 *
 * Restores the original value on dispose.
 *
 * @param capture - Function invoked with the args passed to Deno.Command
 * @returns Disposable handle to restore the original Command
 */
export function stubDenoCommand(
  capture: CaptureFn,
  status: Deno.CommandStatus = defaultStatus,
): Disposable {
  const originalCommand = Deno.Command;

  class StubbedCommand {
    constructor(_cmd: string, options: Deno.CommandOptions) {
      capture(options.args ?? []);
    }

    spawn() {
      return {
        stdin: {
          getWriter: () => ({
            async write(_data: Uint8Array) {},
            async close() {},
          }),
        },
        status: Promise.resolve(status),
      };
    }
  }

  (Deno as { Command: typeof Deno.Command }).Command =
    StubbedCommand as unknown as typeof Deno.Command;

  return {
    [Symbol.dispose]() {
      (Deno as { Command: typeof Deno.Command }).Command = originalCommand;
    },
  };
}
