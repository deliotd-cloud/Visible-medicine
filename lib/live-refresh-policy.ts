const BASE_REFRESH_MS = 3_000;
const MAX_REFRESH_MS = 15_000;
const MAX_JITTER_MS = 750;

export function liveRefreshDelay(
  consecutiveFailures: number,
  jitterSample = Math.random(),
) {
  const failures = Math.max(0, Math.min(3, Math.floor(consecutiveFailures)));
  const base = Math.min(MAX_REFRESH_MS, BASE_REFRESH_MS * 2 ** failures);
  const normalizedJitter = Math.max(0, Math.min(1, jitterSample));
  return Math.round(base + normalizedJitter * MAX_JITTER_MS);
}
