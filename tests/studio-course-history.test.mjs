import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const requireSite = createRequire(new URL('../package.json', import.meta.url));
const ts = requireSite('typescript');
const shim = await import(new URL('../node_modules/vinext/dist/server/app-history-state.js', import.meta.url));
const candidate = readFileSync(new URL('../components/StudioCourseEditor.tsx', import.meta.url), 'utf8');
// Deliberate exact-source mutant: installed app-owned pushes skip the hook update.
const v2 = candidate.replace('window.history.pushState(null,', 'window.history.pushState(window.history.state,')
  .replace('    setSection(next);', '    // Removed local update for the regression probe.');
assert.notEqual(v2, candidate);

function compile(source, mocks) {
  const code = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const exports = {};
  new Function('require', 'module', 'exports', code)(name => name in mocks ? mocks[name] : requireSite(name), { exports }, exports);
  return exports.StudioCourseEditor;
}

// The history branch predicate and metadata copier are imported from installed
// Vinext. Only its hook notification and the React render scheduler are modeled.
function fixture(source, initialUrl) {
  const stack = [{ url: new URL(initialUrl), state: { host: 'preserved', __vinext_historyIndex: 7 } }];
  let index = 0, pushes = 0, cachedSearch = stack[0].url.search, course = { id: 'course-1' };
  const listeners = new Set();
  const slots = []; let cursor = 0, effectDeps, pendingEffect, cleanup, mounted = false;
  const react = {
    useState(initial) {
      const at = cursor++;
      if (!(at in slots)) slots[at] = typeof initial === 'function' ? initial() : initial;
      return [slots[at], next => { slots[at] = typeof next === 'function' ? next(slots[at]) : next; }];
    },
    useEffect(fn, deps) {
      if (!effectDeps || deps.some((value, i) => !Object.is(value, effectDeps[i]))) {
        effectDeps = deps;
        pendingEffect = fn;
      }
    },
  };
  const window = {
    get location() { return stack[index].url; },
    history: {
      get state() { return stack[index].state; },
      pushState(data, _title, url) {
        const nextUrl = new URL(url, stack[index].url);
        const appOwned = shim.isAppOwnedHistoryState(data);
        const nextState = appOwned ? data : shim.createExternalHistoryStatePreservingMetadata(data, stack[index].state);
        stack.splice(index + 1); stack.push({ url: nextUrl, state: nextState }); index++; pushes++;
        // Exact installed navigation.js patchedPushState skips this commit for app-owned data.
        if (!appOwned) cachedSearch = nextUrl.search;
      },
      back() { if (index > 0) { index--; cachedSearch = stack[index].url.search; for (const fn of listeners) fn(); } },
      forward() { if (index < stack.length - 1) { index++; cachedSearch = stack[index].url.search; for (const fn of listeners) fn(); } },
    },
    addEventListener(name, fn) { assert.equal(name, 'popstate'); listeners.add(fn); },
    removeEventListener(name, fn) { assert.equal(name, 'popstate'); listeners.delete(fn); },
  };
  const mocks = {
    react,
    'next/navigation': { useSearchParams: () => new URLSearchParams(cachedSearch) },
    'next/link': ({ children, ...props }) => ({ type: 'a', props: { ...props, children } }),
    './StudioForms': { CreateWorkbookForm: () => null, DuplicateCourseButton: () => null, ReleaseDraftForm: () => null },
  };
  const editor = compile(source, mocks);
  function find(node, predicate) {
    if (!node || typeof node !== 'object') return null;
    if (Array.isArray(node)) { for (const child of node) { const found = find(child, predicate); if (found) return found; } return null; }
    if (predicate(node)) return node;
    const children = node.props?.children;
    for (const child of Array.isArray(children) ? children : [children]) { const found = find(child, predicate); if (found) return found; }
    return null;
  }
  function render() {
    cursor = 0;
    let tree = editor({ course, workbooks: [], releases: [] });
    if (pendingEffect) {
      cleanup?.(); cleanup = pendingEffect(); pendingEffect = undefined;
      cursor = 0; tree = editor({ course, workbooks: [], releases: [] });
    }
    mounted = true;
    return tree;
  }
  function button(name) { return find(render(), node => node.type === 'button' && node.props?.['aria-controls'] === 'course-' + name); }
  function pane() {
    for (const name of ['content', 'preview', 'review']) if (button(name)?.props['aria-pressed']) return name;
    throw Error('No selected pane');
  }
  function click(name) { button(name).props.onClick(); return pane(); }
  globalThis.window = window;
  return {
    window, button, pane, click, render,
    setCourse(id) { course = { id }; },
    externalNavigate(url) { window.history.pushState({ host: 'external' }, '', url); },
    get pushes() { return pushes; }, get length() { return stack.length; }, get listeners() { return listeners.size; },
    unmount() { if (mounted) cleanup?.(); delete globalThis.window; },
  };
}

