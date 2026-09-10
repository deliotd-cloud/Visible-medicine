import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Group, Mesh, MeshStandardMaterial, Matrix4, Vector3 } from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import {
  mergeVertices,
  mergeGeometries,
} from 'three/addons/utils/BufferGeometryUtils.js';
import { loadSourceHolds } from './load-source-holds.mjs';
import { cache } from './bodyparts-archive.mjs';

const hash = (b) => createHash('sha256').update(b).digest('hex');
const { catalog, records, policy, evidence } = await loadSourceHolds();
const auditBytes = await readFile('docs/pulmonary-source-audit.json');
const audit = JSON.parse(auditBytes);
assert.deepEqual(audit.evidence, evidence);
const parents = ['FMA7309', 'FMA7310'].map((id) =>
  catalog.structures.find((s) => s.fmaId === id),
);
const matrix = new Matrix4().fromArray(
  catalog.coordinateSystem.sourceToSceneColumnMajor,
);
const structures = [],
  bundles = [];
const output = 'public/models/bodyparts3d/pulmonary';
await mkdir(output, { recursive: true });
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
};
for (const parent of parents) {
  const group = new Group();
  const side = parent.laterality,
    bundleId = `pulmonary-${side}`;
  for (const lobe of audit.lobes.filter((l) => l.parentId === parent.id)) {
    const definition = records.find(
      (r) => r.tree === 'partof' && r.id === lobe.definition.id,
    );
    assert.deepEqual(definition, lobe.definition);
    policy.assertNoKnownHolds([definition]);
    assert.equal(lobe.roleCounts.unclassified, 0);
    const parts = [],
      sources = [];
    for (const file of definition.files) {
      const source = parent.sources.find((f) => f.file === file);
      assert(source);
      const raw = await readFile(`${cache}/partof/${file}.obj`);
      assert.equal(hash(raw), source.sha256);
      assert.equal(
        lobe.files.find((f) => f.file === file).sha256,
        source.sha256,
      );
      sources.push(source);
      new OBJLoader().parse(raw.toString()).traverse((mesh) => {
        if (!mesh.isMesh) return;
        let geometry = mesh.geometry.clone();
        geometry.deleteAttribute('normal');
        geometry.deleteAttribute('uv');
        geometry = mergeVertices(geometry, 0.000001);
        geometry.computeVertexNormals();
        geometry.applyMatrix4(matrix);
        parts.push(geometry);
      });
    }
    const geometry = mergeGeometries(parts);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox,
      center = box.getCenter(new Vector3());
    let anchor = center.clone(),
      distance = Infinity;
    const positions = geometry.getAttribute('position');
    for (let i = 0; i < positions.count; i++) {
      const point = new Vector3().fromBufferAttribute(positions, i),
        d = point.distanceToSquared(center);
      assert(point.toArray().every(Number.isFinite));
      if (d < distance) {
        anchor = point;
        distance = d;
      }
    }
    const level = definition.name.split(' ')[0];
    assert(['upper', 'middle', 'lower'].includes(level));
    const id = `vm:anatomy:body:thorax:${side}:organ:${side}-${level}-lobe-branches`;
    const name = `${side[0].toUpperCase() + side.slice(1)} ${level} lobe branches`;
    const mesh = new Mesh(geometry, new MeshStandardMaterial());
    mesh.name = definition.id;
    mesh.userData = {
      structureId: id,
      fmaId: definition.id,
      parentId: parent.id,
    };
    group.add(mesh);
    structures.push({
      id,
      fmaId: definition.id,
      name,
      sourceName: definition.name,
      system: 'organs',
      category: 'organ',
      laterality: side,
      region: 'thorax',
      regions: ['thorax'],
      bundle: bundleId,
      nodeName: definition.id,
      bounds: { min: box.min.toArray(), max: box.max.toArray() },
      center: center.toArray(),
      anchor: anchor.toArray(),
      sourceTree: 'partof',
      sources,
      parentId: parent.id,
      level,
      roleCounts: lobe.roleCounts,
      coverageNote:
        'Partial source representation: airway and vessel branches grouped by lobe membership; no lobe parenchyma, fissure surfaces, alveoli or complete bronchovascular territories. Not a volume or segmentation mask.',
      provenance: {
        method: 'licensed-source-mesh',
        license: catalog.license,
        sourceVersion: '4.0',
        recovered: false,
      },
      validation: { status: 'unvalidated', anatomicalReview: false },
    });
  }
  const bytes = Buffer.from(
    await new GLTFExporter().parseAsync(group, { binary: true }),
  );
  await writeFile(`${output}/${bundleId}.glb`, bytes);
  bundles.push({
    id: bundleId,
    url: `/models/bodyparts3d/pulmonary/${bundleId}.glb?v=${hash(bytes)}`,
    sha256: hash(bytes),
    bytes: bytes.length,
    structures: group.children.length,
  });
}
const manifest = {
  version: 1,
  sourceVersion: '4.0',
  license: catalog.license,
  credit: catalog.credit,
  coordinateSystem: catalog.coordinateSystem,
  evidence,
  auditSha256: hash(auditBytes),
  parents,
  regions: [
    {
      id: 'thorax',
      name: 'Lung branch groups',
      description: 'Airway and vessel groups, not lobe tissue surfaces.',
    },
  ],
  structures,
  selectableIds: structures.map((s) => s.id),
  contextIds: [],
  bundles,
  coverage: {
    organs:
      'Five partial lobe representations from existing parent lung meshes; zero new unique source files and no lung envelope.',
  },
  excluded: [],
};
await writeFile(
  `${output}/catalog.json`,
  JSON.stringify(manifest, null, 2) + '\n',
);
console.log(
  JSON.stringify({
    groups: structures.length,
    files: structures.reduce((n, s) => n + s.sources.length, 0),
    bundles,
  }),
);
