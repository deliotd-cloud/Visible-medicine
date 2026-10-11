import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url);
const React = require('react');
const actualLink = await import('vinext/shims/link');
const built = await build({
  stdin: { contents: `export { VentricularView } from './app/ventricles';
    export { bodyDisplayCatalog } from './lib/body-display-catalog';
    export { cardiacFor, cardiacCatalog } from './lib/cardiac';
    export { cardiacCavityGuide } from './lib/cardiac-cavity-guide';
    export { default as raw } from './public/models/bodyparts3d/full-body/catalog.json';`,
    resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, platform: 'node', format: 'cjs', write: false,
  plugins: [{ name: 'controlled-cardiac-boundaries', setup(api) {
    api.onLoad({ filter: /body-scene\.tsx$/ }, () => ({
      contents: 'export const BodyScene=()=>null;export const retryBodyAssets=()=>{};', loader: 'tsx',
    }));
    api.onLoad({ filter: /nested-teaching\.tsx$/ }, () => ({
      contents: 'export const NestedTeaching=()=>null;', loader: 'tsx',
    }));
    api.onLoad({ filter: /nested-education-link\.ts$/ }, () => ({
      contents: 'export const useNestedEducationLink=options=>globalThis.education.use(options);', loader: 'ts',
    }));
  } }],
});

let slots = [], cursor = 0, after = [], checks = 0;
const state = value => { const index = cursor++;
  if (!(index in slots)) slots[index] = typeof value === 'function' ? value() : value;
  return [slots[index], next => slots[index] = typeof next === 'function' ? next(slots[index]) : next];
};
const sameDeps = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
const memo = (fn, deps) => { const index = cursor++;
  if (!sameDeps(slots[index]?.deps, deps)) slots[index] = { deps, value: fn() };
  return slots[index].value;
};
const effect = (fn, deps) => { const index = cursor++;
  if (!sameDeps(slots[index]?.deps, deps)) {
    slots[index]?.cleanup?.(); slots[index] = { deps };
    after.push(() => slots[index].cleanup = fn());
  }
};
const shim = { ...React, useContext: () => null, useState: state, useMemo: memo,
  useCallback: (fn, deps) => memo(() => fn, deps),
  useRef: value => state(() => ({ current: value }))[0],
  useEffect: effect, useLayoutEffect: effect,
  useReducer: (reduce, arg, init) => { const [value, set] = state(() => init ? init(arg) : arg);
    return [value, action => set(old => reduce(old, action))]; },
};
const education = { options: null, published: [], use(options) {
  this.options = options;
  return { adapter: null, publish: id => this.published.push(id) };
} };
const events = new Map();
const preference = { matches: false,
  addEventListener: (name, callback) => events.set(`motion:${name}`, callback),
  removeEventListener: name => events.delete(`motion:${name}`),
};
const document = { hidden: false,
  addEventListener: (name, callback) => events.set(name, callback),
  removeEventListener: name => events.delete(name),
};
const scope = { exports: {} };
runInNewContext(built.outputFiles[0].text, {
  module: scope, exports: scope.exports,
  require: id => id === 'react' ? shim : id === 'next/link' ? { __esModule: true, ...actualLink } : require(id),
  education, structuredClone, window: { matchMedia: () => preference }, document,
});
const api = scope.exports;
const nodes = node => !node || typeof node !== 'object' ? [] :
  Array.isArray(node) ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)];
const text = node => typeof node === 'string' || typeof node === 'number' ? String(node) :
  !node ? '' : Array.isArray(node) ? node.map(text).join('') : text(node.props?.children);
const check = (value, message) => { checks++; assert(value, message); };
const same = (actual, expected, message) => { checks++;
  assert.deepEqual(JSON.parse(JSON.stringify(actual)), JSON.parse(JSON.stringify(expected)), message);
};
const catalog = api.bodyDisplayCatalog(api.raw);
const parent = catalog.structures.find(s => api.cardiacFor(s).length === 4);
check(!!parent, 'Displayed heart parent exists');
const guide = api.cardiacCavityGuide(parent);
check(guide?.steps.length === 6, 'Exact pinned six-stop cavity guide exists');
const ids = api.cardiacCatalog.selectableIds;

