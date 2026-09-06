import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {
  Box3,
  Vector3,
  PerspectiveCamera,
  OrthographicCamera,
  Plane,
} from 'three';
import {
  bodyOffset,
  shoulderOffset,
  translatedBox,
  fitBounds,
} from '../lib/explode-layout.mjs';

const catalog = JSON.parse(
  await fs.readFile('public/models/bodyparts3d/full-body/catalog.json', 'utf8'),
);
const shoulder = JSON.parse(
  await fs.readFile('public/models/bodyparts3d/manifest.json', 'utf8'),
);
let pairChecks = 0,
  framingChecks = 0,
  cropChecks = 0;
const directions = [
  [0, 0.04, 1],
  [0, 0.04, -1],
  [-1, 0.04, 0],
  [1, 0.04, 0],
  [0, -1, 0],
  [0, 1, 0],
  [1, 0.8, 1],
];
function checkFrame(bounds) {
  for (const aspect of [0.45, 0.65, 1, 1.5, 2])
    for (const direction of directions) {
      const up =
        Math.abs(direction[1]) === 1
          ? new Vector3(0, 0, 1)
          : new Vector3(0, 1, 0);
      const fit = fitBounds(bounds, new Vector3(...direction), up, aspect, 39);
      const far = Math.max(
        150,
        fit.distance + bounds.getSize(new Vector3()).length() * 4,
      );
      for (const camera of [
        new PerspectiveCamera(39, aspect, 0.01, far),
        new OrthographicCamera(
          -fit.halfHeight * aspect,
          fit.halfHeight * aspect,
          fit.halfHeight,
          -fit.halfHeight,
          0.01,
          far,
        ),
      ]) {
        camera.position
          .copy(fit.center)
          .addScaledVector(new Vector3(...direction).normalize(), fit.distance);
        camera.up.copy(up);
        camera.lookAt(fit.center);
        camera.updateMatrixWorld();
        for (const x of [bounds.min.x, bounds.max.x])
          for (const y of [bounds.min.y, bounds.max.y])
            for (const z of [bounds.min.z, bounds.max.z]) {
              const p = new Vector3(x, y, z).project(camera);
              assert(
                Math.abs(p.x) <= 0.701 &&
                  Math.abs(p.y) <= 0.701 &&
                  p.z < 1 &&
                  p.z > -1,
                'Padded projection framing',
              );
            }
        framingChecks++;
      }
    }
}
for (const region of ['whole-body', ...catalog.regions.map((r) => r.id)]) {
  const list = catalog.structures.filter(
    (s) => region === 'whole-body' || s.regions.includes(region),
  );
  const frame = new Box3();
  for (const s of list) frame.union(translatedBox(s.bounds));
  const origin = frame.getCenter(new Vector3());
  for (const s of list) {
    assert.equal(bodyOffset(s.center, origin, 0).length(), 0);
    assert.equal(bodyOffset(s.center, origin, 100, true).length(), 0);
  }
  // Full expansion mathematically scales every centroid-pair distance by 2.6.
  for (let i = 0; i < list.length; i++)
    for (let j = i + 1; j < list.length; j++) {
      const a = new Vector3(...list[i].center),
        b = new Vector3(...list[j].center),
        before = a.distanceTo(b);
      const after = a
        .clone()
        .add(bodyOffset(list[i].center, origin, 100))
        .distanceTo(b.clone().add(bodyOffset(list[j].center, origin, 100)));
      assert(Math.abs(after - before * 2.6) < 1e-9);
      pairChecks++;
    }
  for (const amount of [0, 25, 50, 100])
    for (const anchored of [false, true]) {
      const bounds = new Box3();
      for (const s of list)
        bounds.union(
          translatedBox(
            s.bounds,
            bodyOffset(
              s.center,
              origin,
              amount,
              anchored && s.system === 'skeleton',
            ),
          ),
        );
      checkFrame(bounds);
    }
}
for (const amount of [0, 25, 50, 100])
  for (const anchored of [false, true]) {
    const bounds = new Box3();
    for (const part of shoulder.parts) {
      const slug = part.structureId.split(':').at(-1),
        offset = shoulderOffset(
          slug,
          amount,
          anchored && part.structureId.includes(':bone:'),
        );
      const cropped = { min: [...part.bounds.min], max: [...part.bounds.max] };
      cropped.min[1] = Math.max(-3.15, cropped.min[1]);
      bounds.union(translatedBox(cropped, offset));
      const plane = new Plane(new Vector3(0, 1, 0), 3.15 - offset.y);
      assert(
        Math.abs(plane.distanceToPoint(new Vector3(0, -3.15, 0).add(offset))) <
          1e-10,
      );
      assert(plane.distanceToPoint(new Vector3(0, -3, 0).add(offset)) > 0);
      cropChecks++;
    }
    checkFrame(bounds);
  }
const result = {
  passed: true,
  pairChecks,
  framingChecks,
  cropChecks,
  centroidDistanceMultiplierAt100: 2.6,
  sourceGeometryModified: false,
  clinicalValidation: false,
  limits:
    'Centroid spacing is not a collision solver. Anchored bones deliberately do not separate; labels need visual QA. Clinical attachments must be judged assembled at zero.',
};
await fs.writeFile(
  'docs/explode-validation.json',
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result, null, 2));
