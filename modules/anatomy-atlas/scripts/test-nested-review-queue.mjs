import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';

const result = await build({ stdin: { contents: `export * from './lib/nested-review-queue';
export * from './lib/nested-review-material';`, resolveDir: process.cwd(), loader: 'ts' },
bundle: true, write: false, platform: 'node', format: 'esm' });
const api = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
const { nestedReviewRows: rows, nestedReviewQueue: queue, nestedReviewQuery: query } = api;
assert.equal(api.nestedReviewNavigationTrack('teaching'), 'teaching');
for (const value of ['imaging', 'foreign', null, ['teaching']]) assert.equal(api.nestedReviewNavigationTrack(value), 'geometry');
for (const value of [null, undefined, ['left'], {}, 1]) assert.equal(query(value), '');
assert.equal(query(' \u0000left\n '), 'left');
assert.equal(query('x'.repeat(1000)).length, 160);
assert.deepEqual(queue(rows, 'foreign', '', null).entries, []);
let links = 0;
for (const group of rows) {
  const all = queue(rows, group.key, '', null);
  assert.deepEqual(all.entries.map(entry => entry.id), group.surfaces.map(surface => surface.id));
  assert.equal(all.index, -1); assert.equal(all.previous, null); assert.equal(all.next, null);
  for (const [index, entry] of all.entries.entries()) {
    const selected = { nestedKey: group.key, structureId: entry.id };
    const current = queue(rows, group.key, '', selected);
    assert.equal(current.index, index);
    assert.equal(current.previous?.id ?? null, all.entries[index - 1]?.id ?? null);
    assert.equal(current.next?.id ?? null, all.entries[index + 1]?.id ?? null);
    const url = new URL(entry.href, 'https://atlas.test');
    assert.equal(url.pathname, '/review/nested'); assert.equal(url.searchParams.get('parent'), group.parentId);
    assert.equal(url.searchParams.get('study'), group.study); assert.equal(url.searchParams.get('structure'), entry.id);
    const packet = await api.nestedReviewSelection(group.key, entry.id, url.searchParams.get('source'));
    assert(packet); assert.equal(packet.context.sourceHash, url.searchParams.get('source'));
    assert.equal(await api.nestedReviewSelection(group.key, entry.id, '0'.repeat(64)), null);
    assert.equal(packet.context.revisions.imaging, null); links++;
  }
  const hidden = queue(rows, group.key, 'NO_MATCH_AT_ALL', { nestedKey: group.key, structureId: all.entries[0].id });
  assert.equal(hidden.entries.length, 0); assert.equal(hidden.index, -1);
  assert.equal(hidden.previous, null); assert.equal(hidden.next, null);
  const foreign = queue(rows, group.key, '', { nestedKey: 'foreign', structureId: all.entries[0].id });
  assert.equal(foreign.index, -1); assert.equal(foreign.next, null);
  const changed = structuredClone(rows); changed.find(row => row.key === group.key).parentId += '-foreign';
  assert.equal(queue(changed, group.key, '', null).entries.length, 0);
}
assert.equal(links, 108);
const group = rows.find(row => row.surfaces.filter(surface => surface.laterality === 'left').length >= 3);
assert(group);
const specialRows = structuredClone(rows);
specialRows[0].surfaces[0].name = 'Encoded & < marker';
const special = queue(specialRows, specialRows[0].key, '& <', null, 'teaching');
assert.equal(special.entries.length, 1);
assert.equal(new URL(special.entries[0].href, 'https://atlas.test').searchParams.get('q'), '& <');
assert(!special.entries[0].href.includes('<'));
const filtered = queue(rows, group.key, ' LEFT ', null, 'teaching');
assert.deepEqual(filtered.entries.map(entry => entry.id), group.surfaces.filter(surface =>
  `${surface.name} ${surface.id} ${surface.laterality}`.toLowerCase().includes('left')).map(surface => surface.id));
for (const entry of filtered.entries) {
  const params = new URL(entry.href, 'https://atlas.test').searchParams;
  assert.equal(params.get('q'), 'LEFT'); assert.equal(params.get('t'), 'teaching');
}
const packet = await api.nestedReviewMaterial(group.key, filtered.entries[1].id);
const rendered = await componentBuild({ entryPoints: ['app/review/nested/workspace.tsx'],
  bundle: true, write: false, platform: 'node', format: 'cjs' });
const require = createRequire(import.meta.url), module = { exports: {} };
runInNewContext(rendered.outputFiles[0].text, { require, module, exports: module.exports,
  URL, URLSearchParams, TextEncoder, TextDecoder, setTimeout, clearTimeout, console, structuredClone });
const React = require('react'), { renderToStaticMarkup } = require('react-dom/server');
const render = (packet, initialQuery) => renderToStaticMarkup(React.createElement(module.exports.NestedReviewWorkspace,
  { rows, packet, initialQuery, initialTrack: 'teaching', invalid: false }));
const html = render(packet, 'LEFT');
assert.match(html, /Structure 2 of \d+ in the filtered queue/);
assert.match(html, /aria-label="Structures in the filtered review queue"/);
assert.match(html, /Previous structure:/); assert.match(html, /Next structure:/);
assert.match(html, /q=LEFT/); assert.match(html, /Clear search/);
assert.match(html, /t=teaching/);
assert.match(html, /Private history not loaded/); assert.match(html, /<fieldset disabled/);
assert.match(render(packet, 'NO_MATCH_AT_ALL'), /Selected structure is outside this filtered queue/);
assert.match(render(packet, 'NO_MATCH_AT_ALL'), /No matching structures/);
assert(!render(packet, '<script>alert(1)</script>').includes('<script>'));
assert.match(render(null, ''), /108|selections/);
const source = await readFile('app/review/nested/workspace.tsx', 'utf8');
assert(source.includes('document.addEventListener("click", click, true)'));
assert(source.includes('Leave and discard unsaved review edits?'));
assert(source.includes('window.addEventListener("beforeunload", unload)'));
const page = await readFile('app/review/nested/page.tsx', 'utf8');
assert(page.includes('initialQuery={nestedReviewQuery(p.q)}'));
assert(page.includes('initialTrack={nestedReviewNavigationTrack(p.t)}'));
// Preserve the queue-only milestone exactly; later teaching additions have their
// own current-state transition checks, not an exemption from this historical gate.
const queueMilestone='551f7dc0902be9c26c57a74cac4f101925767809';
for (const path of ['content/nested-review-bindings.json', 'content/nested-teaching.ts',
  'lib/nested-review-material.ts', 'lib/nested-review-api.ts', 'lib/nested-review.ts',
  'public/models/bodyparts3d/full-body/catalog.json'])
  assert.deepEqual(execFileSync('git', ['show', queueMilestone+':' + path], { maxBuffer: 32e6 }), execFileSync('git', ['show', '927180af8a7d04a96cd54088953dc68a1dd54588:' + path], { maxBuffer: 32e6 }), path);
const report = { sourceBaseline: '927180af8a7d04a96cd54088953dc68a1dd54588', scopes: rows.length,
  exactSourceLinks: links, sourceAndTeachingUnchangedAtQueueMilestone: true, queueMilestone,
  currentTeachingTransitionCheck: 'scripts/test-eye-layer-guide-review.mjs', filteredNeighboursAndQueryRetention: true,
  invalidScopeAndSourceRejected: true, actualWorkspaceSSR: true, existingUnsavedGuardRetained: true,
  browserInteractionVerified: false, clinicalApproval: false };
await writeFile('docs/nested-review-queue-validation.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
