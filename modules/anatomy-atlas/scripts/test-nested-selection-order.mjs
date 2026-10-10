// Component order and selection state; browser viewport acceptance is separate.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url);
const React = require('react');
const actualLink = await import('vinext/shims/link');
const built = await build({
  stdin: {
    contents: `export { VentricularView } from './app/ventricles';
      export { cerebralCatalog } from './lib/cerebral';
      export { ventricleCatalog } from './lib/ventricles';`,
    resolveDir: process.cwd(), loader: 'tsx',
  },
  bundle: true, platform: 'node', format: 'cjs', write: false,
  plugins: [{ name: 'controlled-scene', setup(api) {
    api.onLoad({ filter: /body-scene\.tsx$/ }, () => ({
      contents: 'export const BodyScene=()=>null;export const retryBodyAssets=()=>{};', loader: 'tsx',
    }));
    api.onLoad({ filter: /nested-teaching\.tsx$/ }, () => ({
      contents: 'export const NestedTeaching=()=>null;', loader: 'tsx',
    }));
    api.onLoad({ filter: /nested-education-link\.ts$/ }, () => ({
      contents: 'export const useNestedEducationLink=()=>({adapter:null,publish:()=>{}});', loader: 'ts',
    }));
  } }],
});

let slots = [], cursor = 0, checks = 0;
const state = value => {
  const index = cursor++;
  if (!(index in slots)) slots[index] = typeof value === 'function' ? value() : value;
  return [slots[index], next => slots[index] = typeof next === 'function' ? next(slots[index]) : next];
};
const shim = {
  ...React, useContext: () => null, useState: state,
  useReducer: (reduce, arg, init) => {
    const [value, set] = state(() => init ? init(arg) : arg);
    return [value, action => set(old => reduce(old, action))];
  },
  useRef: value => state(() => ({ current: value }))[0],
  useMemo: fn => fn(), useCallback: fn => fn,
  useEffect: () => {}, useLayoutEffect: () => {},
};
const scope = { exports: {} };
runInNewContext(built.outputFiles[0].text, {
  module: scope, exports: scope.exports,
  require: id => id === 'react' ? shim : id === 'next/link' ? { __esModule: true, ...actualLink } : require(id),
  structuredClone,
});
const { VentricularView, cerebralCatalog, ventricleCatalog } = scope.exports;
const children = node => React.Children.toArray(node?.props?.children);
const nodes = node => !node || typeof node !== 'object' ? [] :
  Array.isArray(node) ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)];
const text = node => typeof node === 'string' || typeof node === 'number' ? String(node) :
  !node ? '' : Array.isArray(node) ? node.map(text).join('') : text(node.props?.children);
const check = (condition, message) => { checks++; assert(condition, message); };

for (const [study, catalog, focus] of [
  ['cerebral', cerebralCatalog, cerebralCatalog.structures.find(s => /right insula/i.test(s.name))],
  ['ventricles', ventricleCatalog, ventricleCatalog.structures.find(s => /third ventricle/i.test(s.name))],
]) {
  check(!!focus, `${study}: exact selection fixture exists`);
  slots = [];
  let tree;
  const render = () => { cursor = 0; tree = VentricularView({
    parent: catalog.parent, study, initialSelectedId: focus.id,
  }); };
  const scene = () => nodes(tree).find(n => n.props?.onRendererHealth)?.props;
  const card = () => nodes(tree).filter(n => n.props?.className === 'eye-layer-teaching');
  const aside = () => nodes(tree).find(n => n.type === 'aside' && n.props?.className === 'eye-layer-controls');
  const direct = () => children(children(aside()).find(n => n.type === 'fieldset'));
  const cardIndex = () => direct().findIndex(n => n.props?.className === 'eye-layer-teaching');
  const listIndex = () => direct().findIndex(n => study === 'cerebral'
    ? n.props?.layers && n.props?.onVisibility
    : n.type === 'ul' && n.props?.className === 'eye-layer-list');
  const presetIndex = () => direct().findIndex(n => n.props?.className === 'eye-layer-presets');
  const button = label => nodes(tree).find(n => n.props?.onClick && text(n).trim() === label)?.props;
  render();
  check(scene().selectedId === focus.id, `${study}: initial selection is exact source structure`);
  check(card().length === 1, `${study}: selected card appears once`);
  check(text(card()[0]).includes(focus.name), `${study}: card identifies selected anatomy`);
  check(presetIndex() >= 0 && presetIndex() < cardIndex() && cardIndex() < listIndex(),
    `${study}: study preset precedes card, which precedes structure checklist`);
  check(!!button('Fade others') && !!button('Frame selected'), `${study}: selected actions retained`);
  check(nodes(card()[0]).filter(n => n.type?.name === 'NestedTeaching').length === 1,
    `${study}: learning content occurs once inside selected card`);

  if (study === 'cerebral') {
    const list = direct()[listIndex()];
    list.props.onVisibility(focus.id, false);
  } else {
    const toggle = nodes(tree).find(n => n.props?.['aria-label'] === `Show ${focus.name.toLowerCase()}`);
    check(!!toggle, 'Ventricular selected visibility toggle exists');
    toggle.props.onCheckedChange(false);
  }
  render();
  check(scene().selectedId === null && card().length === 0,
    `${study}: clearing selection removes card entirely`);
  scene().onSelect(focus.id); render();
  check(card().length === 1 && text(card()[0]).includes(focus.name),
    `${study}: choosing structure restores the one correct card`);

  scene().onRendererHealth('ready');
  const bundleId = scene().catalog.bundles.find(b => scene().catalog.structures.some(s => s.id === focus.id && s.bundle === b.id)).id;
  scene().onFailure(bundleId, 'sign-in'); render();
  check(text(tree).includes('Some model files require sign-in.') && !!button('Check access again'), `${study}: verified sign-in failure explains recovery`);
  check(scene().selectedId === focus.id, `${study}: failure preserves selection`);
  button('Check access again').onClick(); render();
  check(!text(tree).includes('Some model files require sign-in.'), `${study}: explicit retry clears old access notice`);
  scene().onFailure(bundleId, 'access-denied'); render();
  check(text(tree).includes('The website refused access'), `${study}: forbidden is distinct from sign-in`);
  scene().onFailure(bundleId); render();
  check(!text(tree).includes('The website refused access') && !!button('Retry'), `${study}: a later generic failure does not retain stale access reason`);
  scene().onFailure('not-requested', 'sign-in'); render();
  check(!text(tree).includes('Some model files require sign-in.'), `${study}: unrelated bundle cannot produce access notice`);
  for (const bundle of scene().catalog.bundles) scene().onLoaded(bundle.id);
  render();
  check(!button('Retry') && !button('Check access again'), `${study}: successful loads clear notice`);
  const start = nodes(tree).find(n => n.props?.onClick && text(n).startsWith('Start practice ('))?.props;
  check(start && !start.disabled, `${study}: practice can start from ready view`);
  start.onClick(); render();
  check(tree.type?.name === 'NestedPractice', `${study}: active practice replaces workbench`);
  check(card().length === 0 && !text(tree).includes(focus.name),
    `${study}: active practice does not leak selected answer card`);
}
console.log(JSON.stringify({ passed: true, checks, studies: ['cerebral', 'ventricles'], browserAcceptance: false }));
