/* oxlint-disable react-hooks/rules-of-hooks -- controlled hooks exercise the production specimen workbench */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import { build } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url);
const React = require('react');
const actualLink = await import('vinext/shims/link');
const built = await build({
  stdin: {
    contents: "export { KneeSpecimenView } from './app/um-knee-study'; export { createHraPelvisSupplement } from './app/hra-pelvis-supplement'; export { hraPelvisDefinition } from './lib/hra-pelvis'; export { hraPelvicGuidedDissection } from './lib/hra-pelvic-guided-dissection'; export { kneeDefinition } from './lib/um-limb-studies'; export { hraRenalDefinition } from './lib/hra-renal'; export { initialSpecimen, reduceSpecimen } from './lib/independent-specimen'; export { validStudyCamera } from './lib/study-views'; export { abdominalWallDefinition } from './lib/abdominal-wall'; export { backLayersDefinition } from './lib/back-layers'; export { abdominalWallSupplementFor } from './app/abdominal-wall-study'; export { backLayersSupplementFor } from './app/back-layers-study';",
    resolveDir: process.cwd(), loader: 'tsx',
  },
  bundle: true, write: false, format: 'cjs', platform: 'node',
  loader: { '.css': 'empty' },
  plugins: [{ name: 'no-gpu-boundary', setup(api) {
    api.onLoad({ filter: /[\\/]app[\\/]body-scene\.tsx$/ }, () => ({
      loader: 'js', contents: 'export function BodyScene(){return null;} export function retryBodyAssets(){}',
    }));
  } }],
});
const plain = value => JSON.parse(JSON.stringify(value));
const snapshot = value => value === undefined ? undefined : plain(value);
const nodes = tree => !tree || typeof tree !== 'object' ? [] : Array.isArray(tree)
  ? tree.flatMap(nodes) : [tree, ...nodes(tree.props?.children)];
const text = tree => tree == null ? '' : typeof tree === 'string' || typeof tree === 'number'
  ? String(tree) : Array.isArray(tree) ? tree.map(text).join('') : text(tree.props?.children);

function harness({ definition, supplement, initialNavigation, reducedMotion = false } = {}) {
  const slots = [], effects = [], listeners = new Map();
  let cursor = 0, tree, dirty = false;
  const changed = (old, next) => !old || !next || old.length !== next.length
    || old.some((item, i) => !Object.is(item, next[i]));
  const shim = { ...React,
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [slots[i], value => {
        const next = typeof value === 'function' ? value(slots[i]) : value;
        if (!Object.is(slots[i], next)) { slots[i] = next; dirty = true; }
      }];
    },
    useReducer(reducer, initial, init) {
      const [state, setState] = shim.useState(() => init ? init(initial) : initial);
      return [state, action => setState(value => reducer(value, action))];
    },
    useRef(initial) { return slots[cursor++] ??= { current: initial }; },
    useMemo(fn, deps) {
      const i = cursor++;
      if (changed(slots[i]?.deps, deps)) slots[i] = { deps, value: fn() };
      return slots[i].value;
    },
    useCallback(fn, deps) { return shim.useMemo(() => fn, deps); },
    useEffect(fn, deps) {
      const i = cursor++;
      if (changed(slots[i]?.deps, deps)) effects.push(() => {
        slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: fn() };
      });
    },
    useLayoutEffect(fn, deps) { shim.useEffect(fn, deps); },
  };
  const preference = {
    matches: reducedMotion,
    addEventListener(_name, fn) { listeners.set('motion', fn); },
    removeEventListener() { listeners.delete('motion'); },
  };
  const document = {
    hidden: false,
    addEventListener(name, fn) { listeners.set(name, fn); },
    removeEventListener(name) { listeners.delete(name); },
  };
  const window = { matchMedia: () => preference };
  const module = { exports: {} };
  runInNewContext(built.outputFiles[0].text, {
    module, exports: module.exports, structuredClone, window, document,
    require(id) { return id === 'react' ? shim : id === 'next/link' ? { __esModule: true, ...actualLink } : require(id); },
  });
  const api = module.exports;
  const specimen = definition ?? api.hraPelvisDefinition;
  const props = { specimen, supplement: supplement === undefined
    ? api.createHraPelvisSupplement() : supplement, initialNavigation };
  const sourceBefore = JSON.stringify(specimen);
  function render() {
    for (let count = 0; count < 20; count++) {
      cursor = 0; dirty = false; effects.length = 0;
      tree = api.KneeSpecimenView(props);
      if (dirty) continue;
      for (const effect of effects) effect();
      if (!dirty) return tree;
    }
    assert.fail('Specimen workbench did not settle');
  }
  function find(predicate, description) {
    const found = nodes(tree).filter(predicate);
    assert.equal(found.length, 1, description);
    return found[0].props;
  }
  const scene = () => find(node => node.type?.name === 'BodyScene', 'one source scene');
  const button = label => find(node => node.props?.onClick && text(node) === label, `button ${label}`);
  const child = name => find(node => node.type?.name === name, `child ${name}`);
  function click(label) { const control = button(label); assert(!control.disabled, `${label} enabled`); control.onClick(); render(); }
  function ready() {
    scene().onRendererHealth('ready');
    for (const id of new Set(specimen.catalog.bundles.map(bundle => bundle.id))) scene().onLoaded(id);
    render();
  }
  render();
  return { api, props, slots, scene, button, child, click, ready, render, preference,
    document, listeners, tree: () => tree, unchanged: () => assert.equal(JSON.stringify(specimen), sourceBefore) };
}

