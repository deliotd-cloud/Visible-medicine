import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { contentContext, contentValidator } from './content-contract-tools.mjs';
import { snapshot, hash } from './pin-pica-clinical.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { build } from './workspace-component-test-build.mjs';
import pins from '../content/orbital-nerve-mri-pins.json' with { type: 'json' };
import { orbitalNerveMriTopics as authored } from '../content/orbital-nerve-mri.ts';
import { beforeInternalThoracicImaging } from './internal-thoracic-imaging-history.mjs';

const live = await contentContext(), api = beforeInternalThoracicImaging(live.api), display = api.bodyDisplayCatalog(live.catalog);
const parent = await exactSourceHistoryApi(pins.parentCommit);
assert.deepEqual(display, parent.bodyDisplayCatalog(live.catalog), 'No anatomy or catalogue change');
assert.equal(hash(snapshot(parent, display)), pins.previousAllLessonsAndRecipesHash);
assert.deepEqual(api.structures, parent.structures);assert.deepEqual(api.dissectionProfiles, parent.dissectionProfiles);
for (const b of pins.bundles) {
  assert.deepEqual(display.bundles.find(x => x.id === b.id), b);
  const bytes = await readFile('public' + b.url.split('?')[0]);
  assert.equal(bytes.length, b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'), b.sha256);
}
const targets = new Map(pins.entries.map(e => [e.identity.id + '|mri', e]));
assert.equal(targets.size, 14);
for (const e of pins.entries) assert.deepEqual(display.structures.find(s => s.id === e.identity.id), e.identity);
const records = api.bodyContentRecords(display), validate = await contentValidator(live.registry);
let changed = 0, unchanged = 0, rejected = 0;const entries = [];
for (const s of display.structures) for (const tab of api.contentTabs) {
  const before = parent.bodyLesson(s, tab), now = api.bodyLesson(s, tab), target = targets.get(s.id + '|' + tab);
  if (!target) {
    assert.deepEqual(now, before, s.id + '|' + tab);
    assert.equal(api.orbitalNerveMriLesson(s, tab), undefined);unchanged++;continue;
  }
  assert.deepEqual(before, target.previous.mri);assert.equal(before.readiness, 'pending');assert.equal(now.readiness, 'draft');
  assert.deepEqual(now, api.orbitalNerveMriLesson(s, tab));
  assert.match(now.note, /review/i);assert.match(now.note, /independent/);
  const { readiness: _readiness, ...shown } = now;assert.deepEqual(api.bodyContent(s, tab), shown);
  const record = records.find(r => r.id === s.id);assert(validate(record));assert.deepEqual(record.content.mri, now);
  assert.equal(record.validation.clinicalApproval, 'not-included');
  const packet = await api.bodyReviewMaterial(s.id);assert.equal(packet.approval, false);
  const { tab: _reviewTab, ...review } = packet.topics.find(t => t.tab === 'mri');assert.deepEqual(review, now);
  entries.push({ id: s.id, tab, previousHash: hash(before), currentHash: hash(now) });changed++;
  const copy = structuredClone(now);now.bullets.push('foreign');now.citations.length = 0;
  assert.deepEqual(api.orbitalNerveMriLesson(s, tab), copy, 'Return fresh arrays');
}
assert.equal(changed, 14);assert.equal(unchanged, 9922);
assert.equal(Object.keys(authored).length, 7);
const sourceText = new Map();
for (const topic of Object.values(authored)) for (const url of topic.citations) {
  assert.equal(new URL(url).protocol, 'https:');
  const texts = sourceText.get(url) ?? new Set();
  for (const text of [topic.body, ...topic.bullets]) texts.add(text);
  sourceText.set(url, texts);
}
const sourceWordCounts = Object.fromEntries([...sourceText].map(([url, texts]) => [url, [...texts].join(' ').split(/\s+/).length]));
for (const [url, words] of Object.entries(sourceWordCounts)) assert(words <= 200, url + ' source summary budget');
const allText = topic => [topic.body, ...topic.bullets].join(' ');
assert.match(allText(authored.nasociliary), /poor|low/i);
assert.match(allText(authored.nasociliary), /reader.*agreement|agreement.*reader/i);
assert.match(authored.nasociliary.body, /AC1 −0.13 to −0.08/, 'Both AC1 endpoints are negative');
for (const group of ['frontal', 'lacrimal', 'nasociliary', 'inferior-oculomotor', 'ciliary-ganglion']) {
  assert.deepEqual(authored[group].citations, ['https://pubmed.ncbi.nlm.nih.gov/42034568/']);
  assert.match(allText(authored[group]), /46.*92|92.*46/);
  assert.match(allText(authored[group]), /without orbital disease/);
}
for (const group of ['superior-oculomotor', 'trochlear']) {
  assert.deepEqual(authored[group].citations, ['https://pubmed.ncbi.nlm.nih.gov/33811598/']);
  assert.match(allText(authored[group]), /30 healthy/);
  assert.match(allText(authored[group]), /3D-DESS-WE/);
}
const leaves = (v, p = []) => v === null || typeof v !== 'object' ? [p] : Object.entries(v).flatMap(([k, x]) => leaves(x, [...p, k]));
for (const e of pins.entries) {
  const reject = s => {
    assert.equal(api.orbitalNerveMriLesson(s, 'mri'), undefined);
    assert.equal(api.bodyLesson(s, 'mri').readiness, 'pending');rejected++;
  };
  for (const path of leaves(e.identity)) {
    const bad = structuredClone(e.identity);let value = bad;
    for (const key of path.slice(0, -1)) value = value[key];
    const key = path.at(-1), old = value[key];value[key] = typeof old === 'number' ? old + .01 : typeof old === 'boolean' ? !old : String(old) + '-foreign';reject(bad);
  }
  for (const mutate of [s => { delete s.sources; }, s => s.sources.pop(), s => s.sources.push(s.sources[0]), s => s.regions.push('foreign'), s => { s.foreign = true; }]) {
    const bad = structuredClone(e.identity);mutate(bad);reject(bad);
  }
  for (const other of pins.entries.filter(x => x.group === e.group && x.identity.id !== e.identity.id)) {
    reject({ ...e.identity, sources: other.identity.sources });
  }
}
// Exercise the real BodyExplorer note callback and existing disclosure component.
const require = createRequire(import.meta.url), React = require('react'), render = require('react-dom/server').renderToStaticMarkup;
const built = await build({ stdin: { contents: "export {SourceDisplayNotes} from './app/source-display-notes';", resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, platform: 'node', format: 'cjs', write: false });
const scope = { exports: {} };runInNewContext(built.outputFiles[0].text, { module: scope, exports: scope.exports, require });
const source = await readFile('app/body-explorer.tsx', 'utf8'), ast = ts.createSourceFile('body.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let callback;
function visit(node) {
  if (ts.isArrowFunction(node) && node.body.getText(ast).includes('const content = bodyContent(selected, value);')) { assert.equal(callback, undefined);callback = node.getText(ast); }
  ts.forEachChild(node, visit);
}
visit(ast);assert(callback);
const callbackJs = ts.transpile('const renderNote=' + callback, { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React });
let rendered = 0;
for (const e of pins.entries) {
  const jsx = runInNewContext(callbackJs + ';renderNote("mri")', { React, bodyContent: api.bodyContent, selected: e.identity, SourceDisplayNotes: scope.exports.SourceDisplayNotes, WorkspaceModeButton: ({ children }) => React.createElement('button', null, children), ComponentImagingNotes: () => null, ScanLine: () => null, catalog: display, side: 'both', exam: false, openNested() { throw Error('Unexpected navigation'); } });
  const html = render(jsx), draft = api.bodyLesson(e.identity, 'mri');
  assert(html.includes(render(React.createElement('p', null, draft.body))));
  for (const bullet of draft.bullets) assert(html.includes(render(React.createElement('li', null, bullet))));
  for (const url of draft.citations) assert(html.includes(url.replaceAll('&', '&amp;')));
  assert(html.includes('No imaging study loaded'));rendered++;
}
const transition = { parentCommit: pins.parentCommit, pinsHash: hash(pins), previousAllLessonsAndRecipesHash: pins.previousAllLessonsAndRecipesHash, currentAllLessonsAndRecipesHash: hash(snapshot(api, display)), entries };
const path = 'content/orbital-nerve-mri-transition.json';
if (process.argv.includes('--record')) await writeFile(path, JSON.stringify(transition, null, 2) + '\n', { flag: 'wx' });
else {
  assert.deepEqual(JSON.parse(await readFile(path)), transition);
  const { beforeOrbitalNerveMri } = await import('./orbital-nerve-mri-history.mjs');
  const previous = beforeOrbitalNerveMri(api);
  assert.deepEqual(snapshot(previous, display), snapshot(parent, display));
  assert.equal(beforeOrbitalNerveMri(previous), previous);
  const first = pins.entries[0];
  for (const [mode, error] of [['mixed', /Mixed/], ['foreign', /Unrecorded/]]) assert.throws(() => beforeOrbitalNerveMri({ ...api, bodyLesson(s, t) {
    const value = api.bodyLesson(s, t);
    return s.id === first.identity.id && t === 'mri' ? mode === 'mixed' ? first.previous.mri : { ...value, body: 'foreign' } : value;
  } }), error);
  const bad = { ...first.identity, foreign: true };
  assert.deepEqual(previous.bodyLesson(bad, 'mri'), api.bodyLesson(bad, 'mri'), 'History must not rebind foreign geometry');
}
console.log(JSON.stringify({ changed, unchanged, rejected, rendered, sourceWordCounts, transitionHash: hash(transition), clinicalApproval: false, browserTesting: false }));
