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
import { sourceObjShape } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';

/** @type {Array<[string, string, string[], 'left' | 'right', string]>} */
const definitions = [
  [
    'FMA72970',
    'left frontal lobe',
    ['FJ1744', 'FJ1787', 'FJ1800', 'FJ1833'],
    'left',
    'frontal',
  ],
  [
    'FMA72969',
    'right frontal lobe',
    ['FJ1745', 'FJ1788', 'FJ1801', 'FJ1834'],
    'right',
    'frontal',
  ],
  [
    'FMA72974',
    'left parietal lobe',
    ['FJ1732', 'FJ1797', 'FJ1835', 'FJ1841'],
    'left',
    'parietal',
  ],
  [
    'FMA72973',
    'right parietal lobe',
    ['FJ1733', 'FJ1798', 'FJ1836', 'FJ1842'],
    'right',
    'parietal',
  ],
  [
    'FMA72972',
    'left temporal lobe',
    ['FJ1746', 'FJ1783', 'FJ1785', 'FJ1789'],
    'left',
    'temporal',
  ],
  [
    'FMA72971',
    'right temporal lobe',
    ['FJ1747', 'FJ1784', 'FJ1786', 'FJ1790'],
    'right',
    'temporal',
  ],
  ['FMA72976', 'left occipital lobe', ['FJ1791'], 'left', 'occipital'],
  ['FMA72975', 'right occipital lobe', ['FJ1792'], 'right', 'occipital'],
  ['FMA72978', 'left insula', ['FJ1748'], 'left', 'insula'],
  ['FMA72977', 'right insula', ['FJ1749'], 'right', 'insula'],
  [
    'FMA72801',
    'anterior part of left superior temporal gyrus',
    ['FJ1837'],
    'left',
    'superior-temporal-anterior',
  ],
  [
    'FMA72800',
    'anterior part of right superior temporal gyrus',
    ['FJ1838'],
    'right',
    'superior-temporal-anterior',
  ],
  [
    'FMA72805',
    'posterior part of left superior temporal gyrus',
    ['FJ1839'],
    'left',
    'superior-temporal-posterior',
  ],
  [
    'FMA72804',
    'posterior part of right superior temporal gyrus',
    ['FJ1840'],
    'right',
    'superior-temporal-posterior',
  ],
];
const hash = (b) => createHash('sha256').update(b).digest('hex');
const supplements = JSON.parse(
  await readFile('content/cerebral-supplement-audit.json'),
);
const detached = {
  FJ1744: [3274, 16],
  FJ1745: [3270, 22],
  FJ1833: [6256, 196],
  FJ1834: [6286, 164],
};

const { catalog, records, policy, evidence } = await loadSourceHolds();
assert.deepEqual(supplements.evidence, evidence);
assert(supplements.registrationReferences.every((r) => r.geometryIdentical));
const parent = catalog.structures.find((s) => s.fmaId === 'FMA50801');
assert.equal(parent.sourceTree, 'partof');
assert.equal(parent.sources.length, 59);
const matrix = new Matrix4().fromArray(
  catalog.coordinateSystem.sourceToSceneColumnMajor,
);
const group = new Group(),
  structures = [],
  sourceReports = [];
