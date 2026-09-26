// Execute the real component's workspace closures and hook, with queued React setters.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createContext, runInContext } from 'node:vm';
import ts from 'typescript';
import { build } from './workspace-test-build.mjs';

const source = process.argv.includes('--baseline')
  ? execFileSync('git', ['show', 'ee6c7436695acb2710d2da73517f9f3deddd1ee7:app/body-explorer.tsx'], { encoding: 'utf8' })
  : await readFile('app/body-explorer.tsx', 'utf8');
const ast = ts.createSourceFile('body.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let declaration;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'workspace') declaration = node;
  ts.forEachChild(node, visit);
}
visit(ast);
assert.equal(declaration.initializer.expression.getText(ast), 'useWorkspaceSession');
const transpile = s => ts.transpileModule(s, { compilerOptions: {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
} }).outputText;
const renderCode = transpile('globalThis.session = ' + declaration.initializer.getText(ast));
const hookCode = transpile(await readFile('app/workspace-session.ts', 'utf8'));
const compiled = await build({ stdin: { contents: `export * from './lib/dissection-scope';
export * from './app/dissection-data'; export * from './lib/body-display-catalog';`,
resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const api = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog = api.bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')));
const plain = v => JSON.parse(JSON.stringify(v));
function fixture(region, initialState) {
  const slots = [], queue = []; let cursor = 0;
  const hooks = {
    useState(value) { const i = cursor++; if (!(i in slots)) slots[i] = value;
      return [slots[i], next => queue.push(() => { slots[i] = typeof next === 'function' ? next(slots[i]) : next; })]; },
    useRef(value) { const i = cursor++; return slots[i] ??= { current: value }; },
    useCallback(fn, deps) { const i = cursor++;
      if (!slots[i] || deps.some((d, j) => d !== slots[i].deps[j])) slots[i] = { fn, deps };
      return slots[i].fn; },
    useMemo(fn, deps) { return hooks.useCallback(fn, deps)(); },
  };
  const state = { ...api, catalog, profile: api.dissectionProfiles[region], initialRegion: region,
    side: 'both', dissection: structuredClone(initialState), systems: { bones: true },
    initialSystems: { bones: true }, allBodySystems: { bones: true }, initialInspection: { plane: 'off' },
    explode: 31, layout: 'spatial', inspection: { plane: 'off' }, plate: false, ghostRemoved: false,
    anchorSkeleton: false, showOrigins: false, isolated: false, focus: false, regionalFraming: true,
    view: 'anterior', zoom: 1.4, reset: 0, cameraCapture: { current: { pan: [1, 2, 0], scale: .8 } },
    cameraRestore: { current: null }, selectedId: 'shared-selection', structuredClone,
    exports: {}, require: name => { assert.equal(name, 'react'); return hooks; } };
  for (const key of ['dissection', 'systems', 'explode', 'layout', 'inspection', 'plate', 'ghostRemoved',
    'anchorSkeleton', 'showOrigins', 'isolated', 'focus', 'regionalFraming', 'view', 'zoom', 'reset', 'side'])
    state['set' + key[0].toUpperCase() + key.slice(1)] = v => queue.push(() => {
      state[key] = typeof v === 'function' ? v(state[key]) : v;
    });
  const context = createContext(state);
  runInContext(hookCode, context); state.useWorkspaceSession = state.exports.useWorkspaceSession;
  function render() { cursor = 0; runInContext(renderCode, context); }
  render();
  return { state, render, choose(mode) {
    state.session.chooseMode(mode); while (queue.length) queue.shift()(); render();
  } };
}

let cases = 0;
for (const [region, profile] of Object.entries(api.dissectionProfiles)) {
  for (const study of profile.focuses) for (const targetSide of ['left', 'right', 'both']) {
    const recipe = api.dissectionReducer(api.initialDissection, { type: 'focus', id: study.id });
    const edited = api.dissectionReducer(recipe, { type: 'remove', id: 'synthetic-hidden-id' });
    // Include the same recipe in Undo and Redo to exercise stale history too.
    const { history: _past, future: _future, ...recipeSnapshot } = recipe;
    const original = { ...edited, future: [structuredClone(recipeSnapshot)] };
    const originalJson = JSON.stringify(original);
    const expected = api.dissectionReducer(original, api.dissectionScopeAction(catalog, profile, region, targetSide));
    const f = fixture(region, original);
    f.choose('dissect'); // Save Explore, initialize Dissect.
    f.state.side = targetSide; f.render();
    f.choose('explore');
    assert.deepEqual(plain(f.state.dissection), plain(expected), region + '/' + study.id + '/' + targetSide);
    assert.equal(f.state.side, targetSide, 'Mode changes must not silently switch anatomical side');
    assert.equal(f.state.selectedId, 'shared-selection');
    assert.equal(f.state.explode, 31); assert.equal(f.state.zoom, 1.4);
    assert.deepEqual(plain(f.state.cameraRestore.current), { pan: [1, 2, 0], scale: .8 });
    assert.equal(JSON.stringify(original), originalJson, 'Snapshot was not mutated');
    f.choose('practice'); f.state.dissection = structuredClone(api.initialDissection); f.render();
    f.choose('explore');
    assert.deepEqual(plain(f.state.dissection), plain(expected), 'Practice cannot revive a stale focus');
    cases++;
  }
}
// Actual reported direction: saved Dissect -> Explore/right -> Dissect.
const recipe = api.dissectionReducer(api.initialDissection, { type: 'focus', id: 'longus-colli-left' });
const f = fixture('head-neck', api.initialDissection);
f.choose('dissect'); f.state.dissection = structuredClone(recipe); f.render();
f.choose('explore'); f.state.side = 'right'; f.render(); f.choose('dissect');
assert.equal(f.state.dissection.focusId, null);
assert.equal(f.state.dissection.stageId, 'assembled');
console.log(JSON.stringify({ passed: true, cases, actualWorkspaceClosures: true,
  queuedSetters: true, bothLearningDirections: true, practiceReturn: true,
  geometryChanged: false, clinicalValidation: false }));
