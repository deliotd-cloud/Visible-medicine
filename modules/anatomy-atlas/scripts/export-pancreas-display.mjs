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

// A reversible display derivative; all four archived source files stay intact.
const hash = (b) => createHash('sha256').update(b).digest('hex');
const { catalog, evidence } = await loadSourceHolds();
const auditBytes = await readFile('docs/pancreatic-source-audit.json');
const audit = JSON.parse(auditBytes);
assert.deepEqual(audit.evidence, evidence);
const original = catalog.structures.find((s) => s.fmaId === 'FMA7198');
assert.deepEqual(audit.parent, original);
const overlap = audit.pairs.find((p) => p.files.join() === 'FJ1895,FJ2629');
assert.equal(overlap.exactSharedTriangles, 93);
assert(overlap.firstToSecond.thresholds[1].weightedFraction > 0.96);
assert.equal(overlap.secondToFirst.thresholds[1].weightedFraction, 1);
const keptFiles = ['FJ1895', 'FJ1896', 'FJ2630'];
const sources = original.sources.filter((s) => keptFiles.includes(s.file));
assert.equal(sources.length, 3);
const matrix = new Matrix4().fromArray(
  catalog.coordinateSystem.sourceToSceneColumnMajor,
);
const geometries = [];
for (const source of original.sources) {
  const raw = await readFile(`${cache}/partof/${source.file}.obj`);
  assert.equal(hash(raw), source.sha256);
  if (!keptFiles.includes(source.file)) continue;
  new OBJLoader().parse(raw.toString()).traverse((mesh) => {
    if (!mesh.isMesh) return;
    let g = mesh.geometry.clone();
    g.deleteAttribute('normal');
    g.deleteAttribute('uv');
    g = mergeVertices(g, 0.000001);
    g.computeVertexNormals();
    g.applyMatrix4(matrix);
    geometries.push(g);
  });
}
const geometry = mergeGeometries(geometries);
assert.equal(geometry.index.count / 3, 12690);
geometry.computeBoundingBox();
const box = geometry.boundingBox,
  center = box.getCenter(new Vector3());
const p = geometry.getAttribute('position');
let anchor = center.clone(),
  closest = Infinity;
for (let i = 0; i < p.count; i++) {
  const point = new Vector3().fromBufferAttribute(p, i),
    distance = point.distanceToSquared(center);
  if (distance < closest) {
    closest = distance;
    anchor = point;
  }
}
const mesh = new Mesh(geometry, new MeshStandardMaterial());
mesh.name = original.nodeName;
mesh.userData = {
  structureId: original.id,
  fmaId: original.fmaId,
  sourceCleanup: 'pancreas-overlap-v1',
  anatomicalReview: false,
};
const group = new Group();
group.add(mesh);
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
const directory = 'public/models/bodyparts3d/pancreas';
const replacement = {
  ...original,
  bundle: 'pancreas-corrected-parent',
  sources,
  bounds: { min: box.min.toArray(), max: box.max.toArray() },
  center: center.toArray(),
  anchor: anchor.toArray(),
  coverageNote:
    'One source-labelled pancreatic envelope and two duct-source components. A nearly coincident parenchymal alternative is omitted from display, not reconstructed as another tissue layer. Original sources are retained; tissue identity, duct continuity and clinical accuracy remain unvalidated.',
};
const correction = {
  version: 1,
  original,
  replacement,
  originalBundle: catalog.bundles.find((b) => b.id === original.bundle),
  bundle: {
    id: replacement.bundle,
    url: '/models/bodyparts3d/pancreas/pancreas.glb?v=' + hash(bytes),
    bytes: bytes.length,
    sha256: hash(bytes),
    structures: 1,
  },
  coordinateSystem: catalog.coordinateSystem,
  evidence,
  auditSha256: hash(auditBytes),
  modification: {
    omitted: [original.sources.find((s) => s.file === 'FJ2629')],
    retainedTriangles: 12690,
    omittedTriangles: 4272,
    clinicalApproval: false,
    reason:
      'Near-coincident alternative envelope; not an extra dissectible tissue layer.',
  },
  licence: audit.licence,
};
if (process.argv.includes('--check')) {
  assert.deepEqual(await readFile(`${directory}/pancreas.glb`), bytes);
  assert.deepEqual(
    JSON.parse(await readFile(`${directory}/display-correction.json`)),
    correction,
  );
} else {
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/pancreas.glb`, bytes);
  await writeFile(
    `${directory}/display-correction.json`,
    JSON.stringify(correction, null, 2) + '\n',
  );
}
console.log({
  retainedTriangles: 12690,
  omittedTriangles: 4272,
  bytes: bytes.length,
  sha256: hash(bytes),
  clinicalApproval: false,
});
