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
import { eyeLayerDefinitions } from './eye-layer-definitions.mjs';
import { cleanEyeGeometry, eyeCleanupRecipes } from './eye-source-cleanup.mjs';
import { sourceObjShape } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';

const hash = (b) => createHash('sha256').update(b).digest('hex');
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const { catalog, records, policy, evidence } = await loadSourceHolds();
const parents = catalog.structures.filter((s) =>
  ['FMA12514', 'FMA12515'].includes(s.fmaId),
);
assert.equal(parents.length, 2);
const group = new Group(),
  structures = [],
  excluded = [],
  loader = new OBJLoader();
const cleanupEvidence = [];
const matrix = new Matrix4().fromArray(
  catalog.coordinateSystem.sourceToSceneColumnMajor,
);
for (const [parentFma, side, fma, name, files, kind] of eyeLayerDefinitions) {
  const parent = parents.find((s) => s.fmaId === parentFma);
  const definition = records.find((r) => r.tree === 'partof' && r.id === fma);
  assert.equal(definition.name, name);
  assert.deepEqual(definition.files, files);
  policy.assertNoKnownHolds([definition]);
  const sources = files.map((file) => {
    const source = parent.sources.find((f) => f.file === file);
    assert(source, 'Component outside parent');
    return source;
  });
  const geometries = [];
  for (const source of sources) {
    const raw = await readFile(`${cache}/partof/${source.file}.obj`);
    assert.equal(hash(raw), source.sha256);
    const recipe = eyeCleanupRecipes.find((r) => r.file === source.file);
    if (recipe) {
      const topology = sourceTopology(sourceObjShape(raw));
      const fragments = topology.components.filter((c) => c.bounds.min[0] > 0);
      assert.equal(
        fragments.reduce((sum, c) => sum + c.triangles, 0),
        recipe.count,
      );
      assert(
        fragments.every(
          (c) =>
            c.bounds.max.every((v, i) => v - c.bounds.min[i] < 0.1) &&
            c.areaMm2 < 0.01,
        ),
        'Opposite-side component is not a reviewed speck',
      );
      cleanupEvidence.push({
        ...recipe,
        fragments,
        retainedFaces: recipe.faces - recipe.count,
      });
    }
    loader.parse(raw.toString()).traverse((mesh) => {
      if (!mesh.isMesh) return;
      let g = mesh.geometry.clone();
      g.deleteAttribute('normal');
      g.deleteAttribute('uv');
      g = cleanEyeGeometry(g, source);
      g = mergeVertices(g, 0.0001);
      g.computeVertexNormals();
      g.applyMatrix4(matrix);
      geometries.push(g);
    });
  }
  const geometry = mergeGeometries(geometries);
  geometry.computeBoundingBox();
  const box = geometry.boundingBox,
    center = box.getCenter(new Vector3()),
    position = geometry.getAttribute('position');
  const oppositeVertices = Array.from({ length: position.count }, (_, i) =>
    position.getX(i),
  ).filter((x) => (side === 'right' ? x >= 0 : x <= 0)).length;
  assert.equal(
    oppositeVertices,
    0,
    'Unexpected component laterality discrepancy',
  );
  let anchor = center.clone(),
    best = Infinity;
  for (let i = 0; i < position.count; i++) {
    const p = new Vector3().fromBufferAttribute(position, i),
      d = p.distanceToSquared(center);
    if (d < best) {
      best = d;
      anchor = p;
    }
  }
  const category =
    kind === 'chamber' ? 'space' : kind === 'zonule' ? 'ligament' : 'organ';
  const id = `vm:anatomy:body:head-neck:${String(side)}:${category}:${String(name).replace(/[^a-z0-9]+/g, '-')}`;
  const mesh = new Mesh(geometry, new MeshStandardMaterial());
  mesh.name = fma;
  mesh.userData = { structureId: id, fmaId: fma, parentId: parent.id };
  group.add(mesh);
  structures.push({
    id,
    fmaId: fma,
    name: name[0].toUpperCase() + name.slice(1),
    sourceName: name,
    system: kind === 'zonule' ? 'connective' : 'organs',
    category,
    laterality: side,
    region: 'head-neck',
    regions: ['head-neck'],
    bundle: 'eye-layers',
    nodeName: fma,
    bounds: { min: box.min.toArray(), max: box.max.toArray() },
    center: center.toArray(),
    anchor: anchor.toArray(),
    sourceTree: 'partof',
    sources,
    coverageNote:
      'Existing eyeball source component, independently selectable only in the eye-layer view. Anatomical and clinical validation pending; not a microscopic layer or patient segmentation.',
    provenance: {
      method: 'licensed-source-mesh',
      license: catalog.license,
      sourceVersion: '4.0',
      recovered: false,
    },
    validation: { status: 'unvalidated', anatomicalReview: false },
    parentId: parent.id,
    kind,
  });
}
for (const parent of parents) {
  const sources = [...structures, ...excluded]
    .filter((s) => s.parentId === parent.id)
    .flatMap((s) => s.sources.map((f) => f.file));
  assert.equal(
    new Set(sources).size,
    sources.length,
    'Overlapping component ownership',
  );
  assert.deepEqual(
    [...sources].sort(compare),
    parent.sources.map((f) => f.file).sort(compare),
    'Partition must preserve all existing parent files',
  );
}
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
};
const bytes = Buffer.from(
  await new GLTFExporter().parseAsync(group, { binary: true }),
);
const output = 'public/models/bodyparts3d/eye-layers';
await mkdir(output, { recursive: true });
await writeFile(`${output}/eye-layers.glb`, bytes);
const manifest = {
  version: 1,
  sourceVersion: '4.0',
  license: catalog.license,
  credit: catalog.credit,
  coordinateSystem: catalog.coordinateSystem,
  evidence,
  parents: parents.map((p) => ({
    id: p.id,
    fmaId: p.fmaId,
    laterality: p.laterality,
    sources: p.sources,
  })),
  regions: [
    {
      id: 'head-neck',
      name: 'Eye layers',
      description:
        'Existing source components; independent clinical validation pending.',
    },
  ],
  structures,
  bundles: [
    {
      id: 'eye-layers',
      url: '/models/bodyparts3d/eye-layers/eye-layers.glb?v=' + hash(bytes),
      bytes: bytes.length,
      sha256: hash(bytes),
      structures: structures.length,
    },
  ],
  coverage: {
    nerves: 'Not included in this component view.',
    organs:
      'Eight left-eye and seven right-eye components. Thirty-six pinned opposite-side source triangles are suppressed from four right components. Retina, finer layers and a right anterior chamber are not independently segmented.',
  },
  sourceCleanup: cleanupEvidence,
  excluded,
};
await writeFile(
  `${output}/catalog.json`,
  JSON.stringify(manifest, null, 2) + '\n',
);
// Separate aggregate for the main atlas: one corrected source representation,
// never rendered together with its independently selectable child layers.
const original = parents.find((p) => p.fmaId === 'FMA12514');
const right = structures.filter((s) => s.parentId === original.id);
const parentGeometry = mergeGeometries(
  right.map((s) => group.children.find((m) => m.name === s.nodeName).geometry),
);
parentGeometry.computeBoundingBox();
const box = parentGeometry.boundingBox,
  center = box.getCenter(new Vector3()),
  p = parentGeometry.getAttribute('position');
