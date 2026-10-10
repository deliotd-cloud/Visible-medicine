import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
import { bodyNoteRenderCallback } from './body-note-render-callback.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = '2d72005e6cb88b015cce92bf303e0f918b549133';
const targetTabs = ['ct', 'mri'];
const expected = new Map([
  ['FMA55115', { group: 'corniculate', file: 'FJ2793', side: 'right' }],
  ['FMA55116', { group: 'corniculate', file: 'FJ2776', side: 'left' }],
  ['FMA55117', { group: 'cuneiform', file: 'FJ2795', side: 'right' }],
  ['FMA55118', { group: 'cuneiform', file: 'FJ2773', side: 'left' }],
]);
const references = new Set([
  'https://anatomy.ttuhscep.edu/nervous_system/deepneck_ans.html',
  'https://doi.org/10.1016/j.jasi.2017.05.004',
  'https://pubmed.ncbi.nlm.nih.gov/2298998/',
  'https://pubmed.ncbi.nlm.nih.gov/9799998/',
]);
const pins = JSON.parse(readFileSync('content/laryngeal-framework-quiz-pins.json', 'utf8'));
const selected = pins.entries.filter(entry => expected.has(entry.identity.fmaId));
assert.equal(selected.length, 4);
assert.deepEqual(new Set(selected.map(entry => entry.identity.fmaId)), new Set(expected.keys()));
const byId = new Map(selected.map(entry => [entry.identity.id, entry]));
const fromBaseline = path => execFileSync('git', ['show', `${baseline}:${path}`], {
  windowsHide: true, maxBuffer: 32e6,
});
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const same = (actual, wanted, message) => assert.deepEqual(actual, wanted, message);

