import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
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
  h.cleanup(); // Strict cleanup is idempotent and cannot detach a later owner.
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

test('actual committed layout effect registers dirty work and retires its callback', () => {
  const source = readFileSync(new URL('../app/review/review-dashboard.tsx', import.meta.url), 'utf8');
  const ast = ts.createSourceFile('review-dashboard.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const calls = [];
  const visit = node => { if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'useLayoutEffect') calls.push(node); ts.forEachChild(node, visit); };
  visit(ast);assert.equal(calls.length, 1);
  const call = calls[0];assert.equal(call.arguments[1].getText(ast), '[hasUnsaved]');
  const compile = dirty => new Function('window','hasUnsaved','registerReviewHistoryNavigation','setError', `return (${call.arguments[0].getText(ast)});`);
  const messages = [], h = harness();h.cleanup();
  const effect = compile(true)(h.view, true, registerReviewHistoryNavigation, message => messages.push(message));
  assert.equal(h.listener, undefined, 'a prepared render cannot register before layout commit');
  const cleanup = effect();assert.equal(typeof cleanup, 'function');
  assert.equal(h.fire('https://visiblemedicine.test/review/overview'), true);
  assert.deepEqual(messages, ['Save or discard your unsaved track drafts before leaving this workspace. Your edits are still here.']);
  cleanup();assert.equal(h.listener, undefined);
  const cleanEffect = compile(false)(h.view, false, () => assert.fail('clean committed state must not register'), () => assert.fail('clean state must not report a blocked exit'));
  assert.equal(cleanEffect(), undefined);
  // Authenticate the complete preceding dashboard, not just selected old lines.
  const statement = call.parent.getText(ast);
  const inverse = source.replace("import { useEffect, useLayoutEffect, useRef, useState } from 'react';", "import { useEffect, useRef, useState } from 'react';")
    .replace("import { registerReviewHistoryNavigation } from '@/lib/review-history-navigation';\n", '')
    .replace('  ' + statement + '\n', '');
  const original = execFileSync('git', ['show', 'ea70b126efc1b9a4e9c9b576587f922650145e53:app/review/review-dashboard.tsx'], {cwd: new URL('../', import.meta.url), windowsHide:true, env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  assert.deepEqual(Buffer.from(inverse), original, 'all drafts, autosave, existing link/unload gates and approval code stay exact');
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
