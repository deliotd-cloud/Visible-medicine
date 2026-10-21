import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { bindCameraKeyboard, bindCameraPanKeyboard } from '../lib/camera-keyboard.ts';
import { build } from './workspace-component-test-build.mjs';
import { reviewDisplayPaths } from './review-revision-evidence.mjs';
const require = createRequire(import.meta.url);
const { PerspectiveCamera, OrthographicCamera, Camera, Vector3, Box3 } = require('three');
const { OrbitControls } = require('three-stdlib');
class Surface {
  attributes = new Map(); handlers = new Set(); ownerDocument = { activeElement: this };
  getAttribute(k) { return this.attributes.get(k) ?? null; }
  setAttribute(k, v) { this.attributes.set(k, String(v)); }
  removeAttribute(k) { this.attributes.delete(k); }
  addEventListener(name, fn) { assert.equal(name, 'keydown'); this.handlers.add(fn); }
  removeEventListener(name, fn) { assert.equal(name, 'keydown'); this.handlers.delete(fn); }
  key(key, extra = {}) {
    const event = { key, target: this, defaultPrevented: false, stopped: false, isComposing: false,
      altKey: false, ctrlKey: false, metaKey: false, shiftKey: false,
      preventDefault() { this.defaultPrevented = true; }, stopPropagation() { this.stopped = true; }, ...extra };
    for (const fn of this.handlers) fn(event);
    return event;
  }
}
const near = (a, b) => assert(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
function fixture(ortho = false, pan = false) {
  const camera = ortho ? new OrthographicCamera(-6, 6, 4, -4, .01, 150) : new PerspectiveCamera(38, 1.5, .01, 150);
  camera.position.set(3, 4, 10); camera.up.set(0, 1, 0);
  const controls = new OrbitControls(camera); controls.target.set(1, 2, 0); controls.update(); controls.enableDamping = true;
  const surface = new Surface(); let changes = 0;
  const release = pan ? bindCameraPanKeyboard(surface, camera, () => controls, () => changes++, true)
    : bindCameraKeyboard(surface, () => controls, () => changes++, camera);
  return { camera, controls, surface, release, changes: () => changes };
}
for (const [ortho, pan] of [[false, false], [true, false], [true, true]]) test(`${ortho ? 'orthographic' : 'perspective'} ${pan ? 'tray' : 'model'} zoom preserves target and viewing direction`, () => {
  const f = fixture(ortho, pan), { camera, controls, surface } = f;
  const position = camera.position.clone(), target = controls.target.clone(), quaternion = camera.quaternion.clone();
  const radius = controls.getDistance(), zoom = camera.zoom;
  assert.equal(surface.handlers.size, 1);
  assert.match(surface.getAttribute('aria-description'), /Plus or equal zoom in; minus zooms out/);
  for (const [inKey, outKey] of [['+', '-'], ['=', '_']]) {
    assert.equal(surface.key(inKey).defaultPrevented, true);
    if (ortho) { near(camera.zoom, zoom / .85); near(camera.position.distanceTo(position), 0); }
    else { near(controls.getDistance(), radius * .85); near(camera.zoom, zoom); }
    near(controls.target.distanceTo(target), 0);
    camera.quaternion.toArray().forEach((v, i) => near(v, quaternion.toArray()[i]));
    assert.equal(surface.key(outKey).defaultPrevented, true);
    near(controls.getDistance(), radius); near(camera.zoom, zoom);
  }
  assert.equal(f.changes(), 4); assert.equal(controls.enableDamping, true);
  f.release(); assert.equal(surface.handlers.size, 0); assert.equal(surface.getAttribute('aria-description'), null);
});
test('browser modifiers, composition, focus, other targets and guide/zoom locks retain native behavior', () => {
  const f = fixture(), { camera, controls, surface } = f, before = camera.position.clone();
  for (const key of ['+', '=', '-', '_']) for (const extra of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { isComposing: true }, { target: {} }, { defaultPrevented: true }]) assert.equal(surface.key(key, extra).stopped, false);
  for (const key of ['Tab', 'Escape', 'Home', '0', 'Enter', 'a']) assert.equal(surface.key(key).defaultPrevented, false);
  surface.ownerDocument.activeElement = {}; assert.equal(surface.key('+').defaultPrevented, false); surface.ownerDocument.activeElement = surface;
  controls.enableZoom = false; assert.equal(surface.key('+').defaultPrevented, false); controls.enableZoom = true;
  controls.enabled = false; assert.equal(surface.key('-').defaultPrevented, false);
  near(camera.position.distanceTo(before), 0); assert.equal(f.changes(), 0); f.release();
});
test('existing distance and orthographic zoom bounds clamp without reversing an out-of-range gesture', () => {
  for (const ortho of [false, true]) {
    const f = fixture(ortho), { camera, controls, surface } = f;
    controls.minDistance = 2; controls.maxDistance = 20; controls.minZoom = .5; controls.maxZoom = 2;
    for (let i = 0; i < 60; i++) surface.key('+');
    near(ortho ? camera.zoom : controls.getDistance(), 2);
    const count = f.changes(); assert.equal(surface.key('+').defaultPrevented, true); assert.equal(f.changes(), count);
    for (let i = 0; i < 60; i++) surface.key('-');
    near(ortho ? camera.zoom : controls.getDistance(), ortho ? .5 : 20);
    if (ortho) camera.zoom = .1;
    else camera.position.copy(controls.target).add(new Vector3(0, 0, 50));
    const current = ortho ? camera.zoom : controls.getDistance();
    assert.equal(surface.key('-').defaultPrevented, true);
    near(ortho ? camera.zoom : controls.getDistance(), current);
    surface.key('+');
    assert(ortho ? camera.zoom > current : controls.getDistance() < current);
    f.release();
  }
});
test('invalid camera scale, targets, bounds or unsupported camera do not consume zoom keys', () => {
  const invalid = [f => { f.camera.zoom = 0; }, f => { f.camera.position.x = NaN; }, f => { f.controls.target.z = Infinity; },
    f => { f.controls.minDistance = NaN; }, f => { f.controls.maxDistance = -1; }, f => { f.controls.maxDistance = '20'; }, f => { f.controls.minDistance = 8; f.controls.maxDistance = 4; }];
  for (const mutate of invalid) { const f = fixture(); mutate(f); assert.equal(f.surface.key('+').defaultPrevented, false); assert.equal(f.changes(), 0); f.release(); }
  const f = fixture(true); f.camera.left = f.camera.right; assert.equal(f.surface.key('+').defaultPrevented, false); f.release();
  const camera = new Camera(), controls = new OrbitControls(new PerspectiveCamera()), surface = new Surface();
  const release = bindCameraKeyboard(surface, () => controls, () => assert.fail('Unsupported camera changed'), camera);
  assert.equal(surface.key('+').defaultPrevented, false); release();
});
test('zoom remains opt-in for old helper callers and restores only owned attributes', () => {
  const f = fixture(), { surface, camera, controls } = f; f.release();
  surface.setAttribute('aria-description', 'Before');
  const old = bindCameraKeyboard(surface, () => controls, () => assert.fail('Old caller zoomed'));
  assert.equal(surface.key('+').defaultPrevented, false); old();
  const release = bindCameraKeyboard(surface, () => controls, () => {}, camera);
  surface.setAttribute('aria-description', 'Later owner'); release(); release();
  assert.equal(surface.getAttribute('aria-description'), 'Later owner'); assert.equal(surface.handlers.size, 0);
});
test('actual FittedCamera captures keyboard zoom, retains it across refits and disables it for guided locks', async () => {
  const compiled = await build({ stdin: { contents: "export { FittedCamera } from './app/fitted-camera';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'cjs' });
  let camera = new PerspectiveCamera(38, 1.5, .01, 150), controls = new OrbitControls(camera);
  const surface = new Surface(), refs = [], mod = { exports: {} }, size = { width: 900, height: 600 };
  let index = 0, effects = [], cleanups = [], invalidations = 0;
  runInNewContext(compiled.outputFiles[0].text, { module: mod, exports: mod.exports, require(name) {
    if (name === 'react') return { useRef(value) { return refs[index++] ?? (refs[index - 1] = { current: value }); }, useCallback: fn => fn, useEffect: fn => effects.push(fn) };
    if (name === '@react-three/fiber') return { useThree: () => ({ camera, size, gl: { domElement: surface }, invalidate() { invalidations++; } }), useFrame() {} };
    if (name === '@react-three/drei') return { OrbitControls: 'OrbitControls' };
    return require(name);
  } });
  const capture = { current: null }, props = { bounds: new Box3(new Vector3(-1, -2, -.5), new Vector3(1, 2, .5)), direction: [0, 0, 1], viewKey: 'anterior', zoom: 1, reset: 0, cameraCapture: capture };
  function render(changes) {
    for (const clean of cleanups) clean(); cleanups = []; index = 0; effects = []; Object.assign(props, changes);
    const element = mod.exports.FittedCamera(props); element.props.ref.current = controls;
    for (const key of ['enableRotate', 'enablePan', 'enableZoom']) controls[key] = element.props[key];
    for (const effect of effects) { const clean = effect(); if (clean) cleanups.push(clean); }
  }
  for (const planar of [false, true]) {
    if (planar) { camera = new OrthographicCamera(); controls = new OrbitControls(camera); }
    render({ planar, locked: false }); const before = JSON.stringify(capture.current), count = invalidations;
    assert.equal(surface.key('+').defaultPrevented, true); assert.notEqual(JSON.stringify(capture.current), before); assert(invalidations > count);
    const position = camera.position.clone(), zoom = camera.zoom, pose = structuredClone(capture.current);
    const width = planar ? (camera.right - camera.left) / camera.zoom : null;
    render({ bounds: props.bounds.clone() }); near(camera.position.distanceTo(position), 0); near(capture.current.scale, pose.scale);
    // FittedCamera intentionally normalizes orthographic zoom to1 and retains
    // the same world-space view in its frustum. Assert the view, not one internal
    // representation of it; perspective zoom remains unchanged.
    if (planar) near((camera.right - camera.left) / camera.zoom, width);
    else near(camera.zoom, zoom);
    size.width = 1280; size.height = 720; render({}); near(capture.current.scale, pose.scale);
    capture.current.pan.forEach((v, i) => near(v, pose.pan[i]));
    render({ locked: true }); assert.equal(surface.handlers.size, 0); assert.equal(surface.key('-').defaultPrevented, false);
  }
  for (const clean of cleanups) clean(); assert.equal(surface.handlers.size, 0);
});
test('existing renderer-bound files and original native keyboard suite remain exact, with geometry untouched', async () => {
  assert(reviewDisplayPaths.includes('lib/camera-keyboard.ts')); assert(reviewDisplayPaths.includes('app/fitted-camera.tsx'));
  // Pin the complete unchanged original suite, without an untracked proposal
  // directory. This is the exact original485 file hash, not a partial adapter.
  const original = await readFile(new URL('./test-camera-keyboard.mjs', import.meta.url));
  assert.equal(createHash('sha256').update(original).digest('hex'), 'd4a5d5a386f7997e2cd4716f4ca966513199239810a4c418113d44e3805241b3');
  const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
  assert.equal(createHash('sha256').update(raw).digest('hex'), '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7');
});
