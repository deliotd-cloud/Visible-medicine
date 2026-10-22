/* Controlled real-component lifecycle test. Run with VM_REVIEW_SOURCE_ROOT set to
 * the exact website checkout containing package.json and the inbox contract. */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

const ownRoot = fileURLToPath(new URL('../', import.meta.url));
const ownDependencies = existsSync(join(ownRoot, 'package.json')) && existsSync(join(ownRoot, 'lib/clinical-review-inbox-contract.ts'));
const sourceRoot = ownDependencies ? ownRoot : process.env.VM_REVIEW_SOURCE_ROOT;
assert(sourceRoot, 'Proposal tests need VM_REVIEW_SOURCE_ROOT; integrated tests use their own website root');
const sourceRequire = createRequire(join(resolve(sourceRoot), 'package.json'));
const ts = sourceRequire('typescript');
const React = sourceRequire('react');
const proposalComponent = fileURLToPath(new URL('../components/ClinicalReviewInbox.tsx', import.meta.url));
const transpile = path => ts.transpileModule(readFileSync(path, 'utf8'), {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function loadContract() {
  const module = { exports: {} };
  runInNewContext(transpile(join(sourceRoot, 'lib/clinical-review-inbox-contract.ts')),
    { module, exports: module.exports, structuredClone, require: sourceRequire });
  return module.exports;
}
const contract = loadContract();
const walk = (node, predicate, out = []) => {
  if (React.isValidElement(node)) {
    if (predicate(node)) out.push(node);
    React.Children.forEach(node.props.children, child => walk(child, predicate, out));
  }
  return out;
};
const words = node => typeof node === 'string' || typeof node === 'number' ? String(node) : !node ? '' : Array.isArray(node) ? node.map(words).join('') : words(node.props?.children);
const tick = () => new Promise(resolveTick => setImmediate(resolveTick));
const hash = character => character.repeat(64);
const context = hash('a'), revision = hash('b');
const item = (status = 'not-started', key = 'entry') => ({ key, title: 'Pons', area: 'head-learning', scopeLabel: 'Head', href: '/workspace/atlas-review/head-learning', trackLabel: 'Teaching', revision: hash('c'), status, capability: 'decision' });
function response(status = 'not-started', { token = context, catalog = revision, http = 200, page = 1, pageCount = 1, key = 'entry' } = {}) {
  return { ok: http === 200, status: http, headers: new Headers({ 'X-Clinical-Review-Context': token }), json: async () => ({ schema: 'vm-clinical-inbox-1', scope: 'private-to-signed-in-account-and-institution', catalogRevision: catalog, page, pageCount, selectionTotal: pageCount, nextPage: page < pageCount ? page + 1 : null, items: [item(status, key)], approval: false }) };
}
function harness() {
  const slots = [], listeners = new Map(), pending = [];
  let cursor = 0, effectCleanup, effectSlot, tree, visibilityState = 'visible', href = 'https://example.test/workspace/clinical-review-inbox?area=head-learning&q=pons';
  const add = (name, callback) => { const list = listeners.get(name) ?? new Set(); list.add(callback); listeners.set(name, list); };
  const remove = (name, callback) => listeners.get(name)?.delete(callback);
  const emit = name => { for (const callback of listeners.get(name) ?? []) callback(); };
  const body = { isConnected: true }, rowNode = { isConnected: true }, filterNode = { isConnected: true };
  const focus = [];
  const summaryNode = { isConnected: true, focus(options) { focus.push(options); document.activeElement = this; } };
  const listNode = { contains(node) { return node === rowNode && rowNode.isConnected; } };
  const document = { get visibilityState() { return visibilityState; }, addEventListener: add, removeEventListener: remove, activeElement: body, body };
  const window = { location: { get href() { return href; }, set href(value) { href = value; }, reload() {} }, history: { state: null, replaceState(_state, _title, path) { href = new URL(path, href).href; } }, addEventListener: add, removeEventListener: remove };
  const shim = { ...React,
    useId() { const index = cursor++; return slots[index] ??= 'return-test'; },
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial }; },
    useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial; return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; },
    useEffect(callback) { const index = cursor++; effectSlot = index; if (!(index in slots)) { effectCleanup = callback(); slots[index] = true; } },
  };
  const module = { exports: {} };
  runInNewContext(transpile(proposalComponent), { module, exports: module.exports, window, document, URL, Headers, Response, AbortController, structuredClone,
    require(name) {
      if (name === 'react') return shim;
      if (name === 'react/jsx-runtime') return sourceRequire(name);
      if (name === '../lib/clinical-review-inbox-contract') return contract;
      if (name === '../lib/clinical-review-fetch') return { clinicalReviewFetch: (url, options) => new Promise(resolveFetch => pending.push({ url, options, resolve: resolveFetch })) };
      if (name.endsWith('.css')) return {};
      throw Error(`Unexpected dependency: ${name}`);
    },
  });
  const render = () => { cursor = 0; tree = module.exports.ClinicalReviewInbox(); for (const summary of walk(tree, node => node.props.id === 'clinical-review-inbox-results-summary')) summary.props.ref?.(summaryNode); for (const list of walk(tree, node => node.props.id === 'clinical-review-inbox-results')) if (list.props.ref) list.props.ref.current = listNode; return tree; };
  const button = label => walk(tree, node => node.type === 'button' && words(node) === label)[0];
  const text = () => words(tree);
  const leave = () => { visibilityState = 'hidden'; emit('visibilitychange'); emit('blur'); };
  const returnToInbox = () => { visibilityState = 'visible'; emit('visibilitychange'); emit('focus'); };
  return { render, button, text, pending, leave, returnToInbox, emit, focus, rowNode, filterNode, body, document,
    rowStatuses: () => walk(tree, node => node.props.className?.startsWith?.('clinical-review-inbox-status')).map(words),
    oldListener: name => [...(listeners.get(name) ?? [])][0], get href() { return href; }, setHref(value) { href = value; },
    cleanup() { effectCleanup?.(); delete slots[effectSlot]; }, listenerCount: name => listeners.get(name)?.size ?? 0 };
}