test('Female pelvis guide launches only after exact current bundles and renderer are ready', () => {
  const h = harness(), guide = h.api.hraPelvicGuidedDissection(h.props.specimen);
  assert.equal(guide.steps.length, 6);
  assert.equal(h.button('Start guided dissection').disabled, true);
  h.scene().onRendererHealth('ready'); h.render();
  const bundles = [...new Set(h.props.specimen.catalog.structures
    .filter(surface => !h.scene().hiddenIds.includes(surface.id)).map(surface => surface.bundle))];
  h.scene().onLoaded('unrelated-bundle'); h.render();
  assert.equal(h.button('Start guided dissection').disabled, true);
  for (const id of bundles.slice(0, -1)) {
    h.scene().onLoaded(id); h.render();
    assert.equal(h.button('Start guided dissection').disabled, true, `${id} alone cannot unlock guide`);
  }
  h.scene().onLoaded(bundles.at(-1)); h.render();
  assert.equal(h.button('Start guided dissection').disabled, false);
  h.click('Start guided dissection');
  assert.equal(h.button('Previous').disabled, true);
  const loaded = new Set(bundles);
  for (const [index, step] of guide.steps.entries()) {
    const scene = h.scene();
    assert.equal(scene.selectedId, step.selectedId);
    assert.equal(scene.view, step.view);
    assert.deepEqual(plain(scene.hiddenIds), plain(h.props.specimen.surfaces
      .filter(surface => !step.ids.includes(surface.id)).map(surface => surface.id)));
    assert.equal(scene.explode, 0);
    assert.equal(scene.isolated, false);
    assert.equal(scene.transitionMs, 1800);
    const newlyRequired = [...new Set(h.props.specimen.catalog.structures
      .filter(surface => step.ids.includes(surface.id)).map(surface => surface.bundle))]
      .filter(id => !loaded.has(id));
    if (newlyRequired.length) {
      assert.equal(h.button('Next').disabled, true, 'New source bundle pauses progression');
      for (const id of newlyRequired) { scene.onLoaded(id); loaded.add(id); }
      h.render();
    }
    if (index < guide.steps.length - 1) h.click('Next');
  }
  assert.equal(h.button('Finish').disabled ?? false, false);
  h.click('Previous');
  assert.equal(h.scene().selectedId, guide.steps.at(-2).selectedId);
  h.click('Next');
  h.click('Finish');
  h.unchanged();
});

