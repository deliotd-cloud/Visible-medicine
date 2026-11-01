import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreStudyFocus } from '../source/app/study-return-focus.ts';

function fixture() {
  const body = { isConnected: true, getClientRects: () => [{}] };
  const doc = { body, activeElement: body, defaultView: {
    getComputedStyle: element => ({ visibility: element.visibility ?? 'visible', display: 'block' }),
  } };
  const target = {
    isConnected: true,
    rects: 1,
    visibility: 'visible',
    blockedAncestor: false,
    disabled: false,
    calls: [],
    getClientRects() { return Array(this.rects).fill({}); },
    closest() { return this.blockedAncestor ? {} : null; },
    matches() { return this.disabled; },
    focus(options) { this.calls.push(options); doc.activeElement = this; },
  };
  const root = {
    isConnected: true,
    ownerDocument: doc,
    querySelector(selector) {
      assert.equal(selector, '[role="radio"][aria-checked="true"]');
      return target;
    },
  };
  return { body, doc, target, root };
}

test('closed compact drawer returns to the current mode without scrolling', () => {
  const { doc, target, root } = fixture();
  doc.activeElement = { isConnected: true, getClientRects: () => [] };
  assert.equal(restoreStudyFocus(root), true);
  assert.equal(doc.activeElement, target);
  assert.deepEqual(target.calls, [{ preventScroll: true }]);
});

test('a valid restored launcher remains focused', () => {
  const { doc, target, root } = fixture();
  const launcher = { isConnected: true, getClientRects: () => [{}] };
  doc.activeElement = launcher;
  assert.equal(restoreStudyFocus(root), false);
  assert.equal(doc.activeElement, launcher);
  assert.equal(target.calls.length, 0);
});

test('other live focus remains focused', () => {
  const { doc, target, root } = fixture();
  const live = { isConnected: true, getClientRects: () => [{}] };
  doc.activeElement = live;
  assert.equal(restoreStudyFocus(root), false);
  assert.equal(doc.activeElement, live);
  assert.equal(target.calls.length, 0);
});

test('disconnected root never receives fallback', () => {
  const { target, root } = fixture();
  root.isConnected = false;
  assert.equal(restoreStudyFocus(root), false);
  assert.equal(target.calls.length, 0);
});

for (const state of ['disconnected', 'hidden', 'visibility hidden', 'hidden ancestor', 'inert ancestor', 'aria disabled ancestor', 'disabled']) {
  test(`${state} target is skipped`, () => {
    const { target, root } = fixture();
    if (state === 'disconnected') target.isConnected = false;
    if (state === 'hidden') target.rects = 0;
    if (state === 'visibility hidden') target.visibility = 'hidden';
    if (state.includes('ancestor')) target.blockedAncestor = true;
    if (state === 'disabled') target.disabled = true;
    assert.equal(restoreStudyFocus(root), false);
    assert.equal(target.calls.length, 0);
  });
}

test('uses the root owner document, never an ambient document', () => {
  const { doc, target, root } = fixture();
  const ambient = { activeElement: { isConnected: true, getClientRects: () => [{}] } };
  globalThis.document = ambient;
  try {
    doc.activeElement = null;
    assert.equal(restoreStudyFocus(root), true);
    assert.equal(doc.activeElement, target);
    assert.notEqual(ambient.activeElement, target);
  } finally {
    delete globalThis.document;
  }
});
