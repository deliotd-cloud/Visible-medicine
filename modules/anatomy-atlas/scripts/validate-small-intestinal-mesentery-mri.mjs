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
import pins from '../content/small-intestinal-mesentery-mri-pins.json' with { type: 'json' };
import { smallIntestinalMesenteryMriTopic as authored, smallIntestinalMesenteryMriReference as reference } from '../content/small-intestinal-mesentery-mri.ts';
import { beforeLateralCricoarytenoidUs } from './lateral-cricoarytenoid-us-history.mjs';

const live = await contentContext(), api = beforeLateralCricoarytenoidUs(live.api), display = api.bodyDisplayCatalog(live.catalog);
const parent = await exactSourceHistoryApi(pins.parentCommit);
assert.equal(pins.parentCommit, 'f7be17d1949a2a6ed05c44a9f1a808aad1348a7f');
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
const expected = new Map([['FMA14643', ['mri']]]);
assert.equal(pins.entries.length, 1);
const targets = new Map();
for (const entry of pins.entries) {
  assert.deepEqual(entry.topics, expected.get(entry.identity.fmaId));
  assert.deepEqual(display.structures.find(item => item.id === entry.identity.id), entry.identity);
  for (const tab of entry.topics) targets.set(entry.identity.id + '|' + tab, entry);
}
assert.equal(targets.size, 1);
const records = api.bodyContentRecords(display), validate = await contentValidator(live.registry);
let changed = 0, unchanged = 0, rejected = 0, rendered = 0;
const entries = [];
for (const structure of display.structures) for (const tab of api.contentTabs) {
  const before = parent.bodyLesson(structure, tab), now = api.bodyLesson(structure, tab);
  const target = targets.get(structure.id + '|' + tab);
  if (!target) {
    assert.deepEqual(now, before, structure.id + '|' + tab);
    assert.equal(api.smallIntestinalMesenteryMriLesson(structure, tab), undefined, 'MRI-only exact target helper');
    unchanged++;
    continue;
  }
  assert.deepEqual(before, target.previous[tab]);
  assert.equal(before.readiness, 'pending');
  assert.equal(now.readiness, 'draft');
  assert.deepEqual(now, api.smallIntestinalMesenteryMriLesson(structure, tab));
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
  assert.deepEqual(api.smallIntestinalMesenteryMriLesson(structure, tab), copy, 'Return fresh arrays');
}
assert.equal(changed, 1);
assert.equal(unchanged, 9935);
assert(typeof authored.body === 'string' && authored.body.length > 30);
assert(Array.isArray(authored.bullets) && authored.bullets.length > 0);
assert.equal(new URL(reference).protocol, 'https:');
const sourceWordCounts = { [reference]: [authored.body, ...authored.bullets].join(' ').trim().split(/\s+/).length };
assert(sourceWordCounts[reference] <= 200, 'Source summary budget');
const lesson = api.smallIntestinalMesenteryMriLesson(pins.entries[0].identity, 'mri');
assert.equal(lesson.body, authored.body);
for (const bullet of authored.bullets) assert(lesson.bullets.includes(bullet));
assert.deepEqual(lesson.citations, [reference, 'https://creativecommons.org/licenses/by/4.0/']);
assert.match(lesson.note, /Pierro.*2023/);
assert.match(lesson.note, /CC BY 4\.0/);
assert.match(lesson.note, /review.*pending/i);
assert.match(lesson.note, /independent/i);
const clinicalText = [authored.body, ...authored.bullets].join(' ');
assert.match(clinicalText, /Crohn/);
assert.match(clinicalText, /does not establish that diagnosis/);
assert.match(clinicalText, /bowel distension/);
assert.match(lesson.bullets.join(' '), /roots.*leaves.*vessels.*not separately validated/);
assert.match(lesson.bullets.join(' '), /separation to zero/);

const leaves = (value, path = []) => value === null || typeof value !== 'object'
  ? [path] : Object.entries(value).flatMap(([key, child]) => leaves(child, [...path, key]));
for (const entry of pins.entries) {
  const reject = bad => {
    for (const tab of entry.topics) {
      assert.equal(api.smallIntestinalMesenteryMriLesson(bad, tab), undefined);
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
  for (const fma of ['FMA14647', 'FMA16549']) {
    const foreign = display.structures.find(item => item.fmaId === fma);
    assert(foreign, 'Actual mesocolon or mesoappendix source exists');
    reject({ ...entry.identity, sources: foreign.sources });
  }
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
const path = 'content/small-intestinal-mesentery-mri-transition.json';
if (process.argv.includes('--record'))
  await writeFile(path, JSON.stringify(transition, null, 2) + '\n', { flag: 'wx' });
else {
  assert.deepEqual(JSON.parse(await readFile(path)), transition);
  const {beforeSmallIntestinalMesenteryMri}=await import('./small-intestinal-mesentery-mri-history.mjs');
  const previous=beforeSmallIntestinalMesenteryMri(api);
  assert.deepEqual(snapshot(previous,display),snapshot(parent,display));
  assert.equal(beforeSmallIntestinalMesenteryMri(previous),previous);
  for(const e of pins.entries)assert.equal(previous.smallIntestinalMesenteryMriLesson(e.identity,'mri'),undefined);
  const first=pins.entries[0];
  // With one slot, either complete old state or complete current state is valid.
  // Foreign prose still cannot be replayed as recorded history.
  assert.throws(() => beforeSmallIntestinalMesenteryMri({ ...api, bodyLesson(s, t) {
    const value = api.bodyLesson(s, t);
    return s.id === first.identity.id && t === 'mri' ? { ...value, body: 'foreign' } : value;
  } }), /Unrecorded/);
  const oldApi = { ...api, bodyLesson(s, t) {
    return s.id === first.identity.id && t === 'mri' ? structuredClone(first.previous.mri) : api.bodyLesson(s, t);
  } };
  assert.equal(beforeSmallIntestinalMesenteryMri(oldApi), oldApi);
  const bad = { ...first.identity, foreign: true };
  assert.deepEqual(previous.bodyLesson(bad, 'mri'), api.bodyLesson(bad, 'mri'), 'History must not rebind foreign geometry');
}
console.log(JSON.stringify({ changed, unchanged, rejected, rendered,
  sourceWordCounts, transitionHash: hash(transition), clinicalApproval: false, browserTesting: false }));
