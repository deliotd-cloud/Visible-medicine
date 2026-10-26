import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {test} from 'node:test';

const proposal = resolve(import.meta.dirname, '..');
const baseline = process.env.VM_WEBSITE_ROOT || proposal;
const require = createRequire(resolve(baseline, 'package.json'));
const {build} = require('esbuild');
const built = await build({
  entryPoints: [resolve(proposal, 'components/AtlasRuntimeFrame.tsx')], bundle: true,
  write: false, format: 'cjs', platform: 'node', jsx: 'automatic',
  loader: {'.css': 'empty'}, plugins: [{name: 'frame-harness', setup(api) {
    api.onResolve({filter: /^react(?:\/jsx-runtime)?$/}, args => ({path: args.path, namespace: 'react-stub'}));
    api.onLoad({filter: /.*/, namespace: 'react-stub'}, args => ({loader: 'js', contents: args.path === 'react'
      ? `export const useEffect=()=>{};export const useRef=()=>({current:null});export const useState=(initial)=>[initial==='opening'?'document':initial,()=>{}];`
      : `export const jsx=(type,props)=>({type,props});export const jsxs=jsx;`}));
    api.onResolve({filter: /^\.\/(atlas-runtime-state|atlas-runtime-expansion)$/}, args =>
      ({path: resolve(baseline, 'components', args.path.slice(2)) + '.ts'}));
    api.onResolve({filter: /^\.\/AtlasBodyLearning$/}, () => ({path: 'learning', namespace: 'learning-stub'}));
    api.onLoad({filter: /.*/, namespace: 'learning-stub'}, () => ({loader: 'js', contents: 'export const AtlasBodyLearning=()=>null;'}));
  }}],
});
const module = {exports: {}};
new Function('module', 'exports', built.outputFiles[0].text)(module, module.exports);

function treeFor(src) {
  const Outer = module.exports.AtlasRuntimeFrame;
  const source = Outer({src, title: 'Atlas'});
  const attempt = source.type(source.props);
  return attempt.type(attempt.props);
}
function collect(node, type, found = []) {
  if (!node || typeof node !== 'object') return found;
  if (node.type === type) found.push(node);
  for (const child of [node.props?.children].flat(Infinity)) collect(child, type, found);
  return found;
}
function textOf(node) {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(textOf).join(' ');
  return node?.props ? textOf(node.props.children) : '';
}
function helpFor(src) { return collect(treeFor(src), 'details').find(node => node.props.className === 'atlas-runtime-help'); }

test('guide appears only for the exact relative head and neck runtime path with regional queries', () => {
  for (const src of ['/atlas-runtime/head-neck/index.html', '/atlas-runtime/head-neck/index.html?region=thorax',
    '/atlas-runtime/head-neck/index.html?region=craniofacial&study=x%2Fy']) {
    assert.match(textOf(helpFor(src)), /Keyboard controls/);
  }
  for (const src of ['https://elsewhere.example/atlas-runtime/head-neck/index.html',
    '//elsewhere.example/atlas-runtime/head-neck/index.html', '/atlas-runtime/head-neck/index.html/',
    '/atlas-runtime/head-neck/index.html.bak', '/atlas-runtime/head-neck/%69ndex.html',
    '/atlas-runtime/head-neck/index.html#guide', '/atlas-runtime/shoulder/index.html',
    '/atlas-runtime/head-neck/index.html?region=x#fragment',
    '/atlas-runtime/head-neck/index.html?region=thorax\nother']) {
    assert.doesNotMatch(textOf(helpFor(src)), /Keyboard controls/, src);
  }
});