for (const [fmaId, name, files, side, groupName] of definitions) {
  const supplemental = groupName.startsWith('superior-temporal');
  const tree = supplemental ? 'isa' : 'partof';
  const definition = records.find((r) => r.tree === tree && r.id === fmaId);
  assert.equal(definition.name, name);
  assert.deepEqual(
    definition.files,
    files,
    'Require complete official compound, not one hemisphere',
  );
  policy.assertNoKnownHolds([definition]);
  const sources = files.map((file) => {
    if (!supplemental) return parent.sources.find((s) => s.file === file);
    const s = supplements.candidates.find(
      (c) => c.fmaId === fmaId && c.file === file,
    );
    assert(s && !s.inParentSourceList && s.exactSharedParentTriangles === 0);
    return { file, sha256: s.sha256 };
  });
  assert(sources.every(Boolean));
  const parts = [];
  for (const source of sources) {
    const raw = await readFile(`${cache}/${tree}/${source.file}.obj`);
    assert.equal(hash(raw), source.sha256);
    const topology = sourceTopology(sourceObjShape(raw));
    // Detached original fragments are retained; their status is not guessed from size.
    assert.equal(topology.components.length, detached[source.file] ? 2 : 1);
    if (detached[source.file])
      assert.deepEqual(
        topology.components.map((c) => c.triangles),
        detached[source.file],
      );
    assert.equal(topology.duplicateFaces, 0);
    for (const key of [
      'collapsedFaces',
      'degenerateFaces',
      'boundaryEdges',
      'nonManifoldEdges',
      'nonManifoldVertices',
      'inconsistentWindingEdges',
    ])
      assert.equal(topology[key], 0);
    sourceReports.push({
      tree,
      file: source.file,
      sha256: source.sha256,
      topology,
    });
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
  assert([...box.min.toArray(), ...box.max.toArray()].every(Number.isFinite));
  assert(
    side === 'left' ? box.min.x > 0 : box.max.x < 0,
    'Entire source stays on the specified side',
  );
  let anchor = center.clone(),
    distance = Infinity;
  const positions = geometry.getAttribute('position');
  for (let i = 0; i < positions.count; i++) {
    const p = new Vector3().fromBufferAttribute(positions, i),
      d = p.distanceToSquared(center);
    if (d < distance) {
      anchor = p;
      distance = d;
    }
  }
  const id = `vm:anatomy:body:head-neck:${side}:organ:${name.replaceAll(' ', '-')}`;
  const mesh = new Mesh(geometry, new MeshStandardMaterial());
  mesh.name = fmaId;
  mesh.userData = {
    structureId: id,
    fmaId,
    studyParentId: parent.id,
    sourceRelationship: supplemental
      ? 'supplemental-source'
      : 'parent-component',
  };
  group.add(mesh);
  structures.push({
    id,
    fmaId,
    name: name[0].toUpperCase() + name.slice(1),
    sourceName: name,
    system: 'nerves',
    category: 'organ',
    laterality: side,
    group: groupName,
    region: 'head-neck',
    regions: ['head-neck'],
    bundle: 'cerebral',
    nodeName: fmaId,
    bounds: { min: box.min.toArray(), max: box.max.toArray() },
    center: center.toArray(),
    anchor: anchor.toArray(),
    sourceTree: tree,
    sources,
    studyParentId: parent.id,
    sourceRelationship: supplemental
      ? 'supplemental-source'
      : 'parent-component',
    coverageNote: supplemental
      ? 'Additional official ISA source subdivision, absent from the original parent; not a validated complete superior temporal gyrus or functional territory.'
      : 'All members of the official PART-OF definition, not complete anatomical coverage. Superior temporal source subdivisions are separate additions. Detached frontal fragments are retained; no filled-in cortex is invented.',
    provenance: {
      method: 'licensed-source-mesh',
      license: catalog.license,
      sourceVersion: '4.0',
      recovered: supplemental,
    },
    validation: { status: 'unvalidated', anatomicalReview: false },
  });
}
assert.equal(
  new Set(
    structures.flatMap((s) =>
      s.sources.map((f) => s.sourceTree + '/' + f.file),
    ),
  ).size,
  32,
);
assert.equal(
  structures
    .filter((s) => s.sourceRelationship === 'parent-component')
    .flatMap((s) => s.sources).length,
  28,
);
const ventricular = JSON.parse(
  await readFile('public/models/bodyparts3d/ventricles/catalog.json'),
);
assert.deepEqual(ventricular.parent, parent);
const context = ventricular.structures.filter((s) =>
  ['FMA78450', 'FMA78449'].includes(s.fmaId),
);
assert.equal(context.length, 2);
assert(
  context.every((s) =>
    s.sources.every(
      (f) => !structures.some((p) => p.sources.some((v) => v.file === f.file)),
    ),
  ),
);
const contextBundle = ventricular.bundles.find((b) => b.id === 'ventricles');
assert.equal(
  hash(
    await readFile(
      'public' + new URL(contextBundle.url, 'https://local.invalid').pathname,
    ),
  ),
  contextBundle.sha256,
);
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
const output = 'public/models/bodyparts3d/cerebral';
await mkdir(output, { recursive: true });
await writeFile(`${output}/cerebral.glb`, bytes);
const manifest = {
  version: 1,
  sourceVersion: '4.0',
  license: catalog.license,
  credit: catalog.credit,
  coordinateSystem: catalog.coordinateSystem,
  evidence,
  parent,
  regions: [
    {
      id: 'head-neck',
      name: 'Cerebral regions',
      description: 'Existing source compounds; clinical validation pending.',
    },
  ],
  structures: [...structures, ...context],
  selectableIds: structures.map((s) => s.id),
  contextIds: context.map((s) => s.id),
  supplementalIds: structures
    .filter((s) => s.sourceRelationship === 'supplemental-source')
    .map((s) => s.id),
  supplementEvidenceSha256: hash(
    await readFile('content/cerebral-supplement-audit.json'),
  ),
  bundles: [
    {
      id: 'cerebral',
      url: `/models/bodyparts3d/cerebral/cerebral.glb?v=${hash(bytes)}`,
      bytes: bytes.length,
      sha256: hash(bytes),
      structures: 14,
    },
    contextBundle,
  ],
  coverage: {
    nerves:
      'Eight partial lobe representations and two insulae from the existing brain, plus four additional superior temporal subdivisions. Two ventricular context spaces. Not complete cortex or functional localization.',
    organs: 'No additional organs.',
  },
  excluded: [],
  sourceReports,
};
await writeFile(
  `${output}/catalog.json`,
  JSON.stringify(manifest, null, 2) + '\n',
);
console.log(
  JSON.stringify({
    structures: 14,
    files: 32,
    context: 2,
    bytes: bytes.length,
    sha256: hash(bytes),
    triangles: sourceReports.reduce((n, r) => n + r.topology.triangles, 0),
  }),
);
