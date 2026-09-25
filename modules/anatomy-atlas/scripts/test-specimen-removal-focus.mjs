// Keyboard-focus regression for the independent specimen Set aside path.
// Synthetic controls exercise the helper; AST-extracted callbacks and the real
// reducer prove that the rendered action actually feeds that helper.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const built = await build({
  stdin: {
    contents: "export { restoreSpecimenRemovalFocus, restoreSpecimenHistoryFocus } from './app/specimen-removal-focus'; export { initialSpecimen, reduceSpecimen } from './lib/independent-specimen';",
    resolveDir: process.cwd(), loader: 'tsx',
  },
  bundle: true, platform: 'node', format: 'cjs', write: false,
});
const moduleScope = { exports: {} };
runInNewContext(built.outputFiles[0].text, {
  module: moduleScope, exports: moduleScope.exports, require,
});
const { restoreSpecimenRemovalFocus, restoreSpecimenHistoryFocus, initialSpecimen, reduceSpecimen } = moduleScope.exports;

function fixture({ active = 'body', removed = true, undoConnected = true,
  undoDisabled = false, panelConnected = true, panelPresent = true,
  otherDocument = false, top = 150, bottom = 180 } = {}) {
  const body = {}, doc = { body, activeElement: body };
  const panel = {
    isConnected: panelConnected, scrollTop: 40,
    getBoundingClientRect: () => ({ top: 100, bottom: 250 }),
    scrollIntoView() { assert.fail('The outer page must not scroll'); },
  };
  const focusCalls = [];
  const trigger = { isConnected: !removed, ownerDocument: doc };
  const undo = {
    isConnected: undoConnected, disabled: undoDisabled,
    ownerDocument: otherDocument ? { body: {} } : doc,
    closest: selector => {
      assert.equal(selector, '.eye-layer-controls');
      return panelPresent ? panel : null;
    },
    getBoundingClientRect: () => ({ top, bottom }),
    focus(options) { focusCalls.push(options); doc.activeElement = undo; },
    scrollIntoView() { assert.fail('The outer page must not scroll'); },
  };
  doc.activeElement = active === 'trigger' ? trigger : active === 'other' ? {} : body;
  return { body, doc, panel, trigger, undo, focusCalls };
}

test('removed focused Set aside moves focus to enabled Undo without document scroll', () => {
  for (const active of ['body', 'trigger']) {
    const f = fixture({ active });
    restoreSpecimenRemovalFocus(f.trigger, f.undo);
    assert.equal(f.focusCalls.length, 1, active);
    assert.equal(f.focusCalls[0].preventScroll, true);
    assert.equal(f.doc.activeElement, f.undo);
    assert.equal(f.panel.scrollTop, 40, 'visible Undo leaves panel offset untouched');
  }
});

test('only the controls panel scrolls enough to reveal an out-of-bounds Undo', () => {
  const below = fixture({ top: 270, bottom: 300 });
  restoreSpecimenRemovalFocus(below.trigger, below.undo);
  assert.equal(below.focusCalls[0]?.preventScroll, true);
  assert.equal(below.panel.scrollTop, 102, 'bottom overflow 50 plus 12 px clearance');

  const above = fixture({ top: 80, bottom: 110 });
  restoreSpecimenRemovalFocus(above.trigger, above.undo);
  assert.equal(above.focusCalls[0]?.preventScroll, true);
  assert.equal(above.panel.scrollTop, 8, 'top overflow 20 plus 12 px clearance');
});

test('unrelated focus and invalid controls never steal focus or scroll', () => {
  for (const options of [
    { active: 'other' }, { removed: false }, { undoConnected: false },
    { undoDisabled: true }, { panelConnected: false },
    { panelPresent: false }, { otherDocument: true },
  ]) {
    const f = fixture({ ...options, top: 300, bottom: 330 });
    restoreSpecimenRemovalFocus(f.trigger, f.undo);
    assert.equal(f.focusCalls.length, 0, JSON.stringify(options));
    assert.equal(f.panel.scrollTop, 40, JSON.stringify(options));
  }
  const f = fixture({ top: 300, bottom: 330 });
  restoreSpecimenRemovalFocus(null, f.undo);
  restoreSpecimenRemovalFocus(f.trigger, null);
  assert.equal(f.focusCalls.length, 0);
  assert.equal(f.panel.scrollTop, 40);
});

