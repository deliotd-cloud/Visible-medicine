/** Latest-only UI work, bound to a committed viewer context. Not authorization. */
export function createLatestViewRequest() {
  let context: string | null = null;
  let pending: AbortController | null = null;
  function cancel() {
    const previous = pending;
    pending = null;
    previous?.abort();
  }
  return {
    setContext(next: string | null) {
      if (context === next) return;
      context = next;
      cancel();
    },
    cancel,
    begin(expected: string | null) {
      // An old async callback cannot start fresh work for a departed context.
      if (expected === null || context !== expected) return null;
      cancel();
      const controller = new AbortController();
      pending = controller;
      const isCurrent = () => pending === controller && context === expected && !controller.signal.aborted;
      return {
        signal: controller.signal,
        isCurrent,
        finish() {
          if (!isCurrent()) return false;
          pending = null;
          return true;
        },
      };
    },
  };
}
