/* Controlled commit harness for the real inbox component. Set
 * VM_REVIEW_COMPONENT_PATH to test the sealed pre-change source. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const sourceRequire = createRequire(join(root, 'package.json'));
const React = sourceRequire('react');
const ts = sourceRequire('typescript');
const componentPath = resolve(process.env.VM_REVIEW_COMPONENT_PATH ?? join(root, 'components/ClinicalReviewInbox.tsx'));
const transpile = path => ts.transpileModule(readFileSync(path, 'utf8'), {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const contractModule = { exports: {} };
runInNewContext(transpile(join(root, 'lib/clinical-review-inbox-contract.ts')),
  { module: contractModule, exports: contractModule.exports, structuredClone, require: sourceRequire });
const contract = contractModule.exports;
const tick = () => new Promise(resolveTick => setImmediate(resolveTick));
const hash = character => character.repeat(64);
const context = hash('a'), revision = hash('b');
const item = (status = 'not-started') => ({ key: 'entry', title: 'Pons', area: 'head-learning', scopeLabel: 'Head', href: '/workspace/atlas-review/head-learning', trackLabel: 'Teaching', revision: hash('c'), status, capability: 'decision' });
const response = ({ http = 200, token = context, catalog = revision, malformed = false } = {}) => ({
  ok: http === 200, status: http, headers: new Headers({ 'X-Clinical-Review-Context': token }),
  json: async () => malformed ? { schema: 'wrong' } : { schema: 'vm-clinical-inbox-1', scope: 'private-to-signed-in-account-and-institution', catalogRevision: catalog, page: 1, pageCount: 1, selectionTotal: 1, nextPage: null, items: [item()], approval: false },
});
const walk = (node, predicate, out = []) => {
  if (React.isValidElement(node)) {
    if (predicate(node)) out.push(node);
    React.Children.forEach(node.props.children, child => walk(child, predicate, out));
  }
  return out;
};
const words = node => typeof node === 'string' || typeof node === 'number' ? String(node) : !node ? '' : Array.isArray(node) ? node.map(words).join('') : words(node.props?.children);

function harness() {
  const slots = [], listeners = new Map(), pending = [], focusEvents = [];
  let cursor = 0, effectCleanup, tree, visibilityState = 'visible';
  let href = 'https://example.test/workspace/clinical-review-inbox';
  const add = (name, callback) => { const set = listeners.get(name) ?? new Set(); set.add(callback); listeners.set(name, set); };
  const remove = (name, callback) => listeners.get(name)?.delete(callback);
  const emit = name => { for (const callback of listeners.get(name) ?? []) callback(); };
  const body = { isConnected: true }, outside = { isConnected: true };
  const row = { isConnected: false }, filter = { isConnected: false }, control = { isConnected: false };
  const alert = { isConnected: false, focus(options) { focusEvents.push(options); document.activeElement = this; } };
  const rootNode = { isConnected: true, contains(node) { return node === row && row.isConnected || node === filter && filter.isConnected || node === control && control.isConnected || node === alert && alert.isConnected; } };
  const listNode = { contains(node) { return node === row && row.isConnected; } };
  const document = { get visibilityState() { return visibilityState; }, addEventListener: add, removeEventListener: remove, activeElement: body, body };
  const window = { location: { get href() { return href; }, set href(value) { href = value; }, reload() {} }, history: { state: null, replaceState(_state, _title, path) { href = new URL(path, href).href; } }, addEventListener: add, removeEventListener: remove };
  const shim = { ...React,
    useId() { const index = cursor++; return slots[index] ??= 'failure-focus-test'; },
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial }; },
    useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial; return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; },
    useEffect(callback) { const index = cursor++; if (!(index in slots)) { effectCleanup = callback(); slots[index] = true; } },
  };
  const module = { exports: {} };
  runInNewContext(transpile(componentPath), { module, exports: module.exports, window, document, URL, Headers, Response, AbortController, structuredClone,
    require(name) {
      if (name === 'react') return shim;
      if (name === 'react/jsx-runtime') return sourceRequire(name);
      if (name === '../lib/clinical-review-inbox-contract') return contract;
      if (name === '../lib/clinical-review-fetch') return { clinicalReviewFetch: (url, options) => new Promise(resolveFetch => pending.push({ url, options, resolve: resolveFetch })) };
      if (name.endsWith('.css')) return {};
      throw Error(`Unexpected dependency: ${name}`);
    },
  });
  const render = (commit = true) => {
    cursor = 0;
    const next = module.exports.ClinicalReviewInbox();
    if (!commit) return next;
    tree = next;
    if (next.props.ref) next.props.ref.current = rootNode;
    const list = walk(next, node => node.props.id === 'clinical-review-inbox-results')[0];
    row.isConnected = !!list;
    filter.isConnected = !!walk(next, node => node.type === 'input' && node.props.type === 'search')[0];
    control.isConnected = !!walk(next, node => node.type === 'button' && /^(Pause|Resume from page )/.test(words(node)))[0];
    if (!row.isConnected && document.activeElement === row || !filter.isConnected && document.activeElement === filter || !control.isConnected && document.activeElement === control) document.activeElement = body;
    if (list?.props.ref) list.props.ref.current = listNode;
    const error = walk(next, node => node.props.role === 'alert' && node.props.className === 'clinical-review-inbox-error')[0];
    alert.isConnected = !!error;
    error?.props.ref?.(alert);
    return next;
  };
  const button = label => walk(tree, node => node.type === 'button' && words(node) === label)[0];
  const leave = () => { visibilityState = 'hidden'; emit('visibilitychange'); emit('blur'); };
  const returnToInbox = () => { visibilityState = 'visible'; emit('visibilitychange'); emit('focus'); };
  const completeInitial = async () => { render(); assert.equal(pending.length, 1); pending[0].resolve(response()); await tick(); render(); assert(row.isConnected); };
  const startRecheck = () => { leave(); returnToInbox(); render(); assert.equal(pending.length, 2); assert(row.isConnected); };
  return { render, button, pending, focusEvents, body, outside, row, filter, control, alert, document, completeInitial, startRecheck, returnToInbox,
    setHref(value) { href = value; }, get href() { return href; },
    cleanup() { effectCleanup?.(); rootNode.isConnected = false; },
    text() { return words(tree); },
  };
}

for (const [label, failure] of [
  ['HTTP 401', { http: 401 }], ['HTTP 403', { http: 403 }],
  ['HTTP 409', { http: 409 }], ['HTTP 500', { http: 500 }],
  ['changed account context', { token: hash('d') }], ['changed catalogue revision', { catalog: hash('e') }],
  ['malformed page', { malformed: true }],
]) test(`${label}: committed error receives focus once after focused row is removed`, async () => {
  const h = harness(); await h.completeInitial(); h.document.activeElement = h.row; h.startRecheck();
  h.pending[1].resolve(response(failure)); await tick();
  assert.equal(h.focusEvents.length, 0, 'no focus before commit');
  const abandoned = h.render(false);
  const abandonedAlert = walk(abandoned, node => node.props.role === 'alert')[0];
  assert(abandonedAlert);
  abandonedAlert.props.ref?.({ isConnected: false, focus() { throw Error('abandoned render focused'); } });
  assert.equal(h.focusEvents.length, 0);
  h.render();
  assert.equal(h.row.isConnected, false, 'stale row removed');
  assert.equal(h.focusEvents.length, 1);
  assert.equal(h.focusEvents[0].preventScroll, true);
  h.render(); assert.equal(h.focusEvents.length, 1, 'handoff is one time');
  assert(h.text().includes(failure.http === 500 ? 'failed' : 'Scan invalidated'));
  h.cleanup();
});

test('removed filter receives handoff, but moved focus and already absent focus are preserved', async () => {
  const h = harness(); await h.completeInitial(); h.document.activeElement = h.filter; h.startRecheck();
  h.pending[1].resolve(response({ http: 500 })); await tick(); h.render();
  assert.equal(h.focusEvents.length, 1); h.cleanup();
  for (const origin of ['outside', 'body']) {
    const other = harness(); await other.completeInitial(); other.document.activeElement = origin === 'body' ? other.body : other.row; other.startRecheck();
    if (origin === 'outside') other.document.activeElement = other.outside;
    other.pending[1].resolve(response({ http: 500 })); await tick(); other.render();
    assert.equal(other.focusEvents.length, 0, origin); other.cleanup();
  }
  const movedAfterFailure = harness(); await movedAfterFailure.completeInitial(); movedAfterFailure.document.activeElement = movedAfterFailure.row; movedAfterFailure.startRecheck();
  movedAfterFailure.pending[1].resolve(response({ http: 500 })); await tick(); movedAfterFailure.document.activeElement = movedAfterFailure.outside;
  movedAfterFailure.render(); assert.equal(movedAfterFailure.focusEvents.length, 0); movedAfterFailure.cleanup();
});

test('invalid recheck moves focus from a removed scan control to committed error', async () => {
  const h = harness(); await h.completeInitial(); h.startRecheck(); h.document.activeElement = h.control;
  h.pending[1].resolve(response({ http: 409 })); await tick(); h.render();
  assert.equal(h.control.isConnected, false); assert.equal(h.focusEvents.length, 1); h.cleanup();
});

test('route change, abort, restart and retained error callback cannot focus', async () => {
  const routed = harness(); await routed.completeInitial(); routed.document.activeElement = routed.row; routed.startRecheck();
  routed.returnToInbox(); assert.equal(routed.pending.length, 2, 'duplicate return signals coalesce');
  routed.pending[1].resolve(response({ http: 409 })); await tick(); routed.setHref('https://example.test/studio/workspace'); routed.render();
  assert.equal(routed.focusEvents.length, 0); routed.cleanup();

  const paused = harness(); await paused.completeInitial(); paused.document.activeElement = paused.row; paused.startRecheck();
  paused.button('Pause').props.onClick(); paused.render();
  paused.pending[1].resolve(response({ http: 500 })); await tick(); paused.render();
  assert.equal(paused.focusEvents.length, 0); paused.cleanup();

  const restarted = harness(); await restarted.completeInitial(); restarted.document.activeElement = restarted.row; restarted.startRecheck();
  restarted.button('Refresh reviews').props.onClick(); restarted.render();
  restarted.pending[1].resolve(response({ http: 500 })); await tick();
  restarted.pending[2].resolve(response()); await tick(); restarted.render();
  assert.equal(restarted.focusEvents.length, 0); restarted.cleanup();

  const stale = harness(); await stale.completeInitial(); stale.document.activeElement = stale.row; stale.startRecheck();
  stale.pending[1].resolve(response({ http: 500 })); await tick(); stale.document.activeElement = stale.outside; stale.render();
  const oldAlertRef = walk(stale.render(false), node => node.props.role === 'alert')[0].props.ref;
  stale.button('Resume from page 1').props.onClick(); stale.render();
  stale.document.activeElement = stale.body; oldAlertRef(stale.alert);
  assert.equal(stale.focusEvents.length, 0, 'retained callback cannot focus after restart');
  stale.cleanup();

  const unmounted = harness(); await unmounted.completeInitial(); unmounted.document.activeElement = unmounted.row; unmounted.startRecheck();
  unmounted.pending[1].resolve(response({ http: 409 })); await tick();
  const unmountedAlertRef = walk(unmounted.render(false), node => node.props.role === 'alert')[0].props.ref;
  unmounted.cleanup(); unmounted.row.isConnected = false; unmounted.document.activeElement = unmounted.body;
  unmounted.alert.isConnected = true; unmountedAlertRef(unmounted.alert);
  assert.equal(unmounted.focusEvents.length, 0, 'retained callback cannot focus after unmount');
});
