import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { contentContext, contentValidator } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { beforeThoracicQuiz } from './thoracic-quiz-history.mjs';
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const snapshot = (api, display) => ({ body: display.structures.map(s => ({ id: s.id, sections: Object.fromEntries(api.contentTabs.map(t => [t, api.bodyLesson(s, t)])) })), shoulder: api.structures, recipes: api.dissectionProfiles });
const parentCommit = '0770fd3e49eb02b0430a80769744c88027c591e5';
const { api: currentApi, catalog, registry } = await contentContext();
const api = beforeThoracicQuiz(currentApi);
const display = api.bodyDisplayCatalog(catalog), parent = await exactSourceHistoryApi(parentCommit);
const fmas = ['FMA50169', 'FMA50029', 'FMA50030', 'FMA50584', 'FMA50585', 'FMA50085', 'FMA50086'];
if (process.argv.includes('--capture')) {
  const entries = fmas.map(fma => {
    const identities = display.structures.filter(s => s.fmaId === fma); assert.equal(identities.length, 1);
    const identity = identities[0]; return { identity, topics: ['ct', 'mri'], previous: Object.fromEntries(['ct', 'mri'].map(t => [t, parent.bodyLesson(identity, t)])) };
  });
  const bundleIds = new Set(entries.map(e => e.identity.bundle));
  assert(bundleIds.size > 0);
  await writeFile('content/circle-willis-imaging-pins.json', JSON.stringify({ parentCommit, coordinateSystem: display.coordinateSystem, bundles: display.bundles.filter(b => bundleIds.has(b.id)), previousAllLessonsAndRecipesHash: hash(snapshot(parent, display)), entries }, null, 2) + '\n', { flag: 'wx' });
  process.exit(0);
}
const pins = JSON.parse(await readFile('content/circle-willis-imaging-pins.json'));
const { circleWillisRelationships, circleWillisModalities } = await import('../content/circle-willis-imaging.ts');
// Count each shared original fact once per reference, across side/topic repetition.
const derivedWords = new Map();
for (const note of [...Object.values(circleWillisRelationships), ...Object.values(circleWillisModalities)]) {
  const words = [note.body, ...(note.bullets || [])].join(' ').split(/\s+/).length;
  for (const url of note.citations) derivedWords.set(url, (derivedWords.get(url) || 0) + words);
}
for (const [url, words] of derivedWords) assert(words <= 200, url + ': derived word budget');
assert.equal(hash(pins), 'b5e35e27b271b5b9e3932872f168735428416882918c12554a9ff03c06f87f7e');
assert.equal(pins.bundles.length, 1);
assert.equal(pins.parentCommit, parentCommit);
assert.equal(hash(snapshot(parent, display)), pins.previousAllLessonsAndRecipesHash);
assert.deepEqual(display, parent.bodyDisplayCatalog(catalog));
assert.deepEqual(display.coordinateSystem, pins.coordinateSystem);
assert.deepEqual(pins.entries.map(e => e.identity.fmaId), fmas);
assert.deepEqual(pins.entries.map(e => e.identity.laterality), ['midline', 'right', 'left', 'right', 'left', 'right', 'left']);
for (const bundle of pins.bundles) {
  assert.deepEqual(display.bundles.find(b => b.id === bundle.id), bundle);
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes); assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const targets = new Map(pins.entries.map(e => [e.identity.id, e]));
const records = api.bodyContentRecords(display), validate = await contentValidator(new Map([...registry, ...records.map(r => [r.representationScope + '|' + r.id, r])]));
let changed = 0, unchanged = 0, rejected = 0, rendered = 0;
const entries = [];
for (const s of display.structures) for (const tab of api.contentTabs) {
  const before = parent.bodyLesson(s, tab), now = api.bodyLesson(s, tab), target = targets.get(s.id);
  if (!target || !target.topics.includes(tab)) { assert.deepEqual(now, before, s.id + '|' + tab); unchanged++; continue; }
  assert.deepEqual(s, target.identity); assert.deepEqual(before, target.previous[tab]); assert.equal(before.readiness, 'pending');
  assert.equal(now.readiness, 'draft'); assert.deepEqual(now, api.circleWillisImagingLesson(s, tab));
  const { readiness, ...shown } = now; assert.deepEqual(api.bodyContent(s, tab), shown);
  const record = records.find(r => r.id === s.id); assert(validate(record)); assert.deepEqual(record.content[tab], now);
  assert.equal(record.validation.clinicalApproval, 'not-included');
  const packet = await api.bodyReviewMaterial(s.id); assert.equal(packet.approval, false);
  const { tab: reviewTab, ...topic } = packet.topics.find(t => t.tab === tab); assert.deepEqual(topic, now);
  assert.match(now.note, /revision-bound radiologist review/); assert.match(now.note, /No patient images, registration or clinical approval/);
  const copy = structuredClone(now); now.bullets.push('foreign'); now.citations.length = 0; assert.deepEqual(api.circleWillisImagingLesson(s, tab), copy);
  assert(copy.body.split(/\s+/).length <= 70);
  entries.push({ id: s.id, tab, previousHash: hash(before), currentHash: hash(copy) }); changed++;
}
assert.equal(changed, 14); assert.equal(unchanged, 9922);
const leaves = (value, path = []) => value === null || typeof value !== 'object' ? [path] : Object.entries(value).flatMap(([key, child]) => leaves(child, [...path, key]));
for (const { identity } of pins.entries) {
  for (const tab of api.contentTabs.filter(t => t !== 'ct' && t !== 'mri')) assert.equal(api.circleWillisImagingLesson(identity, tab), undefined);
  const mutations = [{ ...identity, foreignField: true }, Object.fromEntries(Object.entries(identity).filter(([key]) => key !== 'coverageNote'))];
  for (const path of leaves(identity)) {
    const bad = structuredClone(identity); let obj = bad; for (const key of path.slice(0, -1)) obj = obj[key];
    const key = path.at(-1), old = obj[key]; obj[key] = typeof old === 'number' ? old + .01 : typeof old === 'boolean' ? !old : String(old) + '-foreign'; mutations.push(bad);
  }
  for (const bad of mutations) for (const tab of ['ct', 'mri']) { assert.equal(api.circleWillisImagingLesson(bad, tab), undefined); assert.equal(api.bodyLesson(bad, tab).readiness, 'pending'); rejected++; }
}
for (const s of display.structures.filter(s => !targets.has(s.id))) for (const tab of ['ct', 'mri']) assert.equal(api.circleWillisImagingLesson(s, tab), undefined);
// Render the actual BodyExplorer callback and source disclosure.
const { createRequire } = await import('node:module'), { runInNewContext } = await import('node:vm');
const { default: ts } = await import('typescript'); const { build } = await import('./workspace-component-test-build.mjs');
const require = createRequire(import.meta.url), React = require('react'), render = require('react-dom/server').renderToStaticMarkup;
const built = await build({ stdin: { contents: "export {SourceDisplayNotes} from './app/source-display-notes';", resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, platform: 'node', format: 'cjs', write: false });
const scope = { exports: {} }; runInNewContext(built.outputFiles[0].text, { module: scope, exports: scope.exports, require });
const source = await readFile('app/body-explorer.tsx', 'utf8'), ast = ts.createSourceFile('body.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX); let callback;
function visit(n) { if (ts.isArrowFunction(n) && n.body.getText(ast).includes('const content = bodyContent(selected, value);')) { assert.equal(callback, undefined); callback = n.getText(ast); } ts.forEachChild(n, visit); }
visit(ast); assert(callback); const callbackJs = ts.transpile('const renderNote=' + callback, { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React });
for (const { identity } of pins.entries) for (const tab of ['ct', 'mri']) {
  const jsx = runInNewContext(callbackJs + ';renderNote("' + tab + '")', { React, bodyContent: api.bodyContent, selected: identity, SourceDisplayNotes: scope.exports.SourceDisplayNotes, WorkspaceModeButton: ({ children }) => React.createElement('button', null, children), ComponentImagingNotes: () => null, ScanLine: () => null, catalog: display, side: 'both', exam: false, openNested() { throw Error('Unexpected navigation'); } });
  const html = render(jsx), lesson = api.bodyLesson(identity, tab); assert(html.includes(render(React.createElement('p', null, lesson.body))));
  for (const bullet of lesson.bullets) assert(html.includes(render(React.createElement('li', null, bullet))));
  for (const url of lesson.citations) assert(html.includes(url.replaceAll('&', '&amp;'))); assert(html.includes('No imaging study loaded')); rendered++;
}
const transition = { parentCommit, pinsHash: hash(pins), previousAllLessonsAndRecipesHash: pins.previousAllLessonsAndRecipesHash, currentAllLessonsAndRecipesHash: hash(snapshot(api, display)), entries };
if (process.argv.includes('--record')) await writeFile('content/circle-willis-imaging-transition.json', JSON.stringify(transition, null, 2) + '\n', { flag: 'wx' });
else {
  assert.deepEqual(JSON.parse(await readFile('content/circle-willis-imaging-transition.json')), transition);
  const { beforeCircleWillisImaging } = await import('./circle-willis-imaging-history.mjs'); const old = beforeCircleWillisImaging(api);
  assert.deepEqual(snapshot(old, display), snapshot(parent, display)); assert.equal(beforeCircleWillisImaging(old), old);
  assert.throws(() => beforeCircleWillisImaging({ ...api, bodyLesson(s,t) { const v = api.bodyLesson(s,t); return targets.has(s.id) && t === 'ct' ? {...v, body:'foreign'} : v; } }), /Unrecorded/);
  assert.throws(() => beforeCircleWillisImaging({ ...api, bodyLesson(s,t) { return s.id === pins.entries[0].identity.id && t === 'ct' ? structuredClone(pins.entries[0].previous.ct) : api.bodyLesson(s,t); } }), /Mixed/);
}
console.log(JSON.stringify({ changed, unchanged, rejected, rendered, derivedWords: Object.fromEntries(derivedWords), pinsHash: hash(pins), transitionHash: hash(transition), clinicalApproval: false }));