let tree;
const render = (extra = {}) => { cursor = 0; after = [];
  tree = api.VentricularView({ parent, educationCatalog: catalog, study: 'cardiac', ...extra });
  after.forEach(run => run());
};
const scene = () => nodes(tree).find(node => node.props?.onRendererHealth)?.props;
const button = label => nodes(tree).find(node => node.props?.onClick && text(node).trim() === label)?.props;
const disclosure = id => nodes(tree).find(node => node.type === 'details' && node.props?.['data-testid'] === id);
const testNode = id => nodes(tree).find(node => node.props?.['data-testid'] === id);
const guidedPanel = () => nodes(tree).find(node => node.type === 'details' && node.props?.className === 'eye-layer-guided-learning');
const loadReady = () => { for (const bundle of scene().catalog.bundles) scene().onLoaded(bundle.id);
  scene().onRendererHealth('ready'); render(); };
const snapshot = () => ({ selectedId: scene().selectedId, hiddenIds: scene().hiddenIds,
  explode: scene().explode, layout: scene().layout, view: scene().view,
  inspection: scene().inspection });
const cavityHidden = () => scene().hiddenIds.filter(id => ids.includes(id));
const displayedPreset = () => nodes(tree).find(node =>
  nodes(node).some(child => child.props?.id === 'ventricular-preset') &&
  typeof node.props?.value === 'string')?.props.value;

render(); render();
check(button('Start cardiac cavity walkthrough')?.disabled, 'Loading guide cannot start');
button('Start cardiac cavity walkthrough').onClick(); render();
check(!button('End walkthrough'), 'Loading direct callback fails closed');
check(!disclosure('csf-motion-controls') && !scene().csfMotion, 'Cardiac guide has no CSF motion');
loadReady();
check(!button('Start cardiac cavity walkthrough').disabled, 'Ready guide can start explicitly');
check(!button('End walkthrough'), 'Ready model does not auto-start');

const alternate = api.cardiacFor(parent).find(s => s.id !== scene().selectedId);
scene().onSelect(alternate.id); render();
const hide = api.cardiacFor(parent).find(s => s.id !== scene().selectedId);
const switchFor = name => nodes(tree).find(node => node.props?.['aria-label'] === `Show ${name.toLowerCase()}`)?.props;
switchFor(hide.name).onCheckedChange(false); render();
const slider = () => nodes(tree).find(node => node.props?.['aria-label'] === 'Cardiac separation')?.props;
check(!!slider(), 'Cardiac separation control exists');
slider().onValueChange([29]); render();
const cut = () => nodes(tree).find(node => node.props?.positionId === 'nested-cardiac-cut-position')?.props;
cut().onChange({ ...cut().value, plane: 'coronal' }); render();
const before = snapshot();
const camera = { direction: [0.2672612419, 0.5345224838, 0.8017837257],
  up: [0, 1, 0], pan: [0.1, 0.2, 0], scale: 1.25 };