const previous = await exactSourceHistoryApi(baseline, 'review-security');
const compiled = await build({
  stdin: {
    contents: `export {laryngealInletImagingLesson} from './lib/laryngeal-inlet-imaging';
export {laryngealInletImagingTopics,laryngealInletImagingNote,laryngealInletImagingScope} from './content/laryngeal-inlet-imaging';
export {bodyLesson,bodyContent} from './app/body-content';
export {bodyDisplayCatalog} from './lib/body-display-catalog';
export {contentTabs} from './lib/content-types';
export {structures} from './app/anatomy-data';
export {dissectionProfiles} from './app/dissection-data';
export {regionalTours} from './lib/regional-tours';
export * from './lib/body-review-material';
export * from './lib/body-review-context';
export * from './lib/body-review-response';
export * from './lib/body-review-api';
export * from './lib/body-review-decisions';`,
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const now = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const raw = JSON.parse(readFileSync(catalogPath, 'utf8'));
same(raw, JSON.parse(fromBaseline(catalogPath)), 'Archival catalogue unchanged');
const catalog = now.bodyDisplayCatalog(raw);
same(catalog, previous.bodyDisplayCatalog(JSON.parse(fromBaseline(catalogPath))), 'Displayed source records unchanged');
same(catalog.coordinateSystem, pins.coordinateSystem);
same(now.structures, previous.structures);
same(now.dissectionProfiles, previous.dissectionProfiles);
same(now.regionalTours, previous.regionalTours);
same(now.contentTabs, previous.contentTabs);
assert.equal(catalog.structures.length, 1104);
assert.equal(now.contentTabs.length * catalog.structures.length, 9936);
for (const entry of selected) {
  const identity = entry.identity;
  const want = expected.get(identity.fmaId);
  assert.equal(entry.group, want.group);
  assert.equal(identity.laterality, want.side);
  assert.equal(identity.region, 'head-neck');
  assert.equal(identity.category, 'cartilage');
  assert.equal(identity.bundle, 'head-neck-connective-gaps');
  assert.deepEqual(identity.sources.map(source => source.file), [want.file]);
  assert.equal(identity.validation.anatomicalReview, false);
  assert.equal(identity.validation.status, 'unvalidated');
  same(catalog.structures.find(row => row.id === identity.id), identity);
}

for (const family of ['corniculate', 'cuneiform']) for (const tab of targetTabs) {
  const topic = now.laryngealInletImagingTopics[family][tab];
  assert(topic.body.trim());
  assert(Array.isArray(topic.bullets) && topic.bullets.length > 0);
  assert(Array.isArray(topic.citations) && topic.citations.length > 0);
  for (const citation of topic.citations) assert(references.has(citation), citation);
  assert.match([topic.body, ...topic.bullets].join(' '), /arytenoid|aryepiglottic|laryngeal inlet/i);
  if (tab === 'mri') {
    const limitation = [topic.body, ...topic.bullets, now.laryngealInletImagingScope].join(' ');
    assert.match(limitation, /aryepiglottic fold/i);
    assert.match(limitation, /cartilage/i);
    assert.match(limitation, /does not|cannot|not proof|not establish|no guarantee|doesn't/i);
  }
}
assert.match(now.laryngealInletImagingNote, /revision-bound radiologist review pending/i);

let changed = 0, preserved = 0, changedWorksheets = 0, preservedWorksheets = 0;
let malformed = 0, stale = 0, storageCalls = 0;
for (const structure of catalog.structures) {
  const binding = byId.get(structure.id);
  for (const tab of now.contentTabs) {
    const oldLesson = previous.bodyLesson(structure, tab);
    const lesson = now.bodyLesson(structure, tab);
    if (binding && targetTabs.includes(tab)) {
      const topic = now.laryngealInletImagingTopics[binding.group][tab];
      assert.equal(oldLesson.readiness, 'pending');
      assert.equal(lesson.readiness, 'draft');
      same(lesson, now.laryngealInletImagingLesson(structure, tab));
      assert.equal(lesson.title, `${structure.name} · ${tab.toUpperCase()} orientation · draft`);
      assert.equal(lesson.body, topic.body);
      same(lesson.bullets, [...topic.bullets, now.laryngealInletImagingScope]);
      same(lesson.citations, topic.citations);
      assert.equal(lesson.note, now.laryngealInletImagingNote);
      const { readiness, ...shown } = lesson;
      same(now.bodyContent(structure, tab), shown);
      changed++;
    } else {
      same(lesson, oldLesson, `${structure.id}:${tab}`);
      assert.equal(now.laryngealInletImagingLesson(structure, tab), undefined);
      preserved++;
    }
  }
  const oldPacket = await previous.bodyReviewMaterial(structure.id);
  const packet = await now.bodyReviewMaterial(structure.id);
  assert.equal(packet.approval, false);
  if (binding) {
    for (const key of ['source', 'reasoning', 'guidedTours', 'checklist', 'atlasLink', 'limits'])
      same(packet[key], oldPacket[key], `${structure.id}:${key}`);
    assert.equal(packet.fingerprints.source, oldPacket.fingerprints.source);
    assert.notEqual(packet.fingerprints.teaching, oldPacket.fingerprints.teaching);
    assert.notEqual(packet.materialHash, oldPacket.materialHash);
    for (const tab of targetTabs) same(packet.topics.find(topic => topic.tab === tab), {
      tab, ...now.bodyLesson(structure, tab),
    });
    same(await now.parseBodyReviewResponse(packet, structure.id), packet);
    assert.equal(await now.parseBodyReviewResponse(oldPacket, structure.id), null);
    for (const edit of [
      value => { value.topics.find(topic => topic.tab === 'ct').body += ' foreign'; },
      value => { value.topics.find(topic => topic.tab === 'mri').citations = ['https://foreign.example']; },
      value => { value.topics.find(topic => topic.tab === 'ct').readiness = 'approved'; },
      value => { value.topics.splice(value.topics.findIndex(topic => topic.tab === 'mri'), 1); },
      value => { value.source.structure.sources = []; },
    ]) {
      const forged = structuredClone(packet);
      edit(forged);
      assert.equal(await now.parseBodyReviewResponse(forged, structure.id), null);
      malformed++;
    }
    const oldContext = await previous.bodyReviewContext(structure.id);
    const context = await now.bodyReviewContext(structure.id);
    assert.equal(context.sourceHash, oldContext.sourceHash);
    assert.notEqual(context.revisions.teaching, oldContext.revisions.teaching);
    const decision = {
      catalogScope: context.catalogScope,
      structureId: structure.id,
      track: 'teaching',
      expectedVersion: 0,
      materialHash: context.materialHash,
      revisionHash: context.revisions.teaching,
      checklistVersion: context.checklistVersion,
      draft: now.blankBodyReview(context, 'teaching'),
    };
    for (const staleHashes of [
      { materialHash: oldContext.materialHash, revisionHash: oldContext.revisions.teaching },
      { materialHash: oldContext.materialHash },
      { revisionHash: oldContext.revisions.teaching },
    ]) {
      const response = await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions', {
        method: 'POST',
        headers: { origin: 'https://atlas.test', 'content-type': 'application/json', 'oai-authenticated-user-id': 'SYNTHETIC_LARYNGEAL_INLET' },
        body: JSON.stringify({ ...decision, ...staleHashes }),
      }), { prepare() { storageCalls++; throw Error('Stale decision reached storage'); } });
      assert.equal(response.status, 409);
      stale++;
    }
    changedWorksheets++;
  } else {
    same(packet, oldPacket, `${structure.id}: review packet`);
    preservedWorksheets++;
  }
}
assert.equal(changed, 8);
assert.equal(preserved, 9928);
assert.equal(changedWorksheets, 4);
assert.equal(preservedWorksheets, 1100);
assert.equal(malformed, 20);
assert.equal(stale, 12);
assert.equal(storageCalls, 0);

const pathsWhere = (value, predicate, path = []) => [
  ...(predicate(value) ? [path] : []),
  ...(value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) => pathsWhere(child, predicate, [...path, key])) : []),
];
const at = (value, path) => path.reduce((part, key) => part[key], value);
let refusedIdentities = 0;
for (const { identity } of selected) for (const tab of targetTabs) {
  const lesson = now.laryngealInletImagingLesson(identity, tab);
  const clean = structuredClone(lesson);
  lesson.bullets.push('foreign');
  lesson.citations.push('https://foreign.example');
  same(now.laryngealInletImagingLesson(identity, tab), clean, 'Fresh lesson arrays');
  for (const path of pathsWhere(identity, value => value === null || typeof value !== 'object')) {
    const invalid = structuredClone(identity);
    const parent = at(invalid, path.slice(0, -1));
    const key = path.at(-1), original = parent[key];
    parent[key] = typeof original === 'string' ? `${original}-foreign`
      : typeof original === 'number' ? original + 0.01
        : original === null ? 'foreign' : !original;
    assert.equal(now.laryngealInletImagingLesson(invalid, tab), undefined, path.join('.'));
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, Array.isArray)) {
    const invalid = structuredClone(identity);
    at(invalid, path).push('foreign');
    assert.equal(now.laryngealInletImagingLesson(invalid, tab), undefined, path.join('.'));
    refusedIdentities++;
  }
  for (const path of pathsWhere(identity, value => value && typeof value === 'object' && !Array.isArray(value))) {
    const invalid = structuredClone(identity);
    at(invalid, path).unexpected = true;
    assert.equal(now.laryngealInletImagingLesson(invalid, tab), undefined, path.join('.') || '<root>');
    refusedIdentities++;
  }
}

