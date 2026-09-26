// Execute the real saved-view handlers, reducer, profiles and source catalog.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createContext, runInContext, runInNewContext } from 'node:vm';
import ts from 'typescript';
import { build } from './workspace-component-test-build.mjs';

const baseline = process.argv.includes('--baseline');
const source = baseline
  ? execFileSync('git', ['show', 'aecdc36:app/body-explorer.tsx'], { encoding: 'utf8' })
  : await readFile('app/body-explorer.tsx', 'utf8');
const ast = ts.createSourceFile('body.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const handlers = [], printer = ts.createPrinter();
function visit(node) {
  if (ts.isFunctionDeclaration(node) && ['captureView', 'restoreView'].includes(node.name?.text))
    handlers.push(printer.printNode(ts.EmitHint.Unspecified, node, ast));
  ts.forEachChild(node, visit);
}
visit(ast);
assert.equal(handlers.length, 2);
const code = ts.transpileModule(handlers.join('\n'), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
const built = await build({ stdin: {
  contents: "export {dissectionReducer, initialDissection, resolveDissection, dissectionProfiles} from './app/dissection-data'; export {bodySideMatches} from './lib/body-presentation-parts'; export {parseStudyView, compatibleStudyView} from './lib/study-views';",
  resolveDir: process.cwd(), loader: 'ts',
}, bundle: true, platform: 'node', format: 'cjs', write: false });
const compiled = { exports: {} };
runInNewContext(built.outputFiles[0].text, { module: compiled, exports: compiled.exports });
const { dissectionReducer, initialDissection, resolveDissection, dissectionProfiles, bodySideMatches, parseStudyView, compatibleStudyView } = compiled.exports;
const catalog = JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json', 'utf8'));
const plain = value => JSON.parse(JSON.stringify(value));
const compareIds = (a, b) => a.localeCompare(b);
const ids = structures => structures.map(s => s.id).sort(compareIds);
const fields = ['selectedId', 'view', 'side', 'systems', 'explode', 'layout', 'zoom', 'isolated',
  'focus', 'labels', 'ghostRemoved', 'illustrated', 'anchorSkeleton', 'showOrigins', 'plate', 'inspection'];
let checks = 0;
function same(actual, expected, message) {
  checks++;
  assert.deepEqual(plain(actual), plain(expected), message);
}
function setup(region, side = 'both') {
  const full = catalog.structures.filter(s => region === 'whole-body' || s.regions.includes(region));
  const state = {
    catalog, initialRegion: region, whole: region === 'whole-body', profile: dissectionProfiles[region],
    dissection: plain(initialDissection), resolveDissection,
    studyRevision: 'test-source-revision', selectedId: full[0].id, view: 'posterior', side,
    systems: { skeleton: true, muscles: false, organs: true, nerves: true, vessels: false, connective: true },
    explode: 43, layout: 'tray', zoom: 1.7, isolated: true, focus: true, labels: false,
    ghostRemoved: true, illustrated: false, anchorSkeleton: true, showOrigins: true, plate: true,
    inspection: { plane: 'coronal', position: 63, flipped: true, keepSelectedSolid: true, opacity: { muscles: 35 } },
    cameraCapture: { current: { direction: [1, 0, 0], up: [0, 1, 0], pan: [0.2, 0, 0], scale: 0.8 } },
    cameraRestore: { current: null }, reset: 0, regionalFraming: true,
    workspace: { chooseMode(mode) { state.mode = mode; } },
    practiceDispatch(action) { state.practiceAction = action; },
  };
  for (const key of [...fields, 'reset', 'regionalFraming'])
    state['set' + key[0].toUpperCase() + key.slice(1)] = value => {
      state[key] = typeof value === 'function' ? value(state[key]) : value;
    };
  state.dispatch = action => { state.dissection = dissectionReducer(state.dissection, action); };
  const render = () => {
    state.regionStructures = full.filter(s => bodySideMatches(s, state.side));
    state.hiddenIds = resolveDissection(state.regionStructures, state.profile, state.dissection).removed.map(s => s.id);
  };
  const context = createContext(state);
  runInContext(code, context);
  const call = expression => runInContext(expression, context);
  render();
  return { state, full, call, render };
}
function roundTrip(test, label) {
  const { state, full, call, render } = test;
  render();
  const expected = ids(resolveDissection(full, state.profile, state.dissection).removed);
  const shownBefore = [...state.hiddenIds].sort(compareIds);
  const before = Object.fromEntries(fields.map(key => [key, plain(state[key])]));
  const camera = plain(state.cameraCapture.current);
  const saved = call('captureView()');
  same([...saved.hiddenIds].sort(compareIds), expected, `${label}: capture retains full regional removal scope`);
  same([...state.hiddenIds].sort(compareIds), shownBefore, `${label}: renderer stays side scoped`);
  for (const key of fields) same(saved[key], before[key], `${label}: captured ${key}`);
  same(saved.camera, camera, `${label}: captured camera`);
  same([saved.kind, saved.region, saved.revision, saved.layer], ['body', state.initialRegion, state.studyRevision, 'cuff'], `${label}: identity fields`);
  state.saved = saved;
  state.dispatch({ type: 'free' });
  state.side = 'both'; state.view = 'anterior'; state.selectedId = null;
  state.systems = {}; state.explode = 0; state.zoom = 0.5;
  call('restoreView(saved)');
  render();
  for (const key of fields) same(state[key], before[key], `${label}: restored ${key}`);
  same(state.cameraRestore.current, camera, `${label}: restored camera`);
  same([state.mode, state.regionalFraming, state.practiceAction.type, state.reset], ['dissect', false, 'dismiss', 1], `${label}: restore transition`);
  for (const side of ['left', 'right', 'both']) {
    state.side = side; render();
    const expectedSide = expected.filter(id => state.regionStructures.some(s => s.id === id)).sort(compareIds);
    same([...state.hiddenIds].sort(compareIds), expectedSide, `${label}: ${side} after restoration`);
  }
}

// Concrete original failure: both sides removed, Left saved, Both restored.
const manual = setup('shoulder-arm', 'left');
const left = manual.full.find(s => s.laterality === 'left');
const right = manual.full.find(s => s.laterality === 'right');
assert.ok(left && right);
manual.state.dispatch({ type: 'remove-many', ids: [left.id, right.id] });
roundTrip(manual, 'bilateral manual removals / left bookmark');

let scenarios = 1;
for (const region of ['shoulder-arm', 'thorax', 'whole-body']) {
  const scope = setup(region);
  if (!scope.full.length) continue;
  // Representative real stages and a live focused recipe, with manual
  // exceptions, across each presentation side. Whole-body uses the same path.
  const stage = scope.state.profile.stages.find(item => item.hide?.length);
  const focus = scope.state.profile.focuses.find(item => {
    const resolved = resolveDissection(scope.full, scope.state.profile,
      { ...initialDissection, stageId: 'free', focusId: item.id });
    return resolved.visible.length && resolved.removed.length;
  });
  assert.ok(focus, `${region} has a live recipe with hidden and visible tissue`);
  const recipes = [
    { type: 'free' },
    { type: 'stage', id: 'bones' },
    ...(stage ? [{ type: 'stage', id: stage.id }] : []),
    { type: 'focus', id: focus.id },
  ];
  for (const side of ['left', 'right', 'both']) for (const recipe of recipes) {
    const test = setup(region, side);
    test.state.dispatch(recipe);
    const resolved = resolveDissection(test.full, test.state.profile, test.state.dissection);
    // Prefer an opposite-side exception, plus a visible manually removed item.
    const opposite = side === 'left' ? 'right' : 'left';
    const restored = resolved.removed.find(s => s.laterality === opposite) ?? resolved.removed[0];
    if (restored) test.state.dispatch({ type: 'restore', id: restored.id });
    const removed = resolved.visible.find(s => s.laterality === opposite) ?? resolved.visible[0];
    if (removed) test.state.dispatch({ type: 'remove', id: removed.id });
    const foreign = catalog.structures.find(s => !test.full.some(item => item.id === s.id));
    if (foreign) test.state.dispatch({ type: 'remove', id: foreign.id });
    roundTrip(test, `${region}/${side}/${recipe.type}:${recipe.id ?? ''}`);
    scenarios++;
  }
}
// Existing records intentionally contain only what their old capture saved.
// Restoration must accept that exact list without inventing opposite-side edits.
for (const side of ['left', 'right', 'both']) {
  const test = setup('shoulder-arm', side);
  test.state.dispatch({ type: 'stage', id: 'bones' }); test.render();
  const legacy = plain(test.call('captureView()'));
  legacy.hiddenIds = [...test.state.hiddenIds];
  const parsed = parseStudyView(JSON.parse(JSON.stringify(legacy)));
  assert.ok(parsed, `legacy ${side} parses through actual storage contract`);
  assert.ok(compatibleStudyView(parsed, { kind: 'body', region: test.state.initialRegion,
    revision: test.state.studyRevision, structureIds: test.full.map(s => s.id) }), `legacy ${side} remains scope compatible`);
  test.state.legacy = parsed;
  test.call('restoreView(legacy)');
  test.state.side = 'both'; test.render();
  same([...test.state.hiddenIds].sort(compareIds), [...legacy.hiddenIds].sort(compareIds), `legacy ${side} record remains valid`);
  scenarios++;
}
console.log(`PASS ${scenarios} actual capture/restore scenarios, ${checks} checks; real catalog, profiles, reducer, side scopes and legacy records.`);
