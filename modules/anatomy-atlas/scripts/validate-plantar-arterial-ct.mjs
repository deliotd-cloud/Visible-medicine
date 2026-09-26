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
import pins from '../content/plantar-arterial-ct-pins.json' with { type: 'json' };
import { plantarArterialCtTopics as authored, plantarArterialCtReferences as references, plantarArterialCtGroups as groups, sharedImaging } from '../content/plantar-arterial-ct.ts';
import { beforeTransverseMesocolonMri } from './transverse-mesocolon-mri-history.mjs';

const live = await contentContext(), api = beforeTransverseMesocolonMri(live.api), display = api.bodyDisplayCatalog(live.catalog);
const parent = await exactSourceHistoryApi(pins.parentCommit);
assert.equal(pins.parentCommit, '98ec565d1e959466dd5a59da23d10ac9d7c25eaa');
assert.deepEqual(display, parent.bodyDisplayCatalog(live.catalog), 'No anatomy or catalogue change');
assert.deepEqual(display.coordinateSystem, pins.coordinateSystem);
assert.equal(hash(snapshot(parent, display)), pins.previousAllLessonsAndRecipesHash);
assert.deepEqual(api.structures, parent.structures);
assert.deepEqual(api.dissectionProfiles, parent.dissectionProfiles);
for (const bundle of pins.bundles) {
  assert.deepEqual(display.bundles.find(item => item.id === bundle.id), bundle);
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const expected = new Map(['FMA43929','FMA43930','FMA43931','FMA43932','FMA43943','FMA43944','FMA69514','FMA69515','FMA43937','FMA43938'].map(id => [id, ['ct']]));
assert.equal(pins.entries.length, 10);
const targets = new Map();
for (const entry of pins.entries) {
  assert.deepEqual(entry.topics, expected.get(entry.identity.fmaId));
  assert(groups[entry.group].includes(entry.identity.fmaId));
  assert.deepEqual(display.structures.find(item => item.id === entry.identity.id), entry.identity);
  for (const tab of entry.topics) targets.set(entry.identity.id + '|' + tab, entry);
}
assert.equal(targets.size, 10);
const records = api.bodyContentRecords(display), validate = await contentValidator(live.registry);
let changed = 0, unchanged = 0, rejected = 0, rendered = 0;
const entries = [];
for (const structure of display.structures) for (const tab of api.contentTabs) {
  const before = parent.bodyLesson(structure, tab), now = api.bodyLesson(structure, tab);
  const target = targets.get(structure.id + '|' + tab);
  if (!target) {
    assert.deepEqual(now, before, structure.id + '|' + tab);
    assert.equal(api.plantarArterialCtLesson(structure, tab), undefined, 'CT-only exact target helper');
    unchanged++;
    continue;
  }
  assert.deepEqual(before, target.previous[tab]);
  assert.equal(before.readiness, 'pending');
  assert.equal(now.readiness, 'draft');
  assert.deepEqual(now, api.plantarArterialCtLesson(structure, tab));
  assert.match(now.note, /review.*pending/i);
  assert.match(now.note, /independent/i);
  const { readiness: _readiness, ...shown } = now;
  assert.deepEqual(api.bodyContent(structure, tab), shown);
  const record = records.find(item => item.id === structure.id);
  assert(validate(record));
  assert.deepEqual(record.content[tab], now);
  assert.equal(record.validation.clinicalApproval, 'not-included');
  const packet = await api.bodyReviewMaterial(structure.id);
  assert.equal(packet.approval, false);
  const { tab: _reviewTab, ...review } = packet.topics.find(item => item.tab === tab);
  assert.deepEqual(review, now);
  entries.push({ id: structure.id, tab, previousHash: hash(before), currentHash: hash(now) });
  changed++;
  const copy = structuredClone(now);
  now.bullets.push('foreign'); now.citations.length = 0;
  assert.deepEqual(api.plantarArterialCtLesson(structure, tab), copy, 'Return fresh arrays');
}
assert.equal(changed, 10);
assert.equal(unchanged, 9926);
assert.equal(Object.keys(authored).length, 5);
const sourceWordCounts = {};
for (const entry of pins.entries) {
  const topic = authored[entry.group];
  assert(topic && typeof topic.body === 'string' && topic.body.length > 30);
  assert(Array.isArray(topic.bullets) && topic.bullets.length > 0);
  const lesson = api.plantarArterialCtLesson(entry.identity, 'ct');
  assert.equal(lesson.body, topic.body);
  assert(lesson.bullets.includes(sharedImaging));
  assert(lesson.citations.includes(references.cta));
  for (const key of topic.references) {
    assert(lesson.citations.includes(references[key]));
    // Count both placements. Shared app constraints are not source summaries;
    // include the arch/deep cohort and specimen caveats conservatively.
    const texts = [topic.body, ...(['arch', 'deep'].includes(key) ? topic.bullets : [])];
    sourceWordCounts[key] = (sourceWordCounts[key] ?? 0) + texts.join(' ').trim().split(/\s+/).length;
  }
  assert(lesson.citations.length > 0);
  for (const url of lesson.citations) assert.equal(new URL(url).protocol, 'https:');
}
sourceWordCounts.cta = sharedImaging.trim().split(/\s+/).length * pins.entries.length
  + [...authored.arch.bullets, ...authored.superficial.bullets].join(' ').trim().split(/\s+/).length * 2;
for (const count of Object.values(sourceWordCounts)) assert(count <= 200, 'Reference summary budget across ten placements');
assert.match(sharedImaging, /case/i);
assert.match(sharedImaging, /not reliable.*detection/i);
assert.match(authored.arch.body, /cadaver|specimen/i);
assert.match(authored.deep.body, /16.*20/);
assert.match(authored.superficial.bullets.join(' '), /visibility.*unproven/i);
const dorsalVenousArches = display.structures.filter(s => /dorsal.*venous.*arch/i.test(s.name));
assert.equal(dorsalVenousArches.length, 2);
for (const structure of dorsalVenousArches) for (const tab of api.contentTabs) {
  assert.deepEqual(api.bodyLesson(structure, tab), parent.bodyLesson(structure, tab), 'Dorsal venous arches unchanged');
  assert.equal(api.plantarArterialCtLesson(structure, tab), undefined);
}

const leaves = (value, path = []) => value === null || typeof value !== 'object'
  ? [path] : Object.entries(value).flatMap(([key, child]) => leaves(child, [...path, key]));
for (const entry of pins.entries) {
  const reject = bad => {
    for (const tab of entry.topics) {
      assert.equal(api.plantarArterialCtLesson(bad, tab), undefined);
      assert.equal(api.bodyLesson(bad, tab).readiness, 'pending');
      rejected++;
    }
  };
  for (const path of leaves(entry.identity)) {
    const bad = structuredClone(entry.identity);
    let value = bad;
    for (const key of path.slice(0, -1)) value = value[key];
    const key = path.at(-1), old = value[key];
    value[key] = typeof old === 'number' ? old + .01 : typeof old === 'boolean' ? !old : String(old) + '-foreign';
    reject(bad);
  }
  for (const mutate of [item => { delete item.sources; }, item => { item.sources = []; },
    item => item.sources.push(item.sources[0]), item => item.regions.push('foreign'),
    item => { item.foreign = true; }]) {
    const bad = structuredClone(entry.identity); mutate(bad); reject(bad);
  }
  for (const other of pins.entries.filter(item => item.identity.id !== entry.identity.id))
    reject({ ...entry.identity, sources: other.identity.sources });
}

// Execute the real BodyExplorer note callback in the existing disclosure component.
const require = createRequire(import.meta.url), React = require('react');
const render = require('react-dom/server').renderToStaticMarkup;
const built = await build({ stdin: {
  contents: "export {SourceDisplayNotes} from './app/source-display-notes';",
  resolveDir: process.cwd(), loader: 'tsx',
}, bundle: true, platform: 'node', format: 'cjs', write: false });
const scope = { exports: {} };
runInNewContext(built.outputFiles[0].text, { module: scope, exports: scope.exports, require });
const source = await readFile('app/body-explorer.tsx', 'utf8');
const ast = ts.createSourceFile('body.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let callback;
function visit(node) {
  if (ts.isArrowFunction(node) && node.body.getText(ast).includes('const content = bodyContent(selected, value);')) {
    assert.equal(callback, undefined); callback = node.getText(ast);
  }
  ts.forEachChild(node, visit);
}
visit(ast); assert(callback);
const callbackJs = ts.transpile('const renderNote=' + callback, { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React });
for (const entry of pins.entries) for (const tab of entry.topics) {
  const jsx = runInNewContext(callbackJs + ';renderNote(requestedTab)', {
    React, requestedTab: tab, bodyContent: api.bodyContent, selected: entry.identity,
    SourceDisplayNotes: scope.exports.SourceDisplayNotes,
    WorkspaceModeButton: ({ children }) => React.createElement('button', null, children),
    ComponentImagingNotes: () => null, ScanLine: () => null, catalog: display,
    side: 'both', exam: false, openNested() { throw Error('Unexpected navigation'); },
  });
  const html = render(jsx), draft = api.bodyLesson(entry.identity, tab);
  assert(html.includes(render(React.createElement('p', null, draft.body))));
  for (const bullet of draft.bullets) assert(html.includes(render(React.createElement('li', null, bullet))));
  for (const url of draft.citations) assert(html.includes(url.replaceAll('&', '&amp;')));
  assert(html.includes('No imaging study loaded'));
  rendered++;
}
const transition = { parentCommit: pins.parentCommit, pinsHash: hash(pins),
  previousAllLessonsAndRecipesHash: pins.previousAllLessonsAndRecipesHash,
  currentAllLessonsAndRecipesHash: hash(snapshot(api, display)), entries };
const path = 'content/plantar-arterial-ct-transition.json';
if (process.argv.includes('--record'))
  await writeFile(path, JSON.stringify(transition, null, 2) + '\n', { flag: 'wx' });
else {
  assert.deepEqual(JSON.parse(await readFile(path)), transition);
  const {beforePlantarArterialCt}=await import('./plantar-arterial-ct-history.mjs');
  const previous=beforePlantarArterialCt(api);
  assert.deepEqual(snapshot(previous,display),snapshot(parent,display));
  assert.equal(beforePlantarArterialCt(previous),previous);
  for(const e of pins.entries)assert.equal(previous.plantarArterialCtLesson(e.identity,'ct'),undefined);
  const first=pins.entries[0];
  for(const [mode,error]of [['mixed',/Mixed/],['foreign',/Unrecorded/]])assert.throws(()=>beforePlantarArterialCt({...api,bodyLesson(s,t){
    const value=api.bodyLesson(s,t);
    return s.id===first.identity.id&&t==='ct'?mode==='mixed'?first.previous.ct:{...value,body:'foreign'}:value;
  }}),error);
  const bad = { ...first.identity, foreign: true };
  assert.deepEqual(previous.bodyLesson(bad, 'ct'), api.bodyLesson(bad, 'ct'), 'History must not rebind foreign geometry');
}
console.log(JSON.stringify({ changed, unchanged, rejected, rendered,
  sourceWordCounts, transitionHash: hash(transition), clinicalApproval: false, browserTesting: false }));
