import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { build } from 'esbuild';

const bundled = await build({
  stdin: {
    contents: [
      "export { bodyReviewMaterial, bodyReviewSnapshot, bodyReviewSummaries } from './atlas-review/lib/body-review-material';",
      "export { parseBodyReviewResponse } from './atlas-review/lib/body-review-response';",
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
  Buffer.from(bundled.outputFiles[0].text).toString('base64'));
const pins = JSON.parse(readFileSync('atlas-review/content/body-review-display-pins.json', 'utf8'));
const fields = ['source', 'topics', 'reasoning', 'guidedTours', 'checklist', 'atlasLink', 'limits'];
const wire = (value: any): any => JSON.parse(JSON.stringify(value));
const canonical = (value: any): string => Array.isArray(value)
  ? `[${value.map(canonical).join(',')}]`
  : value && typeof value === 'object'
    ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
    : JSON.stringify(value);
const digest = (value: any): string => createHash('sha256')
  .update(canonical(wire(value))).digest('hex');
const reversed = (value: any): any => Array.isArray(value) ? value.map(reversed)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.entries(value).reverse().map(([key, item]) => [key, reversed(item)]))
    : value;

test('integrated Clinical Review binds all displayed evidence to current source pins', { timeout: 120000 }, async () => {
  assert.equal(api.bodyReviewSummaries.length, 1104, 'Review catalog coverage changed');
  assert.deepEqual(pins.evidenceFields, fields);
  assert.equal(pins.algorithm, 'SHA-256');
  assert.equal(pins.scope, 'body-display-catalog');
  assert.equal(pins.pins.length, api.bodyReviewSummaries.length);
  const byId = new Map(pins.pins.map((pin: any) => [pin.structureId, pin.sha256]));
  assert.equal(byId.size, pins.pins.length, 'Display pin IDs must be unique');

  let ordinary: any, withReference: any, withAnswer: any, withReasoning: any, withTour: any;
  for (const row of api.bodyReviewSummaries) {
    const id = row.id;
    const packet = await api.bodyReviewMaterial(id);
    const snapshot = api.bodyReviewSnapshot(id);
    assert(packet && snapshot, `${id}: current-build review evidence`);
    const scope = { schema: packet.schema, kind: packet.kind, structureId: id };
    const earlier = { ...scope, schema: 'vm-body-review-worksheet-2' };
    const fingerprints = {
      source: digest({ scope: { ...scope, schema: 'vm-body-review-worksheet-1' }, source: snapshot.source }),
      teaching: digest({ scope: earlier, topics: snapshot.topics, reasoning: snapshot.reasoning,
        ...(snapshot.guidedTours.length ? { guidedTours: snapshot.guidedTours } : {}) }),
      checklist: digest({ scope: earlier, checks: snapshot.checklist }),
    };
    assert.deepEqual(packet.fingerprints, fingerprints, `${id}: original fingerprint domains`);
    assert.equal(packet.materialHash, digest({ scope, fingerprints }), `${id}: material hash`);
    const evidence = Object.fromEntries(fields.map(field => [field, snapshot[field]]));
    const preimage = { schema: pins.schema, kind: 'body-display-catalog', structureId: id, evidence };
    assert.equal(byId.get(id), digest(preimage), `${id}: independent display pin`);
    assert.deepEqual(await api.parseBodyReviewResponse(wire(packet), id), wire(packet), `${id}: valid JSON packet`);
    ordinary ??= packet;
    if (!withReference && packet.topics.some((topic: any) => topic.citations?.length)) withReference = packet;
    if (!withAnswer && packet.topics.some((topic: any) => topic.correctAnswer)) withAnswer = packet;
    if (!withReasoning && packet.reasoning) withReasoning = packet;
    if (!withTour && packet.guidedTours.length) withTour = packet;
  }
  assert(ordinary && withReference && withAnswer && withReasoning && withTour,
    'Current catalog must supply every displayed evidence sample');

  const changes: [string, any, (packet: any) => void][] = [
    ['prose', ordinary, packet => { packet.topics[0].body += ' Altered teaching.'; }],
    ['reference', withReference, packet => { packet.topics.find((t: any) => t.citations?.length).citations[0] += '?altered=1'; }],
    ['answer', withAnswer, packet => { packet.topics.find((t: any) => t.correctAnswer).correctAnswer += ' altered'; }],
    ['reasoning', withReasoning, packet => { packet.reasoning.explanation += ' Altered explanation.'; }],
    ['checklist', ordinary, packet => { packet.checklist.teaching[0] += ' Altered check.'; }],
    ['limits', ordinary, packet => { packet.limits[0] += ' Altered limit.'; }],
    ['tour evidence', withTour, packet => { packet.guidedTours[0].tour.steps[0].caption += ' Altered caption.'; }],
  ];
  for (const [name, original, change] of changes) {
    const altered = wire(original);
    change(altered);
    assert.equal(altered.materialHash, original.materialHash, `${name}: original revision claim`);
    assert.equal(await api.parseBodyReviewResponse(altered, original.structureId), null, name);
  }

  const reordered = reversed(wire(ordinary));
  assert.deepEqual(await api.parseBodyReviewResponse(reordered, ordinary.structureId), reordered,
    'JSON object key order is immaterial');

  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  assert(descriptor?.configurable, 'Test runtime must allow temporary crypto replacement');
  try {
    Object.defineProperty(globalThis, 'crypto', { configurable: true, value: undefined });
    assert.equal(await api.parseBodyReviewResponse(wire(ordinary), ordinary.structureId), null,
      'Missing native crypto denies review evidence');
  } finally {
    Object.defineProperty(globalThis, 'crypto', descriptor);
  }
});
