import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { loadStudioDraftDependencies } from './studio-draft-dependency-source.mjs';

const requireSite = createRequire(import.meta.url);
const ts = requireSite('typescript');
const realDraftDependencies = loadStudioDraftDependencies(new URL('../', import.meta.url), ts);
const source = readFileSync(new URL('../components/StudioForms.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: {
  jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
} }).outputText;
const course = { id: 'course-1', code: 'SYN', title: 'Saved course title',
  description: 'Saved course description for synthetic learners.', status: 'draft',
  moduleId: 'module-1', workbookCount: 0, releaseCount: 0, enrolledLearners: 0 };
const scope = { actorId: 'edu:author', organizationId: 'org-1' };
const key = forScope => `visible-medicine-studio-draft:${JSON.stringify(['v1', forScope.actorId, forScope.organizationId, 'course-details:course-1'])}`;
const raw = JSON.stringify({ title: 'Unsent scratch title', description: 'Unsent scratch description for synthetic learners.',
  expectedTitle: course.title, expectedDescription: course.description });
const jsx = (type, props, key) => ({ type, props, key });
const walk = node => Array.isArray(node) ? node.flatMap(walk) : node?.props ? [node, ...walk(node.props.children)] : [];
const text = node => Array.isArray(node) ? node.map(text).join('') : node?.props ? text(node.props.children) : typeof node === 'string' ? node : '';

class Input {
  constructor(name, value = '', type = 'text') { this.name = name; this._value = value; this.type = type; this.disabled = false; this.failReset = false; }
  get value() { return this._value; }
  set value(next) { if (this.failReset && next === course.title) throw Error('synthetic reset failure'); this._value = next; }
}
class Textarea extends Input {}
class Select extends Input {}
class FormDataFixture {
  constructor(form) { this.entries = form.elements.filter(element => !element.disabled).map(element => [element.name, element.value]); }
  get(name) { return this.entries.find(([key]) => key === name)?.[1] ?? null; }
  getAll(name) { return this.entries.filter(([key]) => key === name).map(([, value]) => value); }
  keys() { return this.entries.map(([name]) => name).values(); }
  [Symbol.iterator]() { return this.entries[Symbol.iterator](); }
}

