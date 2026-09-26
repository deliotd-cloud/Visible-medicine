/* oxlint-disable react-hooks/rules-of-hooks -- controlled hooks exercise the real component */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { execFileSync } from 'node:child_process';
import { build } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url), React = require('react');
let slots = [], cursor = 0, effects = [];
const shim = { ...React,
  useState(initial) { const i = cursor++;if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
  useRef(initial) { const i = cursor++;return slots[i] ??= { current: initial }; },
  useId: () => 'study-name', useEffect: fn => { effects.push(fn); },
};
const baseline = process.argv.find(a => a.startsWith('--baseline='))?.split('=')[1];
const plugins = baseline ? [{ name: 'old-study-view-component', setup(b) {
  b.onLoad({ filter: /[\\/]app[\\/]study-views\.tsx$/, namespace: 'component-test' }, () => ({
    contents: execFileSync('git', ['show', baseline + ':app/study-views.tsx'], { encoding: 'utf8' }), loader: 'tsx', resolveDir: process.cwd() + '/app',
  }));
} }] : [];
const built = await build({ stdin: { contents: "export {StudyViews} from './app/study-views';export * from './lib/study-views';", resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, platform: 'node', format: 'cjs', write: false, loader: { '.css': 'empty' }, plugins });
let stored = null, failWrites = false;
const storage = { getItem: () => stored, setItem: (_key, value) => { if (failWrites) throw Error('Quota exceeded');stored = value; } };
const compiled = { exports: {} };
runInNewContext(built.outputFiles[0].text, { module: compiled, exports: compiled.exports,
  require: id => id === 'react' ? shim : id === 'next/link' ? () => null : require(id),
  window: { localStorage: storage, addEventListener() {}, removeEventListener() {} }, navigator: {},
  crypto: { randomUUID: () => 'new-bookmark' },
});
const { StudyViews, encodeStudyBookmarks, decodeStudyBookmarks } = compiled.exports;
const state = { kind: 'body', region: 'head-neck', revision: 'test-revision', selectedId: null, view: 'anterior', side: 'both', layer: 'cuff',
  systems: Object.fromEntries(['skeleton', 'muscles', 'organs', 'nerves', 'vessels', 'connective'].map(s => [s, true])), hiddenIds: [], explode: 0, zoom: 1, isolated: false, focus: false, labels: true, ghostRemoved: false, illustrated: true, anchorSkeleton: false, showOrigins: false, plate: false,
  inspection: { plane: 'off', position: 50, flipped: false, keepSelectedSolid: false, opacity: {} },
  camera: { direction: [0, 0, 1], up: [0, 1, 0], pan: [0, 0, 0], scale: 1 },
};
const props = { scope: { kind: 'body', region: 'head-neck', revision: 'test-revision', structureIds: [] }, capture: () => state, restore() { throw Error('Dialog action must not restore anatomy'); } };
const nodes = element => !element || typeof element !== 'object' ? [] : Array.isArray(element) ? element.flatMap(nodes) : [element, ...nodes(element.props?.children)];
const find = (tree, predicate) => { const list = nodes(tree).filter(predicate);assert.equal(list.length, 1);return list[0]; };
const text = element => !element ? '' : typeof element === 'string' ? element : Array.isArray(element) ? element.map(text).join('') : text(element.props?.children);
const button = (tree, label) => find(tree, n => n.props?.onClick && text(n) === label);
const dialogs = tree => nodes(tree).filter(n => n.props?.className === 'vm-study-dialog');
function render() { cursor = 0;effects = [];return StudyViews(props); }
let checks = 0;
function setup(count) {
  slots = [];failWrites = false;
  stored = encodeStudyBookmarks(Array.from({ length: count }, (_, i) => ({ id: 'bookmark-' + i, name: 'View ' + i, savedAt: '2026-09-26T00:00:00.000Z', state })));
  render();for (const fn of effects) fn();const tree = render();
  const doc = { body: {}, activeElement: null }, child = {}, summary = { isConnected: true, ownerDocument: doc, getClientRects: () => [1] };
  const popup = { contains: value => value === child };
  const opener = { isConnected: true, disabled: false, getClientRects: () => [1] };
  assert(find(tree, n => n.type === 'summary' && text(n).startsWith('Saved study views')).props.ref, 'Stable keyboard return target is required');
  find(tree, n => n.type === 'summary' && text(n).startsWith('Saved study views')).props.ref.current = summary;
  return { doc, child, popup, opener, summary, tree };
}
for (const action of ['cancel', 'delete', 'failure', 'external-removal']) {
  const e = setup(1);
  find(e.tree, n => n.props?.['aria-label'] === 'Remove saved view View 0').props.onClick({ currentTarget: e.opener });
  let tree = render(), dialog = dialogs(tree)[1];dialog.props.ref.current = e.popup;e.doc.activeElement = e.child;
  if (action === 'cancel') button(dialog, 'Cancel').props.onClick();
  else if (action === 'external-removal') { stored = encodeStudyBookmarks([]);e.opener.isConnected = false;button(dialog, 'Cancel').props.onClick(); }
  else { failWrites = action === 'failure';await button(dialog, 'Remove view').props.onClick();if (!failWrites) e.opener.isConnected = false; }
  tree = render();dialog = dialogs(tree)[1];
  assert.equal(dialog.props.finalFocus(), action === 'delete' || action === 'external-removal' ? e.summary : e.opener);
  assert.equal(decodeStudyBookmarks(stored).length, action === 'delete' || action === 'external-removal' ? 0 : 1);checks++;
}
for (const count of [0, 19]) {
  const e = setup(count);button(e.tree, 'Save current view').props.onClick({ currentTarget: e.opener });
  let tree = render(), dialog = dialogs(tree)[0];dialog.props.ref.current = e.popup;e.doc.activeElement = e.child;
  find(dialog, n => n.props?.id === 'study-name').props.onChange({ target: { value: 'New view' } });
  tree = render();dialog = dialogs(tree)[0];find(dialog, n => n.type === 'form').props.onSubmit({ preventDefault() {} });
  await Promise.resolve();await Promise.resolve();
  tree = render();e.opener.disabled = button(tree, 'Save current view').props.disabled;
  assert.equal(decodeStudyBookmarks(stored).length, count + 1);
  assert.equal(dialogs(tree)[0].props.finalFocus(), count === 19 ? e.summary : e.opener);checks++;
}
const e = setup(1);button(e.tree, 'Save current view').props.onClick({ currentTarget: e.opener });
const dialog = dialogs(render())[0];dialog.props.ref.current = e.popup;
const secondOpener = { ...e.opener }, secondChild = {};
find(render(), n => n.props?.['aria-label'] === 'Remove saved view View 0').props.onClick({ currentTarget: secondOpener });
dialogs(render())[1].props.ref.current = { contains: value => value === secondChild };
e.doc.activeElement = secondChild;
assert.equal(dialog.props.finalFocus(), false, 'Closing one dialog must not steal focus from the other');checks++;
for (const mode of ['body', 'inside', 'outside', 'hidden', 'unmounted']) {
  e.opener.isConnected = false;e.summary.isConnected = mode !== 'unmounted';e.summary.getClientRects = () => mode === 'hidden' ? [] : [1];
  e.doc.activeElement = mode === 'outside' ? {} : mode === 'inside' ? e.child : e.doc.body;
  assert.equal(dialog.props.finalFocus(), ['outside', 'hidden', 'unmounted'].includes(mode) ? false : e.summary);checks++;
}
console.log(JSON.stringify({ scenarios: checks, actualComponent: true, storageFailuresPreserved: true, browserTesting: false }));
