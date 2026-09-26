import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { contentContext, contentValidator } from './content-contract-tools.mjs';
import { beforeCoronaryArterialUs } from './coronary-arterial-us-history.mjs';
import { snapshot, hash } from './pin-pica-clinical.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { build } from './workspace-component-test-build.mjs';
import pins from '../content/common-interosseous-us-pins.json' with { type: 'json' };
import { commonInterosseousUsTopics as authored, commonInterosseousUsEvidenceLimit as evidenceLimit } from '../content/common-interosseous-us.ts';

const { api: currentApi, catalog, registry } = await contentContext();
const api = beforeCoronaryArterialUs(currentApi), display = api.bodyDisplayCatalog(catalog);
const parent = await exactSourceHistoryApi(pins.parentCommit);
assert.equal(pins.parentCommit, 'aca60179199870ddfdb745fb4224775cb7d0c3d8');
assert.equal(hash(pins), '18eb602bfebf1836c4412848a248ca3f09f9e0ac1982762603d6c2040640a361');
assert.equal(hash(snapshot(parent, display)), pins.previousAllLessonsAndRecipesHash);
assert.deepEqual(display, parent.bodyDisplayCatalog(catalog));
assert.deepEqual(display.coordinateSystem, pins.coordinateSystem);
assert.deepEqual(api.structures, parent.structures);
assert.deepEqual(api.dissectionProfiles, parent.dissectionProfiles);
assert.deepEqual(pins.entries.map(e => e.identity.fmaId), ['FMA22807', 'FMA22808']);
for (const bundle of pins.bundles) {
  assert.deepEqual(display.bundles.find(b => b.id === bundle.id), bundle);
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const targets = new Map(pins.entries.map(e => [e.identity.id, e]));
const records = api.bodyContentRecords(display), validate = await contentValidator(registry);
let changed = 0, unchanged = 0, rejected = 0, rendered = 0;
const entries = [];
for (const s of display.structures) for (const tab of api.contentTabs) {
  const before = parent.bodyLesson(s, tab), now = api.bodyLesson(s, tab), target = targets.get(s.id);
  if (!target || tab !== 'ultrasound') {
    assert.deepEqual(now, before, s.id + '|' + tab); unchanged++; continue;
  }
  assert.deepEqual(s, target.identity); assert.deepEqual(target.topics, ['ultrasound']);
  assert.deepEqual(before, target.previous.ultrasound); assert.equal(before.readiness, 'pending');
  assert.equal(now.readiness, 'draft'); assert.deepEqual(now, api.commonInterosseousUsLesson(s, tab));
  const { readiness: _readiness, ...shown } = now;
  assert.deepEqual(api.bodyContent(s, tab), shown);
  const record = records.find(r => r.id === s.id); assert(validate(record));
  assert.deepEqual(record.content[tab], now); assert.equal(record.validation.clinicalApproval, 'not-included');
  const packet = await api.bodyReviewMaterial(s.id); assert.equal(packet.approval, false);
  const { tab: _tab, ...topic } = packet.topics.find(t => t.tab === tab); assert.deepEqual(topic, now);
  assert.match(now.note, /review pending/); assert.match(now.note, /Creative Commons Attribution/);
  const copy = structuredClone(now); now.bullets.push('foreign'); now.citations.length = 0;
  assert.deepEqual(api.commonInterosseousUsLesson(s, tab), copy);
  entries.push({ id: s.id, tab, previousHash: hash(before), currentHash: hash(copy) }); changed++;
}
assert.equal(changed, 2); assert.equal(unchanged, 9934);
const words = [...Object.values(authored).map(t => t.body), evidenceLimit].join(' ').split(/\s+/).length;
assert(words <= 160); assert.match(evidenceLimit, /review, not a prospective diagnostic-accuracy/);
for (const e of pins.entries) assert.equal(api.bodyLesson(e.identity, 'ultrasound').body, authored[e.group].body);
const unsupported = ['FMA268667', 'FMA268669'];
for (const fma of unsupported) {
  const s = display.structures.find(s => s.fmaId === fma); assert(s);
  assert.equal(api.bodyLesson(s, 'ultrasound').readiness, 'pending', fma);
  assert.equal(api.commonInterosseousUsLesson(s, 'ultrasound'), undefined);
}
for (const fma of ['FMA22807', 'FMA22808', 'FMA22812', 'FMA22813', 'FMA268667', 'FMA268669']) {
  const s = display.structures.find(s => s.fmaId === fma); assert(s);
  assert.equal(api.bodyLesson(s, 'mri').readiness, 'pending');
}
const leaves = (value, path = []) => value === null || typeof value !== 'object' ? [path]
  : Object.entries(value).flatMap(([key, child]) => leaves(child, [...path, key]));
for (const { identity } of pins.entries) {
  for (const path of leaves(identity)) {
    const bad = structuredClone(identity); let obj = bad;
    for (const key of path.slice(0, -1)) obj = obj[key];
    const key = path.at(-1), old = obj[key]; obj[key] = typeof old === 'number' ? old + .01 : typeof old === 'boolean' ? !old : String(old) + '-foreign';
    assert.equal(api.commonInterosseousUsLesson(bad, 'ultrasound'), undefined);
    assert.equal(api.bodyLesson(bad, 'ultrasound').readiness, 'pending'); rejected++;
  }
}
for (const s of display.structures.filter(s => !targets.has(s.id)))
  assert.equal(api.commonInterosseousUsLesson(s, 'ultrasound'), undefined);

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
  const jsx = runInNewContext(callbackJs + ';renderNote("ultrasound")', { React, bodyContent: api.bodyContent,
    selected: identity, SourceDisplayNotes: scope.exports.SourceDisplayNotes,
    WorkspaceModeButton: ({ children }) => React.createElement('button', null, children),
    ComponentImagingNotes: () => null, ScanLine: () => null, catalog: display, side: 'both', exam: false,
    openNested() { throw Error('Unexpected navigation'); } });
  const html = render(jsx), lesson = api.bodyLesson(identity, 'ultrasound');
  assert(html.includes(render(React.createElement('p', null, lesson.body))));
  for (const bullet of lesson.bullets) assert(html.includes(render(React.createElement('li', null, bullet))));
  for (const url of lesson.citations) assert(html.includes(url.replaceAll('&', '&amp;')));
  assert(html.includes('No imaging study loaded')); rendered++;
}
const transition = { parentCommit: pins.parentCommit, pinsHash: hash(pins),
  previousAllLessonsAndRecipesHash: pins.previousAllLessonsAndRecipesHash,
  currentAllLessonsAndRecipesHash: hash(snapshot(api, display)), entries };
if (process.argv.includes('--record')) await writeFile('content/common-interosseous-us-transition.json', JSON.stringify(transition, null, 2) + '\n', { flag: 'wx' });
else {
  assert.deepEqual(JSON.parse(await readFile('content/common-interosseous-us-transition.json')), transition);
  const { beforeCommonInterosseousUs } = await import('./common-interosseous-us-history.mjs');
  const old = beforeCommonInterosseousUs(api);
  assert.deepEqual(snapshot(old, display), snapshot(parent, display));
  assert.equal(beforeCommonInterosseousUs(old), old);
  assert.throws(() => beforeCommonInterosseousUs({ ...api, bodyLesson(s, t) {
    const v = api.bodyLesson(s, t); return targets.has(s.id) && t === 'ultrasound' ? { ...v, body: 'foreign' } : v;
  } }), /Unrecorded/);
}
console.log(JSON.stringify({ changed, unchanged, rejected, rendered, words, transitionHash: hash(transition), clinicalApproval: false }));