function fixture() {
  const original = new Map();
  const stored = new Map([[key(scope), raw], ['visible-medicine-studio-draft:unrelated', 'untouched']]);
  const reads = [], removals = [], writes = [], requests = [];
  let removalFails = false, confirm = true, confirms = 0, verifyMode = 'pass', resolveVerify;
  const storage = {
    getItem(k) { reads.push(k); return stored.get(k) ?? null; },
    setItem(k, v) { writes.push([k, v]); stored.set(k, v); },
    removeItem(k) { if (removalFails) throw Error('private provider detail'); removals.push(k); stored.delete(k); },
  };
  const queued = [];
  const locks = { held: false, request(_name, callback) {
    if (this.held) return new Promise((resolve, reject) => queued.push({ callback, resolve, reject }));
    return Promise.resolve().then(callback);
  } };
  const setGlobal = (name, value) => { original.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { value, configurable: true, writable: true }); };
  setGlobal('localStorage', storage); setGlobal('navigator', { locks });
  setGlobal('HTMLInputElement', Input); setGlobal('HTMLTextAreaElement', Textarea);
  setGlobal('HTMLSelectElement', Select); setGlobal('FormData', FormDataFixture);
  setGlobal('document', { addEventListener() {}, removeEventListener() {} });
  setGlobal('window', { confirm() { confirms++; return confirm; }, setTimeout() { return 1; }, clearTimeout() {},
    addEventListener() {}, removeEventListener() {} });
  setGlobal('fetch', async (...args) => { requests.push(args); throw Error('discard must not use fetch directly'); });

  const scopeModule = { studioDraftScopedKey(value, formKey) {
    return value?.actorId?.startsWith('edu:') && value.organizationId ?
      JSON.stringify(['v1', value.actorId, value.organizationId, formKey]) : null;
  }, studioDraftBoundaryKey(value, formKey) { return JSON.stringify([value?.actorId, value?.organizationId, formKey]); } };
  class ContextError extends Error { constructor(reason = 'changed') { super('context unavailable'); this.reason = reason; } }
  const context = { StudioMutationContextError: ContextError, StudioUncertainSaveError: class extends Error {},
    parseStudioMutationContext(value) { return value?.actorId?.startsWith('edu:') && value.organizationId ?
      { actorId: value.actorId, organizationId: value.organizationId } : null; },
    requiresStudioMutationContext: () => true,
    verifyStudioMutationContext: async () => {
      if (verifyMode === 'changed') throw new ContextError('changed');
      if (verifyMode === 'unavailable') throw new ContextError('unavailable');
      if (verifyMode === 'defer') await new Promise(resolve => { resolveVerify = resolve; });
    },
  };
  let phase = 'outer', cursor = 0, rerender = false, unmounted = false, currentCourse = course, currentScope = scope;
  const hosts = { outer: { slots: [], effects: new Map() }, action: { slots: [], effects: new Map() } };
  const pending = [];
  const hooks = {
    useRef(initial) { const host = hosts[phase], i = cursor++; return host.slots[i] ??= { current: initial }; },
    useMemo(factory, deps) { const host = hosts[phase], i = cursor++, old = host.slots[i];
      if (!old || deps.some((value, at) => !Object.is(value, old.deps[at]))) host.slots[i] = { deps, value: factory() };
      return host.slots[i].value;
    },
    useState(initial) { const host = hosts[phase], i = cursor++;
      if (!(i in host.slots)) host.slots[i] = typeof initial === 'function' ? initial() : initial;
      return [host.slots[i], update => { const next = typeof update === 'function' ? update(host.slots[i]) : update;
        if (!Object.is(next, host.slots[i])) { host.slots[i] = next; rerender = true; } }];
    },
    useEffect(effect, deps) { const host = hosts[phase], i = cursor++, old = host.effects.get(i);
      if (!old || !deps || !old.deps || deps.length !== old.deps.length || deps.some((value, at) => !Object.is(value, old.deps[at])))
        pending.push(() => { old?.cleanup?.(); host.effects.set(i, { deps, cleanup: effect() }); });
    },
    useLayoutEffect(effect, deps) { hooks.useEffect(effect, deps); },
  };
  const mocks = { react: hooks, 'react/jsx-runtime': { jsx, jsxs: jsx },
    'next/navigation': { useRouter: () => ({ refresh() {} }) },
    '@/lib/studio-templates': { STUDIO_COURSE_TEMPLATES: [] },
    '../lib/studio-release-order.ts': {},
    '../lib/studio-navigation-guard.ts': { registerStudioNavigationGuard: () => () => {} },
    '../lib/studio-draft-scope.ts': scopeModule,
    '../lib/studio-mutation-context.ts': context,
    ...realDraftDependencies,
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(name => {
    assert(Object.hasOwn(mocks, name), `Unexpected import: ${name}`); return mocks[name];
  }, module, module.exports);
  let outer, tree, form, controls;
  function render() {
    for (let pass = 0; pass < 15; pass++) {
      rerender = false; pending.length = 0; phase = 'outer'; cursor = 0;
      outer = module.exports.EditCourseDetailsForm({ course: currentCourse, recoveryScope: currentScope });
      if (!controls) {
        controls = Object.fromEntries(walk(outer.props.children).filter(node => node.props.name).map(node =>
          [node.props.name, node.type === 'textarea'
            ? new Textarea(node.props.name, node.props.defaultValue)
            : new Input(node.props.name, node.props.defaultValue, node.props.type)]));
        form = { elements: Object.values(controls), querySelectorAll: () => [] };
      }
      for (const node of walk(outer.props.children)) if (node.props.name && node.props.ref) node.props.ref.current = controls[node.props.name];
      phase = 'action'; cursor = 0; tree = outer.type(outer.props); tree.props.ref.current = form;
      for (const run of pending) run();
      if (!rerender) return;
    }
    throw Error('Unstable synthetic render');
  }
  render();
  const button = () => walk(tree).find(node => node.type === 'button' && text(node).startsWith('Discard unsent course edits'));
  return { stored, reads, removals, writes, requests, controls, locks, queued,
    release() { const item = queued.shift(); assert(item); try { item.resolve(item.callback()); } catch (error) { item.reject(error); } },
    get confirms() { return confirms; },
    get text() { return text(tree); }, get button() { return button(); },
    set confirm(value) { confirm = value; }, set removalFails(value) { removalFails = value; },
    set verifyMode(value) { verifyMode = value; }, resolveVerify() { assert(resolveVerify); resolveVerify(); },
    async settle() { for (let i = 0; i < 12; i++) await Promise.resolve(); if (!unmounted) render(); },
    click() { const result = button().props.onClick(); render(); return result; },
    changeTitle(value) { controls.title.value = value; tree.props.onChange(); render(); },
    changeCourse(next) { currentCourse = next; render(); },
    changeScope(next) { currentScope = next; render(); },
    unmount() { unmounted = true; for (const host of Object.values(hosts)) for (const effect of host.effects.values()) effect.cleanup?.(); },
    dispose() { for (const host of Object.values(hosts)) for (const effect of host.effects.values()) effect.cleanup?.();
      for (const [name, descriptor] of original) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name]; } },
  };
}