const require = createRequire(import.meta.url);
const React = require('react');
const render = require('react-dom/server').renderToStaticMarkup;
const component = await componentBuild({
  stdin: { contents: "export {SourceDisplayNotes} from './app/source-display-notes';export {teachingHeading} from './lib/teaching-heading';", resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, platform: 'node', format: 'cjs', write: false,
});
const scope = { exports: {} };
runInNewContext(component.outputFiles[0].text, { module: scope, exports: scope.exports, require });
const callback = bodyNoteRenderCallback(readFileSync('app/body-explorer.tsx', 'utf8'));
const callbackJs = ts.transpile('const renderNote=' + callback, { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React });
let rendered = 0;
for (const { identity } of selected) for (const tab of targetTabs) {
  const tree = runInNewContext(callbackJs + `;renderNote("${tab}")`, {
    React, bodyContent: now.bodyContent, selected: identity, SourceDisplayNotes: scope.exports.SourceDisplayNotes, teachingHeading: scope.exports.teachingHeading,
    WorkspaceModeButton: ({ children }) => React.createElement('button', null, children),
    ComponentImagingNotes: () => null, ScanLine: () => null, catalog, side: 'both', exam: false,
    openNested() { throw Error('Unexpected navigation'); },
  });
  const html = render(tree), lesson = now.bodyLesson(identity, tab);
  assert(html.includes(render(React.createElement('p', null, lesson.body))));
  for (const bullet of lesson.bullets) assert(html.includes(render(React.createElement('li', null, bullet))));
  for (const url of lesson.citations) assert(html.includes(url.replaceAll('&', '&amp;')));
  assert(html.includes('No imaging study loaded'));
  rendered++;
}

for (const bundle of catalog.bundles) {
  const path = `public${bundle.url.split('?')[0]}`;
  const bytes = readFileSync(path);
  assert.equal(sha256(bytes), bundle.sha256, path);
  same(bytes, fromBaseline(path), `${path} remains unchanged`);
}
console.log(JSON.stringify({ baseline, changed, preserved, changedWorksheets, preservedWorksheets,
  refusedIdentities, malformedPacketsRefused: malformed, staleRefusalsBeforeStorage: stale,
  storageCalls, rendered, sourceBundlesUnchanged: catalog.bundles.length, clinicalApproval: false }));