let anchor = center.clone(),
  distance = Infinity;
for (let i = 0; i < p.count; i++) {
  const point = new Vector3().fromBufferAttribute(p, i),
    d = point.distanceToSquared(center);
  if (d < distance) {
    distance = d;
    anchor = point;
  }
}
const parentMesh = new Mesh(parentGeometry, new MeshStandardMaterial());
parentMesh.name = original.nodeName;
parentMesh.userData = {
  structureId: original.id,
  fmaId: original.fmaId,
  sourceCleanup: 'eye-fragments-v1',
};
const parentGroup = new Group();
parentGroup.add(parentMesh);
const parentBytes = Buffer.from(
  await new GLTFExporter().parseAsync(parentGroup, { binary: true }),
);
await writeFile(`${output}/right-eyeball.glb`, parentBytes);
const replacement = {
  ...original,
  bundle: 'eye-corrected-parent',
  bounds: { min: box.min.toArray(), max: box.max.toArray() },
  center: center.toArray(),
  anchor: anchor.toArray(),
  coverageNote:
    'Source-derived right eyeball with 36 exact disconnected opposite-side triangles suppressed. All retained source surfaces are unchanged in position; anatomical and clinical review pending.',
};
await writeFile(
  `${output}/display-correction.json`,
  JSON.stringify(
    {
      version: 1,
      original,
      replacement,
      bundle: {
        id: 'eye-corrected-parent',
        url:
          '/models/bodyparts3d/eye-layers/right-eyeball.glb?v=' +
          hash(parentBytes),
        bytes: parentBytes.length,
        sha256: hash(parentBytes),
        structures: 1,
      },
      coordinateSystem: catalog.coordinateSystem,
      cleanup: cleanupEvidence,
      license: catalog.license,
      credit: catalog.credit,
    },
    null,
    2,
  ) + '\n',
);
console.log({
  components: structures.length,
  sourceFilesConsidered: 17,
  renderedSourceFiles: structures.reduce(
    (count, s) => count + s.sources.length,
    0,
  ),
  excludedComponents: excluded.length,
  bytes: bytes.length,
  sha256: hash(bytes),
  parentCatalogueChanged: false,
  correctedParent: {
    bytes: parentBytes.length,
    sha256: hash(parentBytes),
    bounds: replacement.bounds,
  },
});