test('mount scans once; returning refreshes atomically and keeps the focused filter and query', async () => {
  const h = harness(); h.render(); assert.equal(h.pending.length, 1);
  h.pending[0].resolve(response()); await tick(); h.render();
  const input = walk(h.render(), node => node.type === 'input' && node.props.type === 'search')[0];
  assert(input); assert(h.text().includes('Not started'));
  h.document.activeElement = h.filterNode;
  h.leave(); h.returnToInbox(); h.render();
  assert.equal(h.pending.length, 2); assert(h.text().includes('Not started')); assert(h.text().includes('Rechecking review statuses'));
  assert(walk(h.render(), node => node.type === 'input' && node.props.type === 'search').length);
  h.pending[1].resolve(response('approval-recorded')); await tick(); h.render();
  assert(h.text().includes('No loaded rows match these filters') || h.text().includes('No known review items need attention'));
  assert.equal(h.document.activeElement, h.filterNode, 'live filter keeps focus');
  assert.equal(h.focus.length, 0, 'background refresh never moves unrelated focus');
  assert(h.href.includes('area=head-learning') && h.href.includes('q=pons'));
  h.cleanup();
});

test('removed focused worksheet row hands focus to committed results only after body fallback', async () => {
  const h = harness(); h.render(); h.pending[0].resolve(response()); await tick(); h.render();
  h.document.activeElement = h.rowNode;
  h.leave(); h.returnToInbox(); h.render();
  assert.equal(h.focus.length, 0, 'no focus shift during recheck');
  h.pending[1].resolve(response('approval-recorded')); await tick();
  h.rowNode.isConnected = false; h.document.activeElement = h.body; h.render();
  assert.equal(h.focus.length, 1); assert.equal(h.focus[0].preventScroll, true);
  h.render(); assert.equal(h.focus.length, 1, 'handoff is once');
  h.cleanup();
});

