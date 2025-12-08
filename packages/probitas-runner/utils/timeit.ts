export type TimeitResult<T> = {
  status: "passed";
  value: T;
  duration: number;
} | {
  status: "failed";
  error: unknown;
  duration: number;
};

export async function timeit<T>(
  fn: () => T | Promise<T>,
): Promise<TimeitResult<T>> {
  const start = performance.now();
  try {
    const value = await fn();
    return {
      status: "passed",
      value,
      duration: performance.now() - start,
    };
  } catch (error: unknown) {
    return {
      status: "failed",
      error,
      duration: performance.now() - start,
    };
  }
}
