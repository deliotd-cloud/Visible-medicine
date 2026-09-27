import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';
import { build } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url), React = require('react');
const built = await build({ stdin: {
  contents: "export * from './lib/shoulder-tours'; export { ShoulderTourPlayer } from './app/shoulder-tour-player'; export { structures } from './app/anatomy-data'; export { initialInspection } from './lib/inspection-state'; export { parseStudyView, compatibleStudyView } from './lib/study-views'; export { default as manifest } from './public/models/bodyparts3d/manifest.json';",
  loader: 'tsx', resolveDir: process.cwd(),
}, bundle: true, platform: 'node', format: 'cjs', write: false, loader: { '.css': 'empty' } });
const mod = { exports: {} };
runInNewContext(built.outputFiles[0].text, { module: mod, exports: mod.exports, require, structuredClone, process: { env: { NODE_ENV: 'test' } } });
const { shoulderTour, shoulderTourStepView, ShoulderTourPlayer, structures, initialInspection, manifest, parseStudyView, compatibleStudyView } = mod.exports;
const plain = value => JSON.parse(JSON.stringify(value));
const before = plain(manifest);
const scene = await readFile('app/anatomy-scene.tsx', 'utf8');
const ast = ts.createSourceFile('scene.tsx', scene, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let visibility;
function visit(node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'isVisible') visibility = node.getText(ast);
  ts.forEachChild(node, visit);
}
visit(ast);
assert(visibility, 'Extract actual scene layer predicate');
const visibilityCode = ts.transpileModule(visibility, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;

test('Tour draft pins exact source IDs and canonical source-space views; cuff targets stay visible', () => {
  assert.equal(shoulderTour.status, 'draft');
  assert.equal(shoulderTour.sourceRevision, manifest.sha256);
  assert.equal(typeof shoulderTour.revision, 'string');
  assert(shoulderTour.revision.length);
  assert.equal(shoulderTour.steps.length, 5);
  assert.deepEqual(plain(shoulderTour.steps.map(s => s.selectedId.split(':').at(-1))), ['deltoid', 'infraspinatus', 'teres-minor', 'supraspinatus', 'subscapularis']);
  for (const [index, step] of shoulderTour.steps.entries()) {
    const selected = structures.find(s => s.id === step.selectedId);
    assert(selected);
    const parts = manifest.parts.filter(p => p.structureId === selected.id);
    assert(parts.length > 0, 'Exact current manifest sources exist');
    for (const part of parts) assert(part.bounds.min.every((n, axis) => Number.isFinite(n) && n <= part.bounds.max[axis]), 'Original source bounds valid');
    assert(step.references.includes('https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html'));
    assert(step.durationMs >= 10000);
    const view = shoulderTourStepView(index);
    assert.deepEqual(plain(view), {
      kind: 'shoulder', region: 'shoulder-pilot', revision: manifest.sha256,
      selectedId: step.selectedId, view: step.view, side: 'right', layer: step.layer,
      systems: { skeleton: true, muscles: true, 'soft-tissue': true }, hiddenIds: [],
      explode: 0, layout: 'spatial', zoom: 1, isolated: index === 3, focus: false,
      labels: true, ghostRemoved: false, illustrated: true, anchorSkeleton: false,
      showOrigins: false, plate: false, referencePlane: false,
      inspection: plain(initialInspection), camera: null,
    });
    assert(parseStudyView(view), 'Real saved-view parser accepts tour state');
    assert(compatibleStudyView(view, { kind: 'shoulder', region: 'shoulder-pilot', revision: manifest.sha256, structureIds: structures.map(s => s.id) }));
    for (const wrong of [{ revision: 'obsolete-source' }, { region: 'whole-body' }, { kind: 'body' }, { structureIds: [] }])
      assert.equal(compatibleStudyView(view, { kind: 'shoulder', region: 'shoulder-pilot', revision: manifest.sha256, structureIds: structures.map(s => s.id), ...wrong }), false, 'Wrong source/scope/selection binding rejected');
    const props = { visibleSystems: view.systems, selectedId: null, layer: view.layer, exam: false };
    assert.equal(runInNewContext(visibilityCode + '\nisVisible(structure, props)', { structure: selected, props }), true, 'Actual layer predicate shows target without selection override');
    if (index > 0) {
      const deltoid = structures.find(s => s.id.endsWith(':deltoid'));
      assert.equal(runInNewContext(visibilityCode + '\nisVisible(structure, props)', { structure: deltoid, props }), false, 'Cuff step sets deltoid aside');
    }
  }
  assert.deepEqual(plain(manifest), before, 'No source bounds/geometry metadata mutation');
});

test('Tour views detach nested state and reject invalid indices', () => {
  for (const index of [-1, 5, 0.5, NaN, Infinity, '0', null, undefined]) assert.equal(shoulderTourStepView(index), null);
  const a = shoulderTourStepView(0), expected = plain(a);
  a.systems.muscles = false; a.hiddenIds.push('forged'); a.inspection.opacity.muscles = 5; a.inspection.plane = 'coronal'; a.selectedId = 'forged';
  assert.deepEqual(plain(shoulderTourStepView(0)), expected);
  assert.deepEqual(plain(initialInspection.opacity), {});
  assert.deepEqual(plain(manifest), before);
});

const calls = [];
const props = { index: null, playing: false, ready: true, onStart: () => calls.push('start'), onPlayPause: () => calls.push('toggle'), onStep: index => calls.push(index), onExit: () => calls.push('exit') };
const render = overrides => require('react-dom/server').renderToStaticMarkup(React.createElement(ShoulderTourPlayer, { ...props, ...overrides }));
function buttons(tree, result = []) {
  if (!tree || typeof tree !== 'object') return result;
  if (tree.type && tree.props?.onClick) result.push(tree.props);
  React.Children.forEach(tree.props?.children, child => buttons(child, result));
  return result;
}
test('Real player renders compact manual start, reference disclosure, step controls and usable exit while loading', () => {
  assert.match(render({}), /Start guided tour/);
  assert.doesNotMatch(render({}), /Pause|Next|Step 1/);
  const inactive = buttons(ShoulderTourPlayer({ ...props, ready: false }));
  assert.equal(inactive[0].disabled, true);
  buttons(ShoulderTourPlayer(props))[0].onClick();
  assert.deepEqual(calls.splice(0), ['start'], 'Start does not trigger autoplay');
  const first = render({ index: 0 });
  assert.match(first, /Step 1 of 5/); assert.match(first, /draft, review pending/); assert.match(first, /<details/); assert.match(first, /<summary/); assert.match(first, /href="https:\/\/anatomy/);
  assert.match(render({ index: 1, playing: true }), /Pause/);
  for (const index of [0, 2, 4]) {
    const controls = buttons(ShoulderTourPlayer({ ...props, index, ready: false }));
    assert.equal(controls.length, 4);
    assert(controls.slice(0, 3).every(button => button.disabled));
    assert.equal(controls[3].disabled, undefined, 'Exit always enabled');
    controls[3].onClick(); assert.deepEqual(calls.splice(0), ['exit']);
  }
  const middle = buttons(ShoulderTourPlayer({ ...props, index: 2 }));
  middle[0].onClick(); middle[1].onClick(); middle[2].onClick();
  assert.deepEqual(calls.splice(0), [1, 'toggle', 3]);
  const last = buttons(ShoulderTourPlayer({ ...props, index: 4 }));
  assert.equal(last[2].children, 'Finish'); last[2].onClick();
  assert.deepEqual(calls.splice(0), ['exit']);
  assert.match(render({ index: 4 }), /Finish/);
});