test('an exhausted focused Undo or Redo moves focus to its enabled counterpart', () => {
  for (const direction of ['undo-to-redo', 'redo-to-undo']) {
    const f = fixture({ active: 'trigger', removed: false });
    f.trigger.disabled = true;
    restoreSpecimenHistoryFocus(f.trigger, f.undo);
    assert.equal(f.focusCalls[0]?.preventScroll, true, direction);
    assert.equal(f.doc.activeElement, f.undo, direction);
    assert.equal(f.panel.scrollTop, 40, direction);
  }
});

test('history restoration ignores enabled trigger, other focus and invalid alternate', () => {
  for (const options of [
    { triggerDisabled: false }, { active: 'other' }, { removed: true },
    { undoConnected: false }, { undoDisabled: true },
    { panelConnected: false }, { panelPresent: false }, { otherDocument: true },
  ]) {
    const f = fixture({ ...options, removed: options.removed ?? false, top: 300, bottom: 330 });
    f.trigger.disabled = options.triggerDisabled ?? true;
    restoreSpecimenHistoryFocus(f.trigger, f.undo);
    assert.equal(f.focusCalls.length, 0, JSON.stringify(options));
    assert.equal(f.panel.scrollTop, 40, JSON.stringify(options));
  }
  const f = fixture({ removed: false });
  f.trigger.disabled = true;
  restoreSpecimenHistoryFocus(null, f.undo);
  restoreSpecimenHistoryFocus(f.trigger, null);
  assert.equal(f.focusCalls.length, 0);
});

const source = await readFile(new URL('../app/um-knee-study.tsx', import.meta.url), 'utf8');
const parsed = ts.createSourceFile('um-knee-study.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const callbacks = [], effects = [], refs = [], historyButtons = [], historyFunctions = [];
function visit(node) {
  if (ts.isJsxAttribute(node) && node.name.text === 'onClick' &&
      ts.isJsxExpression(node.initializer) &&
      node.initializer.expression?.getText(parsed).includes('removalFocusOrigin')) {
    const element = node.parent?.parent?.parent;
    assert.match(element?.getText(parsed) ?? '', /Set aside/);
    callbacks.push(node.initializer.expression.getText(parsed));
  }
  if (ts.isCallExpression(node) && node.expression.getText(parsed) === 'useLayoutEffect' &&
      node.getText(parsed).includes('restoreSpecimenRemovalFocus')) effects.push(node);
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'historyStep') historyFunctions.push(node);
  if (ts.isJsxAttribute(node) && node.name.text === 'onClick' &&
      ts.isJsxExpression(node.initializer) &&
      node.initializer.expression?.getText(parsed).includes('historyStep'))
    historyButtons.push(node.parent?.parent);
  if (ts.isCallExpression(node) && node.expression.getText(parsed) === 'useRef' &&
      node.parent && ts.isVariableDeclaration(node.parent))
    refs.push(node.parent.name.getText(parsed));
  ts.forEachChild(node, visit);
}
visit(parsed);

test('Set aside captures only its own focused trigger before the visibility dispatch', () => {
  assert.equal(callbacks.length, 1, 'one Set aside callback owns focus capture');
  assert(refs.includes('removalFocusOrigin') && refs.includes('undoButton'), 'both persistent refs exist');
  const specimen = {
    catalog: { structures: [{ id: 'tissue-a' }, { id: 'tissue-b' }] },
    surfaces: [{ id: 'tissue-a' }, { id: 'tissue-b' }], studies: [], initialStudy: '',
  };
  for (const focused of [true, false]) {
    let state = initialSpecimen(specimen);
    const document = { activeElement: null };
    const trigger = { ownerDocument: document };
    document.activeElement = focused ? trigger : {};
    const removalFocusOrigin = { current: null }, order = [];
    const dispatch = action => {
      order.push(['dispatch', action.type, action.id, action.visible]);
      state = reduceSpecimen(specimen, state, action);
    };
    runInNewContext(`(${callbacks[0]})({ currentTarget: trigger })`, {
      trigger, selected: { id: 'tissue-a' }, removalFocusOrigin,
      dispatch, setFocus: value => order.push(['focus-mode', value]),
    });
    assert.equal(removalFocusOrigin.current, focused ? trigger : null);
    assert.deepEqual(order, [
      ['dispatch', 'visibility', 'tissue-a', false], ['focus-mode', false],
    ]);
    assert.equal(state.selectedId, null, 'selected tissue disappears');
    assert.equal(state.hidden.includes('tissue-a'), true);
    assert.equal(state.history.length, 1, 'Undo becomes enabled');
    const restored = reduceSpecimen(specimen, state, { type: 'undo' });
    assert.equal(restored.selectedId, 'tissue-a');
    assert.equal(restored.hidden.includes('tissue-a'), false);
  }
});

