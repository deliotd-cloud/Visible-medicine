import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { loadSourceHolds } from './load-source-holds.mjs';
import { cache } from './bodyparts-archive.mjs';

const hash = (value) => createHash('sha256').update(value).digest('hex');
const readJSON = async (path) => JSON.parse(await readFile(path, 'utf8'));
const base = await readJSON('public/models/bodyparts3d/pulmonary/catalog.json');
const audit = await readJSON('docs/pulmonary-source-audit.json');
const { catalog, records, evidence, policy } = await loadSourceHolds();
assert.deepEqual(audit.evidence, evidence);
assert.deepEqual(base.evidence, evidence);
assert.equal(
  base.auditSha256,
  hash(await readFile('docs/pulmonary-source-audit.json')),
);
assert.deepEqual(base.coordinateSystem, catalog.coordinateSystem);
assert.equal(base.license, 'CC-BY-4.0');
const roles = ['airway', 'artery', 'vein'],
  subsets = [],
  bundles = [];
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
};
async function retain(path, bytes) {
  if (process.argv.includes('--check'))
    assert.deepEqual(await readFile(path), Buffer.from(bytes), `Stale ${path}`);
  else await writeFile(path, bytes);
}
for (const originalBundle of base.bundles) {
  assert(
    /^\/models\/bodyparts3d\/pulmonary\/pulmonary-(right|left)\.glb\?v=[a-f0-9]{64}$/.test(
      originalBundle.url,
    ),
  );
  const bytes = await readFile('public' + originalBundle.url.split('?')[0]);
  assert.equal(hash(bytes), originalBundle.sha256);
  const gltf = await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    '',
  );
  const sourceMeshes = new Map();
  gltf.scene.traverse((mesh) => {
    if (mesh.isMesh) {
      assert(!sourceMeshes.has(mesh.name));
      sourceMeshes.set(mesh.name, mesh.geometry);
    }
  });
  const group = new Group(),
    bundleId = originalBundle.id + '-branch-types';
  for (const original of base.structures.filter(
    (s) => s.bundle === originalBundle.id,
  )) {
    const lobe = audit.lobes.find((l) => l.definition.id === original.fmaId);
    assert(lobe);
    assert.equal(lobe.parentId, original.parentId);
    const definition = records.find(
      (r) => r.tree === 'partof' && r.id === original.fmaId,
    );
    assert.deepEqual(lobe.definition, definition);
    policy.assertNoKnownHolds([definition]);
    assert.deepEqual(
      original.sources.map((s) => s.file),
      definition.files,
    );
    assert.equal(
      new Set(lobe.files.map((f) => f.file)).size,
      original.sources.length,
    );
    const geometry = sourceMeshes.get(original.nodeName);
    assert(geometry);
    const index = geometry.index,
      position = geometry.getAttribute('position'),
      normal = geometry.getAttribute('normal');
    assert(index && position && normal);
    assert.equal(position.count, normal.count);
    let offset = 0;
    const ranges = [];
    for (const source of original.sources) {
      const file = lobe.files.find((f) => f.file === source.file);
      assert(file);
      assert.equal(file.sha256, source.sha256);
      assert.equal(
        hash(await readFile(`${cache}/partof/${source.file}.obj`)),
        source.sha256,
      );
      const labels = records.filter((r) => r.files.includes(source.file));
      const smallest = Math.min(...labels.map((r) => r.files.length));
      const exact = labels.filter((r) => r.files.length === smallest);
      assert.deepEqual(exact, file.labels);
      policy.assertNoKnownHolds(exact);
      const classified = [
        ...new Set(
          exact.map((r) =>
            /artery|arteries/.test(r.name)
              ? 'artery'
              : /vein/.test(r.name)
                ? 'vein'
                : /bronch/.test(r.name)
                  ? 'airway'
                  : 'unknown',
          ),
        ),
      ];
      assert.deepEqual(classified, [file.role]);
      assert(roles.includes(file.role));
      const count = file.topology.triangles * 3;
      assert(Number.isSafeInteger(count) && count > 0);
      ranges.push({ source, role: file.role, offset, count });
      offset += count;
    }
    assert.equal(offset, index.count);
    // Existing exporter concatenates source files in definition order. Keep
    // exact indexed vertices/normals/winding, compacting only unused vertices.
    for (const role of roles) {
      const selected = ranges.filter((r) => r.role === role),
        vertexMap = new Map(),
        positions = [],
        normals = [],
        indices = [];
      assert.equal(selected.length, original.roleCounts[role]);
      assert(selected.length > 0);
      for (const range of selected)
        for (let at = range.offset; at < range.offset + range.count; at++) {
          const sourceIndex = index.getX(at);
          assert(
            Number.isSafeInteger(sourceIndex) &&
              sourceIndex >= 0 &&
              sourceIndex < position.count,
          );
          if (!vertexMap.has(sourceIndex)) {
            vertexMap.set(sourceIndex, vertexMap.size);
            positions.push(
              position.getX(sourceIndex),
              position.getY(sourceIndex),
              position.getZ(sourceIndex),
            );
            normals.push(
              normal.getX(sourceIndex),
              normal.getY(sourceIndex),
              normal.getZ(sourceIndex),
            );
          }
          indices.push(vertexMap.get(sourceIndex));
        }
      assert(
        positions.every(Number.isFinite) && normals.every(Number.isFinite),
      );
      const subset = new BufferGeometry();
      subset.setAttribute('position', new Float32BufferAttribute(positions, 3));
      subset.setAttribute('normal', new Float32BufferAttribute(normals, 3));
      subset.setIndex(indices);
      subset.computeBoundingBox();
      const bounds = subset.boundingBox,
        center = bounds.getCenter(new Vector3());
      let anchor,
        distance = Infinity;
      for (let i = 0; i < positions.length; i += 3) {
        const point = positions.slice(i, i + 3),
          d = new Vector3(...point).distanceToSquared(center);
        if (d < distance) {
          anchor = point;
          distance = d;
        }
      }
      const mesh = new Mesh(subset, new MeshStandardMaterial());
      mesh.name = original.nodeName + '_' + role;
      mesh.userData = {
        structureId: original.id,
        displayRole: role,
        canonicalNodeName: original.nodeName,
      };
      group.add(mesh);
      subsets.push({
        groupId: original.id,
        role,
        bundle: bundleId,
        nodeName: mesh.name,
        bounds: { min: bounds.min.toArray(), max: bounds.max.toArray() },
        center: center.toArray(),
        anchor,
        sources: selected.map((r) => r.source),
        triangles: indices.length / 3,
      });
    }
  }
  const output = Buffer.from(
    await new GLTFExporter().parseAsync(group, { binary: true }),
  );
  await retain(`public/models/bodyparts3d/pulmonary/${bundleId}.glb`, output);
  bundles.push({
    id: bundleId,
    url: `/models/bodyparts3d/pulmonary/${bundleId}.glb?v=${hash(output)}`,
    sha256: hash(output),
    bytes: output.length,
    structures: group.children.length,
  });
}
const result = {
  schemaVersion: 1,
  license: base.license,
  credit: base.credit,
  coordinateSystem: base.coordinateSystem,
  parents: base.parents,
  originalStructures: base.structures,
  originalBundles: base.bundles,
  auditSha256: base.auditSha256,
  subsets,
  bundles,
  method:
    'Source-labelled display subsets of existing groups; original geometry retained. Not new FMA identities, parenchyma, perfusion territories or clinical approval.',
};
await retain(
  'public/models/bodyparts3d/pulmonary/branch-types.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(
  JSON.stringify({
    check: process.argv.includes('--check'),
    subsets: subsets.length,
    sourceFiles: subsets.reduce((n, s) => n + s.sources.length, 0),
    triangles: subsets.reduce((n, s) => n + s.triangles, 0),
    bundles,
  }),
);
