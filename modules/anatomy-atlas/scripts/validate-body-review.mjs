import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { readFile } from 'node:fs/promises';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';

const compiled = await build({
  stdin: {
    contents:
      "export * from './lib/body-review-material.ts'; export * from './lib/body-review-search.ts'; export * from './lib/body-review-response.ts'; export { GET } from './app/api/body-review/route.ts'; export { bodyLesson } from './app/body-content.ts'; export {reasoningConceptFor} from './lib/reasoning-questions.ts';",
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});
const api = await import(
  'data:text/javascript;base64,' +
    Buffer.from(compiled.outputFiles[0].text).toString('base64')
);
const rows = api.bodyReviewSummaries;
// Current retained display scope (including subsequent admitted source parts).
// Every row still exercises exact source, topics and unsubmitted review state.
assert.equal(rows.length, 1104); // Includes FMA7041 and FMA76767 source groups, not individual mesh components.
assert.equal(new Set(rows.map((s) => s.id)).size, rows.length);
let links = 0,
  topics = 0;
const packets = [];
for (const row of rows) {
  const packet = await api.bodyReviewMaterial(row.id);
  assert(packet);
  assert.equal(packet.approval, false);
  assert.equal(packet.status, 'worksheet-not-submitted');
  assert.equal(packet.kind, 'body-display-catalog');
  assert.deepEqual(api.parseBodyReviewResponse(packet, row.id), packet);
  assert.equal(packet.source.structure.id, row.id);
  for (const lesson of packet.topics) {
    const { tab, ...copy } = lesson;
    assert.deepEqual(copy, api.bodyLesson(packet.source.structure, tab));
    topics++;
  }
  if (packet.atlasLink) {
    links++;
    const url = new URL(packet.atlasLink, 'https://atlas.invalid');
    assert.equal(url.origin, 'https://atlas.invalid');
    assert.equal(url.searchParams.get('structure'), row.id);
    assert.equal(url.searchParams.get('source'), packet.source.bundle.sha256);
  }
  packets.push(packet);
}
assert.equal(topics, 9936);
assert.equal(links, 1104);
const anteriorCardiac = packets.find(p => p.source.structure.fmaId === 'FMA76767');
assert(anteriorCardiac);
assert.equal(anteriorCardiac.structureId, 'vm:anatomy:body:thorax:unspecified:vessel:anterior-cardiac-vein');
assert.equal(anteriorCardiac.source.bundle.sha256, 'ff72014e957d661a16892581db9e371482541302e4a3203ba3e84cac9f5f1928');
assert.deepEqual(anteriorCardiac.source.structure.sources.map(s => s.file), ['FJ2725', 'FJ2730']);
assert.equal(new Set(packets.map((p) => p.materialHash)).size, rows.length);
const selected = packets.find((p) =>
  p.source.structure.regions.includes('forearm'),
);
assert.deepEqual(await api.bodyReviewMaterial(selected.structureId), selected);
const edited = structuredClone(selected);
edited.source.structure.name = 'Changed outside the atlas';
edited.topics[0].body = 'Changed outside the atlas';
assert.deepEqual(
  await api.bodyReviewMaterial(selected.structureId),
  selected,
  'Packet mutation cannot alter source or content',
);
for (const id of [
  '',
  'unknown',
  'x'.repeat(257),
  'vm:anatomy:body:thorax:right:organ:cavity-of-right-atrium',
])
  assert.equal(await api.bodyReviewMaterial(id), null);
// A few original pilot IDs are shared with root entries: scope and asset must
// remain the body representation, never the separate pilot review record.
const sharedShoulder = await api.bodyReviewMaterial(
  'vm:anatomy:upper-limb:shoulder:right:bone:scapula',
);
assert.equal(sharedShoulder.kind, 'body-display-catalog');
assert.equal(sharedShoulder.source.bundle.id, 'shoulder-arm-skeleton');
for (const region of api.bodyReviewRegions) {
  const queue = api.bodyReviewQueue(rows, region.id, 'all', '');
  assert.equal(
    queue.length,
    rows.filter((s) => s.regions.includes(region.id)).length,
  );
  assert(queue.every((s) => s.regions.includes(region.id)));
}
assert.equal(api.bodyReviewQueue(rows, 'bogus', 'all', '').length, 0);
assert.equal(api.bodyReviewQueue(rows, 'all', 'bogus', '').length, 0);
assert(
  api
    .bodyReviewQueue(rows, 'all', 'all', selected.source.structure.fmaId)
    .some((s) => s.id === selected.structureId),
);
for (const row of api.bodyReviewQueue(rows, 'all', 'skeleton', 'left'))
  assert.equal(row.system, 'skeleton');
for (const mutate of [
  (p) => {
    p.approval = true;
  },
  (p) => {
    p.status = 'approved';
  },
  (p) => {
    p.kind = 'shoulder-pilot';
  },
  (p) => {
    p.source.structure.id = 'wrong';
  },
  (p) => {
    p.topics.reverse();
  },
  (p) => {
    p.topics[0].body = null;
  },
  (p) => {
    p.topics[0].citations = [null];
  },
  (p) => {
    p.topics[0].readiness = 'approved';
  },
  (p) => {
    p.atlasLink = 'https://evil.invalid';
  },
  (p) => {
    p.atlasLink = '//evil.invalid';
  },
  (p) => {
    p.source.bundle.sha256 = 'bad';
  },
  (p) => {
    p.source.structure.sources.push(p.source.structure.sources[0]);
  },
  (p) => {
    p.checklist.geometry = null;
  },
  (p) => {
    p.limits = null;
  },
  // Well-typed changes must fail too: unchanged claimed hashes do not make
  // different clinical evidence part of the current-build worksheet.
  (p) => { p.topics[0].body += ' Altered teaching'; },
  (p) => { p.topics[0].citations = ['https://example.invalid/altered']; },
  (p) => { p.topics[0].correctAnswer = 'Altered answer'; },
  (p) => { p.topics[0].note = 'Altered scope'; },
  (p) => { p.source.structure.name += ' Altered identity'; },
  (p) => { p.source.bundle.sha256 = '0'.repeat(64); },
  (p) => { p.checklist.teaching = []; },
  (p) => { p.limits = []; },
  (p) => { p.atlasLink = '/regions/forearm?structure=foreign'; },
]) {
  const bad = structuredClone(selected);
  mutate(bad);
  assert.equal(api.parseBodyReviewResponse(bad, selected.structureId), null);
}
assert.equal(api.parseBodyReviewResponse(null, selected.structureId), null);
assert.equal(api.parseBodyReviewResponse(selected, 'foreign'), null);
const request = (query, authenticated = true) =>
  new Request(`https://atlas.invalid/api/body-review?${query}`, {
    headers: authenticated
      ? { 'oai-authenticated-user-id': 'worksheet-test-user' }
      : {},
  });
assert.equal((await api.GET(request('', false))).status, 401);
assert.equal((await api.GET(request(''))).status, 400);
assert.equal((await api.GET(request('structure=bad'))).status, 404);
assert.equal((await api.GET(request('structure=a&structure=b'))).status, 400);
const response = await api.GET(
  request(`structure=${encodeURIComponent(selected.structureId)}&download=1`),
);
assert.equal(response.status, 200);
assert.equal(response.headers.get('cache-control'), 'private, no-store');
assert.match(
  response.headers.get('content-disposition'),
  /^attachment; filename="visible-medicine-FMA\d+-review-worksheet.json"$/,
);
assert.deepEqual(await response.json(), selected);
const pancreas = packets.find((p) => p.source.structure.fmaId === 'FMA7198');
const correction = JSON.parse(
  await readFile('public/models/bodyparts3d/pancreas/display-correction.json'),
);
assert.deepEqual(pancreas.source.structure, correction.replacement);
assert.deepEqual(pancreas.source.bundle, correction.bundle);
assert(
  packets.every(
    (p) =>
      p.reviewerNotes.reviewer === '' && p.reviewerNotes.evidence.length === 0,
  ),
);

const component = await componentBuild({
  entryPoints: ['app/review/body/review-dashboard.tsx'],
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
});
const require = createRequire(import.meta.url),
  module = { exports: {} };
const actualLink = await import('vinext/shims/link');
const actualImage = await import('vinext/shims/image');
runInNewContext(component.outputFiles[0].text, {
  module,
  exports: module.exports,
  require: (name) =>
    name === 'next/link'
      ? { __esModule: true, ...actualLink }
      : name === 'next/image'
        ? { __esModule: true, ...actualImage }
        : require(name),
  console,
  URL,
  URLSearchParams,
  TextEncoder,
  AbortController,
  process: { env: { NODE_ENV: 'test' } },
});
const React = require('react'),
  render = require('react-dom/server').renderToStaticMarkup;
let renders = 0;
for (const packet of [
  selected,
  pancreas,
  packets.find((p) => p.source.structure.regions.includes('spine')),
]) {
  const html = render(
    React.createElement(module.exports.BodyReviewDetails, { material: packet }),
  );
  assert(html.includes('Download review worksheet'));
  assert(html.includes('not clinical approval'));
  assert.equal((html.match(/<details/g) || []).length, 12 + (packet.reasoning ? 1 + packet.reasoning.choices.length : 0));
  assert(!html.includes('<textarea'));
  assert(!html.includes('>Approve<'));
  renders++;
}
const reasoningPackets = packets.filter(p=>p.reasoning);
// Derive exact eligible source IDs from the authored binding registry, separately
// from the review/practice packet generation. The old 268 predates bone questions.
const expectedReasoningIds = packets.filter(p => api.reasoningConceptFor(p.source.structure)).map(p => p.structureId).sort();
assert(expectedReasoningIds.length > 0);
assert.deepEqual(reasoningPackets.map(p => p.structureId).sort(), expectedReasoningIds);
for (const packet of reasoningPackets) {
  const concept = api.reasoningConceptFor(packet.source.structure);
  assert(concept);
  for (const key of ['key', 'revision', 'readiness', 'prompt', 'explanation', 'references'])
    assert.deepEqual(packet.reasoning[key], concept[key], packet.structureId + ': reasoning ' + key);
  assert.equal(packet.reasoning.answerId, packet.structureId);
  assert.equal(packet.reasoning.choices.filter(choice => choice.id === packet.structureId).length, 1);
  assert.equal(new Set(packet.reasoning.choices.map(choice => choice.id)).size, packet.reasoning.choices.length);
  for (const choice of packet.reasoning.choices) assert(rows.some(row => row.id === choice.id), 'Choice is an exact admitted source ID');
  const html=render(React.createElement(module.exports.BodyReviewDetails,{material:packet}));
  assert(html.includes('Interactive reasoning'));
  assert(html.includes('Correct answer'));
  for(const choice of packet.reasoning.choices) assert(html.includes(choice.bundleSha256));
  for(const reference of packet.reasoning.references) assert(html.includes(reference.url.replaceAll('&','&amp;')));
  assert(!html.includes('>Approve<'));
  renders++;
}
// The reviewer must see authored answer evidence, not just learner-facing choices.
const vascularPins = JSON.parse(await readFile('content/foot-vascular-quiz-pins.json', 'utf8'));
for (const {identity} of vascularPins.entries) {
  const packet = packets.find(p => p.structureId === identity.id);
  assert(packet);
  const quiz = packet.topics.find(t => t.tab === 'quiz');
  assert.equal(quiz.readiness, 'draft');
  const html = render(React.createElement(module.exports.BodyReviewDetails, {material: packet}));
  assert(html.includes('Draft answer key:</strong> ' + quiz.correctAnswer));
  assert(html.includes('Draft explanation:</strong> ' + quiz.explanation));
  assert(!html.includes('>Approve<'));
  renders++;
}
const unkeyed = packets.find(p => p.topics.every(t => !t.correctAnswer && !t.explanation));
assert(unkeyed);
const unkeyedHtml = render(React.createElement(module.exports.BodyReviewDetails, {material: unkeyed}));
assert(!unkeyedHtml.includes('Draft answer key:'));
assert(!unkeyedHtml.includes('Draft explanation:'));
renders++;
for (const region of ['shoulder-arm', 'forearm', 'thigh']) {
  const html = render(
    React.createElement(module.exports.BodyReviewDashboard, {
      rows,
      regions: api.bodyReviewRegions,
      initialId: null,
      initialRegion: region,
    }),
  );
  assert(html.includes('private, versioned corrections and review records'));
  assert(html.includes('Choose a structure'));
  assert(html.includes('Review queue pages'));
  renders++;
}
console.log(
  JSON.stringify({
    bodySelections: rows.length,
    sourceBoundLinks: links,
    unchangedTopicSnapshots: topics,
    renderedStates: renders,
    readonly: true,
    approval: false,
  }),
);
