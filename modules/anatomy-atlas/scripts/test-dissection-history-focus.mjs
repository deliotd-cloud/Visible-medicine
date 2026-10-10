/* oxlint-disable react-hooks/rules-of-hooks -- controlled production-component harness */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

// This canonical test always bundles the actual component from outputs.
const root = process.cwd(), require = createRequire(resolve(root, 'package.json'));
const React = require('react');
const { build } = await import(pathToFileURL(resolve(root, 'scripts/workspace-component-test-build.mjs')).href);
const compiled = await build({
  stdin: { contents: "export {DissectionControls} from './app/dissection-controls';", resolveDir: root, loader: 'tsx' },
  bundle: true, platform: 'node', format: 'cjs', write: false,
  external: ['react', 'react/*', 'react-dom', 'react-dom/*'], loader: { '.css': 'empty' },
});
let active = false, slots = [], cursor = 0, effects = [];
const shim = { ...React,
  useState(initial) {
    if (!active) return React.useState(initial);
    const i = cursor++;
    if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
    return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }];
  },
  useRef(initial) {
    if (!active) return React.useRef(initial);
    const i = cursor++;
    return slots[i] ??= { current: initial };
  },
  useMemo(fn) { return active ? fn() : React.useMemo(fn); },
  useLayoutEffect(fn) { if (active) effects.push(fn); else React.useLayoutEffect(fn); },
};
const scope = { exports: {} };
runInNewContext(compiled.outputFiles[0].text, { module: scope, exports: scope.exports,
  require: id => id === 'react' ? shim : require(id), queueMicrotask, setTimeout, console,
  process: { env: { NODE_ENV: 'test' } }, structuredClone });
const { DissectionControls } = scope.exports;
const walk = (node, predicate, found = []) => {
  if (React.isValidElement(node)) {
    if (predicate(node)) found.push(node);
    React.Children.forEach(node.props.children, child => walk(child, predicate, found));
  }
  return found;
};
const button = (tree, label) => {
  const found = walk(tree, e => e.props['aria-label'] === label)[0];
  assert(found, `missing ${label}`);
  return found;
};
const labels = { undo: 'Undo last dissection change', redo: 'Redo last undone dissection change' };
function fixture({ history = 1, future = 0, globalDisabled = false, visible = true,
  sourceVisible = true, local = true, inactiveRoot = null, inactiveSource = null,
  inactiveTarget = null, focus = 'undo' } = {}) {
  slots = []; cursor = 0; effects = [];
  const calls = [], body = { name: 'BODY' }, doc = { body, activeElement: body };
  const inactive = '[hidden], [inert], [aria-hidden="true"]';
  const panel = { isConnected: true, closest: selector => selector === inactive && (!visible || inactiveRoot) ? { inactive: inactiveRoot ?? 'hidden' } : null,
    getClientRects: () => visible ? [{}] : [], contains: node => node?.panel === panel };
  const sibling = { ...panel, contains: () => false };
  const nodes = Object.fromEntries(['undo', 'redo', 'reset'].map(kind => [kind, {
    name: kind, panel: local ? panel : sibling, ownerDocument: doc, isConnected: true, disabled: false,
    closest: selector => selector === '.dissection-deck' ? (local ? panel : sibling) :
      selector === inactive && ((kind === 'undo' && inactiveSource) || (kind === 'redo' && inactiveTarget)) ? { inactive: kind === 'undo' ? inactiveSource : inactiveTarget } : null,
    getClientRects: () => visible && (kind !== 'undo' || sourceVisible) ? [{}] : [],
    focus(options) { calls.push([kind, options]); doc.activeElement = this; },
  }]));
  let props = {
    profile: { stages: [], focuses: [], title: 'Test', orientation: '', limitations: [], references: [] },
    state: { stageId: 'free', focusId: null, history: Array(history).fill({}), future: Array(future).fill({}) },
    structures: [], visibleIds: [], visibleCount: 4, loaded: [], failed: [], ghost: false,
    disabled: globalDisabled, onStage() {}, onFocus() {}, onReset() {}, onGhost() {},
    onUndo() { props.state = { ...props.state, history: props.state.history.slice(0, -1), future: [...props.state.future, {}] }; },
    onRedo() { props.state = { ...props.state, history: [...props.state.history, {}], future: props.state.future.slice(0, -1) }; },
  };
  let tree;
  function render() {
    cursor = 0; effects = []; active = true;
    try { tree = DissectionControls(props); } finally { active = false; }
    const section = walk(tree, e => e.props.className === 'dissection-deck')[0];
    assert(section); if (section.props.ref) section.props.ref.current = panel;
    for (const kind of ['undo', 'redo']) {
      const element = button(tree, labels[kind]);
      nodes[kind].disabled = !!element.props.disabled;
      if (element.props.ref) element.props.ref.current = nodes[kind];
    }
    const reset = walk(tree, e => e.props.children && e.props.onClick === props.onReset)[0];
    assert(reset, 'Reassemble');
    nodes.reset.disabled = !!reset.props.disabled;
    if (reset.props.ref) reset.props.ref.current = nodes.reset;
    return tree;
  }
  function commit() { const pending = effects; effects = []; pending.forEach(effect => effect()); }
  render(); commit();
  doc.activeElement = nodes[focus] ?? body;
  function clickWithoutCommit(kind) {
    const element = button(tree, labels[kind]);
    assert.equal(typeof element.props.onClick, 'function');
    assert.equal(typeof element.props.onClickCapture, 'function', 'production focus capture exists');
    element.props.onClickCapture();
    element.props.onClick();
  }
  function activate(kind, { loseFocus = true, moveTo = null, queuedCommit = false } = {}) {
    clickWithoutCommit(kind);
    const settle = () => {
    render();
    if (moveTo) doc.activeElement = nodes[moveTo] ?? body;
    else if (loseFocus && nodes[kind].disabled) doc.activeElement = body;
    commit();
    };
    if (queuedCommit) queueMicrotask(settle);
    else settle();
  }
  return { doc, body, nodes, calls, get props() { return props; },
    setDisabled(value) { props = { ...props, disabled: value }; },
    setVisible(value) { visible = value; },
    clickWithoutCommit, activate, render, commit };
}