test('installed Vinext app-owned state needs the explicit local pane update', () => {
  assert.equal(shim.isAppOwnedHistoryState({ __vinext_historyIndex: 7 }), true);
  const app = fixture(v2, 'https://example.test/studio/courses/course-1?source=workspace');
  try {
    assert.equal(app.pane(), 'content');
    assert.equal(app.click('preview'), 'content');
    assert.equal(app.window.location.search, '?source=workspace&pane=preview');
  } finally { app.unmount(); }
});

test('v4 uses caller-owned history and retains pane behavior, search and hash', () => {
  const app = fixture(candidate, 'https://example.test/studio/courses/course-1?source=workspace#detail');
  try {
    assert.equal(app.pane(), 'content'); assert.equal(app.listeners, 1);
    assert.equal(app.click('preview'), 'preview'); assert.equal(app.click('review'), 'review');
    assert.equal(app.click('review'), 'review'); assert.equal(app.pushes, 2);
    assert.equal(app.window.location.href, 'https://example.test/studio/courses/course-1?source=workspace&pane=review#detail');
    assert.deepEqual(app.window.history.state, shim.createExternalHistoryStatePreservingMetadata(null, { host: 'preserved', __vinext_historyIndex: 7 }));
    assert.equal('host' in app.window.history.state, false);
    app.window.history.back(); assert.equal(app.pane(), 'preview');
    app.window.history.back(); assert.equal(app.pane(), 'content');
    app.window.history.forward(); assert.equal(app.pane(), 'preview');
    app.window.history.forward(); assert.equal(app.pane(), 'review');
    assert.equal(app.pushes, 2); assert.equal(app.listeners, 1);
  } finally { app.unmount(); assert.equal(app.listeners, 0); }
});

test('first render accepts valid pane and rejects invalid pane', () => {
  for (const [value, expected] of [['review', 'review'], ['preview', 'preview'], ['admin', 'content'], ['', 'content']]) {
    const app = fixture(candidate, `https://example.test/studio/courses/course-1?pane=${value}`);
    try { assert.equal(app.pane(), expected); assert.equal(app.pushes, 0); }
    finally { app.unmount(); }
  }
});

test('external query and course changes synchronize without remount', () => {
  const app = fixture(candidate, 'https://example.test/studio/courses/course-1?pane=review');
  try {
    assert.equal(app.pane(), 'review');
    app.externalNavigate('/studio/courses/course-1?pane=preview'); assert.equal(app.pane(), 'preview');
    app.externalNavigate('/studio/courses/course-1?pane=invalid'); assert.equal(app.pane(), 'content');
    app.setCourse('course-2'); app.externalNavigate('/studio/courses/course-2?pane=review'); assert.equal(app.pane(), 'review');
    app.setCourse('course-3'); app.externalNavigate('/studio/courses/course-3'); assert.equal(app.pane(), 'content');
    assert.equal(app.listeners, 1);
  } finally { app.unmount(); assert.equal(app.listeners, 0); }
});

test('rapid stale handlers read live URL and do not suppress Content', () => {
  const app = fixture(candidate, 'https://example.test/studio/courses/course-1');
  try {
    const preview = app.button('preview'), content = app.button('content');
    preview.props.onClick(); content.props.onClick();
    assert.equal(app.pane(), 'content'); assert.equal(app.pushes, 2);
  } finally { app.unmount(); }
});

test('editor binds URL restoration to course/search and retains cleanup', () => {
  assert.match(candidate, /\[course\.id, searchKey\]/);
  assert.match(candidate, /return \(\) => window\.removeEventListener\("popstate", restore\)/);
  assert.doesNotMatch(candidate, /window\.history\.pushState\s*=/);
});
