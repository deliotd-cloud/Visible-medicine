import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const {transformSync, build} = require('esbuild');
const stateSource = readFileSync(new URL('../components/atlas-runtime-state.ts', import.meta.url), 'utf8');
const stateJs = transformSync(stateSource, {loader: 'ts', format: 'esm'}).code;
const {createAtlasDocumentAttempt, sameAtlasDocument} = await import(`data:text/javascript;base64,${Buffer.from(stateJs).toString('base64')}`);
const component = readFileSync(new URL('../components/AtlasRuntimeFrame.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../components/atlas-runtime-frame.css', import.meta.url), 'utf8');

function harness(source = '/atlas-runtime/head-neck/index.html?region=thorax&study=x%2Fy&revision=17') {
  const reports = [], jobs = new Map();
  let next = 0;
  const attempt = createAtlasDocumentAttempt({
    source,
    baseHref: 'https://atlas.example/atlas/thorax-3d',
    report: phase => reports.push(phase),
    schedule: callback => { const id = ++next; jobs.set(id, callback); return id; },
    cancel: id => jobs.delete(id),
  });
  return {attempt, reports, jobs, fire: id => jobs.get(id)?.()};
}

test('only the exact intended document URL clears opening, including query and revision', () => {
  const h = harness();
  assert.equal(h.attempt.loaded('about:blank'), false);
  assert.equal(h.attempt.loaded('https://atlas.example/atlas-runtime/head-neck/index.html?region=pelvis&study=x%2Fy&revision=17'), false);
  assert.equal(h.attempt.loaded('https://atlas.example/atlas-runtime/head-neck/index.html?region=thorax&study=x%2Fy&revision=18'), false);
  assert.equal(h.attempt.loaded('https://elsewhere.example/atlas-runtime/head-neck/index.html?region=thorax&study=x%2Fy&revision=17'), false);
  assert.equal(h.attempt.phase, 'opening');
  assert.equal(h.attempt.loaded('https://atlas.example/atlas-runtime/head-neck/index.html?region=thorax&study=x%2Fy&revision=17'), true);
  assert.deepEqual(h.reports, ['document']);
  assert.equal(h.jobs.size, 0);
});

test('wrong document cannot suppress timeout; a late exact document may recover', () => {
  const h = harness();
  const timer = [...h.jobs.values()][0];
  h.attempt.loaded('about:blank');
  timer();
  assert.deepEqual(h.reports, ['delayed']);
  assert.equal(h.attempt.loaded('https://atlas.example/atlas-runtime/head-neck/index.html?region=thorax&study=x%2Fy&revision=17'), true);
  assert.deepEqual(h.reports, ['delayed', 'document']);
  timer();
  assert.deepEqual(h.reports, ['delayed', 'document']);
});

test('retirement refuses stale load, error, and queued timer callbacks', () => {
  const h = harness();
  const queued = [...h.jobs.values()][0];
  h.attempt.retire();
  assert.equal(h.jobs.size, 0);
  h.attempt.failed();
  assert.equal(h.attempt.loaded('https://atlas.example/atlas-runtime/head-neck/index.html?region=thorax&study=x%2Fy&revision=17'), false);
  queued();
  assert.deepEqual(h.reports, []);
});

test('error stops its timer and cannot be replaced by stale error or timeout', () => {
  const h = harness();
  const queued = [...h.jobs.values()][0];
  h.attempt.failed();
  h.attempt.failed();
  queued();
  assert.deepEqual(h.reports, ['error']);
  assert.equal(h.jobs.size, 0);
});

test('a delayed attempt can report a later network error without disturbing a confirmed document', () => {
  const h = harness();
  [...h.jobs.values()][0]();
  h.attempt.failed();
  assert.deepEqual(h.reports, ['delayed', 'error']);
  h.attempt.failed();
  assert.deepEqual(h.reports, ['delayed', 'error']);
  const confirmed = harness();
  confirmed.attempt.loaded('https://atlas.example/atlas-runtime/head-neck/index.html?region=thorax&study=x%2Fy&revision=17');
  confirmed.attempt.failed();
  assert.deepEqual(confirmed.reports, ['document']);
});

