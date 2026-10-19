import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import {stableMutationContext} from './studio-mutation-context-fixture.mjs';

const require = createRequire(process.env.STUDIO_TEST_PACKAGE ?? new URL('../package.json', import.meta.url));
const ts = require('typescript');
const source = new URL('../', import.meta.url);
function compile(relative, imports = {}) {
  const code = ts.transpileModule(readFileSync(new URL(relative, source), 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)((name) => name === '../lib/studio-mutation-context.ts' ? stableMutationContext : imports[name] ?? require(name), module, module.exports);
  return module.exports;
}
const scopeModule = compile('lib/studio-draft-scope.ts');
const { studioDraftScopedKey, studioDraftBoundaryKey } = scopeModule;
const A = { actorId: 'edu:actor-a', organizationId: 'org-a' };
const B = { actorId: 'edu:actor-b', organizationId: 'org-a' };
const A_OTHER = { actorId: 'edu:actor-a', organizationId: 'org-b' };
const storageKey = (scope) => `visible-medicine-studio-draft:${studioDraftScopedKey(scope, 'new-course')}`;

test('versioned tuple distinguishes actors, organizations, forms and delimiter collisions', () => {
  const keys = [studioDraftScopedKey(A, 'new-course'), studioDraftScopedKey(B, 'new-course'),
    studioDraftScopedKey(A_OTHER, 'new-course'), studioDraftScopedKey(A, 'new-course-template'),
    studioDraftScopedKey({ actorId: 'edu:a:b', organizationId: 'c' }, 'd'),
    studioDraftScopedKey({ actorId: 'edu:a', organizationId: 'b:c' }, 'd')];
  assert.equal(new Set(keys).size, keys.length);
  assert.deepEqual(JSON.parse(keys[0]), ['v1', A.actorId, A.organizationId, 'new-course']);
});
test('missing and malformed scope fails closed', () => {
  for (const value of [undefined, {}, { actorId: '', organizationId: 'org-a' },
    { actorId: 'actor-a', organizationId: 'org-a' }, { actorId: 'edu:', organizationId: 'org-a' }, { actorId: 'edu:x', organizationId: ' ' },
    { actorId: 'edu:x\n', organizationId: 'org-a' }]) assert.equal(studioDraftScopedKey(value, 'new-course'), null);
});
test('distinct malformed contexts have distinct render boundaries but no storage namespace', () => {
  const first = { actorId: 'edu:', organizationId: 'org-a' };
  const second = { actorId: 'edu:', organizationId: 'org-b' };
  assert.notEqual(studioDraftBoundaryKey(first, 'new-course'), studioDraftBoundaryKey(second, 'new-course'));
  assert.equal(studioDraftScopedKey(first, 'new-course'), null);
  assert.equal(studioDraftScopedKey(second, 'new-course'), null);
});

class Input { constructor(name, value = '') { this.name = name; this.value = value; this.type = 'text'; this.checked = false; this.disabled = false; } }
class Textarea extends Input {}
class Select extends Input {}
class FormDataFixture {
  constructor(form) { this.entries = form.elements.filter(x => !x.disabled).map(x => [x.name, x.value]); }
  get(name) { return this.entries.find(x => x[0] === name)?.[1] ?? null; }
  getAll(name) { return this.entries.filter(x => x[0] === name).map(x => x[1]); }
  keys() { return this.entries.map(x => x[0]).values(); }
}
function harness({ scope = A, initial = {}, getFails = false, setFails = false, noLocks = false, post = async () => {} } = {}) {
  const savedGlobals = new Map();
  const values = new Map(Object.entries(initial)), reads = [], removes = [], writes = [], timers = new Map(), queued = [];
  const controls = [new Input('title')], form = { elements: controls, querySelectorAll: () => [] };
  const storage = {
    getItem(key) { reads.push(key); if (getFails) throw Error('blocked'); return values.get(key) ?? null; },
    setItem(key, value) { if (setFails) throw Error('quota'); writes.push(key); values.set(key, value); },
    removeItem(key) { removes.push(key); values.delete(key); },
  };
  const locks = { held: false, request(_name, action) { if (this.held) return new Promise((resolve, reject) => queued.push({ action, resolve, reject })); try { return Promise.resolve(action()); } catch (error) { return Promise.reject(error); } } };
  let confirmResult = false, confirms = 0;
  const globalValues = { localStorage: storage, navigator: noLocks ? {} : { locks }, FormData: FormDataFixture,
    HTMLInputElement: Input, HTMLTextAreaElement: Textarea, HTMLSelectElement: Select,
    document: { location: { href: 'https://example.test/studio' }, addEventListener() {}, removeEventListener() {} },
    window: { setTimeout(callback) { const id = timers.size + 1; timers.set(id, callback); return id; }, clearTimeout(id) { timers.delete(id); }, confirm(){confirms++;return confirmResult;}, addEventListener() {}, removeEventListener() {} } };
  for (const [name, value] of Object.entries(globalValues)) { savedGlobals.set(name, Object.getOwnPropertyDescriptor(globalThis, name)); Object.defineProperty(globalThis, name, { value, configurable: true, writable: true }); }
  let cursor = 0, dirty = true, unmounted = false, effects = new Map(), layoutEffects = new Map(), pending = [], pendingLayout = [], tree, routes = [], refreshes = 0;
  const hooks = {
    useRef(value) { const i = cursor++; if (!(i in slots)) slots[i] = { current: value }; return slots[i]; },
    useState(value) { const i = cursor++; if (!(i in slots)) slots[i] = typeof value === 'function' ? value() : value; return [slots[i], value => { const next = typeof value === 'function' ? value(slots[i]) : value; if (!Object.is(slots[i], next)) { slots[i] = next; dirty = true; } }]; },
    useEffect(effect, deps) { const i = cursor++, old = effects.get(i); if (!old || old.deps.length !== deps.length || deps.some((d, j) => !Object.is(d, old.deps[j]))) pending.push(() => { old?.cleanup?.(); effects.set(i, { deps, create: effect, cleanup: effect() }); }); },
    useLayoutEffect(effect, deps) { const i = cursor++, old = layoutEffects.get(i); if (!old || old.deps.length !== deps.length || deps.some((d, j) => !Object.is(d, old.deps[j]))) pendingLayout.push(() => { old?.cleanup?.(); layoutEffects.set(i, { deps, create: effect, cleanup: effect() }); }); },
  };
  const slots = [];
  const jsx = (type, props, key) => ({ type, props: { ...props, key } });
  const forms = compile('components/StudioForms.tsx', { react: hooks, 'react/jsx-runtime': { jsx, jsxs: jsx },
    'next/navigation': { useRouter: () => ({ push: x => routes.push(x), refresh: () => refreshes++ }) },
    '@/lib/studio-templates': { STUDIO_COURSE_TEMPLATES: [] },
    '../lib/studio-draft-scope.ts': scopeModule,
    '../lib/studio-release-order.ts': {}, '../lib/studio-navigation-guard.ts': { registerStudioNavigationGuard: () => () => {} },
  });
  let outer = forms.CreateCourseForm({ recoveryScope: scope });
  let action = outer.type, props = { ...outer.props, onSubmit: post === 'real' ? outer.props.onSubmit : post };
  function flush() { let count = 0; do { assert.ok(++count < 30); dirty = false; cursor = 0; pending = []; pendingLayout = []; tree = action(props); tree.props.ref.current = form; for (const effect of pendingLayout) effect(); for (const effect of pending) effect(); } while (dirty); }
  flush();
  const nodeText = node => Array.isArray(node) ? node.map(nodeText).join('') : node?.props ? nodeText(node.props.children) : typeof node === 'string' ? node : '';
  const findButton = (node,label) => Array.isArray(node) ? node.map(child=>findButton(child,label)).find(Boolean) : node?.props ? (node.type==='button'&&nodeText(node)===label?node:findButton(node.props.children,label)) : undefined;
  return { values, reads, writes, removes, controls, locks, queued, timers, routes, get refreshes() { return refreshes; },
    get confirms(){return confirms;},set confirmResult(value){confirmResult=value;},
    clickButton(label){const button=findButton(tree,label);assert.ok(button,`Missing ${label}`);button.props.onClick();flush();},
    change(value) { controls[0].value = value; tree.props.onChange(); flush(); },
    submit() { return tree.props.onSubmit({ preventDefault() {}, currentTarget: form }); },
    async settle() { await Promise.resolve(); await Promise.resolve(); if (!unmounted) flush(); },
    scope(next) { // React's changed key retires the old component before mounting the next one.
      outer = forms.CreateCourseForm({ recoveryScope: next }); const oldKey = props.key;
      if (outer.props.key !== oldKey) { for (const effect of layoutEffects.values()) effect.cleanup?.(); for (const effect of effects.values()) effect.cleanup?.(); layoutEffects = new Map(); effects = new Map(); slots.length = 0; controls[0].value = ''; }
      action = outer.type; props = { ...outer.props, onSubmit: post === 'real' ? outer.props.onSubmit : post }; flush();
    },
    release() { const item = queued.shift(); assert.ok(item); try { item.resolve(item.action()); } catch (error) { item.reject(error); } },
    unmountLayoutOnly() { unmounted = true; for (const effect of layoutEffects.values()) effect.cleanup?.(); },
    strictEffectReplay() { for (const effect of layoutEffects.values()) effect.cleanup?.(); for (const effect of effects.values()) effect.cleanup?.(); for (const effect of layoutEffects.values()) effect.cleanup = effect.create(); for (const effect of effects.values()) effect.cleanup = effect.create(); flush(); },
    runTimers() { for (const [id, fn] of timers) { timers.delete(id); fn(); } flush(); },
    text() { return JSON.stringify(tree); },
    dispose() { unmounted = true; for (const effect of layoutEffects.values()) effect.cleanup?.(); for (const effect of effects.values()) effect.cleanup?.(); for (const [name, descriptor] of savedGlobals) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name]; } },
  };
}