test('last keyboard Undo hands focus to enabled Redo, and last Redo to Undo', () => {
  const undo = fixture({ history: 1, future: 0, focus: 'undo' });
  undo.activate('undo');
  assert.equal(undo.doc.activeElement, undo.nodes.redo);
  assert.equal(undo.calls[0]?.[0], 'redo');
  assert.equal(undo.calls[0]?.[1].preventScroll, true);
  assert.equal(undo.nodes.undo.disabled, true);
  const redo = fixture({ history: 0, future: 1, focus: 'redo' });
  redo.activate('redo');
  assert.equal(redo.doc.activeElement, redo.nodes.undo);
  assert.equal(redo.calls[0]?.[0], 'undo');
  assert.equal(redo.calls[0]?.[1].preventScroll, true);
  assert.equal(redo.nodes.redo.disabled, true);
});
test('focused pointer activation also hands over, but a pointer action without local focus does not', () => {
  const focused = fixture({ history: 1, focus: 'undo' });
  focused.activate('undo'); assert.equal(focused.doc.activeElement, focused.nodes.redo);
  const unfocused = fixture({ history: 1, focus: 'body' });
  unfocused.activate('undo'); assert.equal(unfocused.doc.activeElement, unfocused.body);
  assert.equal(unfocused.calls.length, 0);
});
test('batched handler commit in a later microtask precedes next-task expiry', async () => {
  const f = fixture({ history: 1, focus: 'undo' });
  f.activate('undo', { queuedCommit: true });
  assert.equal(f.doc.activeElement, f.nodes.undo, 'commit has not run in capture task');
  await Promise.resolve();
  assert.equal(f.doc.activeElement, f.nodes.redo, 'queued React-style commit keeps the handover');
  assert.equal(f.calls[0]?.[1].preventScroll, true);
});
test('a no-op click expires before a later unrelated history update', async () => {
  const f = fixture({ history: 1, focus: 'undo' });
  f.props.onUndo = () => {};
  f.render(); f.commit();
  f.clickWithoutCommit('undo');
  await new Promise(resolve => setTimeout(resolve, 5));
  f.props.state = { ...f.props.state, history: [], future: [{}] };
  f.render(); f.doc.activeElement = f.body; f.commit();
  assert.equal(f.calls.length, 0, 'expired no-op cannot steal focus on unrelated update');
});
test('non-last Undo and moved focus stay on their intended controls', () => {
  const continuing = fixture({ history: 2, focus: 'undo' });
  continuing.activate('undo', { loseFocus: false });
  assert.equal(continuing.doc.activeElement, continuing.nodes.undo);
  assert.equal(continuing.calls.length, 0);
  const moved = fixture({ history: 1, focus: 'undo' });
  moved.activate('undo', { moveTo: 'reset' });
  assert.equal(moved.doc.activeElement, moved.nodes.reset);
  assert.equal(moved.calls.length, 0);
});
test('unavailable counterpart uses stable Reassemble, without changing history bindings', () => {
  const f = fixture({ history: 1, focus: 'undo' });
  const undo = button(f.render(), labels.undo);
  // A guarded parent can consume Undo while leaving both stacks empty.
  f.props.onUndo = () => { f.props.state = { ...f.props.state, history: [], future: [] }; };
  f.render(); f.commit();
  f.activate('undo');
  assert.equal(f.doc.activeElement, f.nodes.reset);
  assert.equal(f.calls[0]?.[0], 'reset');
  assert.equal(f.calls[0]?.[1].preventScroll, true);
  assert.equal(undo.props.onClick.name, 'onUndo');
});
test('hidden, sibling, global-disabled and unmounted contexts never take focus', async () => {
  for (const options of [
    { visible: false }, { inactiveRoot: 'inert' }, { inactiveRoot: 'aria-hidden' },
    { inactiveSource: 'inert' }, { inactiveTarget: 'aria-hidden' },
    { sourceVisible: false }, { local: false },
  ]) {
    const f = fixture({ history: 1, focus: 'undo', ...options });
    f.activate('undo'); assert.equal(f.calls.length, 0, JSON.stringify(options));
  }
  const disabled = fixture({ history: 1, focus: 'undo' });
  const click = button(disabled.render(), labels.undo);
  click.props.onClickCapture(); click.props.onClick();
  disabled.setDisabled(true); disabled.render(); disabled.doc.activeElement = disabled.body; disabled.commit();
  assert.equal(disabled.calls.length, 0);
  const gone = fixture({ history: 1, focus: 'undo' });
  const queued = button(gone.render(), labels.undo);
  queued.props.onClickCapture(); queued.props.onClick();
  gone.nodes.undo.isConnected = false; gone.nodes.redo.isConnected = false;
  await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal(gone.calls.length, 0, 'unmount without commit cannot focus');
});