test('Guided session restores exact reducer history, search, display and captured camera', () => {
  const initial = harness(), specimen = initial.props.specimen, api = initial.api;
  const first = specimen.surfaces[0].id, second = specimen.surfaces[1].id;
  let state = api.initialSpecimen(specimen);
  state = api.reduceSpecimen(specimen, state, { type: 'select', id: second });
  state = api.reduceSpecimen(specimen, state, { type: 'visibility', id: first, visible: false });
  state = api.reduceSpecimen(specimen, state, { type: 'undo' });
  assert(state.history.length > 0 && state.future.length > 0);
  const initialNavigation = { state, selectedId: state.selectedId, structureOnly: true, view: 'left' };
  const h = harness({ initialNavigation });
  const search = h.child('SpecimenStructureSearch');
  search.onQueryChange('uterine'); h.render();
  h.button('Labels').onClick(); h.render();
  const before = plain(h.slots[0]), preScene = h.scene();
  const displayKeys = ['isolated', 'explode', 'layout', 'view', 'labels', 'focus', 'zoom',
    'zoomStep', 'illustrated', 'showOrigins', 'cameraBounds'];
  const displayBefore = Object.fromEntries(displayKeys.map(key => [key, snapshot(preScene[key])]));
  const captured = { direction: [0, 0, 1], up: [0, 1, 0], pan: [0.1, -0.2, 0.3], scale: 2 };
  assert.equal(h.api.validStudyCamera(captured), true, 'Camera fixture passes the production validator');
  assert(preScene.cameraCapture, 'Production viewer must expose camera capture for restoration');
  preScene.cameraCapture.current = captured;
  h.ready(); h.click('Start guided dissection');
  const manual = nodes(h.tree()).filter(node => node.type === 'fieldset'
    && node.props?.className === 'um-specimen-manual-controls');
  assert.equal(manual.length, 2);
  for (const panel of manual) assert.equal(panel.props.disabled, true);
  const slider = nodes(h.tree()).find(node => node.props?.['aria-label']
    === `${specimen.label} tissue separation`);
  assert(slider, 'Tissue separation slider remains in manual controls');
  assert.equal(slider.props.disabled, true);
  slider.props.onValueChange([55]); h.render();
  assert.equal(h.scene().explode, 0, 'Disabled slider callback cannot separate guided sources');
  const teaching = nodes(h.tree()).find(node => node.type === 'section'
    && node.props?.['aria-label'] === 'Selected specimen structure');
  assert(teaching, 'Selected-structure teaching remains mounted');
  assert(nodes(teaching).some(node => node.type?.name === 'SpecimenLearning'));
  const sourceDetails = nodes(h.tree()).find(node => node.type === 'details'
    && nodes(node).some(child => child.type === 'summary' && text(child) === 'Source & limitations'));
  assert(sourceDetails, 'Source details remain mounted');
  for (const panel of manual) {
    assert(!nodes(panel).includes(teaching), 'Teaching remains outside disabled controls');
    assert(!nodes(panel).includes(sourceDetails), 'Source details remain outside disabled controls');
  }
  const selectedDuringGuide = h.scene().selectedId;
  h.scene().onSelect(first); h.render();
  assert.equal(h.scene().selectedId, selectedDuringGuide, 'Scene selection cannot mutate guide state');
  const structureSearch = h.child('SpecimenStructureSearch');
  assert.equal(typeof structureSearch.onSelect, 'function');
  const otherSource = specimen.surfaces.find(surface => surface.id !== selectedDuringGuide).id;
  structureSearch.onSelect(otherSource); structureSearch.onVisibility(selectedDuringGuide, false); h.render();
  assert.equal(h.scene().selectedId, selectedDuringGuide, 'Search selection callback cannot mutate guide state');
  assert.equal(h.scene().hiddenIds.includes(selectedDuringGuide), false,
    'Search visibility callback cannot hide the selected guided source');
  h.click('Next'); h.click('Exit guided dissection');
  assert.deepEqual(plain(h.slots[0]), before, 'Undo and Redo must be restored exactly');
  assert.equal(h.child('SpecimenStructureSearch').query, 'uterine');
  assert.deepEqual(Object.fromEntries(displayKeys.map(key => [key, snapshot(h.scene()[key])])), displayBefore);
  assert(manual.every(panel => panel.props.disabled), 'Captured active panels were locked');
  const restoredManual = nodes(h.tree()).filter(node => node.type === 'fieldset'
    && node.props?.className === 'um-specimen-manual-controls');
  assert.equal(restoredManual.length, 2);
  for (const panel of restoredManual) assert.equal(panel.props.disabled, false);
  assert(h.scene().cameraRestore, 'Production viewer must expose camera restore');
  assert.deepEqual(plain(h.scene().cameraRestore.current), captured);
  assert.equal(h.api.validStudyCamera(h.scene().cameraRestore.current), true);
  h.unchanged();
});

