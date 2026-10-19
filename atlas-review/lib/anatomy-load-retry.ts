/** Restrict retries to failed bundles in the currently requested scope. */
export function anatomyRetryPlan<T extends { id: string; url: string }>(
  bundles: T[],
  failed: string[],
  required: string[],
) {
  const failedIds = new Set(failed),
    requiredIds = new Set(required);
  return bundles.filter((b) => failedIds.has(b.id) && requiredIds.has(b.id));
}
