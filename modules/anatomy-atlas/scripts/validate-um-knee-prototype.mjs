import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Matrix4, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const hash = (b) => createHash('sha256').update(b).digest('hex');
const base = 'content/prototypes/um-knee';
const raw = await readFile(`${base}/source-audit.json`), report = JSON.parse(raw);
let checks = 0;
const same = (a, b, message) => { checks++; assert.deepEqual(a, b, message); };
same(hash(raw), '4c7f705392f57ac7ab22d4fd0cdfff95e956ca88686bc640521a1203006548d8');
same([report.prototypeOnly, report.admitted, report.registeredToBodyParts3D, report.dicomDownloaded, report.segmentationDownloaded], [true, false, false, false, false]);
same(report.source.license, 'CC0-1.0');
same(hash(await readFile('LICENSES/um-lower-limb-v1-2/dataverse.json')), 'a9d0957579f4c78975978e12f5627fc9e0be758da676dd11d16dd72a303e5375');
same(hash(await readFile('LICENSES/um-lower-limb-v1-2/readme.txt')), 'deb6b13e74e499015a79a84c0bc5c4faa15cc8a763de43ebb8ec088824fc2967');
same(hash(await readFile('public/models/bodyparts3d/full-body/catalog.json')), report.bodyParts3dCatalogSha256);
same(report.structures.map((s) => s.slug), ['femur','tibia','fibula','patella','femoral-cartilage','tibial-cartilage','patellar-cartilage','acl','pcl','mcl','lcl','patellar-ligament','meniscus-group','quadriceps-tendon','popliteus']);
same(new Set(report.structures.map((s) => s.id)).size, 15);
same(report.structures.every((s) => s.id.startsWith('vm:reference:um-5t6tz7-v1-2:knee:') && s.fmaId === null && s.validation.anatomicalReview === false), true);
same(report.structures.filter((s) => s.degenerateTriangles).map((s) => [s.slug, s.degenerateTriangles]), [['femoral-cartilage',8],['tibial-cartilage',8],['mcl',16],['meniscus-group',8]]);
same(report.structures.reduce((n, s) => n + s.display.omittedSourceFaces.length, 0), 40);
same(report.glb.triangles, 293156);
same(report.glb.sourceTriangles, 293196);
const matrix = new Matrix4().fromArray(report.displayTransformColumnMajor);
same(new Vector3(1, 0, 0).applyMatrix4(matrix).toArray(), [0.01, 0, 0], 'Source left remains viewer left');
same(new Vector3(0, 1, 0).applyMatrix4(matrix).toArray(), [0, 0, -0.01], 'Source posterior becomes negative viewer Z');
same(new Vector3(0, 0, 1).applyMatrix4(matrix).toArray(), [0, 0.01, 0], 'Source superior becomes viewer Y');
same(matrix.determinant() > 0, true, 'No reflection/mirroring');
const bytes = await readFile(`${base}/knee.glb`);
same(hash(bytes), 'f4199fc6fdaed1a7ba2da1ae76bff266f0baf4e0972e0c79f9975fc526d17b48');
same(bytes.length, 5297012);
const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
let retained = 0;
for (const structure of report.structures) {
  const source = await readFile(`${base}/source/${structure.sourceFile}`);
  same(hash(source), structure.sha256);
  same(source.length, structure.bytes);
  same(source.readUInt32LE(80), structure.triangles);
  const geometry = gltf.scene.getObjectByName(structure.slug).geometry;
  same(geometry.index.count / 3, structure.display.triangles);
  const positions = geometry.getAttribute('position'), normals = geometry.getAttribute('normal');
  const omitted = new Set(structure.display.omittedSourceFaces);
  let face = 0, maxError = 0;
  for (let i = 0; i < structure.triangles; i++) {
    const sourcePoints = [0, 1, 2].map((j) => new Vector3(...[0, 1, 2].map((k) => source.readFloatLE(84 + i * 50 + 12 + j * 12 + k * 4))));
    const areaZero = new Vector3().crossVectors(sourcePoints[1].clone().sub(sourcePoints[0]), sourcePoints[2].clone().sub(sourcePoints[0])).lengthSq() === 0;
    assert.equal(omitted.has(i), areaZero, 'Only exact original zero-area faces may be removed');
    if (areaZero) continue;
    for (let j = 0; j < 3; j++) {
      const actual = new Vector3().fromBufferAttribute(positions, geometry.index.getX(face * 3 + j));
      maxError = Math.max(maxError, actual.distanceTo(sourcePoints[j].applyMatrix4(matrix)));
    }
    face++;
  }
  same(face, structure.display.triangles, 'All other triangles retained in source order');
  same(maxError < 0.000001, true, 'Original source triangle positions preserved within float32 quantisation');
  same(Array.from(normals.array).every(Number.isFinite), true);
  same([structure.display.boundaryEdges, structure.display.nonManifoldEdges], [0, 0]);
  retained += face;
}
same(retained, 293156);
// Broad source-coordinate relationships, not attachment/contact certification.
const byId = Object.fromEntries(report.structures.map((s) => [s.slug, s]));
same(byId.mcl.sourceBounds.min[0] > byId.lcl.sourceBounds.max[0], true, 'Medial source ligament lies toward +L relative to LCL in this right-knee reference');
same(byId.patella.sourceBounds.max[1] < byId.tibia.sourceBounds.min[1], true, 'Patella is anterior in declared LPS axes');
console.log(JSON.stringify({ passed: true, checks, sourceTrianglesIndividuallyChecked: 293196, retainedTriangles: retained, omittedZeroAreaFaces: 40, structures: 15, prototypeOnly: true, clinicalValidation: false, browserTesting: false }));
