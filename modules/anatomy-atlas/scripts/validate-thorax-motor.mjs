import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';

const compiled = await build({
  stdin: {
    contents: "export * from './lib/limb-motor.ts'; export * from './lib/upper-limb-motor.ts'; export * from './lib/lower-limb-motor.ts'; export * from './lib/thorax-motor.ts'; export * from './app/dissection-data.ts'; export * from './content/thorax-motor.ts'; export { bodyDisplayCatalog } from './lib/body-display-catalog.ts';",
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
});
const {
  limbMotorGroups, limbMotorPlan, upperLimbMotorGroups, lowerLimbMotorGroups,
  thoraxMotorGroups: groups,
  thoraxMotorPlan: plan, thoraxMotorBindings: bindings,
  thoraxMotorNerves: nerves, dissectionReducer: reduce,
  resolveDissection: resolve, initialDissection: initial,
  dissectionProfiles: profiles, bodyDisplayCatalog,
} = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
assert.equal(createHash('sha256').update(raw).digest('hex'), '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7');
const catalog = JSON.parse(raw);
const shown = bodyDisplayCatalog(catalog);
const expected = ['FMA13295', 'FMA9756', 'FMA9757', 'FMA9758'];
assert.deepEqual(bindings.map((b) => b.fmaId).sort(), expected);
assert.deepEqual(Object.keys(nerves), ['phrenic', 'intercostal']);
assert.equal(upperLimbMotorGroups(shown, 'whole-body').length, 0);
assert.equal(lowerLimbMotorGroups(shown, 'whole-body').length, 0);
for (const region of ['head-neck', 'abdomen', 'pelvis', 'upper-arm', 'thigh'])
  assert.deepEqual(groups(shown, region), []);

const ids = (g) => g.targets.map((t) => t.structure.fmaId).sort();
const thoraxScope = shown.structures.filter((s) => s.regions.includes('thorax') && ['muscles', 'skeleton'].includes(s.system));
assert.equal(thoraxScope.length, 52);
const thoraxBones = thoraxScope.filter((s) => s.system === 'skeleton').map((s) => s.id);
for (const side of ['both', 'right', 'left']) {
  const found = groups(shown, 'thorax', side);
  const whole = groups(shown, 'whole-body', side);
  assert.deepEqual(whole, found);
  assert.deepEqual(limbMotorGroups(shown, 'whole-body', side), found);
  assert.deepEqual(found.map((g) => g.key), ['phrenic', 'intercostal']);
  assert.deepEqual(ids(found[0]), ['FMA13295']);
  assert.deepEqual(ids(found[1]), ['FMA9756', 'FMA9757', 'FMA9758']);
  assert(found.every((g) => g.targets.every((t) => t.structure.laterality === 'midline')));
  assert.deepEqual(limbMotorGroups(shown, 'thorax', side), found);
  for (const group of found) {
    const recipe = plan(shown, 'thorax', side, group.key);
    assert.deepEqual(limbMotorPlan(shown, 'thorax', side, group.key), recipe);
    assert.equal(recipe.action.type, 'load-view');
    assert.equal(recipe.selectedId, group.targets[0].structure.id);
    assert.equal(shown.structures.find((s) => s.id === recipe.selectedId).system, 'muscles');
    const region = shown.structures.filter((s) => s.regions.includes('thorax'));
    const prior = reduce(initial, { type: 'stage', id: profiles.thorax.stages.at(-1).id });
    const next = reduce(prior, recipe.action);
    assert.equal(next.history.length, prior.history.length + 1);
    for (const switched of ['both', 'right', 'left']) {
      const scope = region.filter((s) => switched === 'both' || s.laterality === switched || ['midline', 'unpaired', 'unspecified'].includes(s.laterality));
      const visible = resolve(scope, profiles.thorax, next).visible;
      const keep = new Set(group.targets.map((t) => t.structure.id));
      assert.deepEqual(visible.map((s) => s.id), scope.filter((s) => s.system === 'skeleton' || keep.has(s.id)).map((s) => s.id));
      assert(visible.every((s) => s.system !== 'nervous'));
    }
    assert.deepEqual(resolve(region, profiles.thorax, reduce(next, { type: 'undo' })), resolve(region, profiles.thorax, prior));
    assert.deepEqual(reduce(reduce(next, { type: 'undo' }), { type: 'redo' }), next);
    assert.equal(plan(shown, 'thorax', side, group.key, true), null);
    const wholeRecipe = plan(shown, 'whole-body', side, group.key);
    assert.deepEqual(limbMotorPlan(shown, 'whole-body', side, group.key), wholeRecipe);
    assert.equal(wholeRecipe.selectedId, recipe.selectedId);
    const keep = new Set([...groups(shown, 'whole-body', 'both').find((g) => g.key === group.key).targets.map((t) => t.structure.id), ...thoraxBones]);
    assert.deepEqual(wholeRecipe.action.hiddenIds, shown.structures.filter((s) => !keep.has(s.id)).map((s) => s.id));
    const wholePrior = reduce(initial, { type: 'stage', id: profiles['whole-body'].stages[0].id });
    const wholeNext = reduce(wholePrior, wholeRecipe.action);
    for (const switched of ['both', 'right', 'left']) {
      const scope = shown.structures.filter((s) => switched === 'both' || s.laterality === switched || ['midline', 'unpaired', 'unspecified'].includes(s.laterality));
      assert.deepEqual(resolve(scope, profiles['whole-body'], wholeNext).visible.map((s) => s.id), scope.filter((s) => keep.has(s.id)).map((s) => s.id));
    }
    assert.deepEqual(resolve(shown.structures, profiles['whole-body'], reduce(wholeNext, { type: 'undo' })), resolve(shown.structures, profiles['whole-body'], wholePrior));
    assert.deepEqual(reduce(reduce(wholeNext, { type: 'undo' }), { type: 'redo' }), wholeNext);
    assert.equal(plan(shown, 'whole-body', side, group.key, true), null);
  }
}

let rejected = 0;
for (const mutate of [
  (c) => { c.sourceVersion = 'changed'; },
  (c) => { c.license = 'changed'; },
  (c) => { c.coordinateSystem.units = 'changed'; },
  (c) => { c.structures.find((s) => s.fmaId === 'FMA13295').sources[0].sha256 = 'changed'; },
  (c) => { c.structures.find((s) => s.fmaId === 'FMA9756').nodeName = 'changed'; },
  (c) => { c.structures.find((s) => s.fmaId === 'FMA9757').name = 'changed'; },
  (c) => { c.structures.push(structuredClone(c.structures.find((s) => s.fmaId === 'FMA9758'))); },
  (c) => { c.bundles.find((b) => b.id === 'thorax-muscles').sha256 = 'changed'; },
]) {
  const bad = structuredClone(catalog);
  mutate(bad);
  for (const region of ['thorax', 'whole-body']) {
    assert.deepEqual(groups(bad, region), []);
    assert.equal(plan(bad, region, 'both', 'phrenic'), null);
  }
  rejected++;
}
for (const source of thoraxScope) {
  const bad = structuredClone(catalog);
  bad.structures.find((s) => s.id === source.id).name += ' changed';
  assert.deepEqual(groups(bad, 'whole-body'), []);
  assert.equal(plan(bad, 'whole-body', 'both', 'phrenic'), null);
  rejected++;
}
for (const bundleId of new Set(thoraxScope.map((s) => s.bundle))) {
  const bad = structuredClone(catalog);
  bad.bundles.find((b) => b.id === bundleId).sha256 = 'changed';
  assert.deepEqual(groups(bad, 'whole-body'), []);
  rejected++;
}
{
  const bad = structuredClone(catalog);
  const duplicate = structuredClone(bad.structures.find((s) => s.fmaId === 'FMA13295'));
  duplicate.regions = ['head-neck'];
  bad.structures.push(duplicate);
  assert.deepEqual(groups(bad, 'whole-body'), []);
  rejected++;
}
assert.deepEqual(groups(shown, 'thorax', 'invalid'), []);
assert.deepEqual(groups(shown, 'whole-body', 'invalid'), []);
for (const region of ['shoulder', 'upper-arm', 'forearm', 'hand', 'pelvis', 'thigh', 'leg', 'foot'])
  for (const side of ['both', 'right', 'left'])
    assert.deepEqual(limbMotorGroups(shown, region, side), [
      ...upperLimbMotorGroups(shown, region, side),
      ...lowerLimbMotorGroups(shown, region, side),
    ]);
const limbBaseline = limbMotorGroups(shown, 'hand', 'right');
assert(limbBaseline.length > 0);
assert.equal(plan(shown, 'hand', 'right', limbBaseline[0].key), null);

const require = createRequire(import.meta.url);
const component = await componentBuild({ entryPoints: ['app/upper-limb-motor.tsx'], bundle: true, write: false, format: 'cjs', platform: 'node' });
const mod = { exports: {} };
runInNewContext(component.outputFiles[0].text, { module: mod, exports: mod.exports, require, URL, console, process: { env: { NODE_ENV: 'test' } } });
const React = require('react');
const render = (C, props) => require('react-dom/server').renderToStaticMarkup(React.createElement(C, props));
const props = { catalog: shown, region: 'thorax', side: 'left', selectedId: null, disabled: false, onSelect() {}, onExplore() {} };
const html = render(mod.exports.UpperLimbMotorExplorer, props);
assert(html.includes('Muscles by nerve'));
assert(!/<details[^>]*\bopen=/.test(html));
const wholeHtml = render(mod.exports.UpperLimbMotorExplorer, { ...props, region: 'whole-body' });
assert(wholeHtml.includes('Muscles by nerve'));
assert(!/<details[^>]*\bopen=/.test(wholeHtml));
assert.equal(render(mod.exports.UpperLimbMotorExplorer, { ...props, disabled: true }), '');
for (const group of groups(shown, 'thorax', 'left')) {
  const detail = render(mod.exports.UpperLimbMotorDetails, { ...props, group });
  assert(detail.includes('Show muscles &amp; bones'));
  assert(detail.includes('hemidiaphragms'));
  assert(detail.includes('Nerve geometry or course'));
  for (const target of group.targets) assert(detail.includes(target.structure.name));
}
const parent = await readFile('app/body-explorer.tsx', 'utf8');
const ast = ts.createSourceFile('body.tsx', parent, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let handler;
function visit(node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'exploreMotorGroup') handler = node.getText(ast);
  ts.forEachChild(node, visit);
}
visit(ast);
assert(handler);
const script = ts.transpile(handler + ';exploreMotorGroup("phrenic");', { target: ts.ScriptTarget.ES2022 });
for (const region of ['thorax', 'whole-body']) for (const exam of [false, true]) {
  const calls = [];
  const record = (name) => (value) => calls.push([name, value]);
  const env = { catalog: shown, initialRegion: region, side: 'left', exam, limbMotorPlan, initialInspection: { enabled: false }, cameraRestore: { current: 'old' }, dispatch: record('dispatch') };
  for (const name of ['setSystems', 'setInspection', 'setExplode', 'setLayout', 'setPlate', 'setGhostRemoved', 'setFocus', 'setIsolated', 'setZoom', 'setSelectedId', 'setSelectionNotice', 'setReset']) env[name] = record(name);
  runInNewContext(script, env);
  if (exam) assert.deepEqual(calls, []);
  else {
    assert.equal(calls.filter((c) => c[0] === 'dispatch').length, 1);
    assert.equal(calls.find((c) => c[0] === 'setSelectedId')[1], plan(shown, region, 'left', 'phrenic').selectedId);
    assert.equal(env.cameraRestore.current, null);
  }
}
console.log(JSON.stringify({ groups: 2, targets: 4, sideFilters: 3, rejectedMutations: rejected, loadViewUndo: true, noNerveSelection: true, unchangedLimbGroup: true, ssr: true, parentHandler: true }));
