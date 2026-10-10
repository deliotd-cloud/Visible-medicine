import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { build } from './workspace-test-build.mjs';

const built = await build({
  stdin: {
    contents: "export * from 'three'; export {bodyOffset,translatedBox} from './lib/explode-layout.mjs'; export {bodySpreadScale,bodySpreadOffset} from './lib/body-spread'; export {bodyDisplayCatalog} from './lib/body-display-catalog';",
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const api = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`);
const { Box3, Vector3, bodyOffset, bodySpreadScale, bodySpreadOffset, bodyDisplayCatalog, translatedBox } = api;
const raw = JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json', 'utf8'));
const catalog = bodyDisplayCatalog(raw);
const sourceSnapshot = JSON.stringify(catalog);
const vector = (v) => [v.x, v.y, v.z];
const boxFor = (s) => translatedBox(s.bounds);
const frameFor = (items) => {
  const box = new Box3();
  for (const item of items) box.union(boxFor(item));
  return box;
};

// Pure helper contract: identity on cubic/bad frames, no mutation, finite clamp,
// exact original/anchored position, and a gain independent of the visible pool.
const cube = new Box3(new Vector3(-2, -2, -2), new Vector3(2, 2, 2));
const flat = new Box3(new Vector3(-1, -5, -0.5), new Vector3(1, 5, 0.5));
const flatSnapshot = [vector(flat.min), vector(flat.max)];
assert.deepEqual(vector(bodySpreadScale(cube)), [1, 1, 1]);
assert.deepEqual(vector(bodySpreadScale(flat)), [3, 1, 3]);
assert.deepEqual([vector(flat.min), vector(flat.max)], flatSnapshot);
for (const bad of [new Box3(), new Box3(new Vector3(), new Vector3(1, 0, 1)),
  new Box3(new Vector3(), new Vector3(Infinity, 1, 1)),
  new Box3(new Vector3(), new Vector3(NaN, 1, 1))])
  assert.deepEqual(vector(bodySpreadScale(bad)), [1, 1, 1]);
const center = [1, 2, 3], origin = new Vector3(-1, 0, 0), gain = bodySpreadScale(flat);
const inputSnapshot = {center: [...center], origin: vector(origin), gain: vector(gain)};
for (const amount of [0, -5, NaN, Infinity, -Infinity])
  assert.deepEqual(vector(bodySpreadOffset(center, origin, amount, false, gain)), [0, 0, 0]);
for (const amount of [1, 50, 100, 101, Infinity])
  assert.deepEqual(vector(bodySpreadOffset(center, origin, amount, true, gain)), [0, 0, 0]);
assert.deepEqual(vector(bodySpreadOffset(center, origin, 100, false, bodySpreadScale(cube))),
  vector(bodyOffset(center, origin, 100)));
assert.deepEqual(vector(bodySpreadOffset(center, origin, 250, false, gain)),
  vector(bodyOffset(center, origin, 100).multiply(gain)));
assert.deepEqual({center, origin: vector(origin), gain: vector(gain)}, inputSnapshot);
assert.deepEqual(vector(bodySpreadOffset([-1,-2,-3],origin,0,false,gain)),[0,0,0]);
for(const invalidScale of [new Vector3(NaN,1,1),new Vector3(Infinity,1,1),new Vector3(0,1,1),new Vector3(4,1,1)])
  assert.deepEqual(vector(bodySpreadOffset(center,origin,100,false,invalidScale)),vector(bodyOffset(center,origin,100)));

const views = {
  anterior: { direction: new Vector3(0, 0, 1), up: new Vector3(0, 1, 0) },
  posterior: { direction: new Vector3(0, 0, -1), up: new Vector3(0, 1, 0) },
  right: { direction: new Vector3(-1, 0, 0), up: new Vector3(0, 1, 0) },
  oblique: { direction: new Vector3(1, 0.5, 1).normalize(), up: new Vector3(0, 1, 0) },
};
const axes = Object.fromEntries(Object.entries(views).map(([name, view]) => {
  const right = new Vector3().crossVectors(view.up, view.direction).normalize();
  const vertical = new Vector3().crossVectors(view.direction, right).normalize();
  return [name, [right, vertical]];
}));
function projected(box, basis) {
  const center = box.getCenter(new Vector3());
  const half = box.getSize(new Vector3()).multiplyScalar(0.5);
  return basis.map(axis => {
    const middle = center.dot(axis);
    const radius = Math.abs(axis.x) * half.x + Math.abs(axis.y) * half.y + Math.abs(axis.z) * half.z;
    return [middle - radius, middle + radius];
  });
}
const intersects = (a, b, axesCount) => {
  for (let axis = 0; axis < axesCount; axis++)
    if (Math.min(a[axis][1], b[axis][1]) <= Math.max(a[axis][0], b[axis][0])) return false;
  return true;
};
function boundsCoordinates(box) {
  return [[box.min.x, box.max.x], [box.min.y, box.max.y], [box.min.z, box.max.z]];
}
function evidenceFor(scope) {
  const frame = frameFor(scope);
  const frameSnapshot = [vector(frame.min), vector(frame.max)];
  const frameCenter = frame.getCenter(new Vector3());
  const stableGain = bodySpreadScale(frame);
  const source = scope.map(item => boxFor(item));
  const legacy = scope.map((item, index) => source[index].clone().translate(bodyOffset(item.center, frameCenter, 100)));
  const spread = scope.map((item, index) => source[index].clone().translate(bodySpreadOffset(item.center, frameCenter, 100, false, stableGain)));
  assert.deepEqual([vector(frame.min), vector(frame.max)], frameSnapshot);
  const counts = { pairs: 0, legacy3d: 0, spread3d: 0,
    projected: Object.fromEntries(Object.keys(axes).map(name => [name, {legacy: 0, spread: 0}])) };
  const projectedLegacy = Object.fromEntries(Object.entries(axes).map(([name, basis]) => [name, legacy.map(box => projected(box, basis))]));
  const projectedSpread = Object.fromEntries(Object.entries(axes).map(([name, basis]) => [name, spread.map(box => projected(box, basis))]));
  for (let i = 0; i < scope.length; i++) for (let j = i + 1; j < scope.length; j++) {
    if (scope[i].system !== scope[j].system || scope[i].laterality !== scope[j].laterality) continue;
    counts.pairs++;
    if (intersects(boundsCoordinates(legacy[i]), boundsCoordinates(legacy[j]), 3)) counts.legacy3d++;
    if (intersects(boundsCoordinates(spread[i]), boundsCoordinates(spread[j]), 3)) counts.spread3d++;
    for (const name of Object.keys(axes)) {
      if (intersects(projectedLegacy[name][i], projectedLegacy[name][j], 2)) counts.projected[name].legacy++;
      if (intersects(projectedSpread[name][i], projectedSpread[name][j], 2)) counts.projected[name].spread++;
    }
  }
  return {structures: scope.length, gain: vector(stableGain), ...counts};
}

const regions = Object.fromEntries(catalog.regions.map(region => [region.id,
  evidenceFor(catalog.structures.filter(s => s.regions.includes(region.id)))]));
const wholeBody = evidenceFor(catalog.structures);
assert.equal(JSON.stringify(catalog), sourceSnapshot, 'Display catalog is unchanged');
const evidence = {source: 'current bodyDisplayCatalog', regions, wholeBody,
  limitations: 'Conservative 3D and orthographic projected AABB intersections; not mesh overlap, visibility, or browser acceptance.'};
await mkdir('.local', {recursive: true});
await writeFile('.local/body-spread-test.json', `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify({forearm: regions.forearm, increases: Object.entries(regions).filter(([,value]) => value.spread3d > value.legacy3d).map(([name,value]) => ({name, legacy: value.legacy3d, spread: value.spread3d})), evidence: '.local/body-spread-test.json'}));
assert(regions.forearm.spread3d < regions.forearm.legacy3d, 'Forearm conservative 3D pair count must improve');
for (const [region, value] of Object.entries(regions))
  assert(value.spread3d <= value.legacy3d, `${region}: conservative 3D pair count increased`);
