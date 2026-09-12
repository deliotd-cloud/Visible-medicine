import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
import { readGlb, compressGlb, validateGlbDelivery } from './glb-lossless-codec.mjs';
import { hraDigest, hraAccessor } from './hra-pelvis-source.mjs';

const source = readGlb(await readFile('content/sources/hra-renal/renal-source.glb'));
const bytes = await readFile('public/models/hra-renal/kidneys.glb'), display = readGlb(bytes);
const raw = JSON.parse(await readFile('public/models/hra-renal/catalog.json'));
assert.equal(hraDigest(bytes), raw.bundles[0].sha256);
assert.equal(bytes.length, raw.bundles[0].bytes);
assert.equal(raw.clinicalApproval, false); assert.equal(raw.patientRegistration, false);
assert.equal(display.json.nodes.length, 82);
assert.equal(new Set(raw.structures.map(s => s.id)).size, 82);
assert.equal(new Set(raw.structures.map(s => s.name)).size, 82);
assert(!display.json.textures?.length && !display.json.images?.length && !display.json.animations?.length);
let values = 0;
for (const n of source.json.nodes) {
  const other = display.json.nodes.find(d => d.name === n.name);
  assert.equal(!!other, !Object.hasOwn(raw.heldNodes, n.name));
  if (!other) continue;
  assert(!other.matrix && !other.translation && !other.rotation && !other.scale);
  const s = raw.structures.find(s => s.nodeName === n.name);
  assert.equal(s.originalNodeIndex, n.extras.originalNodeIndex);
  const a = source.json.meshes[n.mesh].primitives[0], b = display.json.meshes[other.mesh].primitives[0];
  assert.deepEqual(Object.keys(a.attributes), Object.keys(b.attributes));
  const indices = hraAccessor(source.json, source.bin, a.indices);
  assert.deepEqual(hraAccessor(display.json, display.bin, b.indices), indices);
  assert.equal(indices.length, s.triangles * 3); values += indices.length;
  for (const [key, ai] of Object.entries(a.attributes)) {
    const input = hraAccessor(source.json, source.bin, ai), output = hraAccessor(display.json, display.bin, b.attributes[key]);
    assert.deepEqual(output, key === 'POSITION' ? input.map(p => p.map(v => Math.fround(v * 10))) : input, s.name + ' ' + key);
    values += input.reduce((n, p) => n + p.length, 0);
    if (key === 'POSITION') {
      assert(output.some(p => p.every((v, k) => v === s.anchor[k])));
      for (let k = 0; k < 3; k++) {
        assert.equal(s.bounds.min[k], Math.min(...output.map(p => p[k])));
        assert.equal(s.bounds.max[k], Math.max(...output.map(p => p[k])));
      }
    }
  }
  assert.equal(s.laterality, /_L(?:_|$)|_left_/.test(n.name) ? 'left' : 'right');
  assert(s.sourceOntologyId); assert.equal(s.fmaId, null); // UBERON is not FMA.
}
assert.equal(raw.structures.reduce((n, s) => n + s.triangles, 0), 189794);
const proof = await validateGlbDelivery(bytes, await compressGlb(bytes));
assert.equal(proof.meshes, 82);
const compiled = await build({ stdin: { contents: "export * from './lib/hra-renal.ts'; export * from './lib/hra-renal-teaching.ts'; export * from './lib/independent-specimen.ts'; export * from './lib/specimen-identification.ts'; export * from './lib/body-arrangement.ts'; export {Vector3} from 'three';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node' });
const api = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const { hraRenalDefinition: def, hraRenalTeaching: teaching, hraRenalPractice: adapter, initialSpecimen, reduceSpecimen, specimenAction, filterSpecimen, reduceIdentification, bodyPresentationOffset, extractionOffsets, arrangeBodyStructures, Vector3 } = api;
const all = def.surfaces.map(s => s.id), before = JSON.stringify(def);
assert.equal(def.studies.length, 9);
assert.equal(def.studies.find(s => s.id === 'internal-right').ids.length, 34);
assert.equal(def.studies.find(s => s.id === 'internal-left').ids.length, 37);
assert.equal(adapter.eligibleIds(def, all).length, 13);
assert(def.surfaces.every(s => teaching(def, s)));
assert.equal(new Set(def.surfaces.map(s => teaching(def, s).anatomy)).size, 12);
assert.equal(filterSpecimen(def, 'left renal papilla').length, 11);
assert.equal(filterSpecimen(def, 'right renal pyramid').length, 10);
assert.equal(filterSpecimen(def, 'FMA1335').length, 0);
for (const s of def.surfaces) assert.deepEqual(filterSpecimen(def, s.id).map(v => v.id), [s.id]);
for (const study of def.studies) {
  const state = reduceSpecimen(def, initialSpecimen(def), specimenAction(def, study.id)), saved = JSON.stringify(state);
  const visible = def.surfaces.filter(s => !state.hidden.includes(s.id));
  assert.deepEqual(visible.map(s => s.id).sort(), [...study.ids].sort());
  const removed = reduceSpecimen(def, state, { type: 'visibility', id: state.selectedId, visible: false });
  assert(removed.hidden.includes(state.selectedId));
  const restored = reduceSpecimen(def, removed, { type: 'undo' });
  assert.deepEqual(restored.hidden, state.hidden); assert.equal(restored.selectedId, state.selectedId);
  assert.deepEqual(reduceSpecimen(def, restored, { type: 'redo' }).hidden, removed.hidden);
  assert.equal(reduceSpecimen(def, state, { type: 'show-only', ids: ['foreign'], selectedId: 'foreign' }), state);
  for (const tissue of new Set(visible.map(s => s.tissue))) {
    const hidden = reduceSpecimen(def, state, { type: 'group', tissue, visible: false });
    assert(visible.filter(s => s.tissue === tissue).every(s => hidden.hidden.includes(s.id)));
    assert.deepEqual(reduceSpecimen(def, hidden, { type: 'undo' }).hidden, state.hidden);
  }
  const items = def.catalog.structures.filter(s => study.ids.includes(s.id)), origin = new Vector3();
  for (const view of ['anterior', 'posterior', 'left', 'right', 'superior', 'inferior']) {
    const trays = arrangeBodyStructures(items, origin, view).offsets;
    const extracts = extractionOffsets(items, state.selectedId, view);
    for (const layout of ['extract', 'tray', 'spatial']) for (const item of items) {
      const offsets = layout === 'extract' ? extracts : trays;
      assert(bodyPresentationOffset(item, origin, 0, layout, false, offsets).toArray().every(v => v === 0));
      assert(bodyPresentationOffset(item, origin, 100, layout, false, offsets).toArray().every(Number.isFinite));
    }
  }
  let round = adapter.createRound(def, visible.map(s => s.id), () => 0.37);
  const eligible = adapter.eligibleIds(def, visible.map(s => s.id));
  if (eligible.length < 2) assert.equal(round, null);
  else {
    assert.equal(round.questions.length, Math.min(10, eligible.length));
    while (round.questions[round.index]) {
      const q = round.questions[round.index];
      assert(eligible.includes(q.targetId)); assert(q.options.every(id => eligible.includes(id)));
      assert.equal(reduceIdentification(round, { type: 'answer', id: 'foreign' }), round);
      round = reduceIdentification(reduceIdentification(round, { type: 'reveal' }), { type: 'next' });
    }
    assert(round.results.every(r => r.revealed && !r.firstTry));
  }
  assert.equal(JSON.stringify(state), saved);
}
for (const s of def.surfaces) if (s.sourcePart) assert.equal(adapter.createRound(def, all, () => .3, [s.id]), null);
for (const field of ['id', 'sourceName', 'nodeName', 'laterality', 'sourceOntologyId', 'concept', 'sourcePart']) assert.equal(teaching(def, { ...def.surfaces[0], [field]: 'foreign' }), null);
for (const mutate of [d => d.key = 'foreign', d => d.source.license = 'MIT', d => d.source.version = 'v0', d => d.catalog.bundles[0].url = '/foreign.glb', d => d.catalog.bundles[0].sha256 = '0'.repeat(64), d => d.catalog.coordinateSystem.sourceToSceneColumnMajor[0] *= -1, d => d.surfaces[0].sources[0].sha256 = 'foreign', d => d.surfaces[0].bounds.min[0] += 1, d => d.studies[0].ids.pop()]) {
  const bad = JSON.parse(before); mutate(bad);
  assert.equal(teaching(bad, bad.surfaces[0]), null); assert.equal(adapter.createRound(bad, all), null);
}
assert.equal(adapter.createRound(def, [...all, all[0]]), null);
assert.equal(adapter.createRound(def, [...all, 'foreign']), null);
assert.equal(JSON.stringify(def), before);

// Execute the real launcher/close callbacks without opening a browser.
const explorer = await readFile('app/body-explorer.tsx', 'utf8');
const ast = ts.createSourceFile('body.tsx', explorer, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let launcher, close;
function visit(n) {
  if (ts.isJsxAttribute(n) && n.name.text === 'onClick' && n.initializer?.getText(ast).includes('setHraRenalOpen')) launcher = n.initializer.expression;
  if (ts.isVariableDeclaration(n) && n.name.getText(ast) === 'closeHraRenal') close = n.initializer.arguments[0];
  ts.forEachChild(n, visit);
}
visit(ast); assert(launcher && close);
for (const exam of [false, true]) {
  const calls = [];
  runInNewContext('(' + launcher.getText(ast) + ')()', { exam, setHraRenalOpen: v => calls.push(v) });
  assert.deepEqual(calls, exam ? [] : [true]);
}
assert.match(explorer, /hraRenalOpen && \['abdomen','whole-body'\]\.includes\(initialRegion\) && !exam/);
const calls = [];
runInNewContext('(' + close.getText(ast) + ')()', { setHraRenalOpen: v => calls.push(v), requestAnimationFrame: f => f(), hraRenalLauncher: { current: { focus: () => calls.push('focus') } } });
assert.deepEqual(calls, [false, 'focus']);
const component = await componentBuild({ stdin: { contents: "export { KneeSpecimenView } from './app/um-knee-study.tsx'; export { SpecimenIdentification } from './app/um-limb-learning.tsx'; export { hraRenalSupplement } from './app/hra-renal-study.tsx';", resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false, format: 'cjs', platform: 'node', plugins: [{ name: 'scene-boundary', setup(t) { t.onLoad({ filter: /body-scene\.tsx$/ }, () => ({ loader: 'js', contents: 'export function BodyScene(props){globalThis.sceneProps=props;return null;} export function retryBodyAssets(){}' })); } }] });
const require = createRequire(import.meta.url), React = require('react'), mod = { exports: {} };
const context = { module: mod, exports: mod.exports, require, URL, URLSearchParams, console, process: { env: { NODE_ENV: 'test' } } };
runInNewContext(component.outputFiles[0].text, context);
const render = (name, props) => require('react-dom/server').renderToStaticMarkup(React.createElement(mod.exports[name], props));
for (const study of def.studies) {
  const state = reduceSpecimen(def, initialSpecimen(def), specimenAction(def, study.id));
  const html = render('KneeSpecimenView', { specimen: def, initialNavigation: { state, view: study.view }, supplement: mod.exports.hraRenalSupplement });
  for (const text of ['Capsules', 'Pyramids', 'Papillae', 'Cortex &amp; columns', 'Practise identification', 'CC BY 4.0', '/models/hra-renal/NOTICE.md']) assert(html.includes(text), text);
  assert.equal(context.sceneProps.catalog.sourceVersion, def.key);
  assert.deepEqual(context.sceneProps.hiddenIds, state.hidden);
  assert.equal(context.sceneProps.explode, 0); assert.equal(context.sceneProps.cameraBounds, null);
}
const html = render('SpecimenIdentification', { definition: def, initial: adapter.createRound(def, all, () => .5), visibleIds: all, initialView: 'anterior', onClose() {}, adapter });
assert(html.includes('Answering is paused until the model is ready.'));
assert.equal(context.sceneProps.labels, false); assert.equal(context.sceneProps.showOrigins, false); assert.equal(context.sceneProps.explode, 0);
console.log(JSON.stringify({ surfaces: 82, triangles: 189794, verifiedAccessorValues: values, withheld: 3, studies: 9, taughtSelections: 82, concepts: 12, practiceTargets: 13, decodedMeshes: proof.meshes, componentRenders: 10, clinicalOrDeviceApproval: false }));
