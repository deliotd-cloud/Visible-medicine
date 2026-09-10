import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { createHash } from 'node:crypto';
import { Vector3, Matrix4, PerspectiveCamera, OrthographicCamera, Group } from 'three';
import { orientationBasis, cameraOrientation, orientationText } from '../lib/camera-orientation.ts';
import { build } from './workspace-component-test-build.mjs';

let checks = 0;
const same = (a, b, why) => {
  checks++;
  assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)), why);
};
const raw = await readFile('public/models/bodyparts3d/full-body/catalog.json');
same(createHash('sha256').update(raw).digest('hex'), '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7');
const catalog = JSON.parse(raw), coordinates = catalog.coordinateSystem;
const basis = orientationBasis(coordinates);
const from = (camera) => camera.getWorldDirection(new Vector3()).negate();
const cases = [
  [[0, 0, 5], ['A']], [[0, 0, -5], ['P']],
  [[5, 0, 0], ['L']], [[-5, 0, 0], ['R']],
  [[0, 5, 0], ['S']], [[0, -5, 0], ['I']],
  [[5, 5, 5], ['A', 'L', 'S']], [[-5, -5, -5], ['P', 'R', 'I']],
];
for (const Camera of [PerspectiveCamera, OrthographicCamera]) {
  for (const [position, expected] of cases) {
    const camera = new Camera();
    camera.position.fromArray(position);
    camera.lookAt(0, 0, 0);
    same(cameraOrientation(from(camera), basis), expected);
    camera.rotateZ(1.1); // Roll does not change which side the camera looks from.
    same(cameraOrientation(from(camera), basis), expected);
    camera.position.add(new Vector3(500, -300, 700)); // Pan: do not classify position.
    same(cameraOrientation(from(camera), basis), expected);
    camera.zoom = 4;
    camera.updateProjectionMatrix();
    same(cameraOrientation(from(camera), basis), expected);
  }
}
// Derive axes from the declared transform, not from hardcoded scene XYZ signs.
for (const angle of [0, 0.6, 1.9, 3.1]) {
  const matrix = new Matrix4().makeRotationY(angle).scale(new Vector3(0.1, 0.1, 0.1));
  matrix.setPosition(123, -32, 57);
  const rotated = orientationBasis({ sourceToSceneColumnMajor: matrix.toArray(), unitsPerMillimetre: 0.1 });
  for (const [axis, code] of [[0, 'L'], [1, 'P'], [2, 'S']])
    same(cameraOrientation(new Vector3(...rotated[axis]), rotated), [code]);
}
// Camera parents matter too; getWorldDirection accounts for their rotation.
const parent = new Group(), child = new PerspectiveCamera();
parent.add(child);
parent.rotation.y = Math.PI / 2;
same(cameraOrientation(from(child), basis), ['L']);
const tilt = (x) => ({ x, y: 0, z: Math.sqrt(1 - x * x) });
same(cameraOrientation(tilt(0.31), basis), ['A', 'L']);
same(cameraOrientation(tilt(0.25), basis), ['A']);
same(cameraOrientation(tilt(0.25), basis, ['A', 'L']), ['A', 'L']);
same(cameraOrientation(tilt(0.19), basis, ['A', 'L']), ['A']);
same(cameraOrientation(tilt(-0.25), basis, ['A', 'L']), ['A']);
same(cameraOrientation(tilt(-0.31), basis, ['A', 'L']), ['A', 'R']);
same(cameraOrientation({ x: NaN, y: 0, z: 1 }, basis, ['A']), []);
same(cameraOrientation(new Vector3(), basis), []);
same(cameraOrientation(new Vector3(1, 0, 0), null), []);
same(orientationText(['A', 'L', 'S']), 'front · model-left · above');
same(orientationText([]), 'unavailable');
for (const index of [0, 4, 15]) {
  const altered = structuredClone(coordinates);
  altered.sourceToSceneColumnMajor[index] = NaN;
  same(orientationBasis(altered), null);
}
const reflected = structuredClone(coordinates);
for (const index of [0, 1, 2]) reflected.sourceToSceneColumnMajor[index] *= -1;
same(orientationBasis(reflected), null);
same(orientationBasis({ ...coordinates, unitsPerMillimetre: 0 }), null);

