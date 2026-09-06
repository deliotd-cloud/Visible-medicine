import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const compiled = await build({
  stdin: {
    contents:
      "export * from 'three'; export * from './lib/inspection-state'; export * from './lib/inspection-geometry'; export * from './lib/anatomy-practice'; export * from './lib/explode-layout.mjs';",
    resolveDir: root,
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
});
const api = await import(
  `data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`
);
const {
  Vector3,
  Box3,
  Mesh,
  MeshBasicMaterial,
  BoxGeometry,
  Raycaster,
  Plane,
  DoubleSide,
} = api;
const catalog = JSON.parse(
  await readFile(
    new URL(
      '../public/models/bodyparts3d/full-body/catalog.json',
      import.meta.url,
    ),
    'utf8',
  ),
);
const shoulder = JSON.parse(
  await readFile(
    new URL('../public/models/bodyparts3d/manifest.json', import.meta.url),
    'utf8',
  ),
);
let checks = 0;
const ok = (condition, message) => {
  assert.ok(condition, message);
  checks++;
};
const near = (a, b, message) => ok(Math.abs(a - b) < 1e-7, message);
const boxFor = (s) =>
  new Box3(new Vector3(...s.bounds.min), new Vector3(...s.bounds.max));

for (const region of ['whole-body', ...catalog.regions.map((r) => r.id)]) {
  const structures = catalog.structures.filter(
    (s) => region === 'whole-body' || s.regions.includes(region),
  );
  const frame = new Box3();
  structures.forEach((s) => frame.union(boxFor(s)));
  const center = frame.getCenter(new Vector3());
  ok(
    api.sectionPlanes(frame, api.initialInspection).length === 0,
    'Off does not clip',
  );
  for (const plane of ['axial', 'coronal', 'sagittal'])
    for (const position of [0, 25, 50, 75, 100])
      for (const flipped of [false, true]) {
        const state = { ...api.initialInspection, plane, position, flipped };
        const base = api.sectionPlanes(frame, state)[0];
        const axis = api.sectionAxes[plane].axis;
        near(
          base.normal.getComponent(axis),
          flipped ? -1 : 1,
          'Documented orientation',
        );
        const level =
          frame.min.getComponent(axis) +
          ((frame.max.getComponent(axis) - frame.min.getComponent(axis)) *
            position) /
            100;
        near(
          base.distanceToPoint(new Vector3().setComponent(axis, level)),
          0,
          'Correct cut level',
        );
        for (const s of structures)
          for (const amount of [0, 50, 100]) {
            const offset = api.bodyOffset(
              s.center,
              center,
              amount,
              s.system === 'skeleton',
            );
            const shifted = api.sectionPlanes(frame, state, offset)[0];
            for (const point of [s.bounds.min, s.center, s.bounds.max]) {
              const p = new Vector3(...point);
              near(
                base.distanceToPoint(p),
                shifted.distanceToPoint(p.clone().add(offset)),
                'Explode preserves original cut',
              );
              ok(
                api.pointRetained(p, [base]) ===
                  api.pointRetained(p.clone().add(offset), [shifted]),
                'Label / raycast retention follows exploded structure',
              );
            }
          }
      }
}
const shoulderFrame = new Box3();
shoulder.parts.forEach((p) => {
  const b = boxFor(p);
  b.min.y = Math.max(-3.15, b.min.y);
  if (!b.isEmpty()) shoulderFrame.union(b);
});
for (const part of shoulder.parts)
  for (const plane of ['axial', 'coronal', 'sagittal'])
    for (const amount of [0, 50, 100]) {
      const state = { ...api.initialInspection, plane };
      const offset = api.shoulderOffset(
        part.structureId.split(':').at(-1),
        amount,
      );
      const base = api.sectionPlanes(shoulderFrame, state)[0],
        shifted = api.sectionPlanes(shoulderFrame, state, offset)[0];
      near(
        base.distanceToPoint(new Vector3(...part.bounds.max)),
        shifted.distanceToPoint(new Vector3(...part.bounds.max).add(offset)),
        'Shoulder cut follows displacement',
      );
    }
const mesh = new Mesh(
  new BoxGeometry(2, 2, 2),
  new MeshBasicMaterial({ side: DoubleSide }),
);
mesh.updateMatrixWorld(true);
mesh.raycast = api.clippedMeshRaycast;
const ray = new Raycaster(new Vector3(0, 0, 5), new Vector3(0, 0, -1));
ok(ray.intersectObject(mesh).length > 0, 'Uncut mesh remains selectable');
api.applyMaterialInspection(
  mesh.material,
  [new Plane(new Vector3(0, 0, -1), 0)],
  1,
);
const hits = ray.intersectObject(mesh);
ok(
  hits.length > 0 && hits.every((hit) => hit.point.z <= 0),
  'Clipped near surface never intercepts deeper selection',
);
api.applyMaterialInspection(mesh.material, [], 0.15);
ok(
  ray.intersectObject(mesh).length === 0,
  'Low-opacity surfaces allow click-through',
);
api.applyMaterialInspection(mesh.material, [], 0.2);
ok(ray.intersectObject(mesh).length > 0, '20% opacity is still selectable');
const version = mesh.material.version;
api.applyMaterialInspection(mesh.material, [], 0.5);
ok(
  mesh.material.version === version,
  'Opacity slider does not recompile shader',
);
ok(
  mesh.material.transparent && !mesh.material.depthWrite,
  'Transparent material does not occlude opaque depth',
);
api.applyMaterialInspection(mesh.material, [], 1);
ok(
  !mesh.material.transparent && mesh.material.depthWrite,
  'Reset restores opaque rendering',
);
mesh.geometry.dispose();
mesh.material.dispose();
for (const [value, expected] of [
  [-10, 0.05],
  [5, 0.05],
  [100, 1],
  [250, 1],
  [NaN, 1],
])
  near(
    api.systemOpacity(
      { ...api.initialInspection, opacity: { muscles: value } },
      'muscles',
    ),
    expected,
    'Opacity safely clamped',
  );
near(
  api.systemOpacity(
    { ...api.initialInspection, opacity: { muscles: 10 } },
    'muscles',
    true,
  ),
  1,
  'Selected tissue stays solid',
);
near(
  api.systemOpacity(
    {
      ...api.initialInspection,
      keepSelectedSolid: false,
      opacity: { muscles: 10 },
    },
    'muscles',
    true,
  ),
  0.1,
  'Selection override can be disabled',
);
const loaded = catalog.bundles.slice(0, 6).map((b) => b.id);
for (const count of [5, 10, 20, 100]) {
  const result = api.practiceTargets(
    catalog.structures,
    loaded,
    count,
    () => 0.37,
  );
  ok(result.length <= Math.min(count, 20), 'Practice length bounded');
  ok(
    new Set(result.map((s) => s.id)).size === result.length,
    'No duplicate questions',
  );
  ok(
    result.every((s) => loaded.includes(s.bundle)),
    'Practice uses only loaded geometry',
  );
}
ok(
  api.practiceTargets(catalog.structures, [], 5).length === 0,
  'No unavailable practice targets',
);
const allLoaded = catalog.bundles.map((b) => b.id);
ok(
  api
    .practiceTargets(catalog.structures, allLoaded, 10, () => 0)
    .map((s) => s.id)
    .join() !==
    api
      .practiceTargets(catalog.structures, allLoaded, 10, () => 0.99)
      .map((s) => s.id)
      .join(),
  'Sessions can vary',
);
console.log(
  JSON.stringify(
    {
      passed: true,
      checks,
      regions: 12,
      shoulderSourceParts: shoulder.parts.length,
      sourceGeometryModified: false,
      clinicalValidation: false,
      browserInteractionTesting: false,
    },
    null,
    2,
  ),
);
