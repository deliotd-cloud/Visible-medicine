// Numerical review of the existing display-only separation. No browser testing.
import fs from 'node:fs/promises';
import * as THREE from 'three';
const catalog = JSON.parse(
  await fs.readFile('public/models/bodyparts3d/full-body/catalog.json', 'utf8'),
);
const box = (s) =>
  new THREE.Box3(
    new THREE.Vector3(...s.bounds.min),
    new THREE.Vector3(...s.bounds.max),
  );
const rows = [];
for (const region of catalog.regions.map((r) => r.id)) {
  const scope = catalog.structures.filter((s) => s.regions.includes(region));
  const bounds = new THREE.Box3();
  scope.forEach((s) => bounds.union(box(s)));
  const center = bounds.getCenter(new THREE.Vector3()),
    radius = bounds.getSize(new THREE.Vector3()).length() / 2;
  const moved = (s) => {
    const p = new THREE.Vector3(...s.center).sub(center);
    if (p.length() < 0.05) p.set(0, 0, 1);
    return p
      .normalize()
      .multiplyScalar(100 * 0.012 * Math.min(radius, 4))
      .add(new THREE.Vector3(...s.center));
  };
  const pairs = [];
  for (let i = 0; i < scope.length; i++)
    for (let j = i + 1; j < scope.length; j++) {
      const a = scope[i],
        b = scope[j];
      if (a.system !== b.system || a.laterality !== b.laterality) continue;
      const before = new THREE.Vector3(...a.center).distanceTo(
        new THREE.Vector3(...b.center),
      );
      if (before < 0.03 || before > 0.8) continue;
      const after = moved(a).distanceTo(moved(b));
      pairs.push({
        a: a.name,
        b: b.name,
        beforeMm: before * 100,
        afterMm: after * 100,
        ratio: after / before,
      });
    }
  pairs.sort((a, b) => a.ratio - b.ratio);
  rows.push({
    region,
    nearbyPairs: pairs.length,
    pairsGainingUnder10Percent: pairs.filter((p) => p.ratio < 1.1).length,
    examples: pairs.slice(0, 2),
  });
}
const shoulder = JSON.parse(
  await fs.readFile('public/models/bodyparts3d/manifest.json', 'utf8'),
);
const directions = {
  scapula: [0.4, 0, -0.3],
  humerus: [-1.6, -0.7, 0],
  clavicle: [0.2, 1.4, 0.4],
  supraspinatus: [0, 1.15, -0.55],
  infraspinatus: [0.1, 0, -1.7],
  subscapularis: [0.3, 0, 1.7],
  'teres-minor': [-0.7, -0.4, -1.5],
  deltoid: [-2, 0.2, 0],
  'biceps-long-head': [-0.9, -0.15, 1.5],
};
const views = {
    posterior: [2.5, 1.2, -12],
    anterior: [-1.5, 1, 12],
    lateral: [-14, 1.5, -1.3],
  },
  framing = [];
for (const aspect of [0.65, 1, 1.4])
  for (const [view, vector] of Object.entries(views))
    for (const explode of [0, 100]) {
      const camera = new THREE.PerspectiveCamera(39, aspect, 0.1, 100),
        target = new THREE.Vector3(-0.65, -0.32, 0);
      camera.position
        .copy(target)
        .add(
          new THREE.Vector3(...vector).multiplyScalar(
            Math.max(1, 0.93 / aspect),
          ),
        );
      camera.lookAt(target);
      camera.updateMatrixWorld();
      let outside = 0,
        total = 0;
      for (const part of shoulder.parts) {
        const bounds = box(part),
          shift = new THREE.Vector3(...directions[part.slug]).multiplyScalar(
            explode * 0.018,
          );
        // Conservative AABB bound check, not proof that a rendered triangle is clipped.
        // Plane normal +Y, constant +3.15 retains world Y >= -3.15.
        bounds.min.y = Math.max(bounds.min.y, -3.15 - shift.y);
        if (bounds.min.y > bounds.max.y) continue;
        for (const x of [bounds.min.x, bounds.max.x])
          for (const y of [bounds.min.y, bounds.max.y])
            for (const z of [bounds.min.z, bounds.max.z]) {
              const p = new THREE.Vector3(x, y, z).add(shift).project(camera);
              total++;
              if (Math.abs(p.x) > 1 || Math.abs(p.y) > 1) outside++;
            }
      }
      framing.push({
        aspect,
        view,
        explode,
        outsideConservativeBounds: outside,
        totalBounds: total,
      });
    }
const report = {
  date: '2026-09-06',
  mechanismChanged: false,
  method: 'source-code and numerical bounds review',
  browserTesting: false,
  limitations: [
    'Centroid gaps are not surface clearance.',
    'AABB projection is conservative; out-of-frame bounds do not prove visible pixel clipping.',
  ],
  findings: [
    'Equal-distance radial motion does not reliably separate same-ray neighbours.',
    'Visible-subset/focus bounds change the regional explode origin.',
    'Regional camera resets to a preset and zooms out as separation changes.',
    'Dedicated shoulder camera does not fit exploded geometry.',
    'Shoulder clipping plane is fixed in world space during displacement.',
  ],
  regional: rows,
  shoulderFraming: framing,
};
await fs.writeFile('docs/explode-review.json', JSON.stringify(report, null, 2));
console.log(
  JSON.stringify(
    {
      regional: rows
        .filter((r) => r.examples.length)
        .map((r) => ({
          region: r.region,
          poorPairs: r.pairsGainingUnder10Percent,
          example: r.examples[0],
        })),
      shoulderFraming: framing.filter((r) => r.explode === 100),
    },
    null,
    2,
  ),
);