// Execute the actual frame callback against real Three cameras and a small DOM
// text sink. Hooks are controlled; this is not GPU/browser acceptance.
const require = createRequire(import.meta.url), React = require('react');
const compiled = await build({
  stdin: { contents: "export { SceneOrientation } from './app/scene-orientation'; export { BodyScene } from './app/body-scene';", resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, platform: 'node', format: 'cjs', write: false,
});
let frame, invalidations = 0;
const module = { exports: {} };
runInNewContext(compiled.outputFiles[0].text, {
  module, exports: module.exports,
  require: (id) => id === 'react'
    ? { ...React, useMemo: (fn) => fn(), useRef: (value) => ({ current: value }), useEffect: () => {}, useLayoutEffect: (fn) => fn() }
    : id === '@react-three/fiber'
      ? { useFrame: (fn) => { frame = fn; }, useThree: (selector) => selector({ invalidate: () => { invalidations++; } }) }
      : require(id),
});
const api = module.exports;
let value = '', writes = 0;
const output = { current: {
  get textContent() { return value; },
  set textContent(text) { value = text; writes++; },
} };
api.SceneOrientation({ output, coordinates, enabled: true });
same(invalidations, 1);
const camera = new PerspectiveCamera();
camera.position.set(0, 0, 10);
camera.lookAt(0, 0, 0);
const pose = () => [camera.position.toArray(), camera.quaternion.toArray(), camera.projectionMatrix.toArray()];
const before = pose();
frame({ camera });
same(value, 'front');
const written = writes;
frame({ camera });
same(writes, written, 'Unchanged heading does not write DOM');
same(pose(), before, 'Observer does not change camera or projection');
camera.position.set(-10, 0, 0);
camera.lookAt(0, 0, 0);
frame({ camera });
same(value, 'model-right');
api.SceneOrientation({ output, coordinates: reflected, enabled: true });
frame({ camera });
same(value, 'unavailable', 'Bad frame never retains a plausible old heading');
api.SceneOrientation({ output, coordinates, enabled: false });
frame({ camera });
same(value, 'unavailable', 'Exam-disabled observer does not update');
output.current = null;
frame({ camera });

const nodes = (n) => !n || typeof n !== 'object' ? [] : Array.isArray(n)
  ? n.flatMap(nodes) : [n, ...nodes(n.props?.children)];
const props = {
  catalog, structures: catalog.structures.slice(0, 3), selectedId: null,
  systems: { skeleton: true, muscles: true, organs: true, nerves: true, vessels: true, connective: true },
  isolated: false, hiddenIds: [], ghostRemoved: false, illustrated: true,
  landmarks: [], explode: 0, layout: 'spatial', anchorSkeleton: false,
  showOrigins: false, labels: true, view: 'anterior', zoom: 1, reset: 0,
  focus: false, exam: false, inspection: { plane: 'off', position: 50, flipped: false, opacity: {}, keepSelectedSolid: true },
  plate: false, onSelect() {}, onLoaded() {}, onFailure() {}, onRendererHealth() {},
};
for (const exam of [false, true]) for (const layout of ['spatial', 'extract', 'tray']) {
  const scene = api.BodyScene({ ...props, exam, layout });
  const tree = scene.props.children(() => {}), all = nodes(tree);
  const heading = all.find((n) => n.props?.className === 'anatomy-live-orientation');
  const observer = all.find((n) => n.type === api.SceneOrientation);
  same(!!heading, !exam);
  same(observer.props.enabled, !exam);
  same(observer.props.coordinates, coordinates);
  same(tree.props['data-orientation'], !exam);
  if (heading) {
    same(heading.props['aria-live'], 'off', 'No chatter while rotating');
    same(heading.props.children[1].props.ref, observer.props.output);
  }
  same(scene.props.className, 'body-scene', 'Readout remains within renderer recovery boundary');
}
console.log(JSON.stringify({ passed: true, checks, cameraTypes: 2, sceneModes: 6, newGeometry: false, browserTesting: false, clinicalValidation: false }));