test('cancel keeps all bytes, fields and dirty protection', async () => {
  const h = fixture(); try {
    await h.settle(); h.confirm = false; h.click(); await h.settle();
    assert.equal(h.confirms, 1); assert.equal(h.stored.get(key(scope)), raw);
    assert.equal(h.controls.title.value, 'Unsent scratch title');
    assert.equal(h.removals.length, 0); assert.match(h.text, /Unsubmitted changes saved on this device only/);
  } finally { h.dispose(); }
});

test('confirmed discard removes only the owned key and resets title, description and comparison fields', async () => {
  const h = fixture(); try {
    await h.settle(); h.click(); await h.settle();
    assert.deepEqual(h.removals, [key(scope)]); assert.equal(h.stored.has(key(scope)), false);
    assert.equal(h.stored.get('visible-medicine-studio-draft:unrelated'), 'untouched');
    assert.deepEqual(Object.fromEntries(Object.entries(h.controls).map(([name, control]) => [name, control.value])),
      { expectedTitle: course.title, expectedDescription: course.description,
        title: course.title, description: course.description });
    assert.match(h.text, /No unsaved changes/); assert.match(h.text, /Saved Studio course details were not changed/);
    assert.equal(h.requests.length, 0); assert.equal(h.button.props['aria-disabled'], true);
  } finally { h.dispose(); }
});

test('foreign bytes, newer typing, changed scope or changed saved source during verification refuse', async () => {
  for (const mutate of [
    h => h.stored.set(key(scope), 'foreign bytes'),
    h => h.changeTitle('Newer unsent typing'),
    h => h.changeScope({ actorId: 'edu:other', organizationId: 'org-1' }),
    h => h.changeScope({ actorId: 'edu:author', organizationId: 'org-2' }),
    h => h.changeCourse({ ...course, id: 'course-2' }),
    h => h.changeCourse({ ...course, title: 'New saved title' }),
  ]) {
    const h = fixture(); try {
      await h.settle(); h.verifyMode = 'defer'; h.click();
      await Promise.resolve(); mutate(h); h.resolveVerify(); await h.settle();
      assert.equal(h.removals.length, 0); assert.equal(h.requests.length, 0);
      assert.match(h.text, /could not be safely discarded|signed-in Studio context|Unsubmitted changes/);
    } finally { h.dispose(); }
  }
});

test('storage removal and reset failures retain the draft and dirty warning', async () => {
  for (const fail of [h => { h.removalFails = true; }, h => { h.controls.title.failReset = true; }]) {
    const h = fixture(); try {
      await h.settle(); fail(h); h.click(); await h.settle();
      assert.equal(h.stored.get(key(scope)), raw); assert.match(h.text, /could not be safely discarded/);
      assert.match(h.text, /Unsubmitted changes are not saved on this device/);
      assert.deepEqual(h.removals, [], 'Reset failure never attempts removal; failed removal changes no bytes');
      assert.equal(h.controls.title.value, 'Unsent scratch title');
      assert.equal(h.controls.description.value, 'Unsent scratch description for synthetic learners.');
      assert.equal(h.requests.length, 0);
    } finally { h.dispose(); }
  }
});

