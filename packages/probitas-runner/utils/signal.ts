export function mergeSignals(
  ...signals: (AbortSignal | undefined)[]
): AbortSignal {
  const availableSignals = signals.filter((v) => v !== undefined);
  return AbortSignal.any(availableSignals);
}

export function createScopedSignal(): AbortSignal & Disposable {
  const controller = new AbortController();
  const signal = controller.signal;
  return Object.assign(signal, {
    [Symbol.dispose]: () => {
      controller.abort();
    },
  });
}
