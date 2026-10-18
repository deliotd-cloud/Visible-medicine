// Temporary loopback development diagnostics: launch the existing preview with
// VM_LOCAL_HEAD_DIAGNOSTICS=1 in that process only. No .env/client flag needed.
// "response-finished" means Node finished writing, NOT that a browser received,
// decoded or displayed a scan. No events claim patient-space synchronization.
export const HEAD_TRANSFER_TRACE_PREFIX = 'VM_HEAD_TRANSFER ';
export const HEAD_TRANSFER_TRACE_LIMIT = 128;
const phases = new Set(['start', 'manifest-verified', 'asset-read', 'asset-verified', 'refused', 'response-finished', 'response-closed-before-finish']);
const noop = () => {};

export function headTransferDiagnosticsEnabled(command, value) {
  return command === 'serve' && value === '1';
}

/** Local, bounded numeric events only. Never receives a path, hash, error or buffer. */
export function createHeadTransferDiagnostics({enabled = false, write, now = () => performance.now()} = {}) {
  let events = 0, requests = 0;
  const clock = () => { try { const value = now(); return Number.isFinite(value) ? value : 0; } catch { return 0; } };
  return kind => {
    if (enabled !== true || typeof write !== 'function' || events >= HEAD_TRANSFER_TRACE_LIMIT || !['manifest', 'asset'].includes(kind)) return noop;
    const request = ++requests, start = clock();
    let elapsed = 0;
    const trace = (phase, details = {}) => {
      if (!phases.has(phase) || events >= HEAD_TRANSFER_TRACE_LIMIT) return;
      try {
        elapsed = Math.max(elapsed, Math.min(86400000, Math.max(0, Math.round(clock() - start))));
        const record = {schema: 1, request, kind, phase, elapsedMs: elapsed};
        if (Number.isSafeInteger(details.bytes) && details.bytes >= 0 && details.bytes <= 536870912) record.bytes = details.bytes;
        if (details.status === 200 || details.status === 404) record.status = details.status;
        events++;
        write(HEAD_TRANSFER_TRACE_PREFIX + JSON.stringify(record));
      } catch { /* Diagnostic failures never replace a transport or integrity result. */ }
    };
    trace('start');
    return trace;
  };
}