test('unavailable context, unmount and recovered comparison mismatch never remove bytes', async () => {
  for (const mode of ['unavailable', 'unmount', 'baseline']) {
    const h = fixture(); try {
      await h.settle();
      if (mode === 'baseline') h.controls.expectedTitle.value = 'Older saved title';
      if (mode === 'unavailable') h.verifyMode = 'unavailable';
      if (mode === 'unmount') h.verifyMode = 'defer';
      h.click();
      if (mode === 'unmount') { await Promise.resolve(); h.unmount(); h.resolveVerify(); }
      await h.settle();
      assert.equal(h.stored.get(key(scope)), raw); assert.equal(h.removals.length, 0);
      assert.equal(h.requests.length, 0);
    } finally { h.dispose(); }
  }
});

test('outer details form remount key includes account and institution, but stays stable within one scope', () => {
  const editorSource = readFileSync(new URL('../components/StudioCourseEditor.tsx', import.meta.url), 'utf8');
  const editorCode = ts.transpileModule(editorSource, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  const forms = { CreateWorkbookForm: 'create', DuplicateCourseButton: 'duplicate',
    EditCourseDetailsForm: 'edit', ReleaseDraftForm: 'release' };
  const slots = [], layouts = new Map(); let cursor = 0;
  const react = {
    useRef(initial) { const i = cursor++; return slots[i] ??= {current: initial}; },
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], () => {}]; },
    useMemo(factory, deps) { const i = cursor++, old = slots[i]; if (!old || deps.some((value, at) => !Object.is(value, old.deps[at]))) slots[i] = {deps, value: factory()}; return slots[i].value; },
    useEffect() { cursor++; },
    useLayoutEffect(effect, deps) { const i = cursor++, old = layouts.get(i); if (!old || deps.some((value, at) => !Object.is(value, old.deps[at]))) layouts.set(i, {deps, effect, cleanup: old?.cleanup, pending: true}); },
  };
  const mocks = { react, 'react/jsx-runtime': { jsx, jsxs: jsx }, 'next/link': 'a',
    'next/navigation': { useSearchParams: () => null }, './StudioForms': forms };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', editorCode)(name => { assert(Object.hasOwn(mocks, name)); return mocks[name]; }, module, module.exports);
  const editKey = recoveryScope => {
    cursor = 0;
    const tree = module.exports.StudioCourseEditor({ course, workbooks: [], releases: [], recoveryScope });
    for (const layout of layouts.values()) if (layout.pending) { layout.pending = false; layout.cleanup?.(); layout.cleanup = layout.effect(); }
    return walk(tree).find(node => node.type === 'edit')?.key;
  };
  assert.equal(editKey(scope), editKey({ ...scope }));
  assert.notEqual(editKey(scope), editKey({ ...scope, actorId: 'edu:other' }));
  assert.notEqual(editKey(scope), editKey({ ...scope, organizationId: 'org-2' }));
});

test('a queued own write blocks discard until it completes, then exact new bytes can be removed', async () => {
  const h = fixture(); try {
    await h.settle(); h.locks.held = true;
    h.changeTitle('Newer unsent title');
    assert.equal(h.queued.length, 1);
    h.click(); assert.equal(h.confirms, 0, 'A pending write is not an owned stored draft yet');
    h.locks.held = false; h.release(); await h.settle();
    assert.equal(JSON.parse(h.stored.get(key(scope))).title, 'Newer unsent title');
    h.click(); await h.settle();
    assert.equal(h.stored.has(key(scope)), false); assert.deepEqual(h.removals, [key(scope)]);
    assert.equal(h.queued.length, 0);
  } finally { h.dispose(); }
});

test('only course details opts into discard and a context failure cannot remove its draft', async () => {
  assert.equal((source.match(/discardDraft=\{/g) ?? []).length, 1);
  assert(source.indexOf('discardDraft={{') > source.indexOf('export function EditCourseDetailsForm'));
  const h = fixture(); try {
    await h.settle(); h.verifyMode = 'changed'; h.click(); await h.settle();
    assert.equal(h.stored.get(key(scope)), raw); assert.equal(h.removals.length, 0);
    assert.equal(h.requests.length, 0);
  } finally { h.dispose(); }
});
