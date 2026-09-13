import type { AtlasStoredModel } from './atlas-model-storage';

// Browser-side, bounded GET verification; no storage credentials or runtime imports.
export async function verifyAtlasModelDownload(response: Response, model: Pick<AtlasStoredModel, 'sha256' | 'bytes'>, signal?: AbortSignal) {
  const length = response.headers.get('content-length') ?? '';
  if (!Number.isSafeInteger(model.bytes) || model.bytes < 12 || model.bytes > 32 * 1024 * 1024 || !/^[a-f0-9]{64}$/.test(model.sha256)
    || response.status !== 200 || response.redirected || !response.body
    || response.headers.get('content-type')?.split(';')[0].trim() !== 'model/gltf-binary'
    || !/^\d+$/.test(length) || Number(length) !== model.bytes
    || response.headers.get('etag') !== `"${model.sha256}"`) {
    await response.body?.cancel();
    throw new Error('Download does not identify the complete registered model.');
  }
  if (signal?.aborted) { await response.body.cancel(); throw new Error('Download verification cancelled.'); }
  const reader = response.body.getReader();
  const cancel = () => { void reader.cancel().catch(() => undefined); };
  signal?.addEventListener('abort', cancel, { once: true });
  const bytes = new Uint8Array(model.bytes);
  let offset = 0;
  try {
    while (true) {
      if (signal?.aborted) throw new Error('Download verification cancelled.');
      const { value, done } = await reader.read();
      if (signal?.aborted) throw new Error('Download verification cancelled.');
      if (done) break;
      if (value.byteLength > bytes.length - offset) throw new Error('Downloaded model exceeds its registered size.');
      bytes.set(value, offset); offset += value.byteLength;
    }
    if (offset !== model.bytes) throw new Error('Downloaded model is incomplete.');
    const header = new DataView(bytes.buffer);
    if (header.getUint32(0, true) !== 0x46546c67 || header.getUint32(4, true) !== 2 || header.getUint32(8, true) !== model.bytes) throw new Error('Downloaded model has an invalid GLB header.');
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const sha256 = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    if (signal?.aborted) throw new Error('Download verification cancelled.');
    if (sha256 !== model.sha256) throw new Error('Downloaded model fingerprint does not match this release.');
    return { sha256, bytes: offset };
  } catch (error) { await reader.cancel().catch(() => undefined); throw error; }
  finally { signal?.removeEventListener('abort', cancel); reader.releaseLock(); }
}
