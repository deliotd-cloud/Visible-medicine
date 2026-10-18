// Development-only opt-in. Request contexts and Cloudflare bindings are not
// modified; a fresh process replaces hot reload during large Atlas handoffs.
export function localPreviewServerOptions({ command, stable, seatbelt = false }) {
  if (command !== 'serve') return undefined;
  if (stable !== undefined && !['', '0', '1'].includes(stable)) {
    throw new Error('VM_LOCAL_PREVIEW_STABLE must be 0 or 1');
  }
  if (stable === '1') {
    return { host: '127.0.0.1', strictPort: true, watch: null, hmr: false };
  }
  return seatbelt ? { watch: { useFsEvents: false, usePolling: true } } : undefined;
}
