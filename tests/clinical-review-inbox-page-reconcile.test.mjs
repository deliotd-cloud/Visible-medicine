import * as inboxRequest from '../lib/review-inbox-request.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

const proposalRoot = new URL('../', import.meta.url);
const sourceRoot = process.env.VM_REVIEW_SOURCE_ROOT ?? fileURLToPath(proposalRoot);
const sourceRequire = createRequire(join(sourceRoot, 'package.json'));
const ts = sourceRequire('typescript');
const React = sourceRequire('react');
const transpile = url => ts.transpileModule(readFileSync(url, 'utf8'), {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const load = (url, require) => {
  const module = { exports: {} };
  runInNewContext(transpile(url), { module, exports: module.exports, require, structuredClone, URL, Headers, Response, AbortController });
  return module.exports;
};
const contract = load(new URL('lib/clinical-review-inbox-contract.ts', `file:///${sourceRoot.replaceAll('\\', '/')}/`), sourceRequire);
const search = load(new URL('lib/clinical-review-search.ts', proposalRoot), sourceRequire);
const componentURL = process.env.VM_REVIEW_COMPONENT
  ? pathToFileURL(process.env.VM_REVIEW_COMPONENT)
  : new URL('../components/ClinicalReviewInbox.tsx', import.meta.url);
const walk = (node, predicate, found = []) => {
  if (React.isValidElement(node)) {
    if (predicate(node)) found.push(node);
    React.Children.forEach(node.props.children, child => walk(child, predicate, found));
  }
  return found;
};
const words = node => typeof node === 'string' || typeof node === 'number' ? String(node) : !node ? '' : Array.isArray(node) ? node.map(words).join('') : words(node.props?.children);
const hash = char => char.repeat(64);
const context = hash('a'), revision = hash('b');
const rows = (count, approved = 0, offset = 0) => Array.from({ length: count }, (_, index) => ({
  key: `row-${index + offset}`, title: `Synthetic ${index + offset}`, area: 'structures', scopeLabel: 'Body',
  href: `/workspace/atlas-review?selection=row-${index + offset}`, trackLabel: 'Anatomy', revision: hash('c'),
  status: index + offset < approved ? 'approval-recorded' : 'not-started', capability: 'decision',
}));
const response = ({ count, approved = 0, page = 1, total = count, nextPage = null, offset = 0 }) => ({
  ok: true, status: 200, headers: new Headers({ 'X-Clinical-Review-Context': context }),
  json: async () => ({ schema: 'vm-clinical-inbox-1', scope: 'private-to-signed-in-account-and-institution',
    catalogRevision: revision, page, pageCount: nextPage ? 2 : page, selectionTotal: total, nextPage,
    items: rows(count, approved, offset), approval: false }),
});
const tick = () => new Promise(done => setImmediate(done));

function harness(initialHref) {
  const slots = [], pending = [], listeners = new Map(), historyCalls = [];
  let cursor = 0, tree, href = initialHref, effectQueue = [];
  const add = (name, fn) => { const group = listeners.get(name) ?? new Set(); group.add(fn); listeners.set(name, group); };
  const remove = (name, fn) => listeners.get(name)?.delete(fn);
  const emit = name => { for (const fn of listeners.get(name) ?? []) fn(); };
  const body = { isConnected: true };
  const listNode = { scrollTop: 17, contains() { return false; } };
  const document = { visibilityState: 'visible', activeElement: body, body, addEventListener: add, removeEventListener: remove };
  const historyState = { retained: 'router state' };
  const window = { location: { get href() { return href; }, reload() {} },
    history: { state: historyState, replaceState(state, _title, path) {
      historyCalls.push({ state, path }); href = new URL(path, href).href;
    } }, addEventListener: add, removeEventListener: remove };
  const shim = { ...React,
    useId() { const index = cursor++; return slots[index] ??= 'page-test'; },
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial }; },
    useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; },
    useEffect(fn, deps) { const index = cursor++; const old = slots[index];
      if (!old || !deps || deps.some((value, i) => !Object.is(value, old.deps?.[i]))) {
        slots[index] = { deps }; effectQueue.push(() => { old?.cleanup?.(); slots[index].cleanup = fn(); });
      }
    },
  };
  const module = { exports: {} };
  runInNewContext(transpile(componentURL), {
    module, exports: module.exports, window, document, URL, Headers, Response, AbortController, structuredClone,
    require(name) {
      if (name === 'react') return shim;
      if (name === 'react/jsx-runtime') return sourceRequire(name);
      if (name === '../lib/clinical-review-inbox-contract') return contract;
      if (name === '../lib/clinical-review-search') return search;
      if (name === '../lib/review-inbox-request') return inboxRequest;
      if (name === '../lib/clinical-review-fetch') return { clinicalReviewFetch: (url, options) => new Promise(resolve => pending.push({ url, options, resolve })) };
      if (name === './ClinicalReviewQuickStart') return { ClinicalReviewQuickStart: () => null }; if (name.endsWith('.css')) return {};
      throw Error(`Unexpected dependency: ${name}`);
    },
  });
  const render = () => {
    cursor = 0; effectQueue = []; tree = module.exports.ClinicalReviewInbox();
    const summary = walk(tree, node => node.props.id === 'clinical-review-inbox-results-summary')[0];
    summary?.props.ref?.({ isConnected: true, focus() { document.activeElement = this; } });
    const list = walk(tree, node => node.props.id === 'clinical-review-inbox-results')[0];
    if (list?.props.ref) list.props.ref.current = listNode;
    const effects = effectQueue; effectQueue = []; for (const effect of effects) effect();
    return tree;
  };
  const settle = async data => { assert(pending.length, 'expected a pending scan page'); pending.shift().resolve(response(data)); await tick(); render(); };
  const pageText = () => {
    const pager = walk(tree, node => node.type === 'nav' && node.props['aria-label'] === 'Inbox rows')[0];
    return pager ? String(pager.props.children[1].props.children.join('')) : null;
  };
  return { render, settle, pending, pageText, historyCalls, historyState, document, listNode, emit,
    get href() { return href; }, get tree() { return tree; } };
}

