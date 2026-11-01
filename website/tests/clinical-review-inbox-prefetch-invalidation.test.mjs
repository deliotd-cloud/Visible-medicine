import * as inboxRequest from '../lib/review-inbox-request.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

const proposalRoot = fileURLToPath(new URL('../', import.meta.url));
const sourceRoot = process.env.VM_REVIEW_SOURCE_ROOT;
assert(sourceRoot, 'Set VM_REVIEW_SOURCE_ROOT to the candidate website checkout');
const require = createRequire(join(sourceRoot, 'package.json'));
const React = require('react');
const ts = require('typescript');
const componentPath = process.env.VM_REVIEW_COMPONENT ?? join(proposalRoot, 'components/ClinicalReviewInbox.tsx');
const script = ts.transpileModule(readFileSync(componentPath, 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
const searchModule = { exports: {} };
runInNewContext(ts.transpileModule(readFileSync(join(proposalRoot, 'lib/clinical-review-search.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  { module: searchModule, exports: searchModule.exports });
const sha = c => c.repeat(64);
const item = i => ({ key: `item-${i}`, title: `Item ${i}`, area: 'head-learning', scopeLabel: 'Head', href: '/workspace/atlas-review/head-learning', trackLabel: 'Teaching', revision: sha('c'), status: 'not-started', capability: 'decision' });
const batch = (page, count = 3) => ({ items: [item(page)], catalogRevision: sha('b'), nextPage: page < count ? page + 1 : null, pageCount: count, selectionTotal: count });
const tick = () => new Promise(resolve => setImmediate(resolve));
const walk = (node, predicate, out = []) => { if (React.isValidElement(node)) { if (predicate(node)) out.push(node); React.Children.forEach(node.props.children, child => walk(child, predicate, out)); } return out; };
const words = node => typeof node === 'string' || typeof node === 'number' ? String(node) : !node ? '' : Array.isArray(node) ? node.map(words).join('') : words(node.props?.children);

function harness() {
  let slots = [], cursor = 0, cleanup, tree, queuedEffects = [];
  const requests = [];
  const location = { href: 'https://example.test/workspace/clinical-review-inbox', reload() { throw Error('unexpected reload'); } };
  const window = { location, history: { state: {}, replaceState() {} }, addEventListener() {}, removeEventListener() {} };
  const shim = { ...React,
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
    useRef(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; },
    useId() { cursor++; return 'inbox-test'; },
    useEffect(fn, deps) { const i = cursor++, prior = slots[i]; if (!prior || !deps || deps.some((value, index) => !Object.is(value, prior.deps?.[index]))) queuedEffects.push(() => { prior?.dispose?.(); const dispose = fn(); if (typeof dispose === 'function') cleanup = dispose; slots[i] = { deps, dispose }; }); },
  };
  const scope = { exports: {} };
  runInNewContext(script, { module: scope, exports: scope.exports, AbortController, URL, window,
    require(name) { if (name === 'react') return shim; if (name === 'react/jsx-runtime') return require(name); if (name === '../lib/review-inbox-request') return inboxRequest;
      if (name.endsWith('clinical-review-fetch')) return { clinicalReviewFetch: (url, options) => new Promise(resolve => requests.push({ url, options, resolve })) };
      if (name.endsWith('clinical-review-inbox-contract')) return { inboxAreaLabels: { 'head-learning': 'Head' }, inboxStatusLabels: { 'not-started': 'Not started' }, parseInboxBatch: value => value };
      if (name.endsWith('clinical-review-search')) return searchModule.exports;
      if (name === './ClinicalReviewQuickStart') return { ClinicalReviewQuickStart: () => null }; if (name.endsWith('.css')) return {}; throw Error(name); } });
  const component = scope.exports.ClinicalReviewInbox;
  const render = () => { cursor = 0; tree = component(); return tree; };
  const commit = () => { const effects = queuedEffects; queuedEffects = []; for (const effect of effects) effect(); render(); };
  const button = label => walk(tree, n => n.type === 'button' && words(n) === label)[0];
  const status = () => words(walk(tree, n => n.props.role === 'status')[0]);
  const response = (page, { code = 200, context = sha('a'), body = batch(page) } = {}) => {
    const request = requests.find(r => Number(new URL(r.url, location.href).searchParams.get('page')) === page && !r.done);
    assert(request, `pending page ${page}`); request.done = true;
    request.resolve({ ok: code === 200, status: code, headers: { get: () => context }, json: async () => body });
  };
  render(); commit();
  return { requests, render, button, status, response, unmount() { cleanup?.(); cleanup = undefined; }, get tree() { return tree; } };
}

async function prefetched() {
  const h = harness(); h.response(1); await tick(); h.render();
  assert.equal(h.requests.length, 3, 'page 2 and 3 requested together');
  return h;
}

for (const code of [401, 403, 409]) test(`later HTTP ${code} invalidates before preceding page settles`, async t => {
  const h = await prefetched(); t.after(() => h.unmount()); h.response(3, { code, context: null }); await tick(); h.render();
  assert(h.button('Reload page')); assert.equal(h.button('Resume from page 2'), undefined);
  assert.equal(walk(h.tree, n => n.type === 'li' && words(n).includes('Item 1')).length, 0);
  assert(h.requests[1].options.signal.aborted, 'stalled sibling aborted'); h.unmount();
});

for (const context of [null, sha('d')]) test(`later ${context ? 'changed' : 'missing'} context invalidates while earlier page stalls`, async t => {
  const h = await prefetched(); t.after(() => h.unmount());
  h.response(3, { context, body: new Promise(() => {}) });
  await tick(); h.render(); assert(h.button('Reload page')); assert.equal(h.button('Resume from page 2'), undefined);
  h.unmount();
});

test('later 5xx remains ordered and resumes at first failed page', async () => {
  const h = await prefetched(); h.response(3, { code: 503 }); await tick(); h.render();
  assert.equal(h.button('Reload page'), undefined); assert(h.button('Pause'));
  h.response(2); await tick(); h.render(); assert(h.button('Resume from page 3'));
  assert.equal(h.button('Reload page'), undefined); h.unmount();
});

test('a late prior-generation invalidation cannot clear the replacement scan', async () => {
  const h = await prefetched(); h.button('Refresh reviews').props.onClick(); h.render();
  h.response(1, { body: batch(1, 1) }); await tick(); h.render(); assert(h.status().includes('scan complete'));
  h.response(3, { code: 403 }); await tick(); h.render();
  assert.equal(h.button('Reload page'), undefined); assert(h.status().includes('scan complete')); h.unmount();
});

test('completion and unmount ignore stale responses', async () => {
  const h = await prefetched(); h.response(2); await tick(); h.render(); h.response(3); await tick(); h.render();
  assert(h.status().includes('scan complete')); h.unmount();
  assert.equal(h.button('Reload page'), undefined);
  const other = await prefetched(); other.unmount(); other.response(3, { code: 403 }); await tick(); other.render();
  assert.equal(other.button('Reload page'), undefined);
});
