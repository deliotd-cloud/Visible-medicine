import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {HEAD_MANIFEST_SHA256, type HeadEntry} from '../lib/head-atlas-import.ts';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {headImageConcept as headAtlasConcept} from '../lib/head-image-only-links.ts';
import {headLearningSteps} from '../lib/head-atlas-learning.ts';

// Execute extracted viewer declarations/callbacks under synthetic commit hooks.
// The rest of the scan UI is deliberately outside this fixture.
const source = readFileSync(new URL('../components/HeadAtlasViewer.tsx', import.meta.url), 'utf8');
const ast = ts.createSourceFile('HeadAtlasViewer.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const viewer = ast.statements.find((node): node is ts.FunctionDeclaration => ts.isFunctionDeclaration(node) && node.name?.text === 'HeadAtlasViewer');
assert(viewer?.body);
const variables = new Set(['activeEntry', 'comparisonScope', 'comparisonScopeRef', 'comparisonOpen',
  'playbackSteps', 'playbackIndex', 'playbackScanReady', 'playbackModelStatus', 'playbackBlocked',
  'playbackReady', 'playbackScope', 'playbackScopeRef']);
const functions = new Set(['reportPlaybackModel', 'advanceGuidedPlayback']);
const statements = viewer.body.statements.filter(statement =>
  ts.isVariableStatement(statement) && statement.declarationList.declarations.some(declaration => ts.isIdentifier(declaration.name) && variables.has(declaration.name.text)) ||
  ts.isFunctionDeclaration(statement) && !!statement.name && functions.has(statement.name.text) ||
  ts.isExpressionStatement(statement) && statement.getText(ast).startsWith('useLayoutEffect(') &&
    (statement.getText(ast).includes('comparisonScopeRef.current') || statement.getText(ast).includes('playbackScopeRef.current')));
for (const name of [...variables, ...functions]) assert(statements.some(statement => statement.getText(ast).includes(name)), `extract ${name}`);

let toolbar: ts.JsxSelfClosingElement | undefined;
let guided: ts.JsxSelfClosingElement | undefined;
let comparison: ts.JsxSelfClosingElement | undefined;
function visit(node: ts.Node) {
  if (ts.isJsxSelfClosingElement(node)) {
    const tag = node.tagName.getText(ast);
    if (tag === 'HeadTourPlayback') toolbar = node;
    if (tag === 'HeadAtlasGuidedLearning') guided = node;
    if (tag === 'HeadAtlasInlineComparisonLoader') comparison = node;
  }
  ts.forEachChild(node, visit);
}
visit(viewer);
assert(toolbar && guided && comparison, 'native viewer must render playback, guided learning and the guarded inline comparison loader');
function attribute(node: ts.JsxSelfClosingElement, name: string) {
  const item = node.attributes.properties.find(property => ts.isJsxAttribute(property) && ts.isIdentifier(property.name) && property.name.text === name);
  assert(item && ts.isJsxAttribute(item), `${node.tagName.getText(ast)}.${name}`);
  return item.initializer?.getText(ast);
}

const program = `return function execute(input,hooks,actions){
  const {pkg,study,modality,quizActive,activeId,selected,inlineComparison,rightPanel,learningPosition,
    packageOpening,failedEntryId,modelTourStatus}=input;
  const {useMemo,useRef,useLayoutEffect}=hooks;
  const {importGeneration,practiceRef,modelTourStatusRef,setModelTourStatus,changeLearningPosition,
    showLearningEntry,HEAD_MANIFEST_SHA256,HEAD_LINK_REVISION,headAtlasConcept,headLearningSteps}=actions;
  const activeConcept=input.activeConcept;
  ${statements.map(statement => statement.getText(ast)).join('\n')}
  return {reportPlaybackModel,advanceGuidedPlayback,playbackReady,playbackBlocked,playbackScanReady,
    playbackModelStatus,playbackSteps,playbackIndex,comparisonOpen};
}`;
const compiled = ts.transpileModule(program, {compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS}}).outputText;
const execute = new Function(compiled)() as (input: any, hooks: any, actions: any) => any;

const entry = (modality: 'CT' | 'MRI', name: string): HeadEntry => ({
  id: `${modality === 'CT' ? 'cth' : 'mrb'}.bst.${name}`,
  label: `${name === 'medulla_oblongata' ? 'Medulla oblongata' : name[0].toUpperCase() + name.slice(1)} — regional mask`,
  laterality: 'midline_or_unpaired', representation: 'partial-mask', family: 'Brainstem', color: [1, 0, 0],
  opacity: {fill: 0.3, outline: 1},
});