test('first changed page of a multi-page return scan clears old rows without fetching page two', async () => {
  for (const changed of [{ token: hash('d') }, { catalog: hash('e') }]) {
    const h = harness(); h.render();
    h.pending[0].resolve(response('not-started', { pageCount: 2 })); await tick(); h.render();
    h.pending[1].resolve(response('not-started', { page: 2, pageCount: 2, key: 'second' })); await tick(); h.render();
    assert.equal(h.pending.length, 2);
    h.leave(); h.returnToInbox(); assert.equal(h.pending.length, 3);
    h.pending[2].resolve(response('approval-recorded', { pageCount: 2, ...changed })); await tick(); h.render();
    assert.equal(h.pending.length, 3, 'page two is never requested');
    assert(h.text().includes('Scan invalidated')); assert.deepEqual(h.rowStatuses(), []);
    h.cleanup();
  }
});

test('duplicate return signals coalesce; paused, loading and invalid scans do not auto restart', async () => {
  const h = harness(); h.render(); h.leave(); h.returnToInbox(); assert.equal(h.pending.length, 1, 'loading scan stays owned');
  h.pending[0].resolve(response()); await tick(); h.render();
  h.leave(); h.returnToInbox(); h.returnToInbox(); assert.equal(h.pending.length, 2);
  h.render(); h.button('Pause').props.onClick(); h.render(); h.leave(); h.returnToInbox(); assert.equal(h.pending.length, 2, 'paused scan stays paused');
  h.button('Resume from page 1').props.onClick(); h.render(); assert.equal(h.pending.length, 3);
  h.pending[2].resolve(response('not-started', { http: 401 })); await tick(); h.render();
  assert(h.text().includes('Scan invalidated'));
  h.leave(); h.returnToInbox(); assert.equal(h.pending.length, 3);
  h.cleanup();
});

test('changed account or source cannot replace old rows; late completion and route/unmount are ignored', async () => {
  for (const changed of [{ token: hash('d') }, { catalog: hash('e') }]) {
    const h = harness(); h.render(); h.pending[0].resolve(response()); await tick(); h.render();
    h.leave(); h.returnToInbox(); h.pending[1].resolve(response('approval-recorded', changed)); await tick(); h.render();
    assert(h.text().includes('Scan invalidated')); assert.deepEqual(h.rowStatuses(), []);
    h.cleanup();
  }
  const h = harness(); h.render(); h.pending[0].resolve(response()); await tick(); h.render();
  h.leave(); h.setHref('https://example.test/atlas/3d'); h.returnToInbox(); assert.equal(h.pending.length, 1, 'own route required');
  h.setHref('https://example.test/workspace/clinical-review-inbox'); h.leave(); h.returnToInbox(); assert.equal(h.pending.length, 2);
  const late = h.pending[1]; h.cleanup(); assert(late.options.signal.aborted);
  assert.equal(h.listenerCount('focus'), 0); assert.equal(h.listenerCount('visibilitychange'), 0);
  late.resolve(response('approval-recorded')); await tick(); h.render();
  assert.deepEqual(h.rowStatuses(), ['Not started']);
});

test('retained old return handler cannot start a scan after cleanup and effect remount', async () => {
  const h = harness(); h.render(); h.pending[0].resolve(response()); await tick(); h.render();
  h.leave(); const staleReturn = h.oldListener('focus');
  h.cleanup(); h.render(); assert.equal(h.pending.length, 2, 'fresh effect starts its own mount scan');
  h.pending[1].resolve(response()); await tick(); h.render();
  staleReturn(); assert.equal(h.pending.length, 2, 'retired handler does not refresh remounted view');
  h.cleanup();
});
