/* oxlint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps -- controlled root component hook harness */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url), React = require('react');
const raw = JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const fmas = ['FMA3802', 'FMA3855', 'FMA3862', 'FMA3895', 'FMA7088'];
const same = (actual, expected, label) => assert.deepEqual(
  JSON.parse(JSON.stringify(actual)), JSON.parse(JSON.stringify(expected)), label);
const built = await build({
  stdin: {
    contents: "export { default as BodyExplorer } from './app/body-explorer'; export { DissectionControls } from './app/dissection-controls'; export { DissectionGuide } from './app/dissection-controls'; export { dissectionProfiles, initialDissection, dissectionReducer, resolveDissection } from './app/dissection-data'; export { dissectionScopeAction } from './lib/dissection-scope'; export { coronaryArterialStudyId } from './lib/coronary-arterial-study'; export { bodyDisplayCatalog } from './lib/body-display-catalog';",
    resolveDir: process.cwd(), loader: 'tsx',
  },
  bundle: true, platform: 'node', format: 'cjs', write: false,
});
let slots = [], cursor = 0, refs = [], refCursor = 0;
// The sixth root useState is the catalog loaded by the normal fetch effect.
// Supply the same display catalog and keep effects inactive in this CPU harness.
const shim = {
  ...React,
  useState(initial) {
    const i = cursor++;
    if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
    return [slots[i], update => { slots[i] = typeof update === 'function' ? update(slots[i]) : update; }];
  },
  useReducer(reducer, initial, init) {
    const i = cursor++;
    if (!(i in slots)) slots[i] = init ? init(initial) : initial;
    return [slots[i], action => { slots[i] = reducer(slots[i], action); }];
  },
  useRef(initial) {
    const i = refCursor++;
    return refs[i] ?? (refs[i] = { current: initial });
  },
  useMemo: fn => fn(), useCallback: fn => fn,
  useEffect: () => {}, useLayoutEffect: () => {}, useId: () => 'coronary-study-test',
};
const scope = { exports: {} };
runInNewContext(built.outputFiles[0].text, {
  module: scope, exports: scope.exports,
  require: id => id === 'react' ? shim
    : id === 'next/dynamic' ? () => function DynamicScene() { return null; }
      : id === 'next/link' || id === 'next/image' ? () => null : require(id),
  structuredClone, requestAnimationFrame: fn => fn(), URL, URLSearchParams,
  TextEncoder, TextDecoder, console,
});
const api = scope.exports;
const catalog = api.bodyDisplayCatalog(raw);
const identities = fmas.map(fma => {
  const matches = catalog.structures.filter(item => item.fmaId === fma);
  assert.equal(matches.length, 1, fma);
  return matches[0];
});
const [right, left, lad, circumflex, heart] = identities;
const nodes = value => !value || typeof value !== 'object' ? []
  : Array.isArray(value) ? value.flatMap(nodes) : [value, ...nodes(value.props?.children)];
const label = value => typeof value === 'string' ? value
  : !value ? '' : Array.isArray(value) ? value.map(label).join('') : label(value.props?.children);
