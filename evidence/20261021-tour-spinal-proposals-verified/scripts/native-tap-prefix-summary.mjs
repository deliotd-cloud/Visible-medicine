// Local metadata only: root native TAP results, never assertion payloads.
import assert from 'node:assert/strict';

export function summarizeTapPrefix(text) {
  assert.equal(typeof text, 'string');
  const lines = text.split(/\r?\n/), results = [];
  let pending;
  for (const line of lines) {
    const start = /^(not ok|ok) ([1-9]\d*) - (.*)$/.exec(line);
    if (start) {
      pending = { number: Number(start[2]), outcome: start[1] === 'ok' ? 'ok-marker' : 'failure-marker',
        title: start[3], durationMs: null, file: null, line: null, complete: false };
      results.push(pending);
    } else if (pending && line === '  ...') {
      pending.complete = true;
      pending = undefined;
    } else if (pending) {
      const duration = /^  duration_ms: (\d+(?:\.\d+)?)$/.exec(line);
      const location = /^  location: ['"](.+?):(\d+):\d+['"]$/.exec(line);
      if (duration) pending.durationMs = Number(duration[1]);
      if (location) {
        const normalized = location[1].replaceAll('\\', '/').replace(/\/{2,}/g, '/');
        const candidate = normalized.match(/\/website\/(tests\/[a-zA-Z0-9_./-]+)$/)?.[1];
        const relative = candidate?.split('/').every(part => part && part !== '.' && part !== '..') ? candidate : null;
        // Only known test-relative paths, never arbitrary local filenames.
        pending.file = relative ?? null;
        pending.line = relative ? Number(location[2]) : null;
      }
    }
  }
  const complete = results.filter(row => row.complete);
  return {
    rootResultMarkers: results.length,
    completedRootDiagnostics: complete.length,
    incompleteRootDiagnostics: results.length - complete.length,
    failureMarkers: results.filter(row => row.outcome === 'failure-marker').length,
    failures: results.filter(row => row.outcome === 'failure-marker'),
    longestCompletedCases: complete.filter(row => row.durationMs !== null)
      .sort((a, b) => b.durationMs - a.durationMs).slice(0, 12),
    terminalCounts: null,
    fullSuitePassingClaim: false,
    limitation: 'A prefix is not a terminal receipt, completed-file progress, an estimate of work remaining, or product/clinical acceptance. Durations are case wall times, not profiles or additive suite wall time. No assertion values are retained.',
  };
}
