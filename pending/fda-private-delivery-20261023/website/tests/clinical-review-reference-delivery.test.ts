import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { handlePrivateReferenceDelivery } from '../lib/clinical-review-reference-delivery.ts';
import { privateReferenceBase, privateReferenceObjectKey, type PrivateReferenceRegistry } from '../lib/clinical-review-reference-registry.ts';

const encoder = new TextEncoder();
const sha = (data: Uint8Array) => createHash('sha256').update(data).digest('hex');
const catalogue = encoder.encode('{"review":"local"}');
const geometry = encoder.encode('glTF private reference geometry');
const registry: PrivateReferenceRegistry = {
  schema: 'visible-medicine.private-reference-assets/1',
  references: [{
    id: 'test-reference', revision: sha(catalogue), atlasRevision: 'a'.repeat(40), sourceCommit: 'b'.repeat(40),
    sourceFrame: 'unitless-normalized-source-assembly', deployment: 'local-only', clinicalApproval: false,
    files: [
      { path: 'models/test-reference/catalog.json', sha256: sha(catalogue), bytes: catalogue.length, contentType: 'application/json' },
      { path: 'models/test-reference/reference.glb', sha256: sha(geometry), bytes: geometry.length, contentType: 'model/gltf-binary' },
    ],
  }],
};
const reference = registry.references[0];
const catalogFile = reference.files[0];
const path = privateReferenceBase(reference) + '/' + catalogFile.path;
const url = 'http://127.0.0.1:8787' + path;
const key = privateReferenceObjectKey(catalogFile);

function store(options: { head?: Partial<{ key: string; size: number; sha256: string }>;
  get?: Partial<{ key: string; size: number; sha256: string }>; absent?: boolean } = {}) {
  const calls: string[] = [];
  let cancelled = false;
  const data = new Map([[key, catalogue], [privateReferenceObjectKey(reference.files[1]), geometry]]);
  function object(objectKey: string, value: Uint8Array, override: Partial<{ key: string; size: number; sha256: string }> = {}, slice = value): R2ObjectBody {
    const digest = override.sha256 ?? sha(value);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(slice); if (Object.keys(override).length === 0) controller.close(); },
      cancel() { cancelled = true; },
    });
    return {
      key: override.key ?? objectKey, version: 'fixture', size: override.size ?? value.length,
      etag: digest, httpEtag: `"${digest}"`, uploaded: new Date(0), storageClass: 'Standard',
      checksums: { sha256: Uint8Array.from(Buffer.from(digest, 'hex')).buffer, toJSON: () => ({ sha256: digest }) },
      writeHttpMetadata(_headers: Headers) {}, body: stream, get bodyUsed() { return stream.locked; },
      arrayBuffer: async () => slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength) as ArrayBuffer,
      bytes: async () => slice, text: async () => new TextDecoder().decode(slice),
      json: async <T>() => JSON.parse(new TextDecoder().decode(slice)) as T,
      blob: async () => new Blob([Uint8Array.from(slice)]),
    };
  }
  const bucket: Pick<R2Bucket, 'head' | 'get'> = {
    async head(objectKey) {
      calls.push('head:' + objectKey);
      const value = data.get(objectKey);
      return options.absent || !value ? null : object(objectKey, value, options.head);
    },
    async get(objectKey, getOptions?: R2GetOptions) {
      calls.push('get:' + objectKey);
      const value = data.get(objectKey);
      if (options.absent || !value) return null;
      const range = getOptions?.range;
      const slice = range && 'offset' in range && typeof range.offset === 'number' && typeof range.length === 'number'
        ? value.slice(range.offset, range.offset + range.length) : value;
      return object(objectKey, value, options.get, slice);
    },
  };
  return { bucket, calls, get cancelled() { return cancelled; } };
}
const allow = async () => {};
const send = (request: Request, fixture = store(), authorize = allow, input: unknown = registry) =>
  handlePrivateReferenceDelivery(request, input, fixture.bucket, authorize);

test('authorization is first for every request and revoked access never reaches R2', async () => {
  const fixture = store();
  const requests = [
    new Request(url), new Request(url, { method: 'HEAD' }),
    new Request(url, { method: 'POST' }),
    new Request(url, { headers: { Range: 'bytes=0-1', 'If-None-Match': `"${catalogFile.sha256}"` } }),
    new Request(url + '?duplicate=1'), new Request('https://foreign.example' + path),
  ];
  for (const request of requests) {
    const events: string[] = [];
    const response = await send(request, fixture, async () => { events.push('auth'); throw { status: 403 }; });
    assert.equal(response.status, 403);
    assert.deepEqual(events, ['auth']);
  }
  assert.deepEqual(fixture.calls, []);
  assert.equal((await send(new Request(url), fixture, async () => { throw Error('unknown'); })).status, 503);
  for (const status of [401, 409, 503])
    assert.equal((await send(new Request(url), fixture, async () => { throw { status }; })).status, status);
  assert.equal((await send(new Request(url), fixture)).status, 200);
  const callsBeforeRevocation = fixture.calls.length;
  assert.equal((await send(new Request(url), fixture, async () => { throw { status: 401 }; })).status, 401);
  assert.equal(fixture.calls.length, callsBeforeRevocation);
  assert.equal((await send(new Request(url), fixture, allow, { bad: true })).status, 503);
});

