import type { AtlasStoredModel } from './atlas-model-storage';
import { verifyAtlasModelDownload } from './atlas-model-download.ts';

/** Staff diagnostic of the actual model URL, not the staging endpoint.
 * Read-only, sequential and cancellable; no identity or approval is supplied. */
export async function verifyAtlasDelivery(model: AtlasStoredModel, signal: AbortSignal, request = fetch) {
  if (!model.paths.length || new Set(model.paths).size !== model.paths.length) throw new Error('Atlas delivery paths are missing or repeated.');
  for (const path of model.paths) {
    if (signal.aborted) throw new Error('Atlas delivery check cancelled.');
    await verifyAtlasDeliveryPath(model, path, signal, request);
  }
  return { sha256: model.sha256, bytes: model.bytes, checks: `${model.paths.length} URL(s): HEAD 200; full GET SHA-256; range 206; conditional 304` };
}

async function verifyAtlasDeliveryPath(model: AtlasStoredModel, path: string, signal: AbortSignal, request: typeof fetch) {
  const url = `${path}?v=${model.sha256}`;
  const read = async (method: string, headers?: Record<string, string>) => {
    const response = await request(url, { method, headers, credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal });
    if (response.headers.get('x-atlas-delivery') !== 'registered-storage-v1'
      || !response.headers.get('cache-control')?.includes('no-store')) {
      await response.body?.cancel();
      throw new Error(`Atlas delivery is not the protected storage route (HTTP ${response.status}).`);
    }
    return response;
  };
  const head = await read('HEAD');
  if (head.status !== 200 || head.headers.get('etag')?.replace(/^W\//, '') !== `"${model.sha256}"`) throw new Error(`Atlas HEAD check failed (${head.status}).`);
  const full = await read('GET');
  await verifyAtlasModelDownload(full, model, signal);
  const range = await read('GET', { Range: 'bytes=0-11' });
  if (range.status !== 206 || range.headers.get('content-range') !== `bytes 0-11/${model.bytes}` || !range.body) {
    await range.body?.cancel(); throw new Error(`Atlas range check failed (${range.status}).`);
  }
  const reader = range.body.getReader(), prefix = new Uint8Array(12);
  let length = 0;
  const cancel = () => { void reader.cancel().catch(() => undefined); };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    while (true) {
      if (signal.aborted) throw new Error('Atlas delivery check cancelled.');
      const { done, value } = await reader.read();
      if (signal.aborted) throw new Error('Atlas delivery check cancelled.');
      if (done) break;
      if (value.length > 12 - length) throw new Error('Atlas range exceeded twelve bytes.');
      prefix.set(value, length); length += value.length;
    }
    const view = new DataView(prefix.buffer);
    if (length !== 12 || view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2 || view.getUint32(8, true) !== model.bytes) throw new Error('Atlas range did not match the GLB header.');
  } catch (error) { await reader.cancel().catch(() => undefined); throw error; }
  finally { signal.removeEventListener('abort', cancel); reader.releaseLock(); }
  const conditional = await read('GET', { 'If-None-Match': `"${model.sha256}"` });
  if (conditional.status !== 304) { await conditional.body?.cancel(); throw new Error(`Atlas conditional check failed (${conditional.status}).`); }
}
