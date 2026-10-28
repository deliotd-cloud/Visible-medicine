import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const requireSite = createRequire(new URL('../package.json', import.meta.url));
const ts = requireSite('typescript');
const historyState = await import(new URL('../node_modules/vinext/dist/server/app-history-state.js', import.meta.url));
const {AppBrowserHistoryController} = await import(new URL('../node_modules/vinext/dist/server/app-browser-history-controller.js', import.meta.url));
const source = readFileSync(new URL('../components/StudioCourseEditor.tsx', import.meta.url), 'utf8');
const jsx = (type, props) => ({type, props});

function fixture(initial = '/studio/courses/one?source=workspace#detail') {
  const entries = [new URL(initial, 'https://example.test')];
  const states = [{host: 'retained-caller', __vinext_historyIndex: 7, __vinext_previousNextUrl: '/studio/courses/one', __vinext_treeSnapshotId: 'retained-tree'}];
  const pushedInputs = [];
  let position = 0, pushes = 0, focusMoves = 0, courseId = 'one', cursor = 0, effectCursor = 0, tree;
  const slots = [], effects = [], listeners = new Set();
  const focus = {activeElement: null};
  const forms = { create: () => null, details: () => null, release: () => null, duplicate: () => null };
  const react = {
    useRef(initial) { const index = cursor++; return slots[index] ??= {current: initial}; },
    useState(initialValue) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initialValue === 'function' ? initialValue() : initialValue;
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useEffect(callback, deps) {
      const index = effectCursor++;
      if (!effects[index] || deps.some((value, i) => !Object.is(value, effects[index].deps[i]))) {
        effects[index] = {callback, deps, cleanup: effects[index]?.cleanup, pending: true};
      }
    },
    useMemo(factory, deps) {
      const index = cursor++, prior = slots[index];
      if (!prior || deps.some((value, j) => !Object.is(value, prior.deps[j])))
        slots[index] = {deps, value: factory()};
      return slots[index].value;
    },
    // This editor registers the layout hook before every passive hook.
    useLayoutEffect(callback, deps) { react.useEffect(callback, deps); },
  };
  const window = {
    get location() { return entries[position]; },
    history: {
      get state() { return states[position]; },
      pushState(data, _title, href) {
        pushedInputs.push(data);
        const nextState = historyState.isAppOwnedHistoryState(data) ? data : historyState.createExternalHistoryStatePreservingMetadata(data, states[position]);
        entries.splice(position + 1);
        states.splice(position + 1);
        entries.push(new URL(href, entries[position]));
        states.push(nextState);
        position++; pushes++;
      },
      back() { if (position > 0) { position--; for (const listener of listeners) listener(); } },
      forward() { if (position < entries.length - 1) { position++; for (const listener of listeners) listener(); } },
    },
    addEventListener(name, callback) { assert.equal(name, 'popstate'); listeners.add(callback); },
    removeEventListener(name, callback) { assert.equal(name, 'popstate'); listeners.delete(callback); },
  };
  const mocks = {
    react, 'react/jsx-runtime': {jsx, jsxs: jsx},
    'next/link': {default: 'a'},
    'next/navigation': {useSearchParams: () => new URLSearchParams(window.location.search)},
    './StudioForms': {CreateWorkbookForm: forms.create, EditCourseDetailsForm: forms.details, ReleaseDraftForm: forms.release, DuplicateCourseButton: forms.duplicate},
  };
  const code = ts.transpileModule(source, {compilerOptions: {jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
  const module = {exports: {}};
  new Function('require', 'module', 'exports', code)(name => { assert(Object.hasOwn(mocks, name), name); return mocks[name]; }, module, module.exports);
  const editor = module.exports.StudioCourseEditor;
  function all(node) {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap(all);
    return [node, ...all(node.props?.children)];
  }
  function render() {
    cursor = 0; effectCursor = 0;
    tree = editor({course: {id: courseId}, workbooks: [{id: 'workbook', courseId, title: 'Unsent', mode: 'lecture', caseCount: 0, status: 'draft'}], releases: [{id: 'release', status: 'draft', version: 1, title: 'Draft'}], recoveryScope: {actorId: 'synthetic', organizationId: 'org'}});
    if (effects.some(effect => effect.pending)) {
      for (const effect of effects) if (effect.pending) { effect.pending = false; effect.cleanup?.(); effect.cleanup = effect.callback(); }
      cursor = 0; effectCursor = 0;
      tree = editor({course: {id: courseId}, workbooks: [{id: 'workbook', courseId, title: 'Unsent', mode: 'lecture', caseCount: 0, status: 'draft'}], releases: [{id: 'release', status: 'draft', version: 1, title: 'Draft'}], recoveryScope: {actorId: 'synthetic', organizationId: 'org'}});
    }
    return tree;
  }
  const nodes = () => all(render());
  const tab = pane => nodes().find(node => node.props?.role === 'tab' && node.props['data-course-pane'] === pane);
  const panel = pane => nodes().find(node => node.props?.id === `course-${pane}`);
  const selected = () => ['content', 'preview', 'review'].find(pane => tab(pane).props['aria-selected']);
  function focusedTab() {
    return ['content', 'preview', 'review'].find(pane => tab(pane).props.tabIndex === 0);
  }
  function focusTab(pane) {
    focusMoves++;
    focus.activeElement = {closest: selector => selector === '.course-editor-tablist' ? {} : null};
    tab(pane).props.onFocus();
    render();
  }
  function key(pane, name, modifiers = {}) {
    let prevented = 0;
    const event = {
      key: name,
      altKey: false, ctrlKey: false, metaKey: false, ...modifiers,
      preventDefault() { prevented++; },
      currentTarget: {parentElement: {querySelector(selector) {
        const match = /^\[data-course-pane="(content|preview|review)"\]$/.exec(selector);
        return match ? {focus: () => focusTab(match[1])} : null;
      }}},
    };
    tab(pane).props.onKeyDown(event);
    render();
    return prevented;
  }
  globalThis.window = window;
  globalThis.document = focus;
  return {
    tab, panel, nodes, selected, focusedTab, focusTab, key, render,
    click(pane) { tab(pane).props.onClick(); render(); },
    setCourse(id) { courseId = id; render(); },
    navigate(href) { entries.splice(position + 1); states.splice(position + 1); entries.push(new URL(href, entries[position])); states.push({host: 'external', __vinext_historyIndex: 8}); position++; render(); },
    back() { window.history.back(); render(); }, forward() { window.history.forward(); render(); },
    get url() { return window.location.href; }, get pushes() { return pushes; }, get length() { return entries.length; }, get focusMoves() { return focusMoves; }, get state() { return window.history.state; }, get pushedInputs() { return pushedInputs; },
    close() { for (const effect of effects) effect.cleanup?.(); delete globalThis.window; delete globalThis.document; },
  };
}

test('tabs expose stable relationships, a single roving stop and mounted hidden panels', () => {
  const app = fixture();
  try {
    assert.equal(app.nodes().find(node => node.props?.role === 'tablist').props['aria-label'], 'Course editor');
    assert.equal(app.selected(), 'content'); assert.equal(app.focusedTab(), 'content');
    for (const pane of ['content', 'preview', 'review']) {
      const tab = app.tab(pane), panel = app.panel(pane);
      assert.equal(tab.props['aria-controls'], panel.props.id);
      assert.equal(panel.props['aria-labelledby'], tab.props.id);
      assert.equal(panel.props.role, 'tabpanel');
      assert.equal(panel.props.hidden, pane !== 'content');
      assert.equal(panel.props.tabIndex, 0);
    }
    assert.equal(app.nodes().filter(node => node.props?.role === 'tab' && node.props.tabIndex === 0).length, 1);
    assert.equal(app.nodes().find(node => node.props?.className === 'course-options').type, 'details');
  } finally { app.close(); }
});

test('arrows wrap and Home/End move focus without activating or pushing history', () => {
  const app = fixture();
  try {
    for (const [from, key, to] of [['content', 'ArrowLeft', 'review'], ['review', 'ArrowRight', 'content'], ['content', 'End', 'review'], ['review', 'Home', 'content'], ['content', 'ArrowRight', 'preview']]) {
      assert.equal(app.key(from, key), 1);
      assert.equal(app.focusedTab(), to);
      assert.equal(app.selected(), 'content');
    }
    assert.equal(app.key('preview', 'Tab'), 0);
    assert.equal(app.key('preview', 'Enter'), 0);
    assert.equal(app.key('preview', ' '), 0);
    assert.equal(app.pushes, 0);
    app.click('preview'); // Native button Enter/Space dispatch click; arrows do not.
    assert.equal(app.selected(), 'preview'); assert.equal(app.pushes, 1);
    assert.equal(app.focusedTab(), 'preview');
  } finally { app.close(); }
});

test('Alt, Ctrl and Meta modified navigation keys remain available to the browser', () => {
  const app = fixture();
  try {
    for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) for (const name of ['ArrowLeft', 'ArrowRight', 'Home', 'End']) {
      const before = {selected: app.selected(), focused: app.focusedTab(), url: app.url, pushes: app.pushes, length: app.length, focusMoves: app.focusMoves};
      assert.equal(app.key('content', name, {[modifier]: true}), 0, `${modifier}+${name} must not prevent browser default`);
      assert.deepEqual({selected: app.selected(), focused: app.focusedTab(), url: app.url, pushes: app.pushes, length: app.length, focusMoves: app.focusMoves}, before);
    }
  } finally { app.close(); }
});

test('pane pushes retain caller and framework history fields through the external branch', () => {
  const app = fixture();
  try {
    const before = {...app.state};
    app.click('preview');
    assert.deepEqual(app.pushedInputs[0], {...before, __vinext_externalHistoryState: true});
    assert.equal(historyState.isAppOwnedHistoryState(app.pushedInputs[0]), false);
    assert.deepEqual(app.state, historyState.createExternalHistoryStatePreservingMetadata(app.pushedInputs[0], before));
    for (const key of ['host', '__vinext_historyIndex', '__vinext_previousNextUrl', '__vinext_treeSnapshotId']) assert.equal(app.state[key], before[key]);
    app.click('review');
    assert.equal(app.pushedInputs[1].host, 'retained-caller');
    assert.equal(app.pushedInputs[1].__vinext_externalHistoryState, true);
    assert.equal(app.pushes, 2);
    app.back(); assert.equal(app.selected(), 'preview');
    app.forward(); assert.equal(app.selected(), 'review');
  } finally { app.close(); }
});

test('installed history controller assigns a fresh index while retaining caller state', () => {
  const app = fixture();
  try {
    const original = {...app.state};
    let state = original;
    let href = app.url;
    const controller = new AppBrowserHistoryController({
      initialHistoryState: state,
      maxHistoryStateSnapshots: 8,
      readHistoryState: () => state,
      readCurrentHref: () => href,
      replaceHistoryState: (next, nextHref) => {state = next; if (nextHref) href = new URL(nextHref, href).href;},
      pushHistoryState: (next, nextHref) => {state = next; if (nextHref) href = new URL(nextHref, href).href;},
      readVisibleNavigationMetadata: () => null,
    });
    controller.rememberHistoryStateSnapshot({navigationSnapshot: {pathname: '/studio/courses/one', search: '?source=workspace', params: {}}, unsentForm: {value: 'draft'}});
    app.click('preview');
    const incoming = app.pushedInputs[0];
    assert.equal(historyState.isAppOwnedHistoryState(incoming), false);
    state = historyState.createExternalHistoryStatePreservingMetadata(incoming, state);
    href = app.url;
    controller.claimCurrentHistoryTreeSnapshot('push', original);
    assert.equal(historyState.readHistoryStateTraversalIndex(state), 8);
    assert.equal(state.host, 'retained-caller');
    assert.equal(state.__vinext_previousNextUrl, original.__vinext_previousNextUrl);
    assert.equal(state.__vinext_externalHistoryState, true);
    assert.equal(controller.isCurrentExternalHistoryTree(state), true);
  } finally { app.close(); }
});

test('pane navigation retains query/hash, back/forward and live form subtrees', () => {
  const app = fixture();
  try {
    const details = app.nodes().find(node => node.props?.id === 'course-details-editor');
    assert(details && details.props.children.type);
    const original = ['content', 'review'].map(pane => app.panel(pane).props.children);
    app.click('preview'); app.click('review'); app.click('review');
    assert.equal(app.pushes, 2); assert.equal(app.length, 3);
    assert.equal(app.url, 'https://example.test/studio/courses/one?source=workspace&pane=review#detail');
    assert.equal(app.panel('content').props.hidden, true);
    assert(app.panel('content').props.children, 'Create workbook subtree remains rendered while hidden');
    assert(app.panel('review').props.children, 'Release draft subtree remains rendered while visible');
    app.back(); assert.equal(app.selected(), 'preview');
    app.back(); assert.equal(app.selected(), 'content');
    app.forward(); assert.equal(app.selected(), 'preview');
    app.forward(); assert.equal(app.selected(), 'review');
    assert.equal(app.pushes, 2);
    assert.deepEqual(['content', 'review'].map(pane => app.panel(pane).props.children?.length ?? typeof app.panel(pane).props.children), original.map(value => value?.length ?? typeof value));
  } finally { app.close(); }
});

test('unsent form locations and draft recovery notice survive pane changes', () => {
  const app = fixture();
  try {
    const form = type => app.nodes().find(node => node.type === type);
    const details = form(app.nodes().find(node => node.props?.id === 'course-details-editor').props.children.type);
    assert(details);
    details.props.onDraftRecoveryChange('attention');
    assert(app.nodes().some(node => node.props?.id === 'course-details-draft-status'));
    const create = form(app.nodes().find(node => node.props?.['aria-label'] === 'Add course content').props.children[1].type);
    const release = form(app.panel('review').props.children.find?.(node => node?.type === 'details')?.props.children?.[1]?.type);
    assert(create && release);
    app.click('preview'); app.click('review'); app.click('content');
    assert.equal(app.nodes().find(node => node.props?.id === 'course-details-draft-status').props.children[0], 'A device-local course draft needs attention.');
    assert(form(create.type), 'Unsent create form remains in the hidden/visible pane tree');
    assert(form(release.type), 'Unsent release form remains in the hidden/visible pane tree');
    assert.equal(app.pushes, 3, 'No form submission or extra pane entry is triggered');
  } finally { app.close(); }
});

test('course change resets pane and old course handlers cannot write the new history', () => {
  const app = fixture('/studio/courses/one?pane=review');
  try {
    const old = app.tab('preview').props.onClick;
    app.setCourse('two'); app.navigate('/studio/courses/two');
    assert.equal(app.selected(), 'content'); assert.equal(app.focusedTab(), 'content');
    const before = app.url, pushes = app.pushes;
    old(); assert.equal(app.url, before); assert.equal(app.pushes, pushes);
    app.click('preview'); assert.equal(app.selected(), 'preview');
  } finally { app.close(); }
});

test('Preview exposes a normally focusable builder link after tab activation and retains Back context', () => {
  const app = fixture();
  try {
    app.key('content', 'ArrowRight');
    assert.equal(app.focusedTab(), 'preview');
    assert.equal(app.panel('preview').props.hidden, true);
    app.click('preview');
    assert.equal(app.panel('preview').props.hidden, false);
    const link = app.nodes().find(node => node.props?.['aria-label'] === 'Open Unsent in builder to preview');
    assert(link);
    assert.equal(link.type, 'a');
    assert.equal(link.props.href, '/studio/workbooks/workbook/builder');
    assert.equal(link.props.tabIndex, undefined, 'native anchor remains in normal keyboard order');
    assert.equal(link.props.onClick, undefined, 'document navigation guard receives ordinary link activation');
    app.back();
    assert.equal(app.selected(), 'content');
    assert.equal(app.panel('preview').props.hidden, true);
    app.forward();
    assert.equal(app.selected(), 'preview');
    assert.equal(app.focusedTab(), 'preview');
  } finally { app.close(); }
});