test('a new explicit attempt is isolated from its retired predecessor', () => {
  const old = harness('/atlas-runtime/head-neck/index.html?region=spine');
  const oldTimer = [...old.jobs.values()][0];
  old.attempt.retire();
  const fresh = harness('/atlas-runtime/head-neck/index.html?region=thorax');
  oldTimer();
  old.attempt.failed();
  assert.equal(old.attempt.loaded('https://atlas.example/atlas-runtime/head-neck/index.html?region=spine'), false);
  assert.equal(fresh.attempt.phase, 'opening');
  assert.equal(fresh.attempt.loaded('https://atlas.example/atlas-runtime/head-neck/index.html?region=thorax'), true);
  assert.deepEqual(old.reports, []);
  assert.deepEqual(fresh.reports, ['document']);
});

test('component preserves frame attributes, explicit retry, and accessible honest status', () => {
  assert.match(component, /<AtlasRuntimeSource key=\{src\}/);
  assert.match(component, /<AtlasRuntimeAttempt key=\{retry\.attempt\}/);
  assert.match(component, /onRetry=\{restoreFocus => setRetry\(previous =>/);
  assert.match(component, /<iframe ref=\{frame\} className=\{className\} src=\{src\} title=\{title\} referrerPolicy=\{referrerPolicy\}/);
  assert.match(component, /allowFullScreen=\{allowFullScreen\}/);
  assert.match(component, /href=\{src\} target="_blank" rel="noopener noreferrer"/);
  assert.match(component, /role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(component, /Atlas loading and 3D model display are not confirmed/);
  assert.doesNotMatch(component, /Atlas document opened/);
  assert.match(component, /Opening the 3D Atlas/);
  assert.match(component, /The Atlas is taking longer than expected to open/);
  assert.match(component, /The Atlas could not be opened/);
  assert.match(component, /if \(event\.currentTarget !== frame\.current\) return/);
  assert.match(component, /attempt\.retire\(\)/);
  assert.doesNotMatch(component, /location\.reload|setInterval/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /grid-row: 3/);
  assert.match(css, /> iframe/);
  assert.match(css, /\.atlas-runtime-frame:focus/);
});

// Execute the actual TSX component with a small deterministic hook/JSX runtime.
// This covers render/effect/ref order without an app bundle, browser, or fake GPU.
const compiled = await build({
  entryPoints: [fileURLToPath(new URL('../components/AtlasRuntimeFrame.tsx', import.meta.url))],
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
  jsx: 'automatic',
  loader: {'.css': 'empty'},
  plugins: [{name: 'hook-runtime', setup(api) {
    api.onResolve({filter: /^react(?:\/jsx-runtime)?$/}, args => ({path: args.path, namespace: 'hook-runtime'}));
    api.onLoad({filter: /.*/, namespace: 'hook-runtime'}, args => ({contents: args.path === 'react'
      ? 'export const useState=(...a)=>globalThis.__atlasHooks.useState(...a); export const useRef=(...a)=>globalThis.__atlasHooks.useRef(...a); export const useEffect=(...a)=>globalThis.__atlasHooks.useEffect(...a);'
      : 'export const jsx=(...a)=>globalThis.__atlasHooks.jsx(...a); export const jsxs=jsx;', loader: 'js'}));
  }}],
});

function componentHarness(initialSrc, documentHref = 'about:blank', readyState = 'complete') {
  let current = null, outer = null, sourceInstance = null, child = null, element = null, frameElement = null;
  let sourceValue = initialSrc, nextTimer = 0;
  const timers = new Map();
  const saved = {window: globalThis.window, document: globalThis.document, hooks: globalThis.__atlasHooks};
  const body = {};
  globalThis.document = {body, activeElement: body};
  globalThis.window = {
    location: {href: 'https://atlas.example/atlas/3d'},
    setTimeout(callback) { const id = ++nextTimer; timers.set(id, () => { timers.delete(id); callback(); }); return id; },
    clearTimeout(id) { timers.delete(id); },
  };
  globalThis.__atlasHooks = {
    jsx(type, props, key) { return {type, props: props ?? {}, key}; },
    useState(initial) {
      const instance = current, index = instance.cursor++;
      if (!(index in instance.hooks)) instance.hooks[index] = initial;
      return [instance.hooks[index], value => {
        instance.hooks[index] = typeof value === 'function' ? value(instance.hooks[index]) : value;
      }];
    },
    useRef(initial) {
      const instance = current, index = instance.cursor++;
      if (!(index in instance.hooks)) instance.hooks[index] = {current: initial};
      return instance.hooks[index];
    },
    useEffect(create, deps) {
      const instance = current, index = instance.cursor++;
      const old = instance.effects.get(index);
      if (old && deps.every((value, i) => Object.is(value, old.deps[i]))) return;
      old?.cleanup?.();
      instance.pending.push({index, create, deps});
    },
  };
  const module = {exports: {}};
  new Function('module', 'exports', compiled.outputFiles[0].text)(module, module.exports);
  const Component = module.exports.AtlasRuntimeFrame;
  function instance(type, key) { return {type, key, hooks: [], effects: new Map(), pending: [], cursor: 0}; }
  function render(instanceToRender, props) {
    current = instanceToRender;
    instanceToRender.cursor = 0;
    const tree = instanceToRender.type(props);
    current = null;
    return tree;
  }
  function commit(instanceToCommit) {
    for (const {index, create, deps} of instanceToCommit.pending.splice(0)) {
      instanceToCommit.effects.set(index, {create, deps, cleanup: create()});
    }
  }
  function retire(instanceToRetire) {
    for (const effect of instanceToRetire?.effects.values() ?? []) effect.cleanup?.();
    instanceToRetire?.effects.clear();
    if (instanceToRetire?.frame) instanceToRetire.frame.ref.current = null;
    if (instanceToRetire?.container) instanceToRetire.container.ref.current = null;
  }
  function flush({beforeEffects, beforeCommit} = {}) {
    outer ??= instance(Component, 'outer');
    const sourceElement = render(outer, {src: sourceValue, title: 'Atlas view', className: 'custom-frame', referrerPolicy: 'same-origin', allowFullScreen: true});
    if (!sourceInstance || sourceInstance.key !== sourceElement.key) {
      retire(child);
      child = null;
      retire(sourceInstance);
      sourceInstance = instance(sourceElement.type, sourceElement.key);
    }
    const childElement = render(sourceInstance, sourceElement.props);
    if (!child || child.key !== childElement.key) {
      retire(child);
      child = instance(childElement.type, childElement.key);
      child.frame = {contentDocument: {readyState}, contentWindow: {location: {href: documentHref}}};
    }
    element = render(child, childElement.props);
    frameElement = element.props.children[0];
    child.frame.ref = frameElement.props.ref;
    child.frame.ref.current = child.frame;
    child.container ??= {focus() { globalThis.document.activeElement = child.container; }};
    child.container.ref = element.props.ref;
    child.container.ref.current = child.container;
    beforeEffects?.({frame: child.frame, iframe: frameElement});
    beforeCommit?.();
    commit(child);
    return {frame: child.frame, iframe: frameElement, container: child.container, status: element.props.children[1], help: element.props.children[2]};
  }
  return {
    flush,
    timers,
    document: globalThis.document,
    changeSource(value) { sourceValue = value; return flush(); },
    retry({focused = true, beforeCommit} = {}) {
      const actions = element.props.children[2]
        ? element.props.children[2].props.children[2]
        : element.props.children[1].props.children[4];
      const button = actions.props.children[0];
      const buttonNode = {};
      globalThis.document.activeElement = focused ? buttonNode : body;
      button.props.onClick({currentTarget: buttonNode});
      if (focused) globalThis.document.activeElement = body;
      return flush({beforeCommit});
    },
    replayEffects() {
      for (const effect of child.effects.values()) effect.cleanup?.();
      for (const [index, effect] of child.effects) {
        child.effects.set(index, {...effect, cleanup: effect.create()});
      }
    },
    dispose() { retire(child); retire(sourceInstance); retire(outer); globalThis.window = saved.window; globalThis.document = saved.document; globalThis.__atlasHooks = saved.hooks; },
  };
}

test('early iframe load is reconciled after the hook installs, including StrictMode replay', () => {
  const h = componentHarness('/atlas-runtime/head-neck/index.html?region=thorax',
    'https://atlas.example/atlas-runtime/head-neck/index.html?region=thorax');
  try {
    h.flush({beforeEffects: ({frame, iframe}) => iframe.props.onLoad({currentTarget: frame})});
    assert.equal(h.timers.size, 0);
    let view = h.flush();
    assert.match(view.status.props.children[1].props.children, /Frame navigation finished/);
    h.replayEffects();
    assert.equal(h.timers.size, 0);
    view = h.flush();
    assert.match(view.status.props.children[1].props.children, /model display are not confirmed/);
  } finally { h.dispose(); }
});

test('about:blank stays pending; timeout exposes keyboard controls and exact source link', () => {
  const src = '/atlas-runtime/head-neck/index.html?region=thorax&revision=17';
  const h = componentHarness(src);
  try {
    let view = h.flush();
    view.iframe.props.onLoad({currentTarget: view.frame});
    assert.equal(h.timers.size, 1);
    [...h.timers.values()][0]();
    view = h.flush();
    const actions = view.status.props.children[4];
    assert.equal(view.status.props.role, 'status');
    assert.equal(view.status.props['aria-live'], 'polite');
    assert.equal(actions.props.children[0].props.type, 'button');
    assert.equal(actions.props.children[1].props.href, src);
    assert.equal(actions.props.children[1].props.target, '_blank');
    assert.equal(view.iframe.props.className, 'custom-frame');
    assert.equal(view.iframe.props.referrerPolicy, 'same-origin');
    assert.equal(view.iframe.props.allowFullScreen, true);
  } finally { h.dispose(); }
});

test('source change and explicit retry retire only their old attempt and stale callbacks', () => {
  const h = componentHarness('/atlas-runtime/head-neck/index.html?region=spine');
  try {
    const old = h.flush();
    const oldTimer = [...h.timers.values()][0];
    h.changeSource('/atlas-runtime/head-neck/index.html?region=thorax');
    oldTimer();
    old.iframe.props.onError({currentTarget: old.frame});
    old.iframe.props.onLoad({currentTarget: old.frame});
    assert.equal(h.timers.size, 1);
    [...h.timers.values()][0]();
    const beforeRetry = h.flush();
    h.retry();
    beforeRetry.iframe.props.onError({currentTarget: beforeRetry.frame});
    assert.equal(h.timers.size, 1);
    assert.match(h.flush().status.props.children[0].props.children, /Opening/);
  } finally { h.dispose(); }
  assert.equal(h.timers.size, 0);
});

test('focused explicit retry restores focus to the owned viewer once', () => {
  const h = componentHarness('/atlas-runtime/head-neck/index.html?region=thorax');
  try {
    h.flush();
    assert.equal(h.document.activeElement, h.document.body);
    [...h.timers.values()][0]();
    h.flush();
    const retried = h.retry();
    assert.equal(retried.container.ref.current, retried.container);
    assert.equal(h.document.activeElement, retried.container);
    assert.equal(retried.container.ref.current, retried.container);
    assert.equal(retried.container.ref.current.focus instanceof Function, true);
    h.document.activeElement = h.document.body;
    h.flush();
    assert.equal(h.document.activeElement, h.document.body, 'focus intent is consumed after the new mount');
  } finally { h.dispose(); }
});

test('initial load, source change, unfocused retry, and intervening focus never steal focus', () => {
  const h = componentHarness('/atlas-runtime/head-neck/index.html?region=spine');
  try {
    let view = h.flush();
    assert.equal(view.container.ref.current, view.container);
    assert.equal(h.document.activeElement, h.document.body);
    const elsewhere = {};
    h.document.activeElement = elsewhere;
    view = h.changeSource('/atlas-runtime/head-neck/index.html?region=thorax');
    assert.equal(h.document.activeElement, elsewhere);
    assert.equal(view.container.ref.current, view.container);
    [...h.timers.values()][0]();
    h.flush();
    h.retry({focused: false});
    assert.equal(h.document.activeElement, h.document.body);
    [...h.timers.values()][0]();
    h.flush();
    h.retry({beforeCommit: () => { h.document.activeElement = elsewhere; }});
    assert.equal(h.document.activeElement, elsewhere);
  } finally { h.dispose(); }
});

test('completed navigation retains a collapsed manual recovery disclosure outside the live status', () => {
  const src = '/atlas-runtime/head-neck/index.html?region=thorax&study=x%2Fy&revision=17';
  const h = componentHarness(src, `https://atlas.example${src}`);
  try {
    h.flush();
    const view = h.flush();
    assert.equal(h.timers.size, 0);
    assert.equal(view.help.type, 'details');
    assert.equal(view.help.props.open, undefined, 'help stays compact until the learner chooses it');
    assert.equal(view.help.props.children[0].type, 'summary');
    assert.equal(view.help.props.children[0].props.children, 'Viewer help');
    assert.equal(view.help.props.role, undefined, 'interactive recovery is not an atomic live announcement');
    assert.match(view.help.props.children[1].props.children, /Blank, incomplete or showing an error/);
    assert.match(view.help.props.children[1].props.children, /resets the viewer's current view/);
    const actions = view.help.props.children[2];
    assert.equal(actions.props.children[0].props.type, 'button');
    assert.equal(actions.props.children[1].props.href, src);
    assert.equal(actions.props.children[1].props.rel, 'noopener noreferrer');
    assert.match(view.status.props.children[1].props.children, /Atlas loading and 3D model display are not confirmed/);
    assert.doesNotMatch(view.status.props.children[1].props.children, /Atlas document opened|loaded successfully|model ready/);
    assert.equal(view.status.props.children[4], false);
  } finally { h.dispose(); }
});

test('manual recovery still retries the exact source after completed navigation and consumes focus intent once', () => {
  const src = '/atlas-runtime/head-neck/index.html?region=thorax&revision=17';
  const h = componentHarness(src, `https://atlas.example${src}`);
  try {
    h.flush();
    const completed = h.flush();
    const retried = h.retry();
    assert.notEqual(retried.frame, completed.frame);
    assert.equal(retried.iframe.props.src, src);
    assert.equal(h.document.activeElement, retried.container);
    completed.iframe.props.onLoad({currentTarget: completed.frame});
    completed.iframe.props.onError({currentTarget: completed.frame});
    assert.equal(h.timers.size, 0);
    h.document.activeElement = h.document.body;
    const settled = h.flush();
    assert.equal(settled.help.type, 'details');
    assert.equal(h.document.activeElement, h.document.body);
  } finally { h.dispose(); }
});

test('help does not automatically retry, navigate, or replace the completed frame', () => {
  const src = '/atlas-runtime/head-neck/index.html?region=thorax&revision=17';
  const h = componentHarness(src, `https://atlas.example${src}`);
  try {
    const initial = h.flush();
    for (let index = 0; index < 5; index++) {
      const current = h.flush();
      assert.equal(current.frame, initial.frame);
      assert.equal(current.iframe.props.src, src);
      assert.equal(h.timers.size, 0);
      assert.equal(h.document.activeElement, h.document.body);
    }
  } finally { h.dispose(); }
});