let tree;
function render(region) {
  cursor = 0; refCursor = 0;
  tree = api.BodyExplorer({ initialRegion: region });
  return tree;
}
function component(type) {
  const match = nodes(tree).find(node => node.type === type);
  assert(match, `rendered ${type?.name}`);
  return match.props;
}
function scene() {
  const match = nodes(tree).find(node => node.props?.onRendererHealth && node.props?.structures);
  assert(match, 'root scene rendered');
  return match.props;
}
function button(name) {
  const match = nodes(tree).find(node => node.props?.onClick && label(node) === name);
  assert(match, `rendered button ${name}`);
  return match.props;
}
function slider() {
  const match = nodes(tree).find(node => node.props?.['aria-label'] === 'Exploded separation');
  assert(match, 'separation slider rendered');
  return match.props;
}
function expectedSceneContext() {
  const shown = scene();
  same(shown.contextIds, [heart.id], 'heart is scene context');
  assert.equal(shown.appearance[heart.id].opacity, 0.2, 'heart is muted');
  assert(!shown.hiddenIds.includes(heart.id), 'heart appears while assembled');
  assert(shown.structures.some(item => item.id === heart.id));
  for (const item of [right, left, lad, circumflex])
    assert(shown.structures.some(candidate => candidate.id === item.id), `${item.fmaId} is in scene`);
}
function focusStudy(region) {
  render(region);
  tree.props.session.chooseMode('dissect'); render(region);
  scene().onRendererHealth('ready'); render(region);
  assert(component(api.DissectionControls).onFocus(api.coronaryArterialStudyId));
  render(region);
  for (const id of new Set(identities.map(item => item.bundle))) scene().onLoaded(id);
  render(region);
  assert.equal(component(api.DissectionControls).state.focusId, api.coronaryArterialStudyId);
  expectedSceneContext();
}
for (const region of ['thorax', 'whole-body']) {
  slots = []; refs = []; slots[5] = catalog;
  focusStudy(region);
  const base = scene();
  base.onSelect(heart.id); render(region);
  assert.notEqual(scene().selectedId, heart.id, 'scene context cannot be selected');
  scene().onSelect(right.id); render(region);
  assert.equal(scene().selectedId, right.id, 'coronary target remains selectable');
  const beforeRemoval = component(api.DissectionControls).state;
  button('Remove').onClick({ currentTarget: {} }); render(region);
  assert(scene().hiddenIds.includes(right.id), 'actual Remove callback hides selected target');
  assert.equal(component(api.DissectionControls).state.history.length, beforeRemoval.history.length + 1);
  component(api.DissectionControls).onUndo(); render(region);
  assert(!scene().hiddenIds.includes(right.id), 'Undo restores target');
  component(api.DissectionControls).onRedo(); render(region);
  assert(scene().hiddenIds.includes(right.id), 'Redo removes target');
  component(api.DissectionGuide).onRestore(right.id); render(region);
  assert(!scene().hiddenIds.includes(right.id), 'Restore returns target');
  slider().onValueChange([35]); render(region);
  same(scene().contextIds, [], 'separation removes context identity');
  assert(!scene().structures.some(item => item.id === heart.id), 'separation omits the heart mesh');
  slider().onValueChange([0]); render(region);
  expectedSceneContext();
  // Hiding the organ system must never force it on for a muted canvas context.
  const organSwitch = nodes(tree).find(node => node.props?.['aria-label'] === 'Show Organs');
  assert(organSwitch, 'organ visibility switch');
  organSwitch.props.onCheckedChange(false); render(region);
  same(scene().contextIds, [], 'organ system off suppresses heart context');
  assert.equal(scene().systems.organs, false, 'context does not turn on the organ system');
}

// Run the real reducer/scope gate independently of the component's hook state.
for (const region of ['thorax', 'whole-body']) {
  const profile = api.dissectionProfiles[region];
  const focus = profile.focuses.filter(item => item.id === api.coronaryArterialStudyId);
  assert.equal(focus.length, 1, `${region} has one focus recipe`);
  const recipe = focus[0];
  same(recipe.rule.fmaIds, fmas.slice(0, 4));
  same(recipe.context?.[0]?.fmaIds, ['FMA7088']);
  assert.equal(recipe.includeSkeleton, false);
  assert.equal(recipe.requiredSources.length, 5, 'all five records have source holds');
  const regional = catalog.structures.filter(item => region === 'whole-body' || item.regions.includes(region));
  const initial = api.dissectionReducer(api.initialDissection, { type: 'focus', id: recipe.id });
  same(api.resolveDissection(regional, profile, initial).visible.map(item => item.fmaId).sort(), [...fmas].sort());
  for (const side of ['left', 'right']) {
    const action = api.dissectionScopeAction(catalog, profile, region, side);
    assert(!action.availableFocusIds.includes(recipe.id), `${side} side cannot retain incomplete focus`);
    assert.equal(api.dissectionReducer(initial, action).focusId, null);
  }
}
console.log(JSON.stringify({ passed: true, actualRootCallbacks: true, regions: 2,
  focusTargets: 4, context: 1, clinicalApproval: false, browserTesting: false }));