test('state layout effect drains origin once and hands the Undo ref to the helper', () => {
  assert.equal(effects.length, 1);
  assert.equal(effects[0].arguments[1]?.getText(parsed), '[state]');
  const effect = effects[0].arguments[0].getText(parsed);
  for (const pending of [true, false]) {
    const trigger = {}, undo = {};
    const removalFocusOrigin = { current: pending ? trigger : null };
    const undoButton = { current: undo }, redoButton = { current: {} };
    const historyFocusOrigin = { current: null }, calls = [], historyCalls = [];
    runInNewContext(`(${effect})()`, {
      removalFocusOrigin, undoButton, redoButton, historyFocusOrigin,
      restoreSpecimenRemovalFocus: (origin, target) => calls.push([origin, target]),
      restoreSpecimenHistoryFocus: (origin, target) => historyCalls.push([origin, target]),
    });
    assert.equal(removalFocusOrigin.current, null);
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], pending ? trigger : null);
    assert.equal(calls[0][1], undo);
    assert.equal(historyCalls.length, 1);
    assert.equal(historyCalls[0][0], null);
  }
});

test('Undo/Redo handlers capture focused origin and layout effect chooses the counterpart', () => {
  assert.equal(historyFunctions.length, 1);
  assert.equal(historyButtons.length, 2);
  const buttonRefs = historyButtons.map(node => {
    const attrs = Object.fromEntries(node.attributes.properties.map(attr =>
      [attr.name.getText(parsed), attr.initializer?.getText(parsed)]));
    return attrs;
  });
  assert.deepEqual(buttonRefs.map(attrs => attrs.ref), ['{undoButton}', '{redoButton}']);
  assert.match(buttonRefs[0].onClick, /historyStep\('undo', event\.currentTarget\)/);
  assert.match(buttonRefs[1].onClick, /historyStep\('redo', event\.currentTarget\)/);

  const specimen = {
    catalog: { structures: [{ id: 'tissue-a' }, { id: 'tissue-b' }] },
    surfaces: [{ id: 'tissue-a' }, { id: 'tissue-b' }], studies: [], initialStudy: '',
  };
  let state = reduceSpecimen(specimen, initialSpecimen(specimen),
    { type: 'visibility', id: 'tissue-a', visible: false });
  const handler = ts.transpileModule(historyFunctions[0].getText(parsed), {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const effect = effects[0].arguments[0].getText(parsed);
  for (const [type, focused] of [['undo', true], ['redo', true], ['undo', false]]) {
    const doc = { activeElement: null }, trigger = { ownerDocument: doc };
    doc.activeElement = focused ? trigger : {};
    const historyFocusOrigin = { current: null }, removalFocusOrigin = { current: null };
    const undoButton = { current: type === 'undo' ? trigger : {} };
    const redoButton = { current: type === 'redo' ? trigger : {} };
    const calls = [];
    runInNewContext(`${handler}; historyStep(type, trigger)`, {
      type, trigger, historyFocusOrigin,
      dispatch: action => { state = reduceSpecimen(specimen, state, action); },
      assembledDisplay: () => {},
    });
    assert.equal(historyFocusOrigin.current, focused ? trigger : null);
    assert.equal(type === 'undo' ? state.future.length : state.history.length, 1);
    runInNewContext(`(${effect})()`, {
      historyFocusOrigin, removalFocusOrigin, undoButton, redoButton,
      restoreSpecimenRemovalFocus: () => {},
      restoreSpecimenHistoryFocus: (origin, alternate) => calls.push([origin, alternate]),
    });
    assert.equal(historyFocusOrigin.current, null);
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], focused ? trigger : null);
    assert.equal(calls[0][1], focused && type === 'undo' ? redoButton.current : undoButton.current);
  }
});
