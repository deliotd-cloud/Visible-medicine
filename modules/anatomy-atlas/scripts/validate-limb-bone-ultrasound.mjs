import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { contentContext, contentValidator } from './content-contract-tools.mjs';
import { snapshot, hash } from './pin-pica-clinical.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { build } from './workspace-component-test-build.mjs';
import pins from '../content/limb-bone-ultrasound-pins.json' with { type: 'json' };
import { limbBoneImagingTopics as authored, limbBoneImagingReferences as references, limbBoneUltrasoundLimit } from '../content/limb-bone-imaging.ts';
import { beforePlantarArterialCt } from './plantar-arterial-ct-history.mjs';

const live = await contentContext(), api = beforePlantarArterialCt(live.api), display = api.bodyDisplayCatalog(live.catalog);
const parent = await exactSourceHistoryApi(pins.parentCommit);
assert.equal(pins.parentCommit, '8cd5588714338f7fd03950ab2506bf61e0bbc26f');
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
const expected = new Map(['FMA24474','FMA24475','FMA24477','FMA24478','FMA24480','FMA24481','FMA23464','FMA23465','FMA23467','FMA23468'].map(id => [id, ['ultrasound']]));
assert.equal(pins.entries.length, 10);
const targets = new Map();
for (const entry of pins.entries) {
  assert.deepEqual(entry.topics, expected.get(entry.identity.fmaId));
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
    unchanged++;
    continue;
  }
  assert.deepEqual(before, target.previous[tab]);
  assert.equal(before.readiness, 'pending');
  assert.equal(now.readiness, 'draft');
  assert.deepEqual(now, api.limbBoneImagingLesson(structure, tab));
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
  assert.deepEqual(api.limbBoneImagingLesson(structure, tab), copy, 'Return fresh arrays');
}
assert.equal(changed, 10);
assert.equal(unchanged, 9926);
const sourceWordCounts = {};
for (const entry of pins.entries) {
  const topic = authored[entry.group].ultrasound;
  for (const key of topic.references)
    sourceWordCounts[key] = (sourceWordCounts[key] ?? 0) + [topic.body, ...topic.bullets].join(' ').split(/\s+/).length;
  const lesson = api.limbBoneImagingLesson(entry.identity, 'ultrasound');
  assert(lesson.citations.includes(references.boneUS));
  assert(lesson.bullets.includes(limbBoneUltrasoundLimit));
}
sourceWordCounts.boneUS = limbBoneUltrasoundLimit.trim().split(/\s+/).length * pins.entries.length;
for (const count of Object.values(sourceWordCounts)) assert(count <= 200, 'Reference summary budget across ten placements');
for (const group of ['femur', 'tibia', 'fibula', 'radius', 'ulna']) {
  const topic = authored[group].ultrasound;
  assert(topic && typeof topic.body === 'string' && topic.body.length > 30);
  assert(Array.isArray(topic.bullets) && topic.bullets.length > 0);
  assert(topic.references.some(key => ['elbowUS', 'kneeUS', 'boneUS'].includes(key)));
  for (const key of topic.references) assert.equal(new URL(references[key]).protocol, 'https:');
}
assert.equal(authored.patella.ultrasound, undefined, 'Existing knee helper retains patella ultrasound');
for (const s of display.structures.filter(s => ['FMA24486', 'FMA24487'].includes(s.fmaId)))
  for (const tab of api.contentTabs) assert.deepEqual(api.bodyLesson(s, tab), parent.bodyLesson(s, tab), 'Patella dispatch unchanged');

const leaves = (value, path = []) => value === null || typeof value !== 'object'
  ? [path] : Object.entries(value).flatMap(([key, child]) => leaves(child, [...path, key]));
for (const entry of pins.entries) {
  const reject = bad => {
    for (const tab of entry.topics) {
      assert.equal(api.limbBoneImagingLesson(bad, tab), undefined);
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
  // Structurally missing/empty sources can be rejected by the pre-existing
  // generic knee fallback before it reaches its pending result. This exception
  // is confined to those malformed shapes; valid identity mutations stay strict.
  for (const mutate of [item => { delete item.sources; }, item => { item.sources = []; }]) {
    const bad = structuredClone(entry.identity); mutate(bad);
    assert.equal(api.limbBoneImagingLesson(bad, 'ultrasound'), undefined);
    let result, rejectedShape = false;
    try { result = api.bodyLesson(bad, 'ultrasound'); }
    catch (error) {
      assert.equal(error.name, 'TypeError');
      assert.match(error.message, /^Cannot read properties of undefined \(reading 'length'\)$/);
      rejectedShape = true;
    }
    if (!rejectedShape) assert.equal(result.readiness, 'pending');
    rejected++;
  }
  for (const mutate of [item => item.sources.push(item.sources[0]), item => item.regions.push('foreign'),
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
const path = 'content/limb-bone-ultrasound-transition.json';
if (process.argv.includes('--record'))
  await writeFile(path, JSON.stringify(transition, null, 2) + '\n', { flag: 'wx' });
else {
  assert.deepEqual(JSON.parse(await readFile(path)), transition);
  const {beforeLimbBoneUltrasound}=await import('./limb-bone-ultrasound-history.mjs');
  const previous=beforeLimbBoneUltrasound(api);
  assert.deepEqual(snapshot(previous,display),snapshot(parent,display));
  assert.equal(beforeLimbBoneUltrasound(previous),previous);
  // The generic historical API exposes lessons, not authoring constants.
  // Load those constants from the same exact Git tree, not the current file.
  const originalSource=execFileSync('git',['show',pins.parentCommit+':content/limb-bone-imaging.ts'],{encoding:'utf8'});
  const originalJs=ts.transpileModule(originalSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const original=await import('data:text/javascript;base64,'+Buffer.from(originalJs).toString('base64'));
  assert.deepEqual(previous.limbBoneImagingTopics,original.limbBoneImagingTopics);
  for(const e of pins.entries)for(const tab of e.topics)assert.equal(previous.limbBoneImagingLesson(e.identity,tab),undefined);
  const first=pins.entries[0];
  for(const [mode,error]of [['mixed',/Mixed/],['foreign',/Unrecorded/]])assert.throws(()=>beforeLimbBoneUltrasound({...api,bodyLesson(s,t){
    const value=api.bodyLesson(s,t);
    return s.id===first.identity.id&&t==='ultrasound'?mode==='mixed'?first.previous.ultrasound:{...value,body:'foreign'}:value;
  }}),error);
  const bad = { ...first.identity, foreign: true };
  assert.deepEqual(previous.bodyLesson(bad, 'ultrasound'), api.bodyLesson(bad, 'ultrasound'), 'History must not rebind foreign geometry');
}
console.log(JSON.stringify({ changed, unchanged, rejected, rendered,
  sourceWordCounts, transitionHash: hash(transition), clinicalApproval: false, browserTesting: false }));