test('A recovery stays separate from B and another organization; unscoped bytes are neither read nor changed', () => {
  const legacy = 'not-current-owner'; const oldPrimary = '{"title":"unknown author"}';
  const h = harness({ initial: { [storageKey(A)]: '{"title":"A text"}', 'visible-medicine-studio-draft:new-course': oldPrimary, 'elivion-studio-draft:new-course': legacy } });
  try {
    assert.equal(h.controls[0].value, 'A text');
    h.scope(B); assert.equal(h.controls[0].value, '');
    h.scope(A_OTHER); assert.equal(h.controls[0].value, '');
    h.scope(A); assert.equal(h.controls[0].value, 'A text');
    assert.equal(h.values.get(storageKey(A)), '{"title":"A text"}');
    assert.equal(h.values.get('visible-medicine-studio-draft:new-course'), oldPrimary);
    assert.equal(h.values.get('elivion-studio-draft:new-course'), legacy);
    assert.ok(h.reads.every(x => x.startsWith('visible-medicine-studio-draft:["v1"')));
    assert.deepEqual(h.removes, []);
  } finally { h.dispose(); }
});

test('missing scope cannot restore or persist and reports unavailable device storage', () => {
  const h = harness({ scope: null, initial: { [storageKey(A)]: '{"title":"A text"}' } });
  try { assert.equal(h.controls[0].value, ''); assert.deepEqual(h.reads, []); h.change('fresh'); assert.deepEqual(h.writes, []); assert.match(h.text(), /without a complete signed-in Studio context/); } finally { h.dispose(); }
});

