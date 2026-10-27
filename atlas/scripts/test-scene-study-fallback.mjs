// Exercise the production recovery notice and written-study controls with
// controlled hooks/DOM. Browser layout and GPU recovery are checked separately.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url);
const React = require('react');
const built = await build({
  stdin: {
    contents: "export {SceneRecoveryNotice} from './app/scene-recovery'; export {SceneStudyFallback} from './app/scene-study-fallback';",
    resolveDir: process.cwd(), loader: 'tsx',
  },
  bundle: true, write: false, platform: 'node', format: 'cjs',
  plugins: [{ name: 'controlled-workspace-context', setup(api) {
    api.onResolve({ filter: /^\.\/atlas-workspace$/ }, args =>
      args.importer.endsWith('scene-study-fallback.tsx')
        ? { path: 'workspace-context', namespace: 'study-test' } : undefined);
    api.onLoad({ filter: /.*/, namespace: 'study-test' }, () => ({
      contents: 'export const useAtlasWorkspace = () => globalThis.__studyWorkspace;',
      loader: 'js',
    }));
  } }],
});

let slots = [], cursor = 0, effects = [];
const shim = {
  ...React,
  useState(initial) {
    const i = cursor++;
    if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
    return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }];
  },
  useRef(initial) {
    const i = cursor++;
    if (!(i in slots)) slots[i] = { current: initial };
    return slots[i];
  },
  useLayoutEffect(effect) { effects.push(effect); },
};
const scope = { exports: {} };
const globals = {
  module: scope, exports: scope.exports,
  require: id => id === 'react' ? shim : require(id),
  MutationObserver: class { observe() {} disconnect() {} },
};
runInNewContext(built.outputFiles[0].text, globals);
const { SceneRecoveryNotice, SceneStudyFallback } = scope.exports;
const nodes = node => !node || typeof node !== 'object' ? []
  : Array.isArray(node) ? node.flatMap(nodes)
    : [node, ...nodes(node.props?.children)];
const label = node => typeof node === 'string' ? node
  : !node ? '' : Array.isArray(node) ? node.map(label).join('') : label(node.props?.children);
const button = (tree, caption) => nodes(tree).find(node =>
  node.props?.onClick && label(node) === caption);

const fallback = React.createElement('div', { 'data-study-fixture': true }, 'source study');
for (const health of ['starting', 'ready', 'restoring', 'lost', 'failed']) {
  const tree = SceneRecoveryNotice({ health, onRetry() {}, studyFallback: fallback });
  const appears = nodes(tree).includes(fallback);
  assert.equal(appears, health === 'lost' || health === 'failed', `${health}: written study visibility`);
  assert.equal(!!tree, health !== 'ready', `${health}: notice visibility`);
  if (tree) assert.match(label(tree), /3D identification practice waits/);
}

const document = { hidden: false, body: {}, activeElement: null };
const focused = [];
const element = (name, connected = true) => ({
  name, isConnected: connected, ownerDocument: document, dataset: {},
  textContent: name, tabIndex: 0,
  focus(options) { assert.equal(options.preventScroll, true); focused.push(name); document.activeElement = this; },
});
const heading = element('Acromion');
heading.dataset.studySelectionId = 'shoulder-acromion';
const question = element('written question');
const checkOwner = element('check owner');
checkOwner.dataset.studyCheckId = 'shoulder-acromion';
checkOwner.querySelector = selector => selector === '.structure-quick-check' ? question : null;
const root = element('panel');
root.closest = () => null;
root.querySelectorAll = selector => selector === '[data-structure-study-heading]'
  ? [heading] : selector === '[data-study-check-id]' ? [checkOwner] : [];
const anchor = element('anchor');
anchor.closest = selector => selector === '.body-info' ? root : null;
const infoAnchor = { current: anchor };
const requestRef = { current: null };
const calls = [];
let workspace = {
  mode: 'practice', exam: false, panels: { info: false },
  chooseMode(mode) { calls.push(`mode:${mode}`); this.mode = mode; },
  showInfo() { calls.push('showInfo'); this.panels.info = true; },
};
globals.__studyWorkspace = workspace;
const props = {
  search: React.createElement('select', { 'aria-label': 'Find structure' }),
  selectedName: 'Acromion', selectionKey: 'shoulder-acromion', scopeKey: 'source/v1/shoulder',
  infoAnchor, requestRef, checkKind: 'shoulder',
};
function render(next = props, runEffects = true) {
  cursor = 0; effects = [];
  const tree = SceneStudyFallback(next);
  if (runEffects) for (const effect of effects) effect();
  return tree;
}
function click(tree, caption) {
  const target = button(tree, caption);
  assert(target, `missing action: ${caption}`);
  const origin = element(`origin:${caption}`);
  document.activeElement = origin;
  target.props.onClick({ currentTarget: origin });
  return origin;
}
let tree = render();
assert(nodes(tree).includes(props.search), 'source search stays in the action area');
click(tree, 'Notes: Acromion');
assert.deepEqual(calls, ['mode:explore', 'showInfo']);
assert.equal(requestRef.current.kind, 'notes');
render();
assert.deepEqual(focused, ['Acromion'], 'notes focus the scoped selected heading');
assert.equal(requestRef.current, null);

calls.length = 0; focused.length = 0;
workspace.mode = 'explore'; workspace.panels.info = false;
tree = render();
click(tree, 'Written structure check');
assert.deepEqual(calls, ['mode:practice', 'showInfo']);
assert.equal(requestRef.current.kind, 'check');
render();
assert.deepEqual(focused, ['written question'], 'check focuses its scoped question');
assert.equal(requestRef.current, null);

calls.length = 0; focused.length = 0;
workspace.mode = 'explore'; workspace.panels.info = false;
tree = render({ ...props, selectedName: null, selectionKey: null });
for (const caption of ['Select a structure for notes', 'Written structure check']) {
  assert.equal(button(tree, caption).props.disabled, true);
  click(tree, caption); // Guard still protects programmatic invocation.
}
assert.deepEqual(calls, []);
assert.equal(requestRef.current, null);

workspace.exam = true;
assert.equal(render(), null, 'exam suppresses written-study controls');
workspace.exam = false;
workspace.panels.info = false;
tree = render();
click(tree, 'Notes: Acromion');
workspace.exam = true;
render();
assert.equal(requestRef.current, null, 'exam clears a pending focus request');
workspace.exam = false;

for (const changed of [
  { selectionKey: 'other-structure' },
  { scopeKey: 'source/v2/shoulder' },
]) {
  slots = []; focused.length = 0;
  workspace.mode = 'explore'; workspace.panels.info = false;
  tree = render();
  click(tree, 'Notes: Acromion');
  // Selection/scope changed before the information panel could settle.
  render({ ...props, ...changed });
  assert.equal(requestRef.current, null, 'stale request is dropped');
  assert.deepEqual(focused, [], 'stale request cannot focus another source');
  render(props);
  assert.deepEqual(focused, [], 'returning to the original source cannot revive a cancelled request');
}

slots = []; focused.length = 0;
workspace.mode = 'explore'; workspace.panels.info = false;
tree = render();
click(tree, 'Notes: Acromion');
document.activeElement = element('another user control');
render();
assert.deepEqual(focused, [], 'an unrelated control keeps focus');
assert.equal(requestRef.current, null);

console.log(JSON.stringify({ passed: true, healthStates: 5, actualComponents: true,
  actionModes: true, examGuard: true, scopedFocus: true, browserAcceptance: false }));
