import {EDUCATION_MEDIA_OBJECT_LIMIT, type EducationMediaDependencies} from './education-media-delivery.ts';

const EDUCATION_KEY = /^education-media\/[A-Za-z0-9][A-Za-z0-9/_-]{0,399}$/;

/** Server-only storage dependency, NOT an endpoint or authorization decision.
 * Invoke through readEducationMediaObject, which checks the frozen assessment,
 * independent case entitlement, clearance and actual byte hash before release.
 * No environment/bucket is selected here and no read makes mediaReady true.
 * API: https://developers.cloudflare.com/r2/api/workers/workers-api-reference/
 */
export function createEducationMediaObjectReader(bucket: Pick<R2Bucket, 'get'>): EducationMediaDependencies['readObject'] {
  return async (key, maximumBytes) => {
    if (typeof key !== 'string' || !EDUCATION_KEY.test(key) || key.includes('//') ||
        !Number.isSafeInteger(maximumBytes) || maximumBytes < 1 || maximumBytes > EDUCATION_MEDIA_OBJECT_LIMIT) return null;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    let body: ReadableStream | undefined;
    let complete = false;
    try {
      const object = await bucket.get(key);
      if (!object) return null;
      body = 'body' in object ? object.body : undefined;
      const size = object.size;
      if (object.key !== key || !Number.isSafeInteger(size) || size < 1 || size > maximumBytes ||
          object.range != null || !body || object.bodyUsed !== false) return null;
      // Own one declared, bounded buffer. Never call arrayBuffer/text/json on
      // an unbounded provider object or accumulate arbitrary chunks in a list.
      const bytes = new Uint8Array(size);
      reader = body.getReader();
      let offset = 0;
      for (;;) {
        const chunk = await reader.read();
        if (chunk.done) {
          if (offset !== size) return null;
          complete = true;
          return bytes;
        }
        // Empty chunks cannot progress this fixed object protocol; refusing them
        // also prevents an unbounded zero-byte loop from an invalid provider.
        if (!(chunk.value instanceof Uint8Array) || chunk.value.byteLength === 0 || chunk.value.byteLength > size - offset) return null;
        bytes.set(chunk.value, offset);
        offset += chunk.value.byteLength;
      }
    } catch {
      // No key, source metadata, provider exception or partial bytes may escape.
      return null;
    } finally {
      if (!complete) {
        try {
          if (reader) await reader.cancel();
          else if (body) await body.cancel();
        } catch { /* A locked/failed provider still yields no bytes. */ }
      }
      try { reader?.releaseLock(); } catch { /* No partial result on cleanup failure. */ }
    }
  };
}
