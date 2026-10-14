import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {build} from './workspace-test-build.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
import {bodyNoteRenderCallback} from './body-note-render-callback.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const baseline = 'c57599c400e5145f16c819b7cb6d9720df989ecf';
const before = JSON.parse(readFileSync('content/lower-limb-connective-xray.before.json', 'utf8'));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const same = (actual, expected, message) => assert.deepEqual(actual, expected, message);
assert.equal(sha256(JSON.stringify(before)), '33d97db4dafd3d936b2ed517a3db93c4cd3d2772fa209cc7d4d9eedd4930b66d', 'Immutable before-record');
assert.equal(before.parentCommit, baseline);
assert.equal(before.otherPlacements, 9932);
const expected = new Map([
  ['FMA258847', ['achilles', 'right', 'leg', 'FJ1405']],
  ['FMA264844', ['achilles', 'left', 'leg', 'FJ1405M']],
  ['FMA58776', ['iliotibial', 'right', 'thigh', 'FJ1423']],
  ['FMA58777', ['iliotibial', 'left', 'thigh', 'FJ1423M']],
]);
assert.equal(before.entries.length, 4);
for (const entry of before.entries) {
  const [group, side, region, file] = expected.get(entry.identity.fmaId) || [];
  assert.equal(entry.group, group);
  assert.equal(entry.identity.laterality, side);
  assert.equal(entry.identity.region, region);
  assert.equal(entry.identity.sources[0].file, file);
  assert.equal(entry.identity.validation.status, 'unvalidated');
  assert.equal(entry.identity.validation.anatomicalReview, false);
  assert.equal(entry.previous.readiness, 'pending');
}
same(new Set(before.entries.map(e => e.identity.fmaId)), new Set(expected.keys()));
const byId = new Map(before.entries.map(e => [e.identity.id, e]));
const fromBaseline = path => execFileSync('git', ['show', `${baseline}:${path}`], {
  windowsHide: true, maxBuffer: 32e6, env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'},
});
const previous = await exactSourceHistoryApi(baseline, 'review-security');
const compiled = await build({
  stdin: {contents: `export {lowerLimbConnectiveXrayLesson} from './lib/lower-limb-connective-xray';
export {lowerLimbConnectiveXrayTeaching} from './content/lower-limb-connective-xray';
export {bodyLesson,bodyContent} from './app/body-content';
export {bodyDisplayCatalog} from './lib/body-display-catalog';
export {contentTabs} from './lib/content-types';
export {structures} from './app/anatomy-data';
export {dissectionProfiles} from './app/dissection-data';
export {regionalTours} from './lib/regional-tours';
export * from './lib/body-review-material';
export * from './lib/body-review-context';
export * from './lib/body-review-response';`, resolveDir: process.cwd(), loader: 'ts'},
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const now = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const raw = JSON.parse(readFileSync(catalogPath, 'utf8'));
same(raw, JSON.parse(fromBaseline(catalogPath)), 'Archival catalogue unchanged');
const catalog = now.bodyDisplayCatalog(raw);
same(catalog, previous.bodyDisplayCatalog(JSON.parse(fromBaseline(catalogPath))), 'Displayed catalogue unchanged');
same(now.structures, previous.structures, 'Anatomy structures unchanged');
same(now.dissectionProfiles, previous.dissectionProfiles, 'Dissection recipes unchanged');
same(now.regionalTours, previous.regionalTours, 'Guided tours unchanged');
same(now.contentTabs, previous.contentTabs, 'Tabs unchanged');
assert.equal(catalog.structures.length, 1104);
assert.equal(now.contentTabs.length * catalog.structures.length, 9936);
for (const entry of before.entries)
  same(catalog.structures.find(row => row.id === entry.identity.id), entry.identity, `${entry.identity.fmaId}: source identity`);

const teaching = now.lowerLimbConnectiveXrayTeaching;
same([...teaching.achilles.references], [
  'https://www.orthoinfo.org/diseases--conditions/achilles-tendon-rupture-tear',
  'https://pubmed.ncbi.nlm.nih.gov/36036526/',
]);
same([...teaching.iliotibial.references], [
  'https://pubmed.ncbi.nlm.nih.gov/11323461/',
  'https://jassm.org/an-unusual-case-of-isolated-iliotibial-band-avulsion-fracture/',
  'https://www.radiologyinfo.org/en/info/musculous',
]);
const achillesText = [teaching.achilles.body, ...teaching.achilles.bullets].join(' ');
assert.match(achillesText, /Kager/i);
assert.match(achillesText, /Neither a preserved triangle nor its obscuration alone settles tendon integrity/i);
assert.match(achillesText, /Absence of that fragment does not exclude a tendon tear/i);
assert.match(achillesText, /plain films do not grade a partial tear or measure a tendon gap/i);
const itbText = [teaching.iliotibial.body, ...teaching.iliotibial.bullets].join(' ');
assert.match(itbText, /Gerdy/i);
assert.match(itbText, /unusual isolated case/i);
assert.match(itbText, /not a rule that such injuries are isolated/i);
assert.match(itbText, /Segond avulsions/i);
assert.match(itbText, /iliotibial fibres extending behind Gerdy's tubercle and attaching to some Segond fragments/i);

let changed = 0, preserved = 0, changedWorksheets = 0, malformed = 0;
for (const structure of catalog.structures) {
  const selected = byId.get(structure.id);
  for (const tab of now.contentTabs) {
    const oldLesson = previous.bodyLesson(structure, tab);
    const lesson = now.bodyLesson(structure, tab);
    if (selected && tab === 'xray') {
      same(oldLesson, selected.previous, `${structure.id}: exact before lesson`);
      assert.equal(lesson.readiness, 'draft');
      same(lesson, now.lowerLimbConnectiveXrayLesson(structure, tab));
      const source = teaching[selected.group];
      assert.equal(lesson.body, source.body);
      same(lesson.bullets, source.bullets);
      same(lesson.citations, source.references);
      assert.match(lesson.note, /revision-bound radiologist review pending/i);
      assert.match(lesson.note, /unvalidated/i);
      assert.match(lesson.note, /No X-ray image, patient-space registration, validated projection or linked imaging study/i);
      assert.match(lesson.note, /Atlas, imaging-case and paid-lecture access remain independent/i);
      const {readiness, ...shown} = lesson;
      same(now.bodyContent(structure, tab), shown, 'Actual bodyContent export');
      changed++;
    } else {
      same(lesson, oldLesson, `${structure.id}:${tab}: unchanged lesson`);
      assert.equal(now.lowerLimbConnectiveXrayLesson(structure, tab), undefined);
      preserved++;
    }
  }
  const oldPacket = await previous.bodyReviewMaterial(structure.id);
  const packet = await now.bodyReviewMaterial(structure.id);
  if (selected) {
    assert.equal(packet.approval, false);
    for (const key of ['source', 'reasoning', 'guidedTours', 'checklist', 'atlasLink', 'limits'])
      same(packet[key], oldPacket[key], `${structure.id}:${key}`);
    assert.equal(packet.fingerprints.source, oldPacket.fingerprints.source);
    assert.notEqual(packet.fingerprints.teaching, oldPacket.fingerprints.teaching);
    assert.notEqual(packet.materialHash, oldPacket.materialHash);
    same(packet.topics.find(topic => topic.tab === 'xray'), {tab: 'xray', ...now.bodyLesson(structure, 'xray')});
    assert(await now.parseBodyReviewResponse(packet, structure.id),
      `${structure.id}: current worksheet must match trusted display pins`);
    assert.equal(await now.parseBodyReviewResponse(oldPacket, structure.id), null);
    const oldContext = await previous.bodyReviewContext(structure.id);
    const context = await now.bodyReviewContext(structure.id);
    assert.equal(context.sourceHash, oldContext.sourceHash);
    assert.notEqual(context.revisions.teaching, oldContext.revisions.teaching);
    for (const edit of [
      value => { value.topics.find(topic => topic.tab === 'xray').body += ' foreign'; },
      value => { value.topics.find(topic => topic.tab === 'xray').citations = ['https://foreign.example']; },
      value => { value.topics.find(topic => topic.tab === 'xray').readiness = 'approved'; },
      value => { value.source.structure.sources = []; },
    ]) {
      const forged = structuredClone(packet);
      edit(forged);
      assert.equal(await now.parseBodyReviewResponse(forged, structure.id), null);
      malformed++;
    }
    changedWorksheets++;
  } else same(packet, oldPacket, `${structure.id}: unchanged review packet`);
}
assert.equal(changed, 4);
assert.equal(preserved, 9932);
assert.equal(changedWorksheets, 4);
assert.equal(malformed, 16);

const leaves = (value, path = []) => value === null || typeof value !== 'object'
  ? [path] : Object.entries(value).flatMap(([key, item]) => leaves(item, [...path, key]));
let refused = 0, refusedLeaves = 0;
for (const {identity} of before.entries) {
  const lesson = now.lowerLimbConnectiveXrayLesson(identity, 'xray');
  const clean = structuredClone(lesson);
  lesson.bullets.push('foreign');
  lesson.citations.push('https://foreign.example');
  same(now.lowerLimbConnectiveXrayLesson(identity, 'xray'), clean, 'Fresh lesson arrays');
  for (const path of leaves(identity)) {
    const invalid = structuredClone(identity);
    let cursor = invalid;
    for (const key of path.slice(0, -1)) cursor = cursor[key];
    const key = path.at(-1), value = cursor[key];
    cursor[key] = typeof value === 'number' ? value + 0.01
      : typeof value === 'boolean' ? !value : String(value) + '-foreign';
    assert.equal(now.lowerLimbConnectiveXrayLesson(invalid, 'xray'), undefined,
      `${identity.id}:${path.join('.')}: whole-record rejection`);
    refusedLeaves++;
  }
  for (const mutate of [
    s => { s.sources = []; },
    s => { s.sources[0].file = 'wrong-file'; },
    s => { s.sources[0].sha256 = '0'.repeat(64); },
    s => { delete s.provenance; },
    s => { s.provenance.license = 'foreign'; },
    s => { s.laterality = s.laterality === 'right' ? 'left' : 'right'; },
    s => { s.region = 'foreign'; },
    s => { s.bounds.min[0] += 0.01; },
    s => { s.validation.status = 'validated'; },
    s => { s.unexpected = true; },
  ]) {
    const invalid = structuredClone(identity);
    mutate(invalid);
    assert.equal(now.lowerLimbConnectiveXrayLesson(invalid, 'xray'), undefined);
    refused++;
  }
}

const require = createRequire(import.meta.url);
const React = require('react');
const render = require('react-dom/server').renderToStaticMarkup;
const component = await componentBuild({
  stdin: {contents: "export {SourceDisplayNotes} from './app/source-display-notes';export {teachingHeading} from './lib/teaching-heading';", resolveDir: process.cwd(), loader: 'tsx'},
  bundle: true, platform: 'node', format: 'cjs', write: false,
});
const scope = {exports: {}};
runInNewContext(component.outputFiles[0].text, {module: scope, exports: scope.exports, require});
const callback = bodyNoteRenderCallback(readFileSync('app/body-explorer.tsx', 'utf8'));
const callbackJs = ts.transpile('const renderNote=' + callback, {target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React});
let rendered = 0;
for (const {identity} of before.entries) {
  const tree = runInNewContext(callbackJs + ';renderNote("xray")', {
    React, bodyContent: now.bodyContent, selected: identity,
    SourceDisplayNotes: scope.exports.SourceDisplayNotes, teachingHeading: scope.exports.teachingHeading,
    WorkspaceModeButton: ({children}) => React.createElement('button', null, children),
    ComponentImagingNotes: () => null, ScanLine: () => null, catalog, side: 'both', exam: false,
    openNested() { throw Error('Unexpected navigation'); },
  });
  const html = render(tree), lesson = now.bodyLesson(identity, 'xray');
  assert(html.includes(render(React.createElement('p', null, lesson.body))));
  for (const bullet of lesson.bullets) assert(html.includes(render(React.createElement('li', null, bullet))));
  for (const url of lesson.citations) assert(html.includes(url.replaceAll('&', '&amp;')));
  assert(html.includes('No imaging study loaded'));
  assert(!/imaging study (?:linked|loaded):/i.test(html));
  rendered++;
}
for (const bundle of catalog.bundles) {
  const path = `public${bundle.url.split('?')[0]}`;
  const bytes = readFileSync(path);
  assert.equal(sha256(bytes), bundle.sha256, path);
  same(bytes, fromBaseline(path), `${path}: unchanged source bundle`);
}
console.log(JSON.stringify({baseline, changed, preserved, changedWorksheets,
  malformedPacketsRefused: malformed, refusedIdentities: refused, refusedLeaves, rendered,
  sourceBundlesUnchanged: catalog.bundles.length, clinicalApproval: false}));
