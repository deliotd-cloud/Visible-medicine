import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const website = fileURLToPath(new URL('../', import.meta.url));
const requireSite = createRequire(`${website}/package.json`);
const ts = requireSite('typescript');
const source = readFileSync(new URL('../components/StudioCourseEditor.tsx', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: {
  jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
} }).outputText;
const jsx = (type, props, key) => ({ type, props, key });
const all = node => Array.isArray(node) ? node.flatMap(all)
  : node?.props ? [node, ...all(node.props.children)] : [];
const within = (root, predicate) => all(root).find(predicate);

function fixture(initial = '/studio/courses/one?pane=review&source=workspace#draft') {
  const entries = [new URL(initial, 'https://example.test')], states = [{ host: 'preserved', __vinext_historyIndex: 7 }];
  let position = 0, courseId = 'one', cursor = 0, effectCursor = 0, dirty = false, tree;
  const slots = [], effects = [], listeners = new Set(), focus = { activeElement: null, moves: [] };
  const recoveryScope = { actorId: 'synthetic', organizationId: 'synthetic' };
  focus.getElementById = id => ({ focus() {
    focus.moves.push(id);
    focus.activeElement = { closest: selector => selector === '.course-editor-tablist' ? {} : null };
  } });
  const window = {
    get location() { return entries[position]; },
    history: {
      get state() { return states[position]; },
      pushState(state, _title, href) {
        entries.splice(position + 1); states.splice(position + 1);
        entries.push(new URL(href, entries[position])); states.push(state); position++;
      },
      back() { if (position > 0) { position--; for (const listener of listeners) listener(); } },
    },
    addEventListener(name, listener) { assert.equal(name, 'popstate'); listeners.add(listener); },
    removeEventListener(name, listener) { assert.equal(name, 'popstate'); listeners.delete(listener); },
  };
  const react = {
    useState(initialValue) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initialValue === 'function' ? initialValue() : initialValue;
      return [slots[index], update => {
        const next = typeof update === 'function' ? update(slots[index]) : update;
        if (!Object.is(next, slots[index])) { slots[index] = next; dirty = true; }
      }];
    },
    useEffect(callback, deps) {
      const index = effectCursor++, previous = effects[index];
      if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i])))
        effects[index] = { callback, deps, cleanup: previous?.cleanup, pending: true };
    },
  };
  const mocks = { react, 'react/jsx-runtime': { jsx, jsxs: jsx }, 'next/link': 'a',
    'next/navigation': { useSearchParams: () => new URLSearchParams(window.location.search) },
    './StudioForms': { CreateWorkbookForm: 'create', DuplicateCourseButton: 'duplicate',
      EditCourseDetailsForm: 'edit', ReleaseDraftForm: 'release' } };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => {
    assert(Object.hasOwn(mocks, name), name); return mocks[name];
  }, module, module.exports);
  globalThis.window = window; globalThis.document = focus;
  function render() {
    for (let pass = 0; pass < 10; pass++) {
      dirty = false; cursor = effectCursor = 0;
      tree = module.exports.StudioCourseEditor({ course: { id: courseId }, workbooks: [], releases: [],
        recoveryScope });
      for (const effect of effects) if (effect?.pending) {
        effect.pending = false; effect.cleanup?.(); effect.cleanup = effect.callback();
      }
      if (!dirty) return tree;
    }
    throw Error('Unstable synthetic render');
  }
  const find = predicate => { const node = all(tree).find(predicate); assert(node); return node; };
  const panel = pane => find(node => node.props?.id === `course-${pane}`);
  const tab = pane => find(node => node.props?.role === 'tab' && node.props['data-course-pane'] === pane);
  const details = () => find(node => node.props?.id === 'course-details-editor');
  const option = () => within(find(node => node.props?.className === 'course-options'),
    node => node.type === 'button' && node.props['aria-controls'] === 'course-details-editor');
  const notice = () => find(node => node.props?.id === 'course-details-draft-status');
  const selected = () => ['content', 'preview', 'review'].find(pane => tab(pane).props['aria-selected']);
  render();
  return { render, find, panel, tab, details, option, notice, selected, focus, recoveryScope,
    get url() { return window.location.href; }, get historyLength() { return entries.length; },
    get historyState() { return window.history.state; },
    clickPane(pane) { tab(pane).props.onClick(); render(); },
    clickOptions() { option().props.onClick(); render(); },
    reportRecovery(status) { find(node => node.type === 'edit').props.onDraftRecoveryChange(status); render(); },
    back() { window.history.back(); render(); },
    switchCourse(id) { courseId = id; entries[position] = new URL(`/studio/courses/${id}?pane=review`, entries[position]); render(); },
    movePath(path) { entries[position] = new URL(path, entries[position]); render(); },
    close() { effects.forEach(effect => effect?.cleanup?.()); delete globalThis.window; delete globalThis.document; },
  };
}

