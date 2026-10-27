import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../package.json', import.meta.url));
const ts = require('typescript');
function compile(path, imports = {}) {
  const source = readFileSync(new URL('../' + path, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', 'require', code)(module, module.exports,
    name => Object.hasOwn(imports, name) ? imports[name] : require(name));
  return module.exports;
}

// One actual store instance survives synthetic component unmount/remount.
export const store = compile('lib/studio-release-note-recovery.ts');
const context = compile('lib/studio-mutation-context.ts');
const scopes = compile('lib/studio-draft-scope.ts');
const session = compile('lib/studio-session-drafts.ts');
const order = compile('lib/studio-release-order.ts');
const predecessor = compile('lib/studio-release-predecessor.ts');
export const revision = 'a'.repeat(64);
export const scope = { actorId: 'edu:reviewer-a', organizationId: 'school-a' };
export const release = (changes = {}) => ({
  id: 'release-a', version: 2, status: 'in-review', materialRevision: revision,
  approvalCurrent: false, ...changes,
});
export const keyFor = (person = scope, item = release(), canPublish = true) =>
  store.releaseNoteRecoveryKey(person, JSON.stringify([
    item.id, item.version, item.status, item.materialRevision, canPublish, item.approvalCurrent,
  ]));

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const jsx = (type, props) => ({ type, props });
export function walk(node, predicate) {
  if (Array.isArray(node)) return node.map(child => walk(child, predicate)).find(Boolean);
  if (!node?.props) return undefined;
  return predicate(node) ? node : walk(node.props.children, predicate);
}
export function nodes(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(child => nodes(child, predicate));
  if (!node?.props) return [];
  return [...(predicate(node) ? [node] : []), ...nodes(node.props.children, predicate)];
}
export function words(node) {
  if (Array.isArray(node)) return node.map(words).join('');
  return node?.props ? words(node.props.children) : typeof node === 'string' ? node : '';
}

export function releaseFixture({ document: owner = { visibilityState: 'visible' }, current = scope } = {}) {
  const originals = new Map();
  const requests = [], listeners = new Map();
  let sessionScope = current, refreshes = 0, confirmResult = true, confirmHook = null;
  let getResult = null;
  const fakeDocument = owner;
  fakeDocument.visibilityState ??= 'visible';
  fakeDocument.addEventListener = () => {};
  fakeDocument.removeEventListener = () => {};
  const globals = {
    document: fakeDocument,
    window: {
      addEventListener(name, listener) { listeners.set(name, listener); },
      removeEventListener(name) { listeners.delete(name); },
      confirm() { confirmHook?.(); return confirmResult; },
      location: { reload() {} },
    },
    fetch: async (url, options) => {
      if (options.method === 'GET') {
        if (getResult) return getResult.promise;
        if (sessionScope === 'unavailable') return Response.json({ error: 'unavailable' }, { status: 503 });
        const sent = JSON.parse(options.headers['X-Studio-Mutation-Context']);
        const match = sessionScope && sent.actorId === sessionScope.actorId &&
          sent.organizationId === sessionScope.organizationId;
        return Response.json(match ? { ok: true, action: 'verify-studio-mutation-context' } :
          { error: 'changed', code: 'STUDIO_CONTEXT_CHANGED' }, { status: match ? 200 : 409 });
      }
      const response = deferred();
      requests.push({ body: JSON.parse(options.body), response });
      return response.promise;
    },
  };
  for (const [name, value] of Object.entries(globals)) {
    originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, value });
  }

  function mount(item = release(), person = scope, canPublish = true) {
    const props = { release: item, recoveryScope: person, canPublish };
    const slots = [], effects = [], layouts = [], cleanups = [], layoutCleanups = [];
    let cursor = 0, tree, disposed = false;
    const hooks = {
      useState(initial) {
        const index = cursor++;
        if (!(index in slots)) slots[index] = initial;
        return [slots[index], next => {
          slots[index] = typeof next === 'function' ? next(slots[index]) : next;
        }];
      },
      useRef(initial) {
        const index = cursor++;
        if (!(index in slots)) slots[index] = { current: initial };
        return slots[index];
      },
      useEffect(effect, deps) {
        const index = cursor++;
        if (!(index in slots) || !deps || deps.some((value, position) => value !== slots[index][position])) {
          slots[index] = deps;
          effects.push(() => { cleanups[index]?.(); cleanups[index] = effect() ?? (() => {}); });
        }
      },
      useLayoutEffect(effect, deps) {
        const index = cursor++;
        if (!(index in slots) || !deps || deps.some((value, position) => value !== slots[index][position])) {
          slots[index] = deps;
          layouts.push(() => { layoutCleanups[index]?.(); layoutCleanups[index] = effect() ?? (() => {}); });
        }
      },
    };
    const forms = compile('components/StudioForms.tsx', {
      react: hooks, 'react/jsx-runtime': { jsx, jsxs: jsx },
      'next/navigation': { useRouter: () => ({ refresh() { refreshes++; } }) },
      '@/lib/studio-templates': { STUDIO_COURSE_TEMPLATES: [] },
      '../lib/studio-release-note-recovery.ts': store,
      '../lib/studio-mutation-context.ts': context,
      '../lib/studio-draft-scope.ts': scopes,
      '../lib/studio-session-drafts.ts': session,
      '../lib/studio-release-order.ts': order,
      '../lib/studio-release-predecessor.ts': predecessor,
      '../lib/studio-navigation-guard.ts': { registerStudioNavigationGuard: () => () => {} },
    });
    function render() {
      if (disposed) throw Error('Unmounted');
      cursor = 0;
      tree = forms.ReleaseWorkflowActions(props);
      for (const effect of layouts.splice(0)) effect();
      for (const effect of effects.splice(0)) effect();
      return tree;
    }
    async function settle() { for (let index = 0; index < 24; index++) await Promise.resolve(); }
    async function ready() { render(); await settle(); return render(); }
    function unmount() {
      if (disposed) return;
      disposed = true;
      for (const cleanup of layoutCleanups) cleanup?.();
      for (const cleanup of cleanups) cleanup?.();
    }
    return {
      props, render, ready, settle, unmount,
      get tree() { return tree; },
      find(predicate) { return walk(tree, predicate); },
      button(label) { return walk(tree, node => node.type === 'button' && words(node) === label); },
      notes() { return walk(tree, node => node.type === 'textarea' && node.props.name === 'notes'); },
      decision() { return walk(tree, node => node.type === 'select' && node.props.name === 'decision'); },
      form() { return walk(tree, node => node.type === 'form'); },
      held() { return walk(tree, node => node.props['aria-label'] === 'Held review notes'); },
      editNotes(value) { this.notes().props.onChange({ target: { value } }); render(); },
      submit() { this.form().props.onSubmit({ preventDefault() {} }); },
    };
  }
  return {
    owner, requests, listeners, mount,
    get refreshes() { return refreshes; },
    set current(value) { sessionScope = value; },
    set confirm(value) { confirmResult = value; },
    set onConfirm(callback) { confirmHook = callback; },
    pauseGet() { getResult = deferred(); },
    resolveGet(response) { getResult?.resolve(response); getResult = null; },
    finishPost(index = 0, ok = true) {
      const request = requests[index];
      request.response.resolve(Response.json(ok ? { ok: true, action: request.body.action } :
        { error: 'Review failed' }, { status: ok ? 200 : 400 }));
    },
    dispose() {
      for (const [name, descriptor] of originals) {
        if (descriptor) Object.defineProperty(globalThis, name, descriptor);
        else delete globalThis[name];
      }
    },
  };
}