scene().cameraCapture.current = camera;
const publishedBefore = [...education.published];
button('Start cardiac cavity walkthrough').onClick(); render();
for (const [index, stop] of guide.steps.entries()) {
  check(!!button('End walkthrough'), `${stop.id}: active guide`);
  same(scene().selectedId, stop.selectedId, `${stop.id}: source cavity focus`);
  same(scene().view, stop.view, `${stop.id}: prescribed camera direction`);
  same(displayedPreset(), stop.preset, `${stop.id}: displayed preset`);
  same(cavityHidden(), ids.filter(id => !stop.ids.includes(id)), `${stop.id}: preset visibility`);
  same(scene().explode, 0, `${stop.id}: assembled cavity geometry`);
  same(scene().layout, 'spatial', `${stop.id}: source-position layout`);
  same(scene().inspection.plane, 'off', `${stop.id}: cutaway cleared`);
  check(scene().tourLocked && scene().isolated, `${stop.id}: camera locked and others faded`);
  same(scene().transitionMs, 1800, `${stop.id}: smooth transition`);
  check(education.options.disabled, `${stop.id}: imaging link cannot publish tour selection`);
  same(education.published, publishedBefore, `${stop.id}: no imaging selection published`);
  check(!button('Follow circulation') && !button('Exit walkthrough'), `${stop.id}: circulation controls hidden`);
  check(!disclosure('csf-motion-controls'), `${stop.id}: no CSF controls`);
  check(text(tree).includes(stop.caption), `${stop.id}: source caption rendered`);
  check(text(testNode('cardiac-cavity-tour-source-scope')).includes('Cavity orientation only'),
    `${stop.id}: cavity-only scope visible`);
  same(button('Previous step').disabled, index === 0, `${stop.id}: previous boundary`);
  same(button('Next step').disabled, index === guide.steps.length - 1, `${stop.id}: next boundary`);
  const scopeNode = disclosure('cardiac-cavity-tour-limitations');
  const stateBeforeScope = snapshot();
  guidedPanel().props.onToggle({ target: scopeNode, currentTarget: { open: false } }); render();
  same(snapshot(), stateBeforeScope, `${stop.id}: nested scope collapse preserves tour`);
  check(!!button('End walkthrough'), `${stop.id}: nested scope does not end tour`);
  if (index === 0) {
    preference.matches = true; events.get('motion:change')(); render();
    same(scene().transitionMs, 0, 'Reduced motion removes animation');
    preference.matches = false; events.get('motion:change')(); render();
    document.hidden = true; events.get('visibilitychange')(); render();
    check(scene().transitionPaused, 'Hidden page pauses guided camera');
    button('Next step').onClick(); render();
    same(scene().selectedId, stop.selectedId, 'Hidden-page next callback fails closed');
    document.hidden = false; events.get('visibilitychange')(); render();
    scene().onRendererHealth('lost'); render();
    check(scene().transitionPaused, 'Lost renderer pauses guided camera');
    button('Next step').onClick(); render();
    same(scene().selectedId, stop.selectedId, 'Unready next callback fails closed');
    scene().onRendererHealth('ready'); render();
  }
  if (index < guide.steps.length - 1) { button('Next step').onClick(); render(); }
}
button('End walkthrough').onClick(); render();
same(snapshot(), before, 'Manual selection, visibility, explode and inspection restored');
same(scene().cameraRestore.current, camera, 'Manual camera restoration supplied');
check(!scene().tourLocked && !button('End walkthrough'), 'Manual controls restored');

// A separate session verifies that an already active circulation walkthrough survives.
button('Follow circulation').onClick(); render();
check(!!button('Exit walkthrough'), 'Manual circulation active before guide');
loadReady();
const staleNext = button('Next step');
const staleExit = button('Exit walkthrough');
const circulationState = snapshot();
scene().cameraCapture.current = camera;
check(!button('Start cardiac cavity walkthrough')?.disabled,
  'Guide can start when circulation context has loaded');
button('Start cardiac cavity walkthrough').onClick(); render();
check(!button('Exit walkthrough') && !button('Follow circulation'),
  `Circulation controls unavailable during guide: exit=${!!button('Exit walkthrough')} start=${!!button('Follow circulation')} end=${!!button('End walkthrough')}`);
const guidedState = snapshot();
staleNext.onClick(); staleExit.onClick(); render();
same(snapshot(), guidedState, 'Stale circulation callbacks do not replace guided view');
button('End walkthrough').onClick(); render();
same(snapshot(), circulationState, 'Existing circulation view restored on End');
check(!!button('Exit walkthrough') && text(tree).includes('Step 1 of'),
  'Existing circulation step restored on End');
same(scene().cameraRestore.current, camera, 'Camera restored after circulation session');

console.log(JSON.stringify({ componentChecks: checks, guideStops: guide.steps.length,
  manualStatePreserved: true, circulationRestored: true,
  browserAcceptance: false, clinicalApproval: false }));
