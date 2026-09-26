import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

const source = readFileSync('app/body-explorer.tsx', 'utf8');
const ast = ts.createSourceFile('viewer.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const declarations = new Map(), effects = [];
function visit(node) {
  if (ts.isVariableDeclaration(node)) declarations.set(node.name.getText(ast), node);
  if (ts.isFunctionDeclaration(node) && node.name) declarations.set(node.name.text, node);
  if (ts.isCallExpression(node) && node.expression.getText(ast) === 'useEffect') effects.push(node);
  ts.forEachChild(node, visit);
}
visit(ast);
function evaluate(text, context) {
  return runInNewContext(ts.transpileModule(text, {compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
  }}).outputText, context);
}
function handler(name, context) {
  const node = declarations.get(name);
  assert(node, name);
  const expression = ts.isFunctionDeclaration(node) ? node.getText(ast) : node.initializer.arguments[0].getText(ast);
  evaluate(`this.${name} = ${expression};`, context);
}
function state(kind = 'eye') {
  const queued = [], focused = [];
  const launcher = name => ({focus: () => focused.push(name)});
  const context = {
    eyeParent: kind === 'eye' ? {id: 'old'} : null,
    ventricleParent: kind === 'eye' ? null : {id: 'old'},
    selectedId: 'old', nestedSelection: {structureId: 'child'}, manualHeartStudy: 'coronary-venous',
    nestedReturnFocus: {current: launcher('nested')},
    eyeLauncher: {current: launcher('eye')}, ventricleLauncher: {current: launcher('ventricle')},
    requestAnimationFrame: callback => queued.push(callback),
  };
  for (const [setter, field] of Object.entries({setEyeParent: 'eyeParent', setVentricleParent: 'ventricleParent',
    setNestedSelection: 'nestedSelection', setManualHeartStudy: 'manualHeartStudy', setSelectedIdState: 'selectedId'}))
    context[setter] = value => {context[field] = value;};
  for (const name of ['closeEyeLayers', 'closeVentricles', 'setSelectedId']) handler(name, context);
  return {context, focused, flush: () => {while (queued.length) queued.shift()();}, launcher};
}
for (const kind of ['eye', 'ventricle']) {
  test(`${kind}: same parent retains study; another selection clears child and restores launcher`, () => {
    const {context, focused, flush} = state(kind);
    context.setSelectedId('old');
    assert(context.nestedSelection);
    assert(context[kind === 'eye' ? 'eyeParent' : 'ventricleParent']);
    context.setSelectedId('new');
    assert.equal(context.nestedSelection, null);
    assert.equal(context[kind === 'eye' ? 'eyeParent' : 'ventricleParent'], null);
    if (kind === 'ventricle') assert.equal(context.manualHeartStudy, null);
    flush(); assert.deepEqual(focused, ['nested']);
    context.setSelectedId('old');
    assert.equal(context[kind === 'eye' ? 'eyeParent' : 'ventricleParent'], null);
  });
  test(`${kind}: explicit close falls back to its launcher`, () => {
    const {context, focused, flush} = state(kind);
    context.nestedReturnFocus.current = null;
    context[kind === 'eye' ? 'closeEyeLayers' : 'closeVentricles']();
    flush(); assert.deepEqual(focused, [kind]);
  });
  test(`${kind}: practice closes study and restores selection without reopening it`, () => {
    const {context, flush} = state(kind);
    Object.assign(context, {exam: false, practiceBlocked: false, retryCount: 0,
      available: [], practiceLoadStatus: {loaded: []}, practiceSerial: {current: 0},
      practiceMode: 'find', practiceCount: 5, practiceSampling: 'landmarks', focusTargetIds: [], retryIds: [],
      createPracticeSession: () => ({id: 1}), practiceReturnView: {current: null},
      isolated: true, focus: true, explode: 20, layout: 'spatial', plate: false, zoom: 2, view: 'front',
      cameraCapture: {current: null}, cameraRestore: {current: null}, copyRecoveryCamera: value => value,
      practiceDispatch: action => {context.practiceAction = action;}});
    for (const name of ['setPlate','setLayout','setIsolated','setFocus','setExplode','setZoom','setReset','setView'])
      context[name] = () => {};
    handler('startExam', context); handler('restorePracticeView', context);
    context.startExam();
    assert.equal(context.practiceAction.type, 'start');
    assert.equal(context.selectedId, null); assert.equal(context.nestedSelection, null);
    context.restorePracticeView();
    assert.equal(context.selectedId, 'old');
    assert.equal(context[kind === 'eye' ? 'eyeParent' : 'ventricleParent'], null);
    flush();
  });
}
test('nested search closes old study before recording new launcher, without an old focus jump', () => {
  const {context, launcher, flush, focused} = state('eye');
  const parent = {id: 'new', system: 'organs', name: 'New parent'};
  const target = {study: 'ventricles', parentHash: 'hash', structureId: 'new-child'};
  Object.assign(context, {exam: false, catalog: {}, regionStructures: [parent], side: 'both',
    resolveNestedTarget: () => target, workspace: {chooseMode: () => {}},
    cameraRestore: {current: null}, cameraCapture: {current: null},
    setSystems: () => {}, setDissection: () => {}, setSelectionNotice: () => {},
    applySelection: (id, restore) => context.setSelectedId(id, restore)});
  for (const name of ['setKneeSpecimenOpen','setAbdominalWallOpen','setBackLayersOpen','setHraPelvisOpen','setHraRenalOpen'])
    context[name] = () => {};
  handler('openNested', context);
  const nextLauncher = launcher('new nested');
  context.openNested({parentId: 'new', parentHash: 'hash'}, nextLauncher);
  assert.equal(context.eyeParent, null); assert.equal(context.ventricleParent, parent);
  assert.equal(context.nestedSelection, target); assert.equal(context.nestedReturnFocus.current, nextLauncher);
  flush(); assert.deepEqual(focused, []);
  context.closeVentricles(); flush(); assert.deepEqual(focused, ['new nested']);
});

