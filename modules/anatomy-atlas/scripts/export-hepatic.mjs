import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
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
const auditBytes = await readFile('docs/hepatic-source-audit.json'),
  audit = JSON.parse(auditBytes);
assert.deepEqual(audit.evidence, evidence);
const parent = catalog.structures.find((s) => s.fmaId === 'FMA7197');
assert.deepEqual(audit.parent, parent);
const matrix = new Matrix4().fromArray(
  catalog.coordinateSystem.sourceToSceneColumnMajor,
);
const directory = 'public/models/bodyparts3d/hepatic';
await mkdir(directory, { recursive: true });
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
};
const structures = [],
  bundles = [];
for (const context of [false, true]) {
  const bundleId = context ? 'hepatic-tissue-context' : 'hepatic-branches',
    group = new Group();
  const entries = context
    ? [
        {
          definition: {
            id: 'FMA7197',
            name: 'liver tissue context',
            files: audit.tissueFiles,
          },
          name: 'Liver tissue context',
          kind: 'context',
          laterality: 'unpaired',
        },
      ]
    : audit.groups;
  for (const entry of entries) {
    const { definition, name, kind, laterality } = entry;
    if (!context) {
      const current = records.find(
        (r) => r.tree === 'partof' && r.id === definition.id,
      );
      assert.deepEqual(current, definition);
      policy.assertNoKnownHolds([current]);
    }
    const geometries = [],
      sources = [];
    for (const file of definition.files) {
      const source = parent.sources.find((s) => s.file === file);
      assert(source);
      const raw = await readFile(`${cache}/partof/${file}.obj`);
      assert.equal(hash(raw), source.sha256);
      assert.equal(
        audit.files.find((f) => f.file === file)?.sha256,
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
        geometries.push(geometry);
      });
    }
    const geometry = mergeGeometries(geometries);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox,
      center = box.getCenter(new Vector3()),
      positions = geometry.getAttribute('position');
    let anchor = center.clone(),
      distance = Infinity;
    for (let i = 0; i < positions.count; i++) {
      const p = new Vector3().fromBufferAttribute(positions, i),
        d = p.distanceToSquared(center);
      assert(p.toArray().every(Number.isFinite));
      if (d < distance) {
        anchor = p;
        distance = d;
      }
    }
    const id = `vm:anatomy:body:abdomen:${laterality}:${kind === 'biliary' || context ? 'organ' : 'vessel'}:${name.toLowerCase().replaceAll(' ', '-')}`;
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
      system: kind === 'biliary' || context ? 'organs' : 'vessels',
      category: kind === 'biliary' || context ? 'organ' : 'vessel',
      laterality,
      region: 'abdomen',
      regions: ['abdomen'],
      bundle: bundleId,
      nodeName: definition.id,
      bounds: { min: box.min.toArray(), max: box.max.toArray() },
      center: center.toArray(),
      anchor: anchor.toArray(),
      sourceTree: 'partof',
      sources,
      parentId: parent.id,
      kind,
      coverageNote: context
        ? 'Nine original tissue files retained as nonselectable context. Source segment conflicts and topology defects prevent validated segment labels, clean-envelope or volume claims.'
        : 'Partial source-labelled group. Branch continuity, lumen and territory are not validated; not a complete vascular or biliary tree.',
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
  await writeFile(`${directory}/${bundleId}.glb`, bytes);
  bundles.push({
    id: bundleId,
    url: `/models/bodyparts3d/hepatic/${bundleId}.glb?v=${hash(bytes)}`,
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
  parent,
  structures,
  selectableIds: structures
    .filter((s) => s.kind !== 'context')
    .map((s) => s.id),
  contextIds: structures.filter((s) => s.kind === 'context').map((s) => s.id),
  bundles,
  regions: [
    {
      id: 'abdomen',
      name: 'Liver internal branches',
      description: 'Partial source vessel and biliary groups.',
    },
  ],
  coverage: {
    organs:
      'Seven branch groups and optional unlabelled tissue context, not a validated segment map.',
  },
  excluded: [],
};
await writeFile(
  `${directory}/catalog.json`,
  JSON.stringify(manifest, null, 2) + '\n',
);
console.log(
  JSON.stringify({
    selectable: manifest.selectableIds.length,
    context: manifest.contextIds.length,
    files: structures.reduce((n, s) => n + s.sources.length, 0),
    bundles,
  }),
);
