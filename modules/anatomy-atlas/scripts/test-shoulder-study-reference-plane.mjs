// Execute actual shoulder capture/restore and the device-local storage contract.
// The saved flag controls a static reference-plane illustration, not scan sync.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createContext, runInContext, runInNewContext } from 'node:vm';
import ts from 'typescript';
import { build } from './workspace-component-test-build.mjs';

const baseline = process.argv.includes('--baseline');
const source = baseline
  ? execFileSync('git', ['show', '603fd30587e94df97b8d2ce730cb7d553c2ebcde:app/shoulder-explorer.tsx'], { encoding: 'utf8' })
  : await readFile('app/shoulder-explorer.tsx', 'utf8');
const ast = ts.createSourceFile('shoulder.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const handlers = [], printer = ts.createPrinter();
function visit(node) {
  if (ts.isFunctionDeclaration(node) && ['captureView', 'restoreView', 'applyStudyView'].includes(node.name?.text))
    handlers.push(printer.printNode(ts.EmitHint.Unspecified, node, ast));
  ts.forEachChild(node, visit);
}
visit(ast);
assert.equal(handlers.length, baseline ? 2 : 3, 'extract actual saved-view handlers and shared restoration');
const code = ts.transpileModule(handlers.join('\n'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
const built = await build({ stdin: {
  contents: "export {structures} from './app/anatomy-data'; export {parseStudyView, compatibleStudyView, encodeStudyBookmarks, decodeStudyBookmarks, persistStudyBookmarks, STUDY_STORAGE_KEY} from './lib/study-views';",
  resolveDir: process.cwd(), loader: 'ts',
}, bundle: true, platform: 'node', format: 'cjs', write: false });
const compiled = { exports: {} };
runInNewContext(built.outputFiles[0].text, { module: compiled, exports: compiled.exports });
const { structures, parseStudyView, compatibleStudyView, encodeStudyBookmarks,
  decodeStudyBookmarks, persistStudyBookmarks, STUDY_STORAGE_KEY } = compiled.exports;
const plain = value => JSON.parse(JSON.stringify(value));
let checks = 0;
function same(actual, expected, message) {
  checks++;
  assert.deepEqual(plain(actual), plain(expected), message);
}
const fields = {
  selectedId: 'selectedId', view: 'view', layer: 'layer', systems: 'visibleSystems',
  explode: 'explode', layout: 'layout', zoom: 'zoom', isolated: 'isolated',
  labels: 'showLabels', anchorSkeleton: 'anchorSkeleton', showOrigins: 'showOrigins',
  plate: 'plate', inspection: 'inspection',
};
function setup(enabled) {
  assert.ok(structures.length > 1, 'real shoulder structure catalog');
  const state = {
    structures, manifest: { sha256: 'test-shoulder-revision' },
    selectedId: structures[1].id, view: 'posterior', layer: 'surface',
    visibleSystems: { skeleton: true, muscles: false, 'soft-tissue': true },
    explode: 42, layout: 'tray', zoom: 1.8, isolated: true, showLabels: false,
    anchorSkeleton: true, showOrigins: true, plate: true, syncPlane: enabled,
    inspection: { plane: 'coronal', position: 62, flipped: true,
      keepSelectedSolid: true, keepSelectedUncut: false, opacity: { muscles: 35 } },
    cameraCapture: { current: { direction: [1, 0, 0], up: [0, 1, 0], pan: [0.2, 0, 0], scale: 0.8 } },
    cameraRestore: { current: null }, beforeExam: {current:null}, resetNonce: 0, mode: 'exam',
    workspace: { chooseMode(mode) { state.workspaceMode = mode; } },
    practiceDispatch(action) { state.practiceAction = action; },
  };
  for (const key of [...Object.values(fields), 'syncPlane', 'mode', 'resetNonce'])
    state['set' + key[0].toUpperCase() + key.slice(1)] = value => {
      state[key] = typeof value === 'function' ? value(state[key]) : value;
    };
  const context = createContext(state);
  runInContext(code, context);
  return { state, call: expression => runInContext(expression, context) };
}
function changeView(state, savedFlag) {
  Object.assign(state, { selectedId: structures[0].id, view: 'anterior', layer: 'bones',
    visibleSystems: { skeleton: false, muscles: true, 'soft-tissue': false },
    explode: 0, layout: 'spatial', zoom: 0.5, isolated: false, showLabels: true,
    anchorSkeleton: false, showOrigins: false, plate: false, syncPlane: !savedFlag,
    inspection: { plane: 'off', position: 0, flipped: false, keepSelectedSolid: false, opacity: {} },
    cameraRestore: { current: null } });
}
function storageFixture() {
  const values = new Map();
  return { values, getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value) };
}
function bookmark(state, id = 'shoulder-view') {
  return { id, name: 'Reference plane study', savedAt: '2026-09-26T12:00:00.000Z', state };
}
let captured;
for (const enabled of [true, false]) for (const plate of [true, false]) {
  const { state, call } = setup(enabled);
  state.plate = plate;
  state.layout = plate ? 'tray' : 'spatial';
  const expected = Object.fromEntries(Object.entries(fields).map(([saved, live]) => [saved, plain(state[live])]));
  const camera = plain(state.cameraCapture.current);
  const saved = plain(call('captureView()'));
  // --baseline must fail here for the specific omitted setting, never catch as pass.
  assert.equal(saved.referencePlane, enabled, `capture preserves reference-plane illustration ${enabled}`);
  checks++;
  captured = saved;
  for (const [key, value] of Object.entries(expected)) same(saved[key], value, `capture ${key}`);
  same(saved.camera, camera, 'capture camera');
  same([saved.kind, saved.region, saved.revision, saved.side, saved.hiddenIds,
    saved.focus, saved.ghostRemoved, saved.illustrated],
  ['shoulder', 'shoulder-pilot', state.manifest.sha256, 'right', [], false, false, true], 'capture scope and fixed fields');
  const storage = storageFixture();
  persistStudyBookmarks(storage, { type: 'save', bookmark: bookmark(saved) });
  const decoded = decodeStudyBookmarks(storage.getItem(STUDY_STORAGE_KEY));
  same(decoded[0].state, saved, 'actual save/storage/decode retains all captured fields');
  same(decodeStudyBookmarks(encodeStudyBookmarks(decoded)), decoded, 'encode/decode round trip');
  assert.ok(compatibleStudyView(decoded[0].state, { kind: 'shoulder', region: 'shoulder-pilot',
    revision: state.manifest.sha256, structureIds: structures.map(s => s.id) }));
  checks++;
  changeView(state, enabled);
  state.saved = decoded[0].state;
  call('restoreView(saved)');
  same(state.syncPlane, enabled, 'restore saved reference-plane illustration after changed view');
  for (const [savedKey, live] of Object.entries(fields)) same(state[live], expected[savedKey], `restore ${savedKey}`);
  same(state.cameraRestore.current, camera, 'restore camera');
  same([state.workspaceMode, state.mode, state.practiceAction, state.resetNonce],
    ['dissect', 'study', { type: 'dismiss' }, 1], 'restore transition');
}

const legacy = plain(captured);
delete legacy.referencePlane;
const parsedLegacy = parseStudyView(legacy);
assert.ok(parsedLegacy, 'legacy bookmark without referencePlane parses');
assert.equal(Object.hasOwn(parsedLegacy, 'referencePlane'), false, 'legacy omission stays omitted');
checks += 2;
const legacyStored = decodeStudyBookmarks(encodeStudyBookmarks([bookmark(legacy, 'legacy')]))[0].state;
assert.equal(Object.hasOwn(legacyStored, 'referencePlane'), false, 'storage does not invent legacy flag');
checks++;
const legacyTest = setup(true);
legacyTest.state.saved = legacyStored;
legacyTest.call('restoreView(saved)');
same(legacyTest.state.syncPlane, false, 'legacy restoration disables reference-plane illustration');

for (const invalid of [null, 0, 1, 'true', 'false', {}, [], ['true']]) {
  const malformed = { ...captured, referencePlane: invalid };
  assert.equal(parseStudyView(malformed), null, `reject malformed referencePlane ${JSON.stringify(invalid)}`);
  assert.throws(() => encodeStudyBookmarks([bookmark(malformed)]), /invalid/, 'storage rejects malformed flag');
  const storage = storageFixture();
  persistStudyBookmarks(storage, { type: 'save', bookmark: bookmark(captured, 'existing') });
  const previous = storage.getItem(STUDY_STORAGE_KEY);
  assert.throws(() => persistStudyBookmarks(storage, { type: 'save', bookmark: bookmark(malformed) }), /invalid/);
  assert.equal(storage.getItem(STUDY_STORAGE_KEY), previous, 'Invalid input must not overwrite saved data');
  checks += 4;
}
const body = { ...legacy, kind: 'body', region: 'shoulder-arm', side: 'both',
  systems: { skeleton: true, muscles: true, organs: true, nerves: true, vessels: true, connective: true } };
assert.ok(parseStudyView(body), 'valid body control fixture');
checks++;
for (const value of [true, false, null, 'true']) {
  assert.equal(parseStudyView({ ...body, referencePlane: value }), null, 'body rejects shoulder-only field');
  checks++;
}
console.log(`PASS ${checks} checks: actual shoulder capture/restore, reference-plane enabled/disabled, storage, legacy omission and strict schema.`);