function harness(modality: 'CT' | 'MRI' = 'CT', gap = false) {
  const midbrain = entry(modality, 'midbrain'), pons = entry(modality, 'pons'), medulla = entry(modality, 'medulla_oblongata');
  assert.equal(headAtlasConcept(midbrain, modality)?.conceptId, 'brainstem-midbrain');
  assert.equal(headAtlasConcept(pons, modality)?.conceptId, 'brainstem-pons');
  const pkg = {}, study = {definition: {entries: gap ? [midbrain, medulla] : [midbrain, pons, medulla]}};
  const inlineComparison = {pkg, study, modality};
  const input: any = {pkg, study, modality, quizActive: false, activeId: midbrain.id, selected: {entry: midbrain},
    inlineComparison: null, rightPanel: 'guided', learningPosition: {sequenceId: 'brainstem', conceptId: 'brainstem-midbrain'},
    packageOpening: false, failedEntryId: null, modelTourStatus: null, activeConcept: headAtlasConcept(midbrain, modality)};
  const importGeneration = {current: 0}, practiceRef = {current: {active: false}}, modelTourStatusRef = {current: null as any};
  const positions: any[] = [], selections: HeadEntry[] = [];
  const refs: Array<{current: any}> = [];
  const committed = new Map<number, {create: () => void | (() => void); deps?: unknown[]; cleanup?: () => void}>();
  let effects = new Map<number, {create: () => void | (() => void); deps?: unknown[]}>(), cursor = 0;
  let statusWrites = 0;
  const hooks = {
    useMemo: (fn: () => unknown) => fn(),
    useRef(initial: unknown) { const index = cursor++; return refs[index] ?? (refs[index] = {current: initial}); },
    useLayoutEffect(create: () => void | (() => void), deps?: unknown[]) { effects.set(cursor++, {create, deps}); },
  };
  const actions = {importGeneration, practiceRef, modelTourStatusRef, HEAD_MANIFEST_SHA256, HEAD_LINK_REVISION,
    headAtlasConcept, headLearningSteps,
    setModelTourStatus(updater: (previous: any) => any) { const next = updater(input.modelTourStatus); if (next !== input.modelTourStatus) statusWrites++; input.modelTourStatus = next; },
    changeLearningPosition(position: unknown) { positions.push(position); },
    showLearningEntry(value: HeadEntry) { selections.push(value); },
  };
  function render(patch: Record<string, unknown> = {}, commit = true) {
    Object.assign(input, patch);
    cursor = 0; effects = new Map();
    const result = execute(input, hooks, actions);
    if (commit) for (const [index, effect] of effects) {
      const previous = committed.get(index);
      if (previous?.deps && effect.deps && previous.deps.length === effect.deps.length && previous.deps.every((value, i) => Object.is(value, effect.deps![i]))) continue;
      previous?.cleanup?.();
      const cleanup = effect.create();
      committed.set(index, {...effect, cleanup: typeof cleanup === 'function' ? cleanup : undefined});
    }
    return result;
  }
  const unmount = () => { for (const effect of committed.values()) effect.cleanup?.(); committed.clear(); };
  return {render, input, pkg, study, inlineComparison, midbrain, pons, medulla, positions, selections,
    importGeneration, practiceRef, modelTourStatusRef, unmount, get statusWrites() { return statusWrites; }};
}

test('actual JSX passes native controller context, model confirmation, and guided auto-playing state', () => {
  for (const name of ['identity', 'revision', 'sequenceId', 'stepId', 'index', 'total', 'nextId', 'ready', 'blocked', 'onAdvance'])
    assert.match(attribute(toolbar!, 'context')!, new RegExp(`\\b${name}:`));
  assert.equal(attribute(toolbar!, 'onPlayingChange'), '{setTourPlaying}');
  assert.equal(attribute(guided!, 'autoPlaying'), '{tourPlaying}');
  assert.equal(attribute(comparison!, 'onPlaybackStatus'), '{reportPlaybackModel}');
});

for (const modality of ['CT', 'MRI'] as const) test(`${modality} requires exact loaded current selection and preserves canonical gap`, () => {
  const view = harness(modality, true), current = view.render();
  assert.deepEqual(current.playbackSteps.map((step: any) => [step.conceptId, !!step.entry]),
    [['brainstem-midbrain', true], ['brainstem-pons', false], ['brainstem-medulla', true]]);
  assert.equal(current.playbackReady, true);
  current.advanceGuidedPlayback('brainstem-medulla');
  assert.deepEqual(view.positions, []);
  current.advanceGuidedPlayback('brainstem-pons');
  assert.deepEqual(view.positions, [{sequenceId: 'brainstem', conceptId: 'brainstem-pons'}]);
  assert.deepEqual(view.selections, [], 'gap has no substituted loaded entry');
  const wrongSelection = view.render({selected: {entry: view.medulla}});
  assert.equal(wrongSelection.playbackReady, false);
  wrongSelection.advanceGuidedPlayback('brainstem-pons');
  assert.equal(view.positions.length, 1);
});

