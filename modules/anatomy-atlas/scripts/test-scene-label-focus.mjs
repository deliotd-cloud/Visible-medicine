import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { runInNewContext } from 'node:vm';
import { returnHiddenLabelFocus } from '../lib/scene-label-focus.ts';
import { layoutScreenLabels } from '../lib/screen-label-layout.ts';

function fixture() {
  const doc = { activeElement: null }, events = [];
  const label = { isConnected: true, ownerDocument: doc, disabled: false, tabIndex: 0,
    style: { visibility: 'visible' }, dataset: {}, offsetWidth: 80, offsetHeight: 30,
    setAttribute() {} };
  const canvas = { isConnected: true, ownerDocument: doc, tabIndex: 0,
    closest: () => null,
    focus(options) {
      assert.equal(label.disabled, false, 'Transfer before disabling');
      assert.equal(label.style.visibility, 'visible', 'Transfer before hiding');
      assert.equal(options.preventScroll, true);
      events.push('focus'); doc.activeElement = canvas;
    } };
  doc.activeElement = label;
  return { doc, label, canvas, events };
}
test('hidden-label focus returns to the connected model without scrolling', () => {
  const f = fixture(); returnHiddenLabelFocus(f.label, f.canvas);
  assert.equal(f.doc.activeElement, f.canvas); assert.equal(f.events.length, 1);
});
test('other focus, disconnected, inert, hidden or foreign model is never targeted', () => {
  for (const mutate of [f => { f.doc.activeElement = {}; },
    f => { f.label.isConnected = false; }, f => { f.canvas.isConnected = false; },
    f => { f.canvas.tabIndex = -1; }, f => { f.canvas.ownerDocument = {}; },
    f => { f.canvas.closest = () => ({}); }]) {
    const f = fixture(); mutate(f); returnHiddenLabelFocus(f.label, f.canvas);
    assert.equal(f.events.length, 0);
  }
});

// Execute the actual production frame callback against synthetic projected
// anchors/DOM controls; no reimplementation of its visibility/focus ordering.
const source = await readFile('app/scene-label-layer.tsx', 'utf8');
const ast = ts.createSourceFile('scene-label-layer.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const callbacks = [];
function visit(node) {
  if (ts.isCallExpression(node) && node.expression.getText(ast) === 'useFrame') callbacks.push(node.arguments[0]);
  ts.forEachChild(node, visit);
}
visit(ast); assert.equal(callbacks.length, 1);
const script = ts.transpileModule(`(${callbacks[0].getText(ast)})`,
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
function frameFixture({ outside = false, crowded = false } = {}) {
  const f = fixture(), line = { style: {}, dataset: {}, setAttribute() {} }, point = { style: {}, setAttribute() {} };
  const current = (id, priority) => ({ id, selected: false, priority,
    anchor: { current: { parent: {}, getWorldPosition(world) { world.id = id; } } } });
  const entries = [current('target', 10)];
  const buttons = new Map([['target', f.label]]), lines = new Map([['target', line]]), points = new Map([['target', point]]);
  if (crowded) {
    entries.push(current('landmark', 0));
    buttons.set('landmark', { ...f.label, style: {}, dataset: {} });
    lines.set('landmark', { ...line, style: {}, dataset: {} }); points.set('landmark', { ...point, style: {} });
  }
  const frame = runInNewContext(script, { entries, buttons: { current: buttons }, lines: { current: lines },
    points: { current: points }, world: {}, canvas: f.canvas, size: { width: 400, height: 200 },
    depthFrame: { current: { last: -Infinity, timer: null } }, performance: { now: () => 0 },
    projectLabelAnchor: world => outside && world.id === 'target' ? null : { x: 100, y: 100 },
    layoutScreenLabels, returnHiddenLabelFocus });
  return { ...f, run: () => frame({ camera: { updateMatrixWorld() {} }, scene: {} }) };
}
test('production frame transfers focused off-screen label before it becomes disabled', () => {
  const f = frameFixture({ outside: true }); f.run();
  assert.equal(f.events.length, 1); assert.equal(f.label.disabled, true);
  assert.equal(f.label.style.visibility, 'hidden');
  f.run(); assert.equal(f.events.length, 1, 'No repeated focus stealing on later frames');
});
test('production compact-layout omission also retains keyboard access', () => {
  const f = frameFixture({ crowded: true }); f.run();
  assert.equal(f.events.length, 1); assert.equal(f.label.disabled, true);
});
test('production visible labels retain their focus and visibility', () => {
  const f = frameFixture(); f.run();
  assert.equal(f.events.length, 0); assert.equal(f.doc.activeElement, f.label);
  assert.equal(f.label.disabled, false); assert.equal(f.label.style.visibility, 'visible');
});
test('production hiding does not take focus from search or another control', () => {
  const f = frameFixture({ outside: true }), search = {}; f.doc.activeElement = search; f.run();
  assert.equal(f.doc.activeElement, search); assert.equal(f.events.length, 0);
  assert.equal(f.label.disabled, true);
});
