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
import pins from '../content/laryngeal-framework-imaging-pins.json' with { type: 'json' };
import original from '../content/laryngeal-imaging-transition.json' with { type: 'json' };
import { laryngealFrameworkImagingTopics as authored } from '../content/laryngeal-framework-imaging.ts';
import { beforeOrbitalNerveMri } from './orbital-nerve-mri-history.mjs';

const live = await contentContext(), api = beforeOrbitalNerveMri(live.api), display = api.bodyDisplayCatalog(live.catalog);
const parent = await exactSourceHistoryApi(pins.parentCommit);
assert.deepEqual(display, parent.bodyDisplayCatalog(live.catalog), 'Geometry and identities unchanged');
assert.equal(hash(snapshot(parent, display)), pins.previousAllLessonsAndRecipesHash);
assert.deepEqual(api.structures, parent.structures);assert.deepEqual(api.dissectionProfiles, parent.dissectionProfiles);
for (const b of pins.bundles) {
  assert.deepEqual(display.bundles.find(x => x.id === b.id), b);
  const bytes = await readFile('public' + b.url.split('?')[0]);
  assert.equal(bytes.length, b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'), b.sha256);
}
const targets = new Map();
for (const e of pins.entries) {
  assert.deepEqual(display.structures.find(s => s.id === e.identity.id), e.identity);
  for (const tab of e.topics) targets.set(e.identity.id + '|' + tab, e);
}
const records = api.bodyContentRecords(display), validate = await contentValidator(live.registry);
let changed = 0, unchanged = 0, rejected = 0;const entries = [];
for (const s of display.structures) for (const tab of api.contentTabs) {
  const before = parent.bodyLesson(s, tab), now = api.bodyLesson(s, tab), target = targets.get(s.id + '|' + tab);
  if (!target) { assert.deepEqual(now, before);assert.equal(api.laryngealFrameworkImagingLesson(s, tab), undefined);unchanged++;continue; }
  assert.deepEqual(before, target.previous[tab]);assert.equal(before.readiness, 'pending');assert.equal(now.readiness, 'draft');
  assert.deepEqual(now, api.laryngealFrameworkImagingLesson(s, tab));
  assert.match(now.note, /review/i);assert.match(now.note, /independent/);
  const { readiness: _readiness, ...shown } = now;assert.deepEqual(api.bodyContent(s, tab), shown);
  const record = records.find(r => r.id === s.id);assert(validate(record));assert.deepEqual(record.content[tab], now);
  assert.equal(record.validation.clinicalApproval, 'not-included');
  const packet = await api.bodyReviewMaterial(s.id);assert.equal(packet.approval, false);
  const { tab: _reviewTab, ...review } = packet.topics.find(t => t.tab === tab);assert.deepEqual(review, now);
  entries.push({ id: s.id, tab, previousHash: hash(before), currentHash: hash(now) });changed++;
  const copy = structuredClone(now);now.bullets.push('foreign');now.citations.length = 0;
  assert.deepEqual(api.laryngealFrameworkImagingLesson(s, tab), copy);
}
assert.equal(changed, 8);assert.equal(unchanged, 9928);
assert.match(authored.cricoid.ultrasound.body, /entire posterior cartilage ring/);
assert.match(authored.arytenoid.ct.body, /does not establish ankylosis/);
assert.match(authored.arytenoid.mri.body, /fixed cadaver.*routine clinical MRI/);
assert.match(authored.arytenoid.mri.bullets.join(' '), /4.7 T.*contrast immersion/);
const sourceText = new Map();
for (const group of Object.values(authored)) for (const topic of Object.values(group)) for (const url of topic.citations) {
  assert.equal(new URL(url).protocol, 'https:');
  const texts = sourceText.get(url) ?? new Set();
  for (const text of [topic.body, ...topic.bullets]) texts.add(text);
  sourceText.set(url, texts);
}
for (const [url, texts] of sourceText) assert([...texts].join(' ').split(/\s+/).length <= 200, url + ' source summary budget');
// Preserve the original six laryngeal drafts and their immutable evidence.
for (const e of original.entries) assert.equal(hash(api.bodyLesson(display.structures.find(s => s.id === e.id), e.tab)), e.currentHash);
const leaves = (v, p = []) => v === null || typeof v !== 'object' ? [p] : Object.entries(v).flatMap(([k, x]) => leaves(x, [...p, k]));
for (const e of pins.entries) {
  const reject = s => { for (const tab of e.topics) { assert.equal(api.laryngealFrameworkImagingLesson(s, tab), undefined);assert.equal(api.bodyLesson(s, tab).readiness, 'pending');rejected++; } };
  for (const path of leaves(e.identity)) {
    const bad = structuredClone(e.identity);let value = bad;
    for (const key of path.slice(0, -1)) value = value[key];
    const key = path.at(-1), old = value[key];value[key] = typeof old === 'number' ? old + .01 : typeof old === 'boolean' ? !old : String(old) + '-foreign';reject(bad);
  }
  for (const mutate of [s => { delete s.sources; }, s => s.sources.pop(), s => s.sources.push(s.sources[0]), s => s.regions.push('foreign'), s => { s.foreign = true; }]) {
    const bad = structuredClone(e.identity);mutate(bad);reject(bad);
  }
}
const transition = { parentCommit: pins.parentCommit, pinsHash: hash(pins), previousAllLessonsAndRecipesHash: pins.previousAllLessonsAndRecipesHash, currentAllLessonsAndRecipesHash: hash(snapshot(api, display)), entries };
const path = 'content/laryngeal-framework-imaging-transition.json';
if (process.argv.includes('--record')) await writeFile(path, JSON.stringify(transition, null, 2) + '\n', { flag: 'wx' });
else assert.deepEqual(JSON.parse(await readFile(path)), transition);
const { beforeLaryngealFrameworkImaging } = await import('./laryngeal-framework-imaging-history.mjs');
const previous = beforeLaryngealFrameworkImaging(api);
assert.deepEqual(snapshot(previous, display), snapshot(parent, display));
assert.equal(beforeLaryngealFrameworkImaging(previous), previous);
const first = pins.entries[0], firstTab = first.topics[0];
for (const [mode, error] of [['mixed', /Mixed/], ['foreign', /Unrecorded/]]) assert.throws(() => beforeLaryngealFrameworkImaging({ ...api, bodyLesson(s, t) {
  const value = api.bodyLesson(s, t);
  return s.id === first.identity.id && t === firstTab ? mode === 'mixed' ? first.previous[firstTab] : { ...value, body: 'foreign' } : value;
} }), error);
// Execute the real existing note callback, not a replacement test component.
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
for (const e of pins.entries) for (const topic of e.topics) {
  const jsx = runInNewContext(callbackJs + ';renderNote(topic)', { React, topic, bodyContent: api.bodyContent, selected: e.identity, SourceDisplayNotes: scope.exports.SourceDisplayNotes, WorkspaceModeButton: ({ children }) => React.createElement('button', null, children), ComponentImagingNotes: () => null, ScanLine: () => null, catalog: display, side: 'both', exam: false, openNested() { throw Error('Unexpected navigation'); } });
  const html = render(jsx), draft = api.bodyLesson(e.identity, topic);
  assert(html.includes(render(React.createElement('p', null, draft.body))));
  for (const bullet of draft.bullets) assert(html.includes(render(React.createElement('li', null, bullet))));
  for (const url of draft.citations) assert(html.includes(url.replaceAll('&', '&amp;')));
  assert(html.includes('No imaging study loaded'));rendered++;
}
console.log(JSON.stringify({ changed, unchanged, rejected, rendered, originalSixPreserved: true, transitionHash: hash(transition), clinicalApproval: false, browserTesting: false }));