test('option trigger from Review selects Content, keeps focus, and reveals same mounted form', () => {
  const app = fixture(); try {
    const form = app.details().props.children;
    app.focus.activeElement = { marker: 'options-button', closest: () => null };
    const focusBefore = app.focus.activeElement;
    assert.equal(app.option().props['aria-expanded'], false);
    app.clickOptions();
    assert.equal(app.selected(), 'content');
    assert.equal(app.url, 'https://example.test/studio/courses/one?pane=content&source=workspace#draft');
    assert.equal(app.historyLength, 2);
    assert.equal(app.historyState.host, 'preserved');
    assert.equal(app.historyState.__vinext_historyIndex, 7);
    assert.equal(app.historyState.__vinext_externalHistoryState, true);
    assert.equal(app.details().props.hidden, false);
    assert.equal(app.option().props['aria-expanded'], true);
    assert.equal(app.details().props.children.type, form.type);
    assert.equal(app.details().props.children.key, form.key);
    assert.equal(app.details().props.children.props.recoveryScope, app.recoveryScope);
    assert.equal(app.focus.activeElement, focusBefore);
  } finally { app.close(); }
});

test('Preview and Review hide mounted details; reopening keeps the draft subtree and truthful triggers', () => {
  const app = fixture(); try {
    app.clickOptions();
    assert.equal(app.historyLength, 2);
    const form = app.details().props.children;
    app.clickPane('preview');
    assert.equal(app.panel('content').props.hidden, true);
    assert(within(app.panel('content'), node => node.props?.id === 'course-details-editor'));
    assert.equal(app.details().props.hidden, false, 'Stored disclosure remains open under hidden Content');
    assert.equal(app.option().props['aria-expanded'], false);
    assert.equal(app.option().props.children, 'Edit course details');
    app.clickPane('review');
    assert.equal(app.panel('content').props.hidden, true);
    app.reportRecovery('recovered');
    const recovery = within(app.notice(), node => node.type === 'button');
    assert.equal(recovery.props['aria-expanded'], false);
    assert.equal(recovery.props.children, 'Review recovered edits');
    recovery.props.onClick(); app.render();
    assert.equal(app.selected(), 'content');
    assert.equal(new URL(app.url).searchParams.get('pane'), 'content');
    assert.equal(app.details().props.hidden, false);
    assert.equal(app.details().props.children.key, form.key);
    assert.equal(app.details().props.children.props.recoveryScope, app.recoveryScope);
    assert.equal(app.details().props.children.props.onDraftRecoveryChange instanceof Function, true);
  } finally { app.close(); }
});

test('opening, hiding and reopening details while already in Content adds no history entry', () => {
  const app = fixture('/studio/courses/one?pane=content&keep=1#draft'); try {
    const initialUrl = app.url, form = app.details().props.children;
    app.clickOptions();
    assert.equal(app.details().props.hidden, false);
    assert.equal(app.historyLength, 1);
    app.clickOptions();
    assert.equal(app.details().props.hidden, true);
    app.clickOptions();
    assert.equal(app.details().props.hidden, false);
    assert.equal(app.historyLength, 1);
    assert.equal(app.url, initialUrl);
    assert.equal(app.details().props.children.type, form.type);
    assert.equal(app.details().props.children.key, form.key);
    assert.equal(app.details().props.children.props.recoveryScope, app.recoveryScope);
  } finally { app.close(); }
});

test('Back from open details moves focus out of the disappearing Content panel', () => {
  const app = fixture('/studio/courses/one?pane=preview'); try {
    app.clickOptions();
    app.focus.activeElement = { closest: selector => selector === '.course-editor [role="tabpanel"]'
      ? { id: 'course-content' } : null };
    app.back();
    assert.equal(app.selected(), 'preview');
    assert.equal(app.panel('content').props.hidden, true);
    assert.deepEqual(app.focus.moves, ['course-preview-tab']);
    assert.equal(app.option().props['aria-expanded'], false);
  } finally { app.close(); }
});

test('stale course and stale route details handlers cannot write history or expose a form', () => {
  const app = fixture(); try {
    const old = app.option().props.onClick;
    app.switchCourse('two');
    const current = app.option().props.onClick;
    const before = app.url, length = app.historyLength;
    old(); app.render();
    assert.equal(app.url, before); assert.equal(app.historyLength, length);
    assert.equal(app.details().props.hidden, true);
    app.movePath('/studio/workbooks/book-1');
    current(); app.render();
    assert.equal(app.historyLength, length);
    assert.equal(app.details().props.hidden, true);
  } finally { app.close(); }
});