test('completed out-of-range deep link reconciles URL, preserving unrelated params and history state', async () => {
  const h = harness('https://example.test/workspace/clinical-review-inbox?note=keep&page=100#section');
  h.render(); await h.settle({ count: 25 }); h.render();
  assert.equal(h.pageText(), 'Page 2 of 2');
  assert.equal(new URL(h.href).searchParams.get('page'), '2');
  assert.equal(new URL(h.href).searchParams.get('note'), 'keep');
  assert.equal(new URL(h.href).hash, '#section');
  assert(h.historyCalls.every(call => call.state === h.historyState));
  assert.equal(h.document.activeElement, h.document.body);
});

test('completed one-page and empty results canonicalize a deep link to page one', async () => {
  for (const count of [1, 0]) {
    const h = harness('https://example.test/workspace/clinical-review-inbox?page=100&note=keep');
    h.render(); await h.settle({ count }); h.render();
    assert.equal(new URL(h.href).searchParams.has('page'), false);
    assert.equal(new URL(h.href).searchParams.get('note'), 'keep');
    assert.equal(h.pageText(), null);
  }
});

test('completed return scan shrinking filtered rows reconciles page two without focus or scroll action', async () => {
  const h = harness('https://example.test/workspace/clinical-review-inbox?page=2');
  h.render(); await h.settle({ count: 25 }); h.render();
  assert.equal(h.pageText(), 'Page 2 of 2');
  assert.equal(new URL(h.href).searchParams.get('page'), '2');
  h.emit('blur'); h.emit('focus');
  assert.equal(h.pending.length, 1);
  await h.settle({ count: 25, approved: 1 }); h.render();
  assert.equal(new URL(h.href).searchParams.has('page'), false);
  assert.equal(h.pageText(), null);
  assert.equal(h.document.activeElement, h.document.body);
  assert.equal(h.listNode.scrollTop, 17);
});

test('partial, paused, and failed scans retain the requested page until completeness is known', async () => {
  const h = harness('https://example.test/workspace/clinical-review-inbox?page=100');
  h.render(); await h.settle({ count: 24, total: 30, nextPage: 2 }); h.render();
  assert.equal(new URL(h.href).searchParams.get('page'), '100');
  assert.equal(h.pending.length, 1);
  h.pending.shift().resolve({ ok: false, status: 500 }); await tick(); h.render();
  assert.equal(new URL(h.href).searchParams.get('page'), '100');
  const paused = harness('https://example.test/workspace/clinical-review-inbox?page=100');
  paused.render(); await paused.settle({ count: 24, total: 30, nextPage: 2 }); paused.render();
  const button = walk(paused.tree, node => node.type === 'button' && words(node).includes('Pause'))[0];
  assert(button);
  button.props.onClick(); paused.render();
  assert.equal(new URL(paused.href).searchParams.get('page'), '100');
});
