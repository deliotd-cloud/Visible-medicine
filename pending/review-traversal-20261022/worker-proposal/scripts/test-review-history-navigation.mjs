import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { registerReviewHistoryNavigation } from '../lib/review-history-navigation.ts';

const current = 'https://visiblemedicine.test/review?structure=clavicle#notes';

function harness(initialDirty = true) {
  let listener;
  let dirty = initialDirty;
  let blocked = 0;
  const view = {
    location: { href: current },
    navigation: {
      addEventListener(type, callback) {
        assert.equal(type, 'navigate');
        assert.equal(listener, undefined);
        listener = callback;
      },
      removeEventListener(type, callback) {
        assert.equal(type, 'navigate');
        assert.equal(listener, callback);
        listener = undefined;
      },
    },
  };
  const cleanup = registerReviewHistoryNavigation(view, () => dirty, () => { blocked++; });
  function fire(url, options = {}) {
    const event = new Event('navigate', { cancelable: options.cancelable ?? true });
    Object.defineProperties(event, {
      navigationType: { value: options.kind ?? 'traverse' },
      destination: { value: { sameDocument: options.sameDocument ?? true, url } },
    });
    if (options.alreadyPrevented) event.preventDefault();
    listener?.(event);
    return event.defaultPrevented;
  }
  return { view, fire, cleanup, setDirty(value) { dirty = value; },
    get blocked() { return blocked; }, get listener() { return listener; } };
}

test('dirty, cancelable same-document traversal to a different review URL is blocked', () => {
  const h = harness();
  assert.equal(h.fire('https://visiblemedicine.test/review/overview'), true);
  assert.equal(h.blocked, 1);
  assert.equal(h.fire('https://visiblemedicine.test/review?structure=scapula'), true);
  assert.equal(h.blocked, 2);
  h.cleanup();
  assert.equal(h.listener, undefined);
});

test('clean, hash-only, foreign, nontraverse and uncancelable navigations are untouched', () => {
  const h = harness(false);
  assert.equal(h.fire('https://visiblemedicine.test/review/overview'), false);
  h.setDirty(true);
  assert.equal(h.fire('https://visiblemedicine.test/review?structure=clavicle#other'), false);
  assert.equal(h.fire('https://elsewhere.test/review/overview'), false);
  assert.equal(h.fire('https://visiblemedicine.test/review/overview', { kind: 'push' }), false);
  assert.equal(h.fire('https://visiblemedicine.test/review/overview', { sameDocument: false }), false);
  assert.equal(h.fire('https://visiblemedicine.test/review/overview', { cancelable: false }), false);
  assert.equal(h.fire('https://visiblemedicine.test/review/overview', { alreadyPrevented: true }), true);
  assert.equal(h.blocked, 0);
  h.cleanup();
});

test('cleanup retires a captured callback; unsupported Navigation API is a no-op', () => {
  const h = harness();
  const stale = h.listener;
  h.cleanup();
  const event = new Event('navigate', { cancelable: true });
  Object.defineProperties(event, {
    navigationType: { value: 'traverse' },
    destination: { value: { sameDocument: true, url: 'https://visiblemedicine.test/review/overview' } },
  });
  stale(event);
  assert.equal(event.defaultPrevented, false);
  assert.equal(h.blocked, 0);
  assert.doesNotThrow(() => registerReviewHistoryNavigation({ location: { href: current } }, () => true, () => {})());
});

test('shoulder dashboard wires committed unsaved state and retains existing leave guards', () => {
  const source = readFileSync(new URL('../app/review/review-dashboard.tsx', import.meta.url), 'utf8');
  assert.match(source, /import \{ useEffect, useLayoutEffect, useRef, useState \} from 'react'/);
  assert.match(source, /useLayoutEffect\(\(\) => \{\s*if \(!hasUnsaved\) return;\s*return registerReviewHistoryNavigation\(window, \(\) => hasUnsaved,/);
  assert.match(source, /\}, \[hasUnsaved\]\);\s*function edit\(/);
  assert.match(source, /window\.addEventListener\('beforeunload', warn\)/);
  assert.match(source, /onClickCapture=\{\(event\) => \{/);
  assert.match(source, /if \(hasUnsaved && anchor && anchor\.target !== '_blank'\)/);
  assert.match(source, /Save or discard your unsaved track drafts before leaving this workspace\. Your edits are still here\./);
});
