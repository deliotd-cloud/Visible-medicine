import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { contentContext, contentValidator } from './content-contract-tools.mjs';
import { beforeFootVascularQuiz } from './foot-vascular-quiz-history.mjs';
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const snapshot = (api, display) => ({ body: display.structures.map(s => ({ id: s.id, sections: Object.fromEntries(api.contentTabs.map(t => [t, api.bodyLesson(s, t)])) })), shoulder: api.structures, recipes: api.dissectionProfiles });
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { build } from './workspace-component-test-build.mjs';
import { build as buildLesson } from './workspace-test-build.mjs';
import pins from '../content/achilles-ct-pins.json' with { type: 'json' };
import { achillesCtTopic as authored } from '../content/achilles-ct.ts';

const { api: currentApi, catalog, registry } = await contentContext();
const api = beforeFootVascularQuiz(currentApi), display = api.bodyDisplayCatalog(catalog);
const lessonBuild = await buildLesson({ stdin: { contents: "export {achillesCtLesson} from './lib/achilles-ct';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', write: false });
const { achillesCtLesson } = await import('data:text/javascript;base64,' + Buffer.from(lessonBuild.outputFiles[0].text).toString('base64'));
const parent = await exactSourceHistoryApi(pins.parentCommit);
assert.equal(pins.parentCommit, '36c53fb9e19fca1c7e579f79d6d4807e4778ac19');
assert.equal(hash(pins), '572410d1ecdde2fbdd597ae56901c2202c840602899be544016ccce497f50d0a');
assert.equal(hash(snapshot(parent, display)), pins.previousAllLessonsAndRecipesHash);
assert.deepEqual(display, parent.bodyDisplayCatalog(catalog));
assert.deepEqual(display.coordinateSystem, pins.coordinateSystem);
assert.deepEqual(api.structures, parent.structures);
assert.deepEqual(api.dissectionProfiles, parent.dissectionProfiles);
assert.deepEqual(pins.entries.map(e => e.identity.fmaId), ['FMA258847', 'FMA264844']);
assert.deepEqual(pins.entries.map(e => e.identity.laterality), ['right', 'left']);
for (const bundle of pins.bundles) {
  assert.deepEqual(display.bundles.find(b => b.id === bundle.id), bundle);
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const targets = new Map(pins.entries.map(e => [e.identity.id, e]));
const records = api.bodyContentRecords(display);
// The base contract registry predates admitted display additions. Bind these
// records to the independently replayed, exact catalogue checked above.
const displayRegistry = new Map([...registry, ...records.map(record =>
  [record.representationScope + '|' + record.id, record])]);
const validate = await contentValidator(displayRegistry);
let changed = 0, unchanged = 0, rejected = 0, rendered = 0;
const entries = [];
for (const s of display.structures) for (const tab of api.contentTabs) {
  const before = parent.bodyLesson(s, tab), now = api.bodyLesson(s, tab), target = targets.get(s.id);
  if (!target || tab !== 'ct') {
    assert.deepEqual(now, before, s.id + '|' + tab); unchanged++; continue;
  }
  assert.deepEqual(s, target.identity); assert.deepEqual(target.topics, ['ct']);
  assert.deepEqual(before, target.previous.ct); assert.equal(before.readiness, 'pending');
  assert.equal(now.readiness, 'draft'); assert.deepEqual(now, achillesCtLesson(s, tab));
  const { readiness: _readiness, ...shown } = now;
  assert.deepEqual(api.bodyContent(s, tab), shown);
  const record = records.find(r => r.id === s.id); assert(validate(record));
  assert.deepEqual(record.content[tab], now); assert.equal(record.validation.clinicalApproval, 'not-included');
  const packet = await api.bodyReviewMaterial(s.id); assert.equal(packet.approval, false);
  const { tab: _tab, ...topic } = packet.topics.find(t => t.tab === tab); assert.deepEqual(topic, now);
  assert.match(now.note, /radiologist review/); assert.match(now.bullets.join(' '), /CC BY 4\.0/);
  assert.match(now.note, /No patient images, registration or clinical approval/);
  assert(now.citations.includes('https://creativecommons.org/licenses/by/4.0/'));
  const copy = structuredClone(now); now.bullets.push('foreign'); now.citations.length = 0;
  assert.deepEqual(achillesCtLesson(s, tab), copy);
  entries.push({ id: s.id, tab, previousHash: hash(before), currentHash: hash(copy) }); changed++;
}
assert.equal(changed, 2); assert.equal(unchanged, 9934);
const words = [authored.body, ...authored.bullets].join(' ').split(/\s+/).length;
assert(words <= 400);
for (const e of pins.entries) assert.equal(api.bodyLesson(e.identity, 'ct').body, authored.body);
for (const { identity } of pins.entries) for (const tab of api.contentTabs.filter(t => t !== 'ct')) {
  assert.equal(achillesCtLesson(identity, tab), undefined);
  assert.deepEqual(api.bodyLesson(identity, tab), parent.bodyLesson(identity, tab));
}
const leaves = (value, path = []) => value === null || typeof value !== 'object' ? [path]
  : Object.entries(value).flatMap(([key, child]) => leaves(child, [...path, key]));
for (const { identity } of pins.entries) {
  for (const bad of [{ ...identity, foreignField: true }, Object.fromEntries(Object.entries(identity).filter(([key]) => key !== 'coverageNote'))]) {
    assert.equal(achillesCtLesson(bad, 'ct'), undefined);
    assert.equal(api.bodyLesson(bad, 'ct').readiness, 'pending'); rejected++;
  }
  for (const path of leaves(identity)) {
    const bad = structuredClone(identity); let obj = bad;
    for (const key of path.slice(0, -1)) obj = obj[key];
    const key = path.at(-1), old = obj[key]; obj[key] = typeof old === 'number' ? old + .01 : typeof old === 'boolean' ? !old : String(old) + '-foreign';
    assert.equal(achillesCtLesson(bad, 'ct'), undefined);
    assert.equal(api.bodyLesson(bad, 'ct').readiness, 'pending'); rejected++;
  }
}
for (const s of display.structures.filter(s => !targets.has(s.id)))
  assert.equal(achillesCtLesson(s, 'ct'), undefined);

// Execute the actual BodyExplorer teaching callback with its disclosure component.
const require = createRequire(import.meta.url), React = require('react'), render = require('react-dom/server').renderToStaticMarkup;
const built = await build({ stdin: { contents: "export {SourceDisplayNotes} from './app/source-display-notes';",
  resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, platform: 'node', format: 'cjs', write: false });
const scope = { exports: {} }; runInNewContext(built.outputFiles[0].text, { module: scope, exports: scope.exports, require });
const source = await readFile('app/body-explorer.tsx', 'utf8');
const ast = ts.createSourceFile('body.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let callback;
function visit(n) { if (ts.isArrowFunction(n) && n.body.getText(ast).includes('const content = bodyContent(selected, value);')) {
  assert.equal(callback, undefined); callback = n.getText(ast); } ts.forEachChild(n, visit); }
visit(ast); assert(callback);
const callbackJs = ts.transpile('const renderNote=' + callback, { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React });
for (const { identity } of pins.entries) {
  const jsx = runInNewContext(callbackJs + ';renderNote("ct")', { React, bodyContent: api.bodyContent,
    selected: identity, SourceDisplayNotes: scope.exports.SourceDisplayNotes,
    WorkspaceModeButton: ({ children }) => React.createElement('button', null, children),
    ComponentImagingNotes: () => null, ScanLine: () => null, catalog: display, side: 'both', exam: false,
    openNested() { throw Error('Unexpected navigation'); } });
  const html = render(jsx), lesson = api.bodyLesson(identity, 'ct');
  assert(html.includes(render(React.createElement('p', null, lesson.body))));
  for (const bullet of lesson.bullets) assert(html.includes(render(React.createElement('li', null, bullet))));
  for (const url of lesson.citations) assert(html.includes(url.replaceAll('&', '&amp;')));
  assert(html.includes('No imaging study loaded')); rendered++;
}
const transition = { parentCommit: pins.parentCommit, pinsHash: hash(pins),
  previousAllLessonsAndRecipesHash: pins.previousAllLessonsAndRecipesHash,
  currentAllLessonsAndRecipesHash: hash(snapshot(api, display)), entries };
if (process.argv.includes('--record')) await writeFile('content/achilles-ct-transition.json', JSON.stringify(transition, null, 2) + '\n', { flag: 'wx' });
else {
  assert.deepEqual(JSON.parse(await readFile('content/achilles-ct-transition.json')), transition);
  const { beforeAchillesCt } = await import('./achilles-ct-history.mjs');
  const historyApi = { ...api, achillesCtLesson };
  const old = beforeAchillesCt(historyApi);
  assert.deepEqual(snapshot(old, display), snapshot(parent, display));
  assert.equal(beforeAchillesCt(old), old);
  assert.throws(() => beforeAchillesCt({ ...historyApi, bodyLesson(s, t) {
    const v = api.bodyLesson(s, t); return targets.has(s.id) && t === 'ct' ? { ...v, body: 'foreign' } : v;
  } }), /Unrecorded/);
  assert.throws(() => beforeAchillesCt({ ...historyApi, bodyLesson(s, t) {
    return s.id === pins.entries[0].identity.id && t === 'ct' ? structuredClone(pins.entries[0].previous.ct) : api.bodyLesson(s, t);
  } }), /Mixed/);
}
console.log(JSON.stringify({ changed, unchanged, rejected, rendered, words, transitionHash: hash(transition), clinicalApproval: false }));
