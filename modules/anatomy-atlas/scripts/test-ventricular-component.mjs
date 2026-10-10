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
    export { ventriclesFor, ventricleCatalog } from './lib/ventricles';
    export { ventricularGuide } from './lib/ventricular-guide';
    export { default as raw } from './public/models/bodyparts3d/full-body/catalog.json';`,
    resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, platform: 'node', format: 'cjs', write: false,
  plugins: [{ name: 'controlled-ventricular-boundaries', setup(api) {
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
const state = (value) => { const index = cursor++;
  if (!(index in slots)) slots[index] = typeof value === 'function' ? value() : value;
  return [slots[index], next => slots[index] = typeof next === 'function' ? next(slots[index]) : next];
};
const sameDeps = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
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
const preference = { matches: true,
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
const same = (a, b, message) => { checks++; assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)), message); };
const catalog = api.bodyDisplayCatalog(api.raw);
const parent = catalog.structures.find(structure => api.ventriclesFor(structure).length === 4);
check(!!parent, 'Exact displayed brain parent exists');
const guide = api.ventricularGuide(parent);
check(guide?.steps.length === 5, 'Source-bound five-stop guide exists');

let tree;
const render = (extra = {}) => { cursor = 0; after = [];
  tree = api.VentricularView({ parent, educationCatalog: catalog, ...extra });
  after.forEach(run => run());
};
const scene = () => nodes(tree).find(node => node.props?.onRendererHealth)?.props;
const button = label => nodes(tree).find(node => node.props?.onClick && text(node).trim() === label)?.props;
const disclosure = id => nodes(tree).find(node => node.type === 'details' && node.props?.['data-testid'] === id)?.props;
const guidedPanel = () => nodes(tree).find(node => node.type === 'details' && node.props?.className === 'eye-layer-guided-learning');
const scopeDisclosure = () => nodes(guidedPanel()).find(node => node.type === 'details' && node.props?.['data-testid'] === 'ventricular-tour-limitations');
const status = () => nodes(tree).find(node => node.type === 'output' && node.props?.['data-testid'] === 'csf-motion-status');
const loadReady = (extra = {}) => { for (const bundle of scene().catalog.bundles) scene().onLoaded(bundle.id);
  scene().onRendererHealth('ready'); render(extra); };
const deniedStart = (reason) => { const control = button('Start CSF motion');
  check(control?.disabled, `${reason}: start disabled`);
  control.onClick(); render();
  check(!!button('Start CSF motion') && !scene().csfMotion, `${reason}: direct disabled callback fails closed`);
};

render(); render();
check(!!button('Start ventricular walkthrough')?.disabled, 'Guide waits for source/renderer readiness');
button('Start ventricular walkthrough').onClick(); render();
check(!button('End walkthrough'), 'Guide callback cannot start while loading');
check(!!disclosure('csf-motion-controls'), 'Motion disclosure is present only for source-bound ventricles');
check(!scene().csfMotion, 'CSF motion defaults off');
deniedStart('Unready view');
loadReady();
check(!button('Start ventricular walkthrough').disabled, 'Ready guide can start');
const idlePanel = guidedPanel(), idleScope = scopeDisclosure();
idlePanel.props.onToggle({ target: idleScope, currentTarget: { open: true } }); render();
check(!guidedPanel().props.open && !button('End walkthrough'), 'Reading scope does not expand or autoplay the idle guide');
deniedStart('Reduced-motion preference');
preference.matches = false; events.get('motion:change')(); render();
check(!button('Start CSF motion').disabled, 'Motion may be explicitly started when ready');
button('Start CSF motion').onClick(); render();
check(scene().csfMotion, 'Explicit start enables schematic motion');
check(text(status()).includes('Schematic motion active'), 'Accessible active status');
for (const id of api.ventricleCatalog.ventricularIds)
  same(scene().appearance[id].opacity, 0.18, 'Every ventricular shell is transparent while motion is active');
button('Pause CSF motion').onClick(); render();
check(!scene().csfMotion && !!button('Start CSF motion'), 'Explicit pause stops motion');

document.hidden = true; events.get('visibilitychange')(); render(); deniedStart('Hidden page');
document.hidden = false; events.get('visibilitychange')(); render();
scene().onRendererHealth('lost'); render(); deniedStart('Lost renderer');
scene().onRendererHealth('ready'); render();
const slider = () => nodes(tree).find(node => node.props?.['aria-label'] === 'Ventricular separation');
slider().props.onValueChange([37]); render(); deniedStart('Exploded teaching layout');
slider().props.onValueChange([0]); render();
const cut = () => nodes(tree).find(node => node.props?.positionId === 'nested-ventricles-cut-position')?.props;
check(!!cut(), 'Actual cutaway control is present');
cut().onChange({ ...cut().value, plane: 'sagittal' }); render(); deniedStart('Cutaway');
cut().onChange({ ...cut().value, plane: 'off' }); render();

// Prepare non-default reducer state; walkthrough must not dispatch over it.
const alternate = scene().structures.find(structure =>
  api.ventricleCatalog.ventricularIds.includes(structure.id) && structure.id !== scene().selectedId);
scene().onSelect(alternate.id); render();
const switchFor = name => nodes(tree).find(node => node.props?.['aria-label'] === `Show ${name.toLowerCase()}`)?.props;
const hiddenPart = scene().structures.find(structure =>
  api.ventricleCatalog.ventricularIds.includes(structure.id) && structure.id !== scene().selectedId);
switchFor(hiddenPart.name).onCheckedChange(false); render();
slider().props.onValueChange([29]); render();
cut().onChange({ ...cut().value, plane: 'coronal' }); render();
const before = { selectedId: scene().selectedId, hiddenIds: scene().hiddenIds,
  explode: scene().explode, layout: scene().layout, view: scene().view, inspection: scene().inspection };
const publishedBeforeGuide = [...education.published];
const camera = { direction: [0.2672612419, 0.5345224838, 0.8017837257],
  up: [0, 1, 0], pan: [0.1, 0.2, 0], scale: 1.25 };
scene().cameraCapture.current = camera;
button('Start ventricular walkthrough').onClick(); render();
for (const [index, step] of guide.steps.entries()) {
  const panel = guidedPanel(), scope = scopeDisclosure();
  const notice = nodes(panel).find(node => node.props?.['data-testid'] === 'ventricular-tour-source-scope');
  check(text(notice) === 'Draft source-space teaching · CSF markers are schematic, not measured physiology or connected circulation.',
    `${step.id}: compact schematic warning remains visible`);
  check(scope?.props.open !== true && nodes(scope).some(node => node.type === 'summary' && text(node) === 'Tour scope & limitations'),
    `${step.id}: full scope starts in a closed disclosure`);
  check(nodes(scope).some(node => node.type === 'p' && text(node) === guide.limitation),
    `${step.id}: exact original limitation retained`);
  const scopeState = { selectedId: scene().selectedId, hiddenIds: scene().hiddenIds,
    explode: scene().explode, layout: scene().layout, view: scene().view, inspection: scene().inspection };
  panel.props.onToggle({ target: scope, currentTarget: { open: false } }); render();
  same({ selectedId: scene().selectedId, hiddenIds: scene().hiddenIds,
    explode: scene().explode, layout: scene().layout, view: scene().view, inspection: scene().inspection },
    scopeState, `${step.id}: reading nested scope preserves guide state`);
  check(!!button('End walkthrough') && guidedPanel().props.open,
    `${step.id}: nested disclosure cannot end the ventricular guide`);
  same(scene().selectedId, step.selectedId, `${step.id}: exact source focus`);
  same(scene().view, step.view, `${step.id}: camera view`);
  same(scene().hiddenIds.filter(id => api.ventricleCatalog.ventricularIds.includes(id)),
    api.ventricleCatalog.ventricularIds.filter(id => !step.ids.includes(id)), `${step.id}: exact source visibility`);
  same(scene().explode, 0, `${step.id}: assembled geometry`);
  same(scene().layout, 'spatial', `${step.id}: source-position layout`);
  same(scene().inspection.plane, 'off', `${step.id}: cutaway overlay cleared`);
  check(scene().tourLocked && scene().isolated, `${step.id}: camera locked and others faded`);
  same(scene().transitionMs, 1800, `${step.id}: camera transition`);
  check(education.options.disabled, `${step.id}: imaging sync paused`);
  check(nodes(tree).some(node => node.type === 'fieldset' && node.props.disabled), `${step.id}: manual controls disabled`);
  check(nodes(tree).some(node => node.type === 'fieldset' && node.props.inert), `${step.id}: custom controls inert`);
  check(switchFor(hiddenPart.name).disabled, `${step.id}: non-native switch explicitly disabled`);
  switchFor(hiddenPart.name).onCheckedChange(true); render();
  slider().props.onValueChange([66]); render();
  cut().onChange({ ...cut().value, plane: 'sagittal' }); render();
  check(text(tree).includes(step.caption), `${step.id}: caption rendered`);
  same(button('Previous step').disabled, index === 0, `${step.id}: previous boundary`);
  same(button('Next step').disabled, index === guide.steps.length - 1, `${step.id}: next boundary`);
  const selected = scene().selectedId;
  scene().onSelect(hiddenPart.id); render();
  same(scene().selectedId, selected, `${step.id}: direct scene selection fails closed`);
  same(education.published, publishedBeforeGuide, `${step.id}: guide publishes no scan selection`);
  if (index === 0) {
    preference.matches = true; events.get('motion:change')(); render();
    same(scene().transitionMs, 0, 'Reduced motion removes camera animation');
    preference.matches = false; events.get('motion:change')(); render();
    document.hidden = true; events.get('visibilitychange')(); render();
    check(scene().transitionPaused, 'Hidden page pauses guided camera');
    button('Next step').onClick(); render();
    same(scene().selectedId, selected, 'Hidden-page step callback fails closed');
    document.hidden = false; events.get('visibilitychange')();
    scene().onRendererHealth('lost'); render();
    check(scene().transitionPaused, 'Renderer loss pauses guided camera');
    button('Next step').onClick(); render();
    same(scene().selectedId, selected, 'Unready step callback fails closed');
    scene().onRendererHealth('ready'); render();
  }
  if (index < guide.steps.length - 1) { button('Next step').onClick(); render(); }
}
button('Next step').onClick(); render();
same(scene().selectedId, guide.steps.at(-1).selectedId, 'Last-step callback cannot advance out of bounds');
button('End walkthrough').onClick(); render();
same({ selectedId: scene().selectedId, hiddenIds: scene().hiddenIds,
  explode: scene().explode, layout: scene().layout, view: scene().view, inspection: scene().inspection },
  before, 'Manual selection, visibility, layout and cut restored exactly');
same(scene().cameraRestore.current, camera, 'Exact prior camera supplied for restoration');
check(!scene().tourLocked && !button('End walkthrough'), 'Manual camera and controls restored');
check(!!button('Undo layers') && !button('Undo layers').disabled, 'Pre-guide reducer history retained');
button('Undo layers').onClick(); render();
same(scene().hiddenIds.filter(id => api.ventricleCatalog.ventricularIds.includes(id)), [],
  'Undo acts on prior manual visibility after guide exits');
let focused = false;
button('Start ventricular walkthrough').ref.current = { focus() { focused = true; } };
button('Start ventricular walkthrough').onClick(); render();
button('End walkthrough').onClick(); render();
check(focused, 'Focus returns to guide launcher');

slots = []; events.clear(); preference.matches = true; document.hidden = false;
render({ initialSelectedId: 'foreign-child' }); loadReady({ initialSelectedId: 'foreign-child' });
check(button('Start ventricular walkthrough').disabled, 'Foreign incoming child denied');
check(button('Start CSF motion').disabled,'Foreign incoming child denies motion');
button('Start ventricular walkthrough').onClick(); render({ initialSelectedId: 'foreign-child' });
check(!button('End walkthrough'), 'Foreign-child callback denied');
slots = []; render({ parent: { ...parent, name: 'altered brain parent' } });
check(!button('Start ventricular walkthrough') && !disclosure('csf-motion-controls'),
  'Altered parent denies both guide and motion');
slots = []; render({ initialGuidedLearningExpanded: true });
check(nodes(tree).some(node => node.type === 'details' && node.props.className === 'eye-layer-guided-learning' && node.props.open),
  'Library may expand disclosure');
check(!button('End walkthrough') && button('Start ventricular walkthrough').disabled,
  'Expanded disclosure does not autoplay or bypass readiness');
slots = []; render({ study: 'brainstem' });
check(!button('Start ventricular walkthrough') && !disclosure('csf-motion-controls'),
  'Other brain study has neither ventricular guide nor CSF motion');
check(!scene().csfMotion, 'Other study passes no CSF motion flag');
same(education.published, publishedBeforeGuide, 'Guide and motion published no additional scan selection');
console.log(JSON.stringify({ componentChecks: checks, guideStops: guide.steps.length,
  motionOptIn: true, manualStatePreserved: true, browserAcceptance: false, clinicalApproval: false }));
