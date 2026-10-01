import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { build } from './workspace-test-build.mjs';

const compiled = await build({
  stdin: {
    contents: "export * from './lib/body-review-material.ts'; export * from './lib/body-review-response.ts';",
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const api = await import('data:text/javascript;base64,' +
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const packets = await Promise.all(api.bodyReviewSummaries.map(s => api.bodyReviewMaterial(s.id)));
const wire = value => JSON.parse(JSON.stringify(value));
let mutations = 0;
function rejected(packet, mutate) {
  const altered = wire(packet);
  mutate(altered);
  assert.equal(altered.materialHash, packet.materialHash, 'Attack leaves the claimed revision unchanged');
  assert.equal(api.parseBodyReviewResponse(altered, altered.structureId), null, packet.structureId);
  mutations++;
}

test('all current worksheets and JSON transport remain accepted; snapshots are detached', () => {
  const digest = createHash('sha256');
  for (const packet of packets) {
    assert(packet);
    assert.deepEqual(api.parseBodyReviewResponse(packet, packet.structureId), packet);
    const transported = wire(packet);
    assert.deepEqual(api.parseBodyReviewResponse(transported, packet.structureId), transported);
    const snapshot = api.bodyReviewSnapshot(packet.structureId);
    snapshot.source.structure.name = 'Do not retain';
    snapshot.topics[0].body = 'Do not retain';
    snapshot.checklist.teaching.push('Do not retain');
    snapshot.limits.length = 0;
    assert.deepEqual(api.bodyReviewSnapshot(packet.structureId).source, packet.source);
    assert.deepEqual(api.bodyReviewSnapshot(packet.structureId).topics, packet.topics);
    digest.update(JSON.stringify(packet));
  }
  const sha256 = digest.digest('hex');
  // Optional migration check against a pre-edit capture; future teaching changes
  // need not keep this old digest or rewrite a permanent content fixture.
  if (process.env.VM_REVIEW_BASELINE_SHA256)
    assert.equal(sha256, process.env.VM_REVIEW_BASELINE_SHA256);
  console.log(JSON.stringify({ worksheets: packets.length, topics: packets.length * 9, allPacketsSha256: sha256 }));
});

test('every displayed topic rejects altered valid-looking prose under unchanged hashes', () => {
  for (const packet of packets)
    for (let i = 0; i < packet.topics.length; i++)
      rejected(packet, p => { p.topics[i].body += ' Altered teaching.'; });
});

test('all topic fields and omitted/extra fields are pinned, not merely their types', () => {
  const packet = packets.find(p => p.topics.some(t => t.correctAnswer && t.explanation));
  assert(packet);
  for (let i = 0; i < packet.topics.length; i++) {
    for (const [field, value] of Object.entries({
      title: 'Altered title', bullets: ['Altered bullet'],
      citations: ['https://example.invalid/altered'], correctAnswer: 'Altered answer',
      explanation: 'Altered explanation', note: 'Altered limitation',
      readiness: packet.topics[i].readiness === 'draft' ? 'pending' : 'draft',
    })) rejected(packet, p => { p.topics[i][field] = value; });
    rejected(packet, p => { p.topics[i].undeclaredEvidence = 'Extra'; });
    rejected(packet, p => { delete p.topics[i].body; });
  }
  const reordered = wire(packet);
  reordered.topics = reordered.topics.map(t => Object.fromEntries(Object.entries(t).reverse()));
  assert.deepEqual(api.parseBodyReviewResponse(reordered, reordered.structureId), reordered,
    'JSON property order is not evidence');
});

test('source, scope, links, checklists and limits cannot be substituted or suppressed', () => {
  for (const packet of packets) {
    rejected(packet, p => { p.source.structure.name += ' Altered'; });
    rejected(packet, p => { p.source.bundle.sha256 = '0'.repeat(64); });
    rejected(packet, p => { p.source.sourceVersion += ' Altered'; });
    rejected(packet, p => { p.checklist.teaching = []; });
    rejected(packet, p => { p.limits = []; });
    rejected(packet, p => { p.atlasLink = '/regions/forearm?structure=foreign'; });
  }
  const packet = packets[0];
  rejected(packet, p => {
    p.structureId = p.source.structure.id = 'vm:anatomy:body:forearm:right:bone:unknown';
  });
  assert.equal(api.parseBodyReviewResponse(packet, 'foreign'), null);
  for (const id of ['', 'unknown', 'x'.repeat(257)]) assert.equal(api.bodyReviewSnapshot(id), null);
});

test('interactive reasoning and entire guided-tour evidence remain exact', () => {
  const reasoning = packets.filter(p => p.reasoning);
  assert(reasoning.length);
  for (const packet of reasoning) {
    rejected(packet, p => { p.reasoning.prompt += ' Altered'; });
    rejected(packet, p => { p.reasoning.explanation += ' Altered'; });
    rejected(packet, p => { p.reasoning.references[0].url = 'https://example.invalid/altered'; });
    rejected(packet, p => { p.reasoning = null; });
  }
  const tours = packets.filter(p => p.guidedTours.length);
  assert(tours.length);
  for (const packet of tours) {
    rejected(packet, p => { p.guidedTours[0].tour.steps[0].caption += ' Altered'; });
    rejected(packet, p => { p.guidedTours = []; });
  }
  console.log(JSON.stringify({ rejectedUnchangedRevisionMutations: mutations,
    reasoningWorksheets: reasoning.length, tourWorksheets: tours.length }));
});
