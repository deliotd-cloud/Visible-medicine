import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceRoot = fileURLToPath(new URL('../', import.meta.url));
const requireSite = createRequire(resolve(sourceRoot, 'package.json'));
const ts = requireSite('typescript');
const source = readFileSync(resolve(sourceRoot, 'components/StudioCourseEditor.tsx'), 'utf8');
const jsx = (type, props) => ({ type, props });
const compiled = ts.transpileModule(source, { compilerOptions: {
  jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
} }).outputText;

function fixture() {
  let url = new URL('https://example.test/studio/courses/one?pane=preview');
  let cursor = 0, effectCursor = 0, focusMoves = 0;
  const slots = [], effects = [], layouts = [], listeners = new Set();
  const tabFocus = { closest: selector => selector === '.course-editor-tablist' ? {} : null };
  const document = {
    activeElement: null,
    getElementById(id) {
      return id === 'course-content-tab' ? { focus() { focusMoves++; document.activeElement = tabFocus; } } : null;
    },
  };
  const window = {
    get location() { return url; },
    addEventListener(name, fn) { assert.equal(name, 'popstate'); listeners.add(fn); },
    removeEventListener(name, fn) { assert.equal(name, 'popstate'); listeners.delete(fn); },
  };
  const react = {
    useRef(initial) { const i = cursor++; return slots[i] ??= {current: initial}; },
    useMemo(factory, deps) { const i = cursor++, old = slots[i]; if (!old || deps.some((value, j) => !Object.is(value, old.deps[j]))) slots[i] = {deps, value: factory()}; return slots[i].value; },
    useLayoutEffect(fn, deps) { const i = effectCursor++, prior = layouts[i]; if (!prior || deps.some((value, j) => !Object.is(value, prior.deps[j]))) layouts[i] = {deps, fn, cleanup: prior?.cleanup, pending: true}; },
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }];
    },
    useEffect(fn, deps) {
      const i = effectCursor++, prior = effects[i];
      if (!prior || deps.some((value, j) => !Object.is(value, prior.deps[j])))
        effects[i] = { deps, fn, cleanup: prior?.cleanup, pending: true };
    },
  };
  const mocks = {
    react, 'react/jsx-runtime': { jsx, jsxs: jsx },
    'next/link': 'a',
    'next/navigation': { useSearchParams: () => new URLSearchParams(url.search) },
    './StudioForms': { CreateWorkbookForm: 'create', DuplicateCourseButton: 'duplicate',
      EditCourseDetailsForm: 'details', ReleaseDraftForm: 'release' },
  };
  const scope = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(name => {
    assert(Object.hasOwn(mocks, name), `Unexpected import: ${name}`);
    return mocks[name];
  }, scope, scope.exports);
  globalThis.window = window;
  globalThis.document = document;
  const all = node => !node || typeof node !== 'object' ? [] : Array.isArray(node)
    ? node.flatMap(all) : [node, ...all(node.props?.children)];
  const render = () => {
    cursor = effectCursor = 0;
    const tree = scope.exports.StudioCourseEditor({ course: { id: 'one' }, workbooks: [],
      releases: [], recoveryScope: { actorId: 'synthetic', organizationId: 'org' } });
    for (const layout of layouts) if (layout?.pending) { layout.pending = false; layout.cleanup?.(); layout.cleanup = layout.fn(); }
    for (const effect of effects) if (effect?.pending) { effect.pending = false; effect.cleanup?.(); effect.cleanup = effect.fn(); }
    return tree;
  };
  const selected = () => all(render()).find(node => node.props?.role === 'tab' && node.props['aria-selected'])?.props['data-course-pane'];
  render();
  return {
    document, selected,
    get focusMoves() { return focusMoves; },
    backToContent() {
      url = new URL('/studio/courses/one?pane=content', url);
      for (const fn of listeners) fn();
    },
    close() { layouts.forEach(layout => layout.cleanup?.()); effects.forEach(effect => effect.cleanup?.()); delete globalThis.window; delete globalThis.document; },
  };
}

test('Back moves focus from a disappearing pane to its newly selected tab', () => {
  const app = fixture();
  try {
    assert.equal(app.selected(), 'preview');
    app.document.activeElement = { closest: selector => selector === '.course-editor [role="tabpanel"]'
      ? { id: 'course-preview' } : null };
    app.backToContent();
    assert.equal(app.selected(), 'content');
    assert.equal(app.focusMoves, 1);
  } finally { app.close(); }
});

test('Back leaves focus outside the disappearing panel untouched', () => {
  const app = fixture();
  try {
    app.document.activeElement = { closest: () => null };
    app.backToContent();
    assert.equal(app.selected(), 'content');
    assert.equal(app.focusMoves, 0);
  } finally { app.close(); }
});