const catalogEffect = effects.find(node => node.getText(ast).includes('Catalog unavailable'));
assert(catalogEffect);
for (const kind of ['eye', 'ventricles']) test(`linked ${kind}: initial catalog selection survives and normal state changes do not reload`, async () => {
  const {context} = state('eye');
  context.eyeParent = null; context.selectedId = null;
  let fetches = 0, commits = 0, modes = 0, lastDeps, cleanup;
  const parent = {id: 'linked'}, nested = {study: kind, structureId: 'linked-child'};
  Object.assign(context, {catalogAttempt: 0, initialRegion: 'head-neck', studyLink: {status: 'ready'}, assetBase: '',
    dispatch: () => {}, chooseWorkspaceMode: () => {modes++;},
    appliedStudyLink: {current: false}, setLinkedStudyReady: () => {}, setLinkIssue: () => {},
    setSide: () => {}, setSystems: () => {}, allBodySystems: {}, setView: () => {}, setSelectionNotice: () => {},
    setError: () => {}, setCatalog: () => {commits++;},
    resolveStudyLink: () => ({status: 'ready', selected: parent, nested, side: 'both', view: 'front'}),
    // This suite isolates effect identity; real catalogue parsing/failure paths
    // are exercised separately by test-body-catalog-input.mjs.
    modelDeliveryUrl: path => path, parseBodyCatalog: value => value,
    bodyDisplayCatalog: value => value, bodyLinkEntries: () => {},
    AbortController, setTimeout: () => 1, clearTimeout: () => {},
    fetch: async () => {fetches++; return {ok: true, json: async () => ({structures: [], bundles: [], regions: []})};},
    useEffect: (callback, deps) => {
      if (!lastDeps || deps.some((value, i) => value !== lastDeps[i])) {cleanup?.(); cleanup = callback(); lastDeps = deps;}
    },
  });
  const render = () => evaluate(catalogEffect.getText(ast), context);
  render(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(context.selectedId, 'linked'); assert.equal(context.nestedSelection, nested);
  assert.equal(context[kind === 'eye' ? 'eyeParent' : 'ventricleParent'], parent);
  assert.equal(fetches, 1); assert.equal(modes, 1);
  context.workspace = {mode: 'dissect', chooseMode: context.chooseWorkspaceMode};
  context.exam = true; render();
  assert.equal(fetches, 1);
  context.catalogAttempt++; render(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(fetches, 2); assert.equal(commits, 2); assert.equal(modes, 1);
  cleanup();
});