test('Wall/back supplements deliver six exact steps with readiness, reduced motion and Finish restoration', () => {
  const api = harness().api;
  for (const [definition, supplement] of [
    [api.abdominalWallDefinition, api.abdominalWallSupplementFor()],
    [api.backLayersDefinition, api.backLayersSupplementFor()],
  ]) for (const reducedMotion of [false, true]) {
    const h = harness({ definition, supplement, reducedMotion });
    const guide = supplement.guidedDissection(definition);
    assert.equal(guide.steps.length, 6);
    assert.equal(h.button('Start guided dissection').disabled, true);
    const before = plain(h.slots[0]);
    h.ready(); h.click('Start guided dissection');
    for (const [index, step] of guide.steps.entries()) {
      assert.equal(h.scene().selectedId, step.selectedId);
      assert.equal(h.scene().view, step.view);
      assert.deepEqual(plain(h.scene().hiddenIds), plain(definition.surfaces.filter(surface => !step.ids.includes(surface.id)).map(surface => surface.id)));
      assert.equal(h.scene().transitionMs, reducedMotion ? 0 : 1800);
      assert(text(h.tree()).includes(step.caption));
      if (index < guide.steps.length - 1) h.click('Next');
    }
    h.click('Finish');
    assert.deepEqual(plain(h.slots[0]), before);
    h.ready(); h.click('Start guided dissection');
    h.scene().onRendererHealth('lost'); h.render();
    assert.equal(h.button('Next').disabled, true);
    h.click('Exit guided dissection');
    assert.deepEqual(plain(h.slots[0]), before);
    h.unchanged();
  }
});

test('Rendering loss and hidden document pause navigation while Exit remains available', () => {
  const h = harness(); h.ready(); h.click('Start guided dissection');
  h.scene().onRendererHealth('lost'); h.render();
  assert.equal(h.button('Next').disabled, true);
  h.click('Exit guided dissection');
  h.ready(); h.click('Start guided dissection');
  h.document.hidden = true;
  h.listeners.get('visibilitychange')?.(); h.render();
  assert.equal(h.scene().transitionPaused, true);
  h.click('Exit guided dissection');
  h.document.hidden = false; h.listeners.get('visibilitychange')?.(); h.render();
  h.ready(); h.click('Start guided dissection');
  const requiredBundle = h.props.specimen.catalog.structures
    .find(surface => !h.scene().hiddenIds.includes(surface.id)).bundle;
  h.scene().onFailure(requiredBundle); h.render();
  assert.equal(h.button('Next').disabled, true);
  h.click('Exit guided dissection');
  h.unchanged();
});

test('Reduced motion removes camera tween; ordinary specimens have no guide', () => {
  const h = harness({ reducedMotion: true }); h.ready(); h.click('Start guided dissection');
  assert.equal(h.scene().transitionMs, 0);
  h.click('Next'); assert.equal(h.scene().transitionMs, 0);
  for (const definition of [h.api.kneeDefinition, h.api.hraRenalDefinition]) {
    const ordinary = harness({ definition, supplement: null });
    assert.equal(nodes(ordinary.tree()).some(node => /guided dissection/i.test(text(node)) && node.props?.onClick), false);
    assert.equal(ordinary.scene().transitionMs ?? 0, 0);
    ordinary.unchanged();
  }
  const exam = harness(); exam.ready(); exam.click('Practise identification');
  assert.equal(nodes(exam.tree()).filter(node => node.type?.name === 'SpecimenIdentification').length, 1);
  assert.equal(nodes(exam.tree()).filter(node => text(node) === 'Start guided dissection').length, 0);
  h.unchanged();
});
