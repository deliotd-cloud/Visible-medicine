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
const quarantined = new Set(['FMA58239', 'FMA58839', 'FMA58299', 'FMA58271']);
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
    loader.parse(raw.toString()).traverse((mesh) => {
      if (!mesh.isMesh) return;
      let g = mesh.geometry.clone();
      g.deleteAttribute('normal');
      g.deleteAttribute('uv');
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
  if (quarantined.has(fma)) {
    assert(
      oppositeVertices > 0,
      'Expected side discrepancy changed; review the source',
    );
    excluded.push({
      fmaId: fma,
      name,
      parentId: parent.id,
      kind,
      sources,
      sourceTree: 'partof',
      oppositeVertices,
      reason:
        'Source component contains opposite-side vertices. Withheld from independent layer rendering pending source review; no trimming, reflection or repair.',
    });
    geometry.dispose();
    continue;
  }
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
      url: '/models/bodyparts3d/eye-layers/eye-layers.glb',
      bytes: bytes.length,
      sha256: hash(bytes),
      structures: structures.length,
    },
  ],
  coverage: {
    nerves: 'Not included in this component view.',
    organs:
      'Eight left-eye components; right iris, lens and vitreous body only. Four right components have source laterality discrepancies and are withheld. Retina and finer tissue layers are not independently segmented.',
  },
  excluded,
};
await writeFile(
  `${output}/catalog.json`,
  JSON.stringify(manifest, null, 2) + '\n',
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
});