test('guide matches native focus scoped controls, while recovery and readiness text remain honest', () => {
  const text = textOf(helpFor('/atlas-runtime/head-neck/index.html?region=thorax'));
  for (const phrase of ['Tab to the model canvas first', 'arrow keys rotate', 'pan a planar tray',
    'hold Shift', '+ or = zooms in', '− zooms out', 'Ctrl/Cmd+Z undoes',
    'Ctrl/Cmd+Shift+Z or Ctrl+Y redoes', 'editors or dialogs', 'Controls can be unavailable while loading or locked']) {
    assert.ok(text.includes(phrase), phrase);
  }
  assert.match(text, /Blank, incomplete or showing an error\?/);
  assert.match(text, /Retrying resets the viewer's current view/);
  assert.match(text, /Open this source full screen/);
  const status = textOf(collect(treeFor('/atlas-runtime/head-neck/index.html'), 'div')
    .find(node => node.props.className?.includes?.('atlas-runtime-status')));
  assert.match(status, /Atlas loading and 3D model display are not confirmed/);
});

test('the described keys and guards are present in the native runtime bindings', () => {
  const native = process.env.VM_NATIVE_ROOT || 'F:/VisibleMedicine/staging/20261025-regional-title-native/atlas';
  const fitted = readFileSync(resolve(native, 'app/fitted-camera.tsx'), 'utf8');
  const camera = readFileSync(resolve(native, 'lib/camera-keyboard.ts'), 'utf8');
  const dissect = readFileSync(resolve(native, 'lib/dissection-shortcuts.ts'), 'utf8');
  assert.match(fitted, /bindCameraPanKeyboard\([\s\S]*?, true\)/);
  assert.match(fitted, /bindCameraKeyboard\(gl\.domElement/);
  assert.match(camera, /event\.target !== surface \|\| surface\.ownerDocument\.activeElement !== surface/);
  assert.match(camera, /Hold Shift for fine pan/);
  assert.match(camera, /Hold Shift for fine rotation/);
  assert.match(camera, /key === '\+' \|\| key === '='/);
  assert.match(camera, /key !== '-' && key !== '_'/);
  assert.match(dissect, /key === 'z' \? \(event\.shiftKey \? 'redo' : 'undo'\)/);
  assert.match(dissect, /key === 'y' && event\.ctrlKey && !event\.shiftKey/);
  assert.match(dissect, /state\.enabled/);
  assert.match(dissect, /input, textarea, select, \[role="textbox"\]/);
  assert.match(dissect, /\[role="dialog"\]/);
});

test('Escape closes and returns focus; blur closes only outside the disclosure', () => {
  const detail = helpFor('/atlas-runtime/head-neck/index.html');
  let focused = 0, stopped = 0, prevented = 0;
  const summary = {focus() {focused++;}};
  const inside = {};
  const element = {open: true, querySelector: selector => selector === 'summary' ? summary : null,
    contains: node => node === inside};
  detail.props.ref.current = element;
  detail.props.onBlur({currentTarget: element, relatedTarget: inside});
  assert.equal(element.open, true);
  detail.props.onKeyDown({key: 'Escape', preventDefault() {prevented++;}, stopPropagation() {stopped++;}});
  assert.equal(element.open, false);
  assert.equal(focused, 1);
  assert.equal(prevented, 1);
  assert.equal(stopped, 1);
  element.open = true;
  detail.props.onBlur({currentTarget: element, relatedTarget: {}});
  assert.equal(element.open, false);
  element.open = true;
  detail.props.onBlur({currentTarget: element, relatedTarget: null});
  assert.equal(element.open, false);
});

test('open guide wraps within the viewer and keeps recovery actions accessible', () => {
  const css = readFileSync(resolve(proposal, 'components/atlas-runtime-frame.css'), 'utf8');
  assert.match(css, /container-type: inline-size/);
  assert.match(css, /\.atlas-runtime-keyboard-guide \{ overflow-wrap: anywhere; \}/);
  assert.match(css, /\.atlas-runtime-host-tools > \.atlas-runtime-help\[open\][\s\S]*?width: min\(440px, calc\(100cqw - 24px\)\)/);
  assert.match(css, /\.atlas-runtime-help\[open\][\s\S]*?overflow: auto/);
  const help = helpFor('/atlas-runtime/head-neck/index.html');
  assert.equal(collect(help, 'button').length, 1);
  assert.equal(collect(help, 'a').length, 1);
});

test('runtime-specific layout is opted in only for the known bundled source',()=>{
 assert.equal(treeFor('/atlas-runtime/head-neck/index.html?region=thorax').props['data-keyboard-guide'],'');
 assert.equal(treeFor('/atlas-runtime/shoulder/index.html').props['data-keyboard-guide'],undefined);
 const css=readFileSync(resolve(proposal,'components/atlas-runtime-frame.css'),'utf8');
 const appended=css.slice(css.indexOf('/* The known runtime'));
 assert.match(appended,/\[data-keyboard-guide\][\s\S]*height: 100%/);
 assert.match(appended,/max-height: calc\(100% - var\(--atlas-learning-row, 36px\) - 16px\)/);
});