test('advance obeys committed scope, import generation, readiness, practice and blocked state', () => {
  const view = harness(), visible = view.render();
  const speculative = view.render({activeId: view.pons.id}, false);
  speculative.advanceGuidedPlayback('brainstem-pons');
  assert.deepEqual(view.positions, []);
  visible.advanceGuidedPlayback('brainstem-pons');
  assert.equal(view.positions.length, 1, 'still committed callback remains valid');
  view.render();
  visible.advanceGuidedPlayback('brainstem-pons');
  assert.equal(view.positions.length, 1, 'retired callback is inert');
  const current = view.render({activeId: view.midbrain.id});
  view.importGeneration.current++;
  current.advanceGuidedPlayback('brainstem-pons');
  assert.equal(view.positions.length, 1);
  view.importGeneration.current--;
  view.practiceRef.current.active = true;
  current.advanceGuidedPlayback('brainstem-pons');
  assert.equal(view.positions.length, 1);
  view.practiceRef.current.active = false;
  const blocked = view.render({failedEntryId: view.midbrain.id});
  assert.equal(blocked.playbackBlocked, true);
  blocked.advanceGuidedPlayback('brainstem-pons');
  assert.equal(view.positions.length, 1);
  const loading = view.render({failedEntryId: null, packageOpening: true});
  assert.equal(loading.playbackReady, false);
  loading.advanceGuidedPlayback('brainstem-pons');
  assert.equal(view.positions.length, 1);
  view.unmount();
});

test('model report accepts only current comparison, concept and generation; repeated status is stable', () => {
  const view = harness();
  const closed = view.render();
  closed.reportPlaybackModel({conceptId: 'brainstem-midbrain', status: 'matched'});
  assert.equal(view.statusWrites, 0);
  const open = view.render({inlineComparison: view.inlineComparison});
  assert.equal(open.playbackReady, false);
  open.reportPlaybackModel({conceptId: 'brainstem-pons', status: 'matched'});
  assert.equal(view.statusWrites, 0);
  open.reportPlaybackModel({conceptId: 'brainstem-midbrain', status: 'matched'});
  assert.equal(view.statusWrites, 1);
  assert.equal(view.modelTourStatusRef.current?.value.status, 'matched');
  open.reportPlaybackModel({conceptId: 'brainstem-midbrain', status: 'matched'});
  assert.equal(view.statusWrites, 1);
  const ready = view.render();
  assert.equal(ready.playbackReady, true);
  ready.advanceGuidedPlayback('brainstem-pons');
  assert.equal(view.positions.length, 1);
  view.practiceRef.current.active = true;
  ready.reportPlaybackModel({conceptId: 'brainstem-midbrain', status: 'blocked'});
  assert.equal(view.statusWrites, 1);
  view.practiceRef.current.active = false;
  view.importGeneration.current++;
  ready.reportPlaybackModel({conceptId: 'brainstem-midbrain', status: 'blocked'});
  assert.equal(view.statusWrites, 1);
  view.importGeneration.current--;
  const replacement = view.render({inlineComparison: {pkg: view.pkg, study: view.study, modality: 'CT'}});
  ready.reportPlaybackModel({conceptId: 'brainstem-midbrain', status: 'blocked'});
  assert.equal(view.statusWrites, 1);
  assert.equal(replacement.playbackReady, false);
  view.render({inlineComparison: null});
  replacement.reportPlaybackModel({conceptId: 'brainstem-midbrain', status: 'matched'});
  assert.equal(view.statusWrites, 1);
  view.unmount();
});

test('comparison advance requires latest synchronous model confirmation', () => {
  const view = harness();
  const open = view.render({inlineComparison: view.inlineComparison});
  open.reportPlaybackModel({conceptId: 'brainstem-midbrain', status: 'matched'});
  const ready = view.render();
  assert.equal(ready.playbackReady, true);
  view.modelTourStatusRef.current = {scope: view.inlineComparison, value: {conceptId: 'brainstem-midbrain', status: 'waiting'}};
  ready.advanceGuidedPlayback('brainstem-pons');
  assert.deepEqual(view.positions, []);
  ready.reportPlaybackModel({conceptId: 'brainstem-midbrain', status: 'matched'});
  ready.advanceGuidedPlayback('brainstem-pons');
  assert.equal(view.positions.length, 1);
  assert.deepEqual(view.selections, [view.pons]);
  view.unmount();
});

test('committed study replacement and panel transition retire prior advance and status callbacks', () => {
  const view = harness();
  const prior = view.render({inlineComparison: view.inlineComparison});
  prior.reportPlaybackModel({conceptId: 'brainstem-midbrain', status: 'matched'});
  view.render();
  const otherStudy = {definition: {entries: view.study.definition.entries}};
  view.render({study: otherStudy, inlineComparison: null});
  prior.advanceGuidedPlayback('brainstem-pons');
  prior.reportPlaybackModel({conceptId: 'brainstem-midbrain', status: 'blocked'});
  assert.deepEqual(view.positions, []);
  assert.equal(view.statusWrites, 1);
  const panel = view.render({rightPanel: 'practice'});
  assert.equal(panel.playbackBlocked, true);
  panel.advanceGuidedPlayback('brainstem-pons');
  assert.deepEqual(view.positions, []);
  view.unmount();
});