test('valid to missing or malformed to B retires the previous DOM input and never writes it as B', async () => {
  const h = harness();
  try {
    h.change('A input'); await h.settle(); const aBytes = h.values.get(storageKey(A));
    h.scope(null); assert.equal(h.controls[0].value, '');
    h.change('missing-context input'); await h.settle();
    h.scope({ actorId: 'edu:', organizationId: 'org-a' });
    assert.equal(h.controls[0].value, '');
    h.change('malformed-context input'); await h.settle();
    h.scope({ actorId: 'edu:', organizationId: 'org-b' });
    assert.equal(h.controls[0].value, '');
    h.scope(B); assert.equal(h.controls[0].value, '');
    assert.equal(h.values.get(storageKey(A)), aBytes);
    assert.equal(h.values.has(storageKey(B)), false);
    assert.ok(h.writes.every(key => key === storageKey(A)));
  } finally { h.dispose(); }
});

test('queued A write and save completion retire on B transition; A bytes and B bytes stay unchanged', async () => {
  let finish;
  const h = harness({ post: () => new Promise(resolve => { finish = resolve; }) });
  try {
    h.locks.held = true; h.change('A unsent'); const submitted = h.submit();
    h.scope(B); h.release(); await h.settle(); finish(); await submitted; await h.settle();
    assert.deepEqual(h.writes, []); assert.deepEqual(h.removes, []); assert.equal(h.controls[0].value, '');
  } finally { h.dispose(); }
});

