import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const root = 'public/models/bodyparts3d/full-body/';
const catalog = JSON.parse(await fs.readFile(root + 'catalog.json', 'utf8'));
const schema = JSON.parse(
  await fs.readFile('content/schema/anatomy-structure.schema.json', 'utf8'),
);
const idPattern = new RegExp(schema.properties.id.pattern);
const identities = new Set(),
  bindings = new Set();
const sourceOwners = new Map();
let triangles = 0,
  vertices = 0;
for (const s of catalog.structures) {
  assert(!identities.has(s.id), `Duplicate ID ${s.id}`);
  identities.add(s.id);
  for (const source of s.sources) {
    assert(
      !sourceOwners.has(source.file),
      `Duplicate source component ${source.file}: ${sourceOwners.get(source.file)} / ${s.id}`,
    );
    sourceOwners.set(source.file, s.id);
  }
  assert(idPattern.test(s.id), `Invalid product ID ${s.id}`);
  assert(
    schema.properties.category.enum.includes(s.category),
    `Invalid category ${s.name}`,
  );
  assert(schema.properties.laterality.enum.includes(s.laterality));
  assert(
    s.regions.every((id) => catalog.regions.some((r) => r.id === id)),
    `Missing region ${s.name}`,
  );
  assert(
    s.sources.length > 0 &&
      s.sources.every((f) => /^[a-f0-9]{64}$/.test(f.sha256)),
  );
  const center = new THREE.Vector3(...s.center);
  assert(
    s.laterality !== 'right' || center.x < 0.03,
    `Right side appears reflected: ${s.name}`,
  );
  assert(
    s.laterality !== 'left' || center.x > -0.03,
    `Left side appears reflected: ${s.name}`,
  );
}
for (const bundle of catalog.bundles) {
  const bytes = await fs.readFile(root + bundle.id + '.glb');
  assert.equal(bytes.length, bundle.bytes);
  assert(bytes.length < 24 * 1024 * 1024);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
  const { scene } = await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    '',
  );
  scene.traverse((mesh) => {
    if (!mesh.isMesh) return;
    const record = catalog.structures.find(
      (s) => s.bundle === bundle.id && s.nodeName === mesh.name,
    );
    assert(record, `Unbound node ${bundle.id}/${mesh.name}`);
    assert.equal(mesh.userData.structureId, record.id);
    bindings.add(record.id);
    const p = mesh.geometry.attributes.position,
      n = mesh.geometry.attributes.normal;
    assert(n && p);
    for (const v of p.array) assert(Number.isFinite(v));
    for (const v of n.array) assert(Number.isFinite(v));
    triangles += (mesh.geometry.index?.count ?? p.count) / 3;
    vertices += p.count;
    mesh.geometry.computeBoundingBox();
    for (let axis = 0; axis < 3; axis++) {
      assert(
        Math.abs(
          mesh.geometry.boundingBox.min.getComponent(axis) -
            record.bounds.min[axis],
        ) < 1e-4,
      );
      assert(
        Math.abs(
          mesh.geometry.boundingBox.max.getComponent(axis) -
            record.bounds.max[axis],
        ) < 1e-4,
      );
    }
  });
}
assert.equal(bindings.size, catalog.structures.length);
const transform = new THREE.Matrix4().fromArray(
  catalog.coordinateSystem.sourceToSceneColumnMajor,
);
assert(transform.determinant() > 0);
const test = new THREE.Vector3(-150, -70, 1200);
assert(
  test.distanceTo(
    test
      .clone()
      .applyMatrix4(transform)
      .applyMatrix4(transform.clone().invert()),
  ) < 1e-8,
);
let framingChecks = 0;
for (const region of ['whole-body', ...catalog.regions.map((r) => r.id)])
  for (const side of ['both', 'left', 'right']) {
    const structures = catalog.structures.filter(
      (s) =>
        (region === 'whole-body' || s.regions.includes(region)) &&
        (side === 'both' ||
          s.laterality === side ||
          ['midline', 'unpaired', 'unspecified'].includes(s.laterality)),
    );
    assert(structures.length, `Empty region/side ${region}/${side}`);
    const bounds = new THREE.Box3();
    for (const s of structures)
      bounds.union(
        new THREE.Box3(
          new THREE.Vector3(...s.bounds.min),
          new THREE.Vector3(...s.bounds.max),
        ),
      );
    const center = bounds.getCenter(new THREE.Vector3()),
      size = bounds.getSize(new THREE.Vector3());
    for (const aspect of [0.65, 1, 1.4])
      for (const direction of [
        [0, 0.04, 1],
        [0, 0.04, -1],
        [-1, 0.04, 0],
        [1, 0.04, 0],
      ]) {
        const lateral = Math.abs(direction[0]) === 1,
          width = lateral ? size.z : size.x,
          depth = lateral ? size.x : size.z;
        const distance =
          Math.max(size.y / 1.32, width / (aspect * 1.4), 0.65) /
            Math.tan(THREE.MathUtils.degToRad(19)) +
          depth * 0.65;
        assert(distance < 65, 'Camera clamp would break framing');
        const camera = new THREE.PerspectiveCamera(38, aspect, 0.01, 150);
        camera.position
          .copy(center)
          .add(
            new THREE.Vector3(...direction)
              .normalize()
              .multiplyScalar(distance),
          );
        camera.lookAt(center);
        camera.updateMatrixWorld();
        for (const x of [bounds.min.x, bounds.max.x])
          for (const y of [bounds.min.y, bounds.max.y])
            for (const z of [bounds.min.z, bounds.max.z]) {
              const point = new THREE.Vector3(x, y, z).project(camera);
              assert(
                Math.abs(point.x) < 0.9 && Math.abs(point.y) < 0.9,
                `Framing failed ${region}/${side}`,
              );
            }
        framingChecks++;
      }
  }
const canal = catalog.structures.find((s) => s.fmaId === 'FMA78497');
assert(
  canal &&
    canal.category === 'space' &&
    /not a complete spinal cord/.test(canal.coverageNote),
);
assert(
  !catalog.structures.some((s) => s.fmaId === 'FMA7647'),
  'Ambiguous central canal promoted to spinal cord',
);
assert.equal(catalog.regions.length, 11);
assert.equal(
  catalog.structures.filter((s) => s.system === 'organs').length,
  73,
);
const result = {
  passed: true,
  sourceVersion: catalog.sourceVersion,
  structures: catalog.structures.length,
  bundles: catalog.bundles.length,
  triangles,
  vertices,
  framingChecks,
  systems: Object.fromEntries(
    ['skeleton', 'muscles', 'nerves', 'organs', 'vessels', 'connective'].map(
      (key) => [key, catalog.structures.filter((s) => s.system === key).length],
    ),
  ),
  checks: [
    'all GLB hashes/bytes',
    'unique identities and schema values',
    'one rendered owner per source component',
    'all node bindings',
    'finite geometry',
    'stored bounds',
    'left/right convention',
    'invertible shared transform',
    'all regions and laterality framing',
    'explicit neural coverage boundary',
  ],
  clinicalValidation: false,
  browserInteractionTesting: false,
};
await fs.writeFile(
  'docs/full-body-validation.json',
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result, null, 2));
