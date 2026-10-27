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
const proposalComponent = join(resolve(process.env.VM_INBOX_COMPONENT_ROOT || sourceRoot), 'components/ClinicalReviewInbox.tsx');
const transpile = path => ts.transpileModule(readFileSync(path, 'utf8'), {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function loadContract() {
  const module = { exports: {} };
  runInNewContext(transpile(join(sourceRoot, 'lib/clinical-review-inbox-contract.ts')),
    { module, exports: module.exports, structuredClone, require: sourceRequire });
  return module.exports;
}

test('return during a two-page mount scan keeps its requests and performs one atomic follow-up', async () => {
  const h = harness(); h.render();
  const first = h.pending[0];
  h.document.activeElement = h.filterNode;
  h.leave(); h.returnToInbox(); h.returnToInbox();
  assert.equal(h.pending.length, 1, 'return never duplicates page one');
  assert.equal(first.options.signal.aborted, false, 'return never aborts the active scan');
  first.resolve(response('not-started', { pageCount: 2 })); await tick(); h.render();
  assert.equal(h.pending.length, 2);
  assert.equal(first.options.signal.aborted, false);
  h.pending[1].resolve(response('not-started', { page: 2, pageCount: 2, key: 'second' })); await tick(); h.render();
  assert.equal(h.pending.length, 3, 'completed mount scan starts exactly one deferred recheck');
  assert(h.text().includes('Rechecking review statuses'));
  assert.deepEqual(h.rowStatuses(), ['Not started', 'Not started'], 'old committed rows stay visible during recheck');
  assert.equal(h.document.activeElement, h.filterNode, 'filter keeps focus');
  assert(h.href.includes('area=head-learning') && h.href.includes('q=pons'));
  h.pending[2].resolve(response('approval-recorded', { pageCount: 2 })); await tick(); h.render();
  assert.deepEqual(h.rowStatuses(), ['Not started', 'Not started'], 'first recheck page cannot publish partial replacement');
  assert.equal(h.pending.length, 4);
  h.pending[3].resolve(response('approval-recorded', { page: 2, pageCount: 2, key: 'second' })); await tick(); h.render();
  assert.deepEqual(h.rowStatuses(), [], 'completed recheck removes recorded decisions from default filter');
  assert.equal(h.pending.length, 4, 'duplicate return signals were coalesced');
  assert.equal(h.document.activeElement, h.filterNode);
  h.cleanup();
});

test('a second genuine return during the recheck queues one later recheck without aborting the first', async () => {
  const h = harness(); h.render();
  h.leave(); h.returnToInbox();
  h.pending[0].resolve(response()); await tick(); h.render();
  assert.equal(h.pending.length, 2);
  const firstRecheck = h.pending[1];
  h.leave(); h.returnToInbox(); h.returnToInbox();
  assert.equal(h.pending.length, 2);
  assert.equal(firstRecheck.options.signal.aborted, false);
  firstRecheck.resolve(response('approval-recorded')); await tick(); h.render();
  assert.equal(h.pending.length, 3, 'another leave and return schedules one fresh check');
  assert.equal(firstRecheck.options.signal.aborted, false);
  h.pending[2].resolve(response('approval-recorded')); await tick(); h.render();
  assert.equal(h.pending.length, 3, 'no retry loop');
  h.cleanup();
});

test('deferred check keeps the original account and catalogue boundaries', async () => {
  for (const changed of [{ token: hash('d') }, { catalog: hash('e') }]) {
    const h = harness(); h.render(); h.leave(); h.returnToInbox();
    h.pending[0].resolve(response('not-started', { pageCount: 2 })); await tick(); h.render();
    h.pending[1].resolve(response('not-started', { page: 2, pageCount: 2, key: 'second' })); await tick(); h.render();
    assert.equal(h.pending.length, 3);
    h.pending[2].resolve(response('approval-recorded', { pageCount: 2, ...changed })); await tick(); h.render();
    assert.equal(h.pending.length, 3, 'invalid first page never fetches page two');
    assert(h.text().includes('Scan invalidated'));
    assert.deepEqual(h.rowStatuses(), []);
    h.leave(); h.returnToInbox(); assert.equal(h.pending.length, 3, 'invalid scan stays stopped');
    h.cleanup();
  }
});

test('paused, failed, hidden, wrong-route and retired views do not consume a deferred return', async () => {
  const paused = harness(); paused.render(); paused.render(); paused.leave(); paused.returnToInbox();
  paused.button('Pause').props.onClick(); paused.render();
  paused.pending[0].resolve(response()); await tick(); paused.render();
  paused.leave(); paused.returnToInbox(); assert.equal(paused.pending.length, 1, 'paused scan stays paused');
  paused.cleanup();

  const failed = harness(); failed.render(); failed.leave(); failed.returnToInbox();
  failed.pending[0].resolve(response('not-started', { http: 500 })); await tick(); failed.render();
  failed.leave(); failed.returnToInbox(); assert.equal(failed.pending.length, 1, 'failed scan stays failed');
  failed.cleanup();

  const hidden = harness(); hidden.render(); hidden.leave();
  hidden.pending[0].resolve(response()); await tick(); hidden.render();
  assert.equal(hidden.pending.length, 1, 'completion while hidden does not fetch');
  hidden.returnToInbox(); assert.equal(hidden.pending.length, 2, 'visibility return starts one check');
  hidden.cleanup();

  const route = harness(); route.render(); route.leave(); route.setHref('https://example.test/atlas/3d'); route.returnToInbox();
  route.pending[0].resolve(response()); await tick(); route.render();
  assert.equal(route.pending.length, 1, 'wrong route never starts deferred check');
  route.cleanup();

  const retired = harness(); retired.render(); retired.leave(); retired.returnToInbox();
  const late = retired.pending[0]; retired.cleanup();
  assert(late.options.signal.aborted);
  late.resolve(response()); await tick();
  assert.equal(retired.pending.length, 1, 'late response cannot restart an unmounted view');
  assert.equal(retired.listenerCount('focus'), 0);
});

test('failed deferred recheck stops rather than retrying on its own', async () => {
  const h = harness(); h.render(); h.leave(); h.returnToInbox();
  h.pending[0].resolve(response()); await tick(); h.render();
  assert.equal(h.pending.length, 2);
  h.pending[1].resolve(response('not-started', { http: 500 })); await tick(); h.render();
  assert(h.text().includes('failed'));
  h.leave(); h.returnToInbox();
  assert.equal(h.pending.length, 2, 'failure does not feed an automatic retry loop');
  h.cleanup();
});
test('a queued return cannot refresh after the view becomes hidden or leaves its route', async () => {
  for (const destination of ['hidden', 'other-route']) {
    const h = harness(); h.render(); h.leave(); h.returnToInbox();
    if (destination === 'hidden') h.leave(); else h.setHref('https://example.test/atlas/3d');
    h.pending[0].resolve(response()); await tick(); h.render();
    assert.equal(h.pending.length, 1, 'completion does not refresh an inactive view');
    if (destination === 'hidden') { h.returnToInbox(); assert.equal(h.pending.length, 2, 'a later visible return can refresh'); }
    h.cleanup();
  }
});

test('pause and manual resume retire a queued return and ignore its late response', async () => {
  const h = harness(); h.render(); h.render(); h.leave(); h.returnToInbox();
  h.button('Pause').props.onClick(); h.render();
  h.button('Resume from page 1').props.onClick(); h.render();
  assert.equal(h.pending.length, 2); assert(h.pending[0].options.signal.aborted);
  h.pending[0].resolve(response()); await tick(); h.render();
  assert.equal(h.pending.length, 2);
  h.pending[1].resolve(response()); await tick(); h.render();
  assert.equal(h.pending.length, 2, 'manual resume does not inherit a retired return');
  h.cleanup();
});

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

