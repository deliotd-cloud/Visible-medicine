import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { readFile } from 'node:fs/promises';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';

const compiled = await build({
  stdin: {
    contents:
      "export * from './lib/body-review-material.ts'; export * from './lib/body-review-search.ts'; export * from './lib/body-review-response.ts'; export { GET } from './app/api/body-review/route.ts'; export { bodyLesson } from './app/body-content.ts';",
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
assert.equal(rows.length, 1024);
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
assert.equal(topics, 9216);
assert.equal(links, 1024);
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
  assert.equal((html.match(/<details/g) || []).length, 11);
  assert(!html.includes('<textarea'));
  assert(!html.includes('>Approve<'));
  renders++;
}
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