test('retired recovery timer cannot announce A draft in B form', () => {
  const h = harness({ initial: { [storageKey(A)]: '{"title":"A text"}' } });
  try { assert.ok(h.timers.size); h.scope(B); h.runTimers(); assert.equal(h.controls[0].value, ''); assert.doesNotMatch(h.text(), /Recovered an unsent/); } finally { h.dispose(); }
});

test('accepted response between synchronous unmount and passive cleanup cannot navigate or clean bytes', async () => {
  const oldFetch = globalThis.fetch;
  let finish;
  globalThis.fetch = async () => new Promise(resolve => { finish = resolve; });
  const h = harness({ post: 'real', initial: { [storageKey(B)]: '{"title":"B text"}' } });
  try {
    h.change('A unsent'); await h.settle(); const aBytes = h.values.get(storageKey(A));
    const pending = h.submit();for(let i=0;i<12&&!finish;i++)await Promise.resolve();assert.equal(typeof finish,'function','exercise an actual pending POST before the unmount commit');h.unmountLayoutOnly();
    finish({ ok: true, status: 200, json: async () => ({ ok: true, action: 'create-course', courseId: 'accepted-a' }) });
    await pending;
    assert.deepEqual(h.routes, []); assert.equal(h.refreshes, 0);
    assert.equal(h.values.get(storageKey(A)), aBytes);
    assert.equal(h.values.get(storageKey(B)), '{"title":"B text"}');
    assert.deepEqual(h.removes, []);
    assert.equal(h.timers.size, 0);
  } finally { h.dispose(); globalThis.fetch = oldFetch; }
});

test('StrictMode effect cleanup and re-setup keeps a live form writable', async () => {
  const h = harness();
  try { h.strictEffectReplay(); h.change('still editing'); await h.settle(); assert.equal(JSON.parse(h.values.get(storageKey(A))).title, 'still editing'); } finally { h.dispose(); }
});

test('uncertain create acknowledgement keeps scoped bytes; exact acknowledgement removes only those bytes', async () => {
  const oldFetch = globalThis.fetch;
  let body = { ok: true, action: 'create-course' };
  let requests=0;
  globalThis.fetch = async () => {requests++;return { ok: true, status: 200, json: async () => body };};
  const legacy = 'legacy unknown';
  const h = harness({ post: 'real', initial: { 'elivion-studio-draft:new-course': legacy } });
  try {
    h.change('unsent'); await h.settle(); const raw = h.values.get(storageKey(A)); assert.ok(raw);
    await h.submit(); await h.settle(); assert.equal(h.values.get(storageKey(A)), raw); assert.deepEqual(h.removes, []);
    body = { ok: true, action: 'create-course', courseId: 'course:accepted' };
    await h.submit();await h.settle();assert.equal(requests,1,'an uncertain receipt cannot be retried immediately');
    h.confirmResult=false;h.clickButton('I checked the saved item');assert.equal(h.confirms,1);
    await h.submit();await h.settle();assert.equal(requests,1,'cancelled reconciliation retains the guard');
    h.confirmResult=true;h.clickButton('I checked the saved item');assert.equal(h.confirms,2);
    await h.submit(); await h.settle(); assert.equal(h.values.has(storageKey(A)), false);
    assert.equal(requests,2,'only the deliberate new submission sends another POST');
    assert.deepEqual(h.removes, [storageKey(A)]); assert.equal(h.values.get('elivion-studio-draft:new-course'), legacy);
    assert.deepEqual(h.routes, ['/studio/courses/course%3Aaccepted']);
  } finally { h.dispose(); globalThis.fetch = oldFetch; }
});

test('storage denied, no Locks API and cross-tab compare failure never overwrite', async () => {
  const denied = harness({ getFails: true }); try { denied.change('new'); await denied.settle(); assert.deepEqual(denied.writes, []); assert.match(denied.text(), /could not be safely recovered/); } finally { denied.dispose(); }
  const noLocks = harness({ noLocks: true }); try { noLocks.change('new'); await noLocks.settle(); assert.deepEqual(noLocks.writes, []); assert.match(noLocks.text(), /storage is unavailable/); } finally { noLocks.dispose(); }
  const conflict = harness(); try { conflict.values.set(storageKey(A), '{"title":"other tab"}'); conflict.change('mine'); await conflict.settle(); assert.equal(conflict.values.get(storageKey(A)), '{"title":"other tab"}'); assert.deepEqual(conflict.writes, []); } finally { conflict.dispose(); }
});
