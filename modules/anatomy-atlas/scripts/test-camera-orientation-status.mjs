import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';
import { PerspectiveCamera, Vector3 } from 'three';

const require = createRequire(import.meta.url);
const React = require('react');
const compiled = await build({
  stdin: {
    contents: "export { SceneOrientation } from './app/scene-orientation'; export { BodyScene } from './app/body-scene'; export { FittedCamera } from './app/fitted-camera';",
    resolveDir: process.cwd(), loader: 'tsx',
  },
  bundle: true, platform: 'node', format: 'cjs', write: false,
});
let frame;
const module = { exports: {} };
runInNewContext(compiled.outputFiles[0].text, {
  module, exports: module.exports,
  require: (id) => id === 'react'
    ? { ...React, useMemo: (fn) => fn(), useRef: (value) => ({ current: value }), useEffect: () => {}, useLayoutEffect: (fn) => fn() }
    : id === '@react-three/fiber'
      ? { useFrame: (fn) => { frame = fn; }, useThree: (selector) => selector({ invalidate() {} }) }
      : require(id),
});

test('accessible direction follows presets and pointer movement while keyboard angles stay immediate', () => {
  const { SceneOrientation } = module.exports;
  const coordinates = {
    sourceToSceneColumnMajor: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    unitsPerMillimetre: 1,
  };
  let visual = '', status = '', writes = 0;
  const output = { current: { get textContent() { return visual; }, set textContent(value) { visual = value; } } };
  const statusOutput = { current: { get textContent() { return status; }, set textContent(value) { status = value; writes++; } } };
  const keyboardCameraFrom = { current: null };
  SceneOrientation({ output, statusOutput, keyboardCameraFrom, coordinates, enabled: true });
  const camera = new PerspectiveCamera();
  const point = (x, y, z) => { camera.position.set(x, y, z); camera.lookAt(0, 0, 0); frame({ camera }); };
  point(0, 0, 10);
  assert.equal(status, `View from: ${visual}.`);
  const firstWrites = writes;
  point(0, 0, 10);
  assert.equal(writes, firstWrites, 'unchanged render does not repeat a live announcement');

  keyboardCameraFrom.current = new Vector3(0, 0, 1);
  statusOutput.current.textContent = 'View from: front. Orbit angle: 10° around, 90° from above.';
  point(0, 0, 10);
  assert.match(status, /Orbit angle: 10°/, 'keyboard detail persists for its actual pose');

  point(1, 0, 10);
  assert.equal(status, `View from: ${visual}.`, 'pointer orbit clears stale keyboard angles even inside one direction sector');
  assert.equal(keyboardCameraFrom.current, null);
  point(0, 0, -10);
  assert.equal(status, `View from: ${visual}.`, 'posterior preset replaces front status');
  assert.notEqual(visual, 'front');
  const presetWrites = writes;
  point(0, 0, -10);
  assert.equal(writes, presetWrites);
  point(0, 0, 10);
  assert.equal(status, `View from: ${visual}.`, 'reset restores front status');
});

test('BodyScene connects the keyboard status and camera observer without exam disclosure', async () => {
  const { BodyScene, SceneOrientation, FittedCamera } = module.exports;
  const { readFile } = await import('node:fs/promises');
  const catalog = JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
  const props = {
    catalog, structures: [], selectedId: null,
    systems: { skeleton: true, muscles: true, organs: true, nerves: true, vessels: true, connective: true },
    isolated: false, hiddenIds: [], ghostRemoved: false, illustrated: true, landmarks: [],
    explode: 0, layout: 'spatial', anchorSkeleton: false, showOrigins: false, labels: true,
    view: 'anterior', zoom: 1, reset: 0, focus: false, exam: false,
    inspection: { plane: 'off', position: 50, flipped: false, opacity: {}, keepSelectedSolid: true },
    plate: false, onSelect() {}, onLoaded() {}, onFailure() {}, onRendererHealth() {},
  };
  const nodes = (n) => !n || typeof n !== 'object' ? [] : Array.isArray(n)
    ? n.flatMap(nodes) : [n, ...nodes(n.props?.children)];
  const all = nodes(BodyScene(props).props.children(() => {}));
  const status = all.find((n) => n.type === 'output' && n.props?.className === 'sr-only');
  const observer = all.find((n) => n.type === SceneOrientation);
  const fitted = all.find((n) => n.type === FittedCamera);
  assert.equal(observer.props.statusOutput, status.props.ref);
  assert.equal(status.props['aria-live'], 'polite');
  let announced = '';
  status.props.ref.current = { get textContent() { return announced; }, set textContent(value) { announced = value; } };
  fitted.props.onKeyboardRotate(new Vector3(0, 0, 1), Math.PI / 18, Math.PI / 2);
  assert.match(announced, /Orbit angle: 10°/);
  assert.equal(observer.props.keyboardCameraFrom.current.z, 1);
  const examNodes = nodes(BodyScene({ ...props, exam: true }).props.children(() => {}));
  assert.equal(examNodes.some((n) => n.type === 'output' && n.props?.className === 'sr-only'), false);
});