test('exact canonical local URL only; no foreign, raw, traversal or query aliases', async () => {
  const fixture = store();
  for (const host of ['127.0.0.1', 'localhost', '[::1]'])
    assert.equal((await send(new Request(`http://${host}:8787${path}`, { method: 'HEAD' }), fixture)).status, 200);
  for (const bad of [
    'https://example.org' + path, 'http://127.0.0.2' + path, 'http://localhost.evil.test' + path,
    url + '?x=1', url + '?x=1&x=2', url.replace('/catalog.json', '/%63atalog.json'),
    url.replace('/catalog.json', '/%2e%2e/catalog.json'),
    'http://localhost:8787/' + key, url.replace(reference.revision, '0'.repeat(64)),
    url.replace('/catalog.json', '/missing.json'),
  ]) assert.equal((await send(new Request(bad), fixture)).status, 404, bad);
  assert.equal((await send(new Request(url, { method: 'PUT' }), fixture)).status, 405);
  assert.equal(fixture.calls.every(call => call === 'head:' + key), true);
  assert.equal('put' in fixture.bucket, false);
});

test('GET streams exact key and MIME; HEAD and conditionals verify head without get', async () => {
  const fixture = store();
  const get = await send(new Request(url), fixture);
  assert.equal(get.status, 200);
  assert.equal(await get.text(), new TextDecoder().decode(catalogue));
  assert.equal(get.headers.get('content-type'), 'application/json');
  assert.equal(get.headers.get('etag'), `"${catalogFile.sha256}"`);
  assert.equal(get.headers.get('accept-ranges'), 'bytes');
  assert.equal(get.headers.get('cache-control'), 'private, no-store');
  assert.equal(get.headers.get('vary'), 'Cookie');
  assert.equal(get.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(get.headers.get('cross-origin-resource-policy'), 'same-origin');
  const head = await send(new Request(url, { method: 'HEAD' }), fixture);
  assert.equal(head.status, 200);
  assert.equal(head.body, null);
  assert.equal(head.headers.get('content-length'), String(catalogue.length));
  const conditional = await send(new Request(url, { headers: { 'If-None-Match': `W/"${catalogFile.sha256}"` } }), fixture);
  assert.equal(conditional.status, 304);
  assert.equal(conditional.headers.get('etag'), `"${catalogFile.sha256}"`);
  assert.equal(fixture.calls.filter(call => call.startsWith('get:')).length, 1);
  assert.deepEqual(fixture.calls, [`head:${key}`, `get:${key}`, `head:${key}`, `head:${key}`]);
});

test('single canonical ranges, suffix, 416 and If-Range mismatch', async () => {
  const fixture = store();
  const range = await send(new Request(url, { headers: { Range: 'bytes=1-3' } }), fixture);
  assert.equal(range.status, 206);
  assert.equal(await range.text(), new TextDecoder().decode(catalogue.slice(1, 4)));
  assert.equal(range.headers.get('content-range'), `bytes 1-3/${catalogue.length}`);
  const suffix = await send(new Request(url, { headers: { Range: 'bytes=-4' } }), fixture);
  assert.equal(suffix.status, 206);
  assert.equal(await suffix.text(), new TextDecoder().decode(catalogue.slice(-4)));
  for (const value of ['bytes=0-1,3-4', 'bytes=00-01', 'bytes=-0', 'bytes=999-', 'bytes=3-1']) {
    const response = await send(new Request(url, { headers: { Range: value } }), fixture);
    assert.equal(response.status, 416, value);
    assert.equal(response.headers.get('content-range'), `bytes */${catalogue.length}`);
  }
  const full = await send(new Request(url, { headers: { Range: 'bytes=1-3', 'If-Range': '"other"' } }), fixture);
  assert.equal(full.status, 200);
  assert.equal(await full.text(), new TextDecoder().decode(catalogue));
});

test('head and get key, size and checksum drift fail closed; invalid get body is cancelled', async () => {
  for (const field of ['key', 'size', 'sha256'] as const) {
    const wrong = field === 'size' ? 999 : field === 'key' ? 'foreign' : '0'.repeat(64);
    const headFixture = store({ head: { [field]: wrong } });
    assert.equal((await send(new Request(url), headFixture)).status, 503);
    assert.equal(headFixture.calls.filter(call => call.startsWith('get:')).length, 0);
    assert.equal((await send(new Request(url, { method: 'HEAD' }), headFixture)).status, 503);
    assert.equal((await send(new Request(url, { headers: { 'If-None-Match': `"${catalogFile.sha256}"` } }), headFixture)).status, 503);
    const getFixture = store({ get: { [field]: wrong } });
    assert.equal((await send(new Request(url), getFixture)).status, 503);
    assert.equal(getFixture.cancelled, true);
  }
  assert.equal((await send(new Request(url), store({ absent: true }))).status, 503);
});
