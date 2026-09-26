import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import pins from '../content/thoracoabdominal-organ-imaging-pins.json' with { type: 'json' };
import transition from '../content/esophagus-external-ultrasound.transition.json' with { type: 'json' };
import { contentContext, contentValidator } from './content-contract-tools.mjs';
import { wholeBodyTeachingSnapshot } from './exact-clinical-reference-history.mjs';
import { beforeEsophagusExternalUltrasound, esophagusUltrasoundHash as hash } from './esophagus-external-ultrasound-history.mjs';
import { build } from './workspace-component-test-build.mjs';
import { beforeLaryngealFrameworkImaging } from './laryngeal-framework-imaging-history.mjs';

const loaded = await contentContext();
const live = { ...loaded, api: beforeLaryngealFrameworkImaging(loaded.api) }, { api, catalog } = live;
const before = beforeEsophagusExternalUltrasound(live).api;
assert.equal(beforeEsophagusExternalUltrasound({ api: before }).api, before);
assert.equal(hash(wholeBodyTeachingSnapshot(before, catalog)), transition.previousAllLessonsAndRecipesHash,
  'Unrelated whole-body teaching, shoulder or recipes changed');
const display = api.bodyDisplayCatalog(catalog);
const { identity: s } = pins.entries.find(e => e.group === 'esophagus');
assert.deepEqual(display.structures.find(e => e.id === s.id), s);
assert.equal(s.fmaId, 'FMA7131');assert.equal(s.sources[0].file, 'FJ2563');
const bundle = display.bundles.find(b => b.id === s.bundle);
const bytes = await readFile('public' + bundle.url.split('?')[0]);
assert.equal(bytes.length, bundle.bytes);
assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
const draft = api.thoracoabdominalOrganImagingLesson(s, 'ultrasound');
assert.deepEqual(api.bodyLesson(s, 'ultrasound'), draft);
assert.equal(hash(draft), transition.draftHash);assert.equal(draft.readiness, 'draft');
assert.deepEqual(before.bodyLesson(s, 'ultrasound'), transition.previous);
const { readiness: _r, ...shown } = draft;
assert.deepEqual(api.bodyContent(s, 'ultrasound'), shown);
assert.match(draft.body, /cervical oesophagus.*left of the trachea.*lower left thyroid pole/);
assert.match(draft.body, /81 adults.*three symptomatic.*not complete-organ validation/);
assert.match(draft.bullets.join(' '), /transcutaneous.*endoscopic.*transoesophageal/);
assert.match(draft.bullets.join(' '), /no sonographic layers, motility, measurements, patency, normality or registered probe plane/);
assert.match(draft.note, /review pending/);
for (const url of ['https://pmc.ncbi.nlm.nih.gov/articles/PMC8163523/', 'https://pubmed.ncbi.nlm.nih.gov/30402811/']) assert(draft.citations.includes(url));
const fact = api.thoracoabdominalOrganImagingGroups.esophagus.focus.ultrasound;
assert((fact.body + ' ' + fact.pitfall).split(/\s+/).length <= 180);
const record = api.bodyContentRecords(display).find(e => e.id === s.id);
assert.deepEqual(record.content.ultrasound, draft);
assert.equal(record.validation.clinicalApproval, 'not-included');
assert((await contentValidator(live.registry))(record));
let changed = 0, unchanged = 0;
for (const structure of display.structures) for (const tab of api.contentTabs) {
  if (structure.id === s.id && tab === 'ultrasound') { changed++;continue; }
  assert.deepEqual(api.bodyLesson(structure, tab), before.bodyLesson(structure, tab));unchanged++;
}
assert.equal(changed, 1);assert.equal(unchanged, 9935);
const leaves = (v, path = []) => v === null || typeof v !== 'object' ? [path] : Object.entries(v).flatMap(([k, x]) => leaves(x, [...path, k]));
const arrays = (v, path = []) => v && typeof v === 'object' ? [...(Array.isArray(v) ? [path] : []), ...Object.entries(v).flatMap(([k, x]) => arrays(x, [...path, k]))] : [];
let rejected = 0;
function reject(bad) {
  assert.equal(api.thoracoabdominalOrganImagingLesson(bad, 'ultrasound'), undefined);
  assert.equal(api.bodyLesson(bad, 'ultrasound').readiness, 'pending');rejected++;
}
for (const path of leaves(s)) {
  const bad = structuredClone(s);let cursor = bad;
  for (const key of path.slice(0, -1)) cursor = cursor[key];
  const key = path.at(-1), value = cursor[key];
  cursor[key] = typeof value === 'number' ? value + .01 : typeof value === 'boolean' ? !value : String(value) + '-foreign';reject(bad);
}
for (const path of arrays(s)) {
  const bad = structuredClone(s);let cursor = bad;
  for (const key of path) cursor = cursor[key];
  cursor.push('foreign');reject(bad);
}
reject({ ...structuredClone(s), foreign: true });
const nestedExtra = structuredClone(s);nestedExtra.sources[0].foreign = true;reject(nestedExtra);
assert.throws(() => beforeEsophagusExternalUltrasound({ api: { ...api, bodyLesson(structure, tab) {
  const lesson = api.bodyLesson(structure, tab);
  return structure.id === s.id && tab === 'ultrasound' ? { ...lesson, body: 'foreign' } : lesson;
} } }), /Unrecorded/);
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
const jsx = runInNewContext(callbackJs + ';renderNote(topic)', { React, topic: 'ultrasound', bodyContent: api.bodyContent, selected: s, SourceDisplayNotes: scope.exports.SourceDisplayNotes, WorkspaceModeButton: ({ children }) => React.createElement('button', null, children), ComponentImagingNotes: () => null, ScanLine: () => null, catalog: display, side: 'both', exam: false, openNested() { throw Error('Unexpected navigation'); } });
const html = render(jsx);
assert(html.includes(render(React.createElement('p', null, draft.body))));
for (const bullet of draft.bullets) assert(html.includes(render(React.createElement('li', null, bullet))));
for (const url of draft.citations) assert(html.includes(url.replaceAll('&', '&amp;')));
assert(html.includes('No imaging study loaded'));assert(html.includes('review pending'));
console.log(JSON.stringify({ changed, unchanged, rejected, actualPanelRender: true, wholeSnapshotPreserved: true, sourceBytesUnchanged: true, clinicalApproval: false }));
