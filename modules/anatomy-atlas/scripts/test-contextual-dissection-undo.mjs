// Focused reducer and component contract checks; browser visual acceptance is separate.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url);
const React = require('react');
const ts = require('typescript');
let noticeRef = null;
let lastEffectDeps = null;
let pendingEffects = [];
const reactForDirectComponentCall = {
  ...React,
  useRef: value => noticeRef ?? (noticeRef = { current: value }),
  useLayoutEffect(effect, deps) {
    if (!lastEffectDeps || deps.some((value, index) => value !== lastEffectDeps[index]))
      pendingEffects.push(effect);
    lastEffectDeps = deps;
  },
};
const compiled = await build({
  stdin: {
    contents: "export { initialDissection, dissectionReducer } from './app/dissection-data'; export { lastSingleRemoval } from './lib/contextual-dissection-undo'; export { BodySelectionNotice, revealRemovalNotice } from './app/body-selection-notice';",
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
});
const compiledModule = { exports: {} };
runInNewContext(compiled.outputFiles[0].text, {
  module: compiledModule,
  exports: compiledModule.exports,
  require: id => id === 'react' ? reactForDirectComponentCall : require(id),
  structuredClone,
});
const { initialDissection, dissectionReducer: reduce, lastSingleRemoval, BodySelectionNotice, revealRemovalNotice } = compiledModule.exports;
const items = [
  { id: 'left', name: 'Radial artery', side: 'left' },
  { id: 'right', name: 'Radial artery', side: 'right' },
  { id: 'ulna', name: 'Ulna', side: 'left' },
];
const action = (state, type, values = {}) => reduce(state, { type, ...values });
const candidate = (state, scope = items) => lastSingleRemoval(state, scope);

test('one reducer removal resolves by ID, preserving item identity and input state', () => {
  const state = action(initialDissection, 'remove', { id: 'right' });
  const original = JSON.stringify(state);
  assert.equal(candidate(state), items[1]);
  assert.equal(JSON.stringify(state), original);
  assert.equal(candidate(initialDissection), null);
  assert.equal(candidate(state, items.filter(item => item.id !== 'right')), null);
  assert.equal(candidate(state, [...items, { ...items[1] }]), null, 'duplicate ID is ambiguous');
  assert.equal(candidate(state, items.filter(item => item.id !== 'left')), items[1], 'matching names do not conflate distinct IDs');
});

test('restored tissue can be removed again and ordinary undo/redo stays contextual', () => {
  let state = action(initialDissection, 'restore', { id: 'left' });
  assert.equal(candidate(state), null);
  state = action(state, 'remove', { id: 'left' });
  assert.equal(candidate(state), items[0], 'removing the same restored ID is one tissue action');
  const undone = action(state, 'undo');
  assert.equal(candidate(undone), null, 'no stale remove action after undo');
  assert.equal(candidate(action(undone, 'redo')), items[0]);

  const first = action(initialDissection, 'remove', { id: 'left' });
  const second = action(first, 'remove', { id: 'right' });
  assert.equal(candidate(second), items[1]);
  assert.equal(candidate(action(second, 'undo')), items[0]);
  assert.equal(candidate(action(action(second, 'undo'), 'redo')), items[1]);
  assert.equal(candidate(action(second, 'remove', { id: 'right' })), items[1], 'repeated no-op does not consume the prior action');
});

test('stage, focus, loaded views, reset and scope transitions never impersonate a removal', () => {
  for (const state of [
    action(initialDissection, 'stage', { id: 'deep' }),
    action(initialDissection, 'focus', { id: 'study-left' }),
    action(initialDissection, 'load-view', { hiddenIds: ['left'] }),
    action(action(initialDissection, 'remove', { id: 'left' }), 'reset'),
    action(action(initialDissection, 'remove', { id: 'left' }), 'free'),
  ]) assert.equal(candidate(state), null);
  const focused = action(initialDissection, 'focus', { id: 'study-left' });
  const removed = action(focused, 'remove', { id: 'left' });
  assert.equal(candidate(removed), items[0]);
  assert.equal(candidate(action(removed, 'scope', { availableFocusIds: [] })), null);
  assert.equal(candidate(removed, items.slice(1)), null, 'current display scope must contain the exact ID');
});

test('bulk and mixed history changes are rejected', () => {
  assert.equal(candidate(action(initialDissection, 'remove-many', { ids: ['left', 'right'] })), null);
  const both = action(action(initialDissection, 'remove', { id: 'left' }), 'remove', { id: 'right' });
  assert.equal(candidate(action(both, 'restore', { id: 'left' })), null);
  const mixed = {
    ...both,
    restored: ['ulna'],
  };
  assert.equal(candidate(mixed), null, 'unrelated restored changes cannot be called a single removal');
  const changedStage = { ...both, stageId: 'different' };
  assert.equal(candidate(changedStage), null);
  const changedFocus = { ...both, focusId: 'different' };
  assert.equal(candidate(changedFocus), null);
});

const walk = (node, match, out = []) => {
  if (React.isValidElement(node)) {
    if (match(node)) out.push(node);
    React.Children.forEach(node.props.children, child => walk(child, match, out));
  }
  return out;
};
const content = node => typeof node === 'string' || typeof node === 'number'
  ? String(node)
  : !node ? '' : Array.isArray(node) ? node.map(content).join('') : content(node.props?.children);

test('notice exposes live message and contextual action in each mode', () => {
  for (const [mode, label] of [
    ['explore', 'Undo hiding Radial artery'],
    ['dissect', 'Undo removal of Radial artery'],
  ]) {
    let calls = 0;
    const tree = BodySelectionNotice({ message: 'Radial artery hidden', removed: items[0], onUndo: () => calls++, mode });
    assert.match(content(tree), /Radial artery hidden/);
    const live = walk(tree, node => node.props['aria-live'])[0];
    assert(live, 'message is announced through a live region');
    assert.match(content(live), /Radial artery hidden/);
    const button = walk(tree, node => node.type === 'button')[0];
    assert(button, 'single contextual Undo button');
    assert.equal(button.props['aria-label'], label);
    button.props.onClick();
    assert.equal(calls, 1);
  }
  const empty = BodySelectionNotice({ message: 'Ready', removed: null, onUndo: () => assert.fail('no action'), mode: 'explore' });
  assert.match(content(empty), /Ready/);
  assert.equal(walk(empty, node => node.type === 'button').length, 0);
});

test('notice restores focus to its persistent wrapper before Undo callback', () => {
  const order = [];
  const tree = BodySelectionNotice({
    message: 'Ulna removed', removed: items[2], mode: 'dissect',
    onUndo: () => order.push('undo'),
  });
  const wrapper = walk(tree, node => node.props.ref && typeof node.props.ref === 'object')[0];
  assert(wrapper, 'persistent notice wrapper exposes a ref');
  wrapper.props.ref.current = {
    focus: options => {
      assert.equal(options.preventScroll, true);
      order.push('focus');
    },
  };
  const button = walk(tree, node => node.type === 'button')[0];
  button.props.onClick();
  assert.deepEqual(order, ['focus', 'undo']);
});

function noticeFixture({ noticeTop = 150, noticeBottom = 180, popup = false, closed = false, connected = true } = {}) {
  let focused = 0;
  const info = {
    scrollTop: 20,
    getBoundingClientRect: () => ({ top: 100, bottom: 250 }),
  };
  const controls = popup ? {
    scrollTop: 40,
    hasAttribute: name => name === 'data-closed' && closed,
    getBoundingClientRect: () => ({ top: 110, bottom: 220 }),
  } : null;
  const target = {
    isConnected: connected,
    closest: selector => selector === '.body-info' ? info : selector === '.anatomy-controls-popup' ? controls : null,
    getBoundingClientRect: () => ({ top: noticeTop, bottom: noticeBottom }),
    focus: () => focused++,
  };
  return { target, info, controls, focused: () => focused };
}

test('reveal only scrolls the open containing panel when notice leaves its bounds', () => {
  const visible = noticeFixture();
  revealRemovalNotice(visible.target);
  assert.equal(visible.info.scrollTop, 20);
  assert.equal(visible.focused(), 0);

  const below = noticeFixture({ noticeTop: 300, noticeBottom: 325 });
  revealRemovalNotice(below.target);
  assert.equal(below.info.scrollTop, 208, 'scrolls body-info to reveal notice');
  assert.equal(below.focused(), 0, 'automatic reveal never takes keyboard focus');

  const inPopup = noticeFixture({ noticeTop: 300, noticeBottom: 325, popup: true });
  revealRemovalNotice(inPopup.target);
  assert.equal(inPopup.controls.scrollTop, 218, 'open popup is the scroll container');
  assert.equal(inPopup.info.scrollTop, 20, 'outer panel remains still');

  const closed = noticeFixture({ noticeTop: 300, noticeBottom: 325, popup: true, closed: true });
  revealRemovalNotice(closed.target);
  assert.equal(closed.controls.scrollTop, 40);
  assert.equal(closed.info.scrollTop, 20);
  const detached = noticeFixture({ noticeTop: 300, noticeBottom: 325, connected: false });
  revealRemovalNotice(detached.target);
  assert.equal(detached.info.scrollTop, 20);
  revealRemovalNotice(null);
  const outside = noticeFixture({ noticeTop: 300, noticeBottom: 325 });
  outside.target.closest = () => null;
  revealRemovalNotice(outside.target);
  assert.equal(outside.info.scrollTop, 20);
});

test('notice effect reveals a new ID once and ignores message-only rerenders', () => {
  noticeRef = null;
  lastEffectDeps = null;
  pendingEffects = [];
  const render = (message, removed) => BodySelectionNotice({
    message, removed, mode: 'explore', onUndo: () => {},
  });
  const fixture = noticeFixture({ noticeTop: 300, noticeBottom: 325 });
  const first = render('First message', items[0]);
  walk(first, node => node.props.className === 'body-selection-notice')[0].props.ref.current = fixture.target;
  assert.equal(pendingEffects.length, 1);
  pendingEffects.shift()();
  assert.equal(fixture.info.scrollTop, 208);
  assert.equal(fixture.focused(), 0);

  render('Longer message for the same selection', { ...items[0] });
  assert.equal(pendingEffects.length, 0, 'same ID does not schedule another reveal');
  render('Different removal', items[1]);
  assert.equal(pendingEffects.length, 1, 'new ID schedules reveal');
  render('No removal', null);
  assert.equal(pendingEffects.length, 2, 'clearing ID updates dependency');
  pendingEffects.splice(0, 1)[0]();
  assert.equal(fixture.info.scrollTop, 396, 'new ID can reveal again');
  pendingEffects.shift()();
  assert.equal(fixture.info.scrollTop, 396, 'clearing ID does not scroll');
});

test('BodyExplorer wires the notice to current scope, mode and Undo handler', async () => {
  const source = await readFile(new URL('../app/body-explorer.tsx', import.meta.url), 'utf8');
  const file = ts.createSourceFile('body-explorer.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const notices = [];
  const visit = node => {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(file) === 'BodySelectionNotice') notices.push(node);
    ts.forEachChild(node, visit);
  };
  visit(file);
  assert.equal(notices.length, 1);
  const attrs = Object.fromEntries(notices[0].attributes.properties.map(attr => [attr.name.getText(file), attr.initializer?.getText(file)]));
  assert.match(attrs.removed, /!exam/);
  assert.match(attrs.removed, /workspace\.mode === 'explore'/);
  assert.match(attrs.removed, /workspace\.mode === 'dissect'/);
  assert.match(attrs.removed, /lastSingleRemoval\(dissection, regionStructures\)/);
  assert.match(attrs.onUndo, /undoDissection/);
  assert.match(attrs.mode, /workspace\.mode/);
  const expression = notices[0].attributes.properties.find(attr => attr.name.getText(file) === 'removed').initializer.expression.getText(file);
  const dissection = action(initialDissection, 'remove', { id: 'left' });
  for (const mode of ['explore', 'dissect', 'practice']) {
    for (const exam of [false, true]) {
      const result = runInNewContext(expression, {
        exam, workspace: { mode }, dissection, regionStructures: items, lastSingleRemoval,
      });
      assert.equal(result, !exam && mode !== 'practice' ? items[0] : null);
    }
  }
});
