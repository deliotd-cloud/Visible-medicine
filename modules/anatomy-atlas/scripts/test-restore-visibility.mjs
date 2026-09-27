import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { build } from './workspace-test-build.mjs';

// Execute the current production handlers and renderer fading predicate, while
// using the real catalogue, reducer and rendered-structure filter. No React/GPU
// or browser camera fit is claimed by this focused suite.
const bundle = await build({
  stdin: { contents: "export * from './app/dissection-data'; export * from './app/body-types'; export * from './lib/anatomy-load-state';", loader: 'ts', resolveDir: process.cwd() },
  bundle: true, format: 'esm', platform: 'node', write: false,
});
const api = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const catalog = JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json', 'utf8'));
const sourceIdentity = JSON.stringify(catalog);
const scope = catalog.structures.filter(s => s.regions.includes('thigh'));
const profile = api.dissectionProfiles.thigh;
const targets = ['muscles', 'vessels'].map(system => scope.find(s => s.system === system));
assert(targets.every(Boolean), 'Real scope contains two restore systems');
const selected = scope.find(s => !targets.includes(s));
const foreign = catalog.structures.find(s => !scope.includes(s));
assert(selected && foreign);

function extract(path, names, declarations = false) {
  return readFile(path, 'utf8').then(source => {
    const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const found = {};
    const printer = ts.createPrinter({ removeComments: true });
    function visit(node) {
      if ((declarations ? ts.isVariableDeclaration(node) : ts.isFunctionDeclaration(node)) && names.includes(node.name?.getText(ast)))
        found[node.name.getText(ast)] = declarations ? node.initializer.getText(ast) : printer.printNode(ts.EmitHint.Unspecified, node, ast);
      ts.forEachChild(node, visit);
    }
    visit(ast);
    assert.deepEqual(Object.keys(found).sort(), [...names].sort(), `Extract production nodes from ${path}`);
    return found;
  });
}
const handlers = await extract('app/body-explorer.tsx', ['restoreStructure', 'restoreStructures']);
const predicates = await extract('app/body-scene.tsx', ['faded'], true);
const handlerCode = ts.transpileModule(Object.values(handlers).join('\n'), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
function fixture(layout, overrides = {}) {
  const state = {
    selectedId: selected.id, isolated: true, focus: true, zoom: 3, reset: 7,
    explode: 55, layout, plate: true, ghostRemoved: true, showOrigins: true,
    inspection: { mode: 'cutaway', plane: 'coronal', position: 37 },
    systems: { ...api.allBodySystems, muscles: false, vessels: false },
    ...overrides,
  };
  const initial = structuredClone(state);
  const writes = [];
  const env = {
    exam: false, catalog, cameraRestore: { current: { stale: true } },
    dissection: targets.reduce((s, target) => api.dissectionReducer(s, { type: 'remove', id: target.id }), structuredClone(api.initialDissection)),
    dispatch(action) {
      writes.push(['dispatch', JSON.parse(JSON.stringify(action))]);
      env.dissection = api.dissectionReducer(env.dissection, action);
      env.resolved = api.resolveDissection(scope, profile, env.dissection);
    },
  };
  env.resolved = api.resolveDissection(scope, profile, env.dissection);
  for (const key of Object.keys(state)) env[`set${key[0].toUpperCase()}${key.slice(1)}`] = value => {
    writes.push([key]);
    state[key] = typeof value === 'function' ? value(state[key]) : value;
  };
  runInNewContext(handlerCode + '\nthis.handlers = {restoreStructure, restoreStructures};', env);
  return { env, state, initial, writes };
}
for (const layout of ['spatial', 'extract', 'tray']) for (const mode of ['single', 'matching']) {
  test(`${mode} restore clears isolation/framing/scale and retains ${layout} dissection`, () => {
    const { env, state, initial, writes } = fixture(layout);
    const before = structuredClone(env.dissection);
    const restored = mode === 'single' ? [targets[0]] : targets;
    if (mode === 'single') env.handlers.restoreStructure(targets[0].id);
    else env.handlers.restoreStructures([targets[0].id, foreign.id, targets[1].id, targets[0].id, selected.id, '']);
    assert.equal(state.isolated, false, 'Restored surfaces must leave isolation fading');
    assert.equal(state.focus, false, 'Restore must leave selected-only framing');
    assert.equal(state.zoom, 1);
    assert.equal(state.reset, initial.reset + 1, 'Refit even when live wheel/pan differs from stored zoom');
    assert.equal(env.cameraRestore.current, null, 'A stale recovery camera must not override refit');
    for (const key of ['selectedId', 'explode', 'layout', 'plate', 'ghostRemoved', 'showOrigins', 'inspection']) assert.deepEqual(state[key], initial[key], `${key} retained`);
    const actions = writes.filter(([type]) => type === 'dispatch').map(([, action]) => action);
    assert.deepEqual(actions, [mode === 'single' ? { type: 'restore', id: targets[0].id } : { type: 'restore-many', ids: targets.map(s => s.id) }]);
    assert.equal(env.dissection.history.length, before.history.length + 1, 'One undoable restore');
    const rendered = api.renderedAnatomyStructures(env.resolved.visible, state.systems, env.resolved.removed.map(s => s.id), false);
    for (const item of restored) {
      assert.equal(state.systems[item.system], true);
      assert.equal(rendered.find(s => s.id === item.id), item, 'Original source object returns to rendered set');
      const faded = runInNewContext(predicates.faded, { removed: env.resolved.removed.some(s => s.id === item.id), props: state, selected: item.id === state.selectedId });
      assert.equal(faded, false, 'Actual renderer predicate no longer assigns ghost opacity');
    }
    const undo = api.dissectionReducer(env.dissection, { type: 'undo' });
    for (const key of ['stageId', 'focusId', 'removed', 'restored']) assert.deepEqual(undo[key], before[key], 'Restore undoes as one action');
    assert.equal(JSON.stringify(catalog), sourceIdentity, 'Source catalogue unchanged');
  });
}
for (const mode of ['single', 'matching']) {
  test(`${mode} invalid/nonremoved/foreign/empty restores make no writes`, () => {
    for (const id of ['', 'not-a-structure', selected.id, foreign.id]) {
      const { env, state, initial, writes } = fixture('spatial');
      const before = JSON.stringify(env.dissection);
      env.handlers[mode === 'single' ? 'restoreStructure' : 'restoreStructures'](mode === 'single' ? id : [id, id]);
      assert.deepEqual(writes, []);
      assert.deepEqual(state, initial);
      assert.equal(JSON.stringify(env.dissection), before);
      assert.deepEqual(env.cameraRestore.current, { stale: true });
    }
    if (mode === 'matching') {
      const { env, writes } = fixture('tray');
      env.handlers.restoreStructures([]);
      assert.deepEqual(writes, []);
    }
  });
  test(`${mode} exam restore makes no writes`, () => {
    const { env, writes } = fixture('extract');
    env.exam = true;
    env.handlers[mode === 'single' ? 'restoreStructure' : 'restoreStructures'](mode === 'single' ? targets[0].id : targets.map(s => s.id));
    assert.deepEqual(writes, []);
    assert.deepEqual(env.cameraRestore.current, { stale: true });
  });
  test(`${mode} restore forces refit when React zoom already equals one`, () => {
    const { env, state } = fixture('tray', { isolated: false, focus: false, zoom: 1 });
    env.handlers[mode === 'single' ? 'restoreStructure' : 'restoreStructures'](mode === 'single' ? targets[0].id : [targets[0].id]);
    assert.equal(state.reset, 8);
    assert.equal(env.cameraRestore.current, null);
  });
}
