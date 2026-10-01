import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { build } from './workspace-test-build.mjs';

// Bundle the actual workspace modules. Invented catalog entries or expected
// digests would make this trust-boundary regression test meaningless.
const compiled = await build({
  stdin: {
    contents: [
      "export { bodyReviewMaterial, bodyReviewSnapshot, bodyReviewSummaries } from './lib/body-review-material.ts';",
      "export { bodyReviewDisplayMatches } from './lib/body-review-display-integrity.ts';",
      "export { parseBodyReviewResponse } from './lib/body-review-response.ts';",
    ].join('\n'),
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});
const api = await import('data:text/javascript;base64,' +
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const wire = value => JSON.parse(JSON.stringify(value));
const canonical = value => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.keys(value).sort().map(key =>
      `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
};
const digest = value => createHash('sha256')
  .update(canonical(wire(value))).digest('hex');
const display = value => ({
  source: value.source,
  topics: value.topics,
  reasoning: value.reasoning,
  guidedTours: value.guidedTours,
  checklist: value.checklist,
  atlasLink: value.atlasLink,
  limits: value.limits,
});
const reverseKeys = value => Array.isArray(value) ? value.map(reverseKeys)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.entries(value).reverse().map(([key, item]) => [key, reverseKeys(item)]))
    : value;

test('all 1104 current worksheets preserve independently calculated material hashes and accept direct and JSON evidence', async () => {
  assert.equal(api.bodyReviewSummaries.length, 1104, 'Catalog coverage changed; review this test scope');
  const ids = api.bodyReviewSummaries.map(row => row.id);
  assert.equal(new Set(ids).size, ids.length, 'Review IDs must be unambiguous');
  for (const id of ids) {
    const packet = await api.bodyReviewMaterial(id);
    const expected = api.bodyReviewSnapshot(id);
    assert(packet && expected, `Missing current-build evidence for ${id}`);
    const scope = { schema: packet.schema, kind: packet.kind, structureId: id };
    const fingerprints = {
      source: digest({ scope: { ...scope, schema: 'vm-body-review-worksheet-1' }, source: expected.source }),
      teaching: digest({ scope: { ...scope, schema: 'vm-body-review-worksheet-2' },
        topics: expected.topics, reasoning: expected.reasoning,
        ...(expected.guidedTours.length ? { guidedTours: expected.guidedTours } : {}) }),
      checklist: digest({ scope: { ...scope, schema: 'vm-body-review-worksheet-2' },
        checks: expected.checklist }),
    };
    assert.deepEqual(packet.fingerprints, fingerprints, `${id}: review scopes changed`);
    assert.equal(packet.materialHash, digest({ scope, fingerprints }), `${id}: material hash changed`);
    assert.equal(await api.bodyReviewDisplayMatches(packet, id), true, `${id}: direct evidence`);
    assert.equal(await api.bodyReviewDisplayMatches(wire(packet), id), true, `${id}: JSON evidence`);
    assert.deepEqual(await api.parseBodyReviewResponse(packet, id), packet, `${id}: direct response`);
    const transported = wire(packet);
    assert.deepEqual(await api.parseBodyReviewResponse(transported, id), transported, `${id}: JSON response`);
  }
});

test('seven displayed evidence scopes reject valid-looking changes under unchanged revision pins', async () => {
  const packets = await Promise.all(api.bodyReviewSummaries.slice(0, 30)
    .map(row => api.bodyReviewMaterial(row.id)));
  const ordinary = packets.find(packet => packet?.topics.length && packet?.source?.structure?.name);
  const withReasoning = packets.find(packet => packet?.reasoning) ||
    await findPacket(packet => packet.reasoning);
  const withTour = packets.find(packet => packet?.guidedTours?.length) ||
    await findPacket(packet => packet.guidedTours.length);
  assert(ordinary && withReasoning && withTour, 'Real evidence must cover every scope');
  const cases = [
    ['source', ordinary, packet => { packet.source.structure.name += ' altered'; }],
    ['topics', ordinary, packet => { packet.topics[0].body += ' Altered teaching.'; }],
    ['reasoning', withReasoning, packet => { packet.reasoning.prompt += ' Altered question.'; }],
    ['guidedTours', withTour, packet => { packet.guidedTours[0].tour.steps[0].caption += ' Altered caption.'; }],
    ['checklist', ordinary, packet => { packet.checklist.teaching = []; }],
    ['atlasLink', ordinary, packet => { packet.atlasLink = '/regions/forearm?structure=foreign'; }],
    ['limits', ordinary, packet => { packet.limits = []; }],
  ];
  for (const [scope, original, mutate] of cases) {
    const altered = wire(original);
    mutate(altered);
    assert.equal(altered.materialHash, original.materialHash, `${scope}: revision pin stays claimed`);
    assert.equal(await api.bodyReviewDisplayMatches(altered, original.structureId), false, scope);
    assert.equal(await api.parseBodyReviewResponse(altered, original.structureId), null, scope);
  }
});

async function findPacket(predicate) {
  for (const row of api.bodyReviewSummaries) {
    const packet = await api.bodyReviewMaterial(row.id);
    if (packet && predicate(packet)) return packet;
  }
  return null;
}

test('unknown IDs, missing evidence and suppressed warnings fail closed', async () => {
  const packet = await api.bodyReviewMaterial(api.bodyReviewSummaries[0].id);
  assert(packet);
  for (const id of ['', 'unknown', 'x'.repeat(257)]) {
    assert.equal(api.bodyReviewSnapshot(id), null);
    assert.equal(await api.bodyReviewMaterial(id), null);
    assert.equal(await api.bodyReviewDisplayMatches(packet, id), false);
    assert.equal(await api.parseBodyReviewResponse(packet, id), null);
  }
  for (const field of ['source', 'topics', 'reasoning', 'guidedTours', 'checklist', 'atlasLink', 'limits']) {
    const altered = wire(packet);
    delete altered[field];
    assert.equal(await api.bodyReviewDisplayMatches(altered, packet.structureId), false, `missing ${field}`);
    assert.equal(await api.parseBodyReviewResponse(altered, packet.structureId), null, `missing ${field}`);
  }
  for (const field of ['geometry', 'teaching', 'imaging']) {
    const altered = wire(packet);
    altered.checklist[field] = [];
    assert.equal(await api.bodyReviewDisplayMatches(altered, packet.structureId), false, `suppressed ${field}`);
    assert.equal(await api.parseBodyReviewResponse(altered, packet.structureId), null, `suppressed ${field}`);
  }
});

test('JSON key order and transport omission of undefined do not change evidence', async () => {
  const packet = await api.bodyReviewMaterial(api.bodyReviewSummaries[0].id);
  assert(packet);
  const reordered = reverseKeys(wire(packet));
  assert.equal(await api.bodyReviewDisplayMatches(reordered, packet.structureId), true);
  assert.deepEqual(await api.parseBodyReviewResponse(reordered, packet.structureId), reordered);
  const withUndefined = wire(packet);
  withUndefined.topics[0].transportOmitted = undefined;
  withUndefined.source.transportOmitted = undefined;
  assert.equal(await api.bodyReviewDisplayMatches(withUndefined, packet.structureId), true);
  assert.deepEqual(await api.parseBodyReviewResponse(wire(withUndefined), packet.structureId), wire(packet));
  assert.equal(digest(display(withUndefined)), digest(display(packet)));
});

test('unframed tours accept absent optional frames but reject invented frames', async () => {
  const packet = await findPacket(p => p.guidedTours.some(e => e.stepFrames === undefined));
  assert(packet, 'Retained tour scope includes unframed tours');
  assert.equal(await api.bodyReviewDisplayMatches(packet, packet.structureId), true);
  assert.deepEqual(await api.parseBodyReviewResponse(packet, packet.structureId), packet);
  const altered = wire(packet);
  altered.guidedTours.find(e => e.stepFrames === undefined).stepFrames = [];
  assert.equal(await api.bodyReviewDisplayMatches(altered, packet.structureId), false);
  assert.equal(await api.parseBodyReviewResponse(altered, packet.structureId), null);
});

test('public response and digest APIs turn arbitrary input exceptions into rejection', async () => {
  const id = api.bodyReviewSummaries[0].id;
  const packet = await api.bodyReviewMaterial(id);
  assert(packet);
  const throwingGet = new Proxy(packet, { get() { throw Error('untrusted getter'); } });
  const throwingJSON = wire(packet);
  throwingJSON.source.toJSON = () => { throw Error('untrusted serializer'); };
  const circular = wire(packet);
  circular.source.circular = circular.source;
  for (const value of [throwingGet, throwingJSON, circular]) {
    assert.equal(await api.bodyReviewDisplayMatches(value, id), false);
    assert.equal(await api.parseBodyReviewResponse(value, id), null);
  }
});

test('missing or rejected native WebCrypto fails closed without a fallback', { concurrency: false }, async () => {
  const id = api.bodyReviewSummaries[0].id;
  const packet = await api.bodyReviewMaterial(id);
  assert(packet);
  const original = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  assert(original?.configurable, 'Test process must allow temporary crypto injection');
  try {
    for (const replacement of [undefined, {
      subtle: { async digest() { throw Error('native digest rejected'); } },
    }]) {
      Object.defineProperty(globalThis, 'crypto', {
        configurable: true, enumerable: original.enumerable,
        value: replacement, writable: true,
      });
      assert.equal(await api.bodyReviewDisplayMatches(packet, id), false);
      assert.equal(await api.parseBodyReviewResponse(packet, id), null);
    }
  } finally {
    Object.defineProperty(globalThis, 'crypto', original);
  }
});
