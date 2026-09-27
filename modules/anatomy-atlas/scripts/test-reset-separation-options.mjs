import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Exercise production code, not a copied reset implementation. This focused
// check covers state and the actual camera enabling condition, not React/GPU fit.
const baselineRevision = '0ff5e51a5fb9e6b660a16d1531da5c92a74317c2';
const root = fileURLToPath(new URL('../', import.meta.url));
const currentSource = await readFile(new URL('../app/body-explorer.tsx', import.meta.url), 'utf8');
const baselineSource = execFileSync('git', ['-C', root, 'show', `${baselineRevision}:app/body-explorer.tsx`], { encoding: 'utf8' });

function extract(source) {
  const ast = ts.createSourceFile('body-explorer.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let reset, closeUp;
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'resetView') reset = node.getText(ast);
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'regionalCloseUp') {
      assert(ts.isCallExpression(node.initializer), 'regionalCloseUp remains a memo call');
      closeUp = node.initializer.arguments[0].getText(ast);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert(reset && closeUp, 'Extract actual reset and regional camera callback');
  return {
    reset: ts.transpileModule(reset, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText,
    closeUp: ts.transpileModule(`const callback = ${closeUp};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText,
  };
}
const current = extract(currentSource);
const baseline = extract(baselineSource);
const inspectionSource = await readFile(new URL('../lib/inspection-state.ts', import.meta.url), 'utf8');
const inspectionModule = { exports: {} };
runInNewContext(ts.transpileModule(inspectionSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, inspectionModule);
const initialInspection = inspectionModule.exports.initialInspection;

function fixture(code, layout, showOrigins, anchorSkeleton, overrides = {}) {
  const state = {
    regionalFraming: false, layout, showOrigins, anchorSkeleton, explode: 65,
    inspection: { plane: 'coronal', position: 37, flipped: true, opacity: { muscles: 35 }, keepSelectedSolid: false },
    plate: true, zoom: 3, focus: true, isolated: true, reset: 9,
    systems: { skeleton: true, muscles: false, vessels: true, nerves: false },
    hiddenIds: ['hidden-tissue'],
    dissection: { stageId: 'deep', focusId: 'vessels', removed: ['removed-tissue'], restored: [], history: [{ removed: [] }] },
    selectedId: 'selected-foot-tissue', side: 'right', illustrated: true,
    ghostRemoved: false, exam: false,
    ...overrides,
  };
  const initial = structuredClone(state);
  const env = { initialInspection, cameraRestore: { current: { position: [1, 2, 3], target: [4, 5, 6] } } };
  for (const key of Object.keys(state)) env[`set${key[0].toUpperCase()}${key.slice(1)}`] = value => {
    state[key] = typeof value === 'function' ? value(state[key]) : value;
  };
  env.dispatch = () => assert.fail('Reset must not dispatch a dissection change');
  env.setSelectedIdState = env.setSelectedId;
  runInNewContext(`${code.reset}\nresetView();`, env);
  return { state, initial, env };
}

function cameraInput(code, state) {
  // Capture the input produced by the real memo callback. Return enabled only
  // to isolate the guide condition from catalogue/bounds and GPU behavior.
  let input;
  const env = {
    ...state, initialRegion: 'foot', dedicatedCameraRecipe: false, jointCloseUp: null,
    presentationStructures: [{ id: state.selectedId }], available: [{ id: state.selectedId }],
    regionalFramingBounds(value) { input = value; return value.enabled; },
  };
  runInNewContext(`${code.closeUp}\ncallback();`, env);
  assert(input, 'Production camera callback calls regionalFramingBounds');
  return input;
}

for (const layout of ['spatial', 'tray', 'extract']) {
  for (const showOrigins of [false, true]) for (const anchorSkeleton of [false, true]) {
    test(`Reset clears separation options from ${layout}, guides=${showOrigins}, pins=${anchorSkeleton}`, () => {
      const { state, initial, env } = fixture(current, layout, showOrigins, anchorSkeleton);
      for (const key of ['showOrigins', 'anchorSkeleton', 'focus', 'isolated', 'plate']) assert.equal(state[key], false, `${key} cleared`);
      assert.equal(state.explode, 0, 'Separation cleared');
      assert.equal(state.regionalFraming, true);
      assert.equal(state.layout, 'spatial');
      assert.equal(state.inspection, initialInspection, 'Existing cutaway reset retained');
      assert.equal(state.zoom, 1);
      assert.equal(state.reset, initial.reset + 1, 'Live camera refit requested');
      assert.equal(env.cameraRestore.current, null, 'Stale camera restore cannot override reset');
      for (const key of ['systems', 'hiddenIds', 'dissection', 'selectedId', 'side', 'illustrated', 'ghostRemoved', 'exam']) assert.deepEqual(state[key], initial[key], `${key} preserved`);
      const input = cameraInput(current, state);
      assert.equal(input.region, 'foot');
      assert.equal(input.selectedId, initial.selectedId);
      assert.equal(input.enabled, true, 'Actual Foot close-up condition recovers after clearing guides');
      assert.equal(cameraInput(current, { ...state, showOrigins: true }).enabled, false, 'Original-position guides disable the actual regional camera condition');
    });
  }
}

test('Reset requests live refit even when stored zoom is already one', () => {
  const { state, initial, env } = fixture(current, 'spatial', true, true, { zoom: 1, explode: 0, focus: false, isolated: false });
  assert.equal(state.reset, initial.reset + 1);
  assert.equal(env.cameraRestore.current, null);
  assert.equal(state.showOrigins, false);
  assert.equal(state.anchorSkeleton, false);
});

test(`Pinned baseline ${baselineRevision} reproduces retained guides/pins by state, not an exception`, () => {
  for (const [showOrigins, anchorSkeleton] of [[true, false], [false, true], [true, true]]) {
    const { state } = fixture(baseline, 'extract', showOrigins, anchorSkeleton);
    assert.equal(state.showOrigins, showOrigins, 'Baseline wrongly retains guides');
    assert.equal(state.anchorSkeleton, anchorSkeleton, 'Baseline wrongly retains pinning');
    const failures = ['showOrigins', 'anchorSkeleton'].filter(key => state[key] !== false);
    assert.deepEqual(failures, [showOrigins && 'showOrigins', anchorSkeleton && 'anchorSkeleton'].filter(Boolean), 'Clearing contract fails on the actual stale flags');
    assert.equal(cameraInput(baseline, state).enabled, !showOrigins, 'Baseline guides keep the actual Foot close-up condition disabled');
  }
});
