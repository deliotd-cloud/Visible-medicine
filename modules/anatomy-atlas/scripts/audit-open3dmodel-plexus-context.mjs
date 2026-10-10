// Offline, same-source-frame context audit. No asset admission or registration.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {readFile, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readNamedObjObjects} from './open3dmodel-obj-source.mjs';
import {triangulateSourceObject} from './open3dmodel-triangulation.mjs';
import {prepareShape} from './vessel-shape-math.mjs';
import {sourceTopology} from './source-topology.mjs';

export const NAMES = Object.freeze(['Humerus.r', 'Scapula.r.', 'Clavicle.r']);
const root = resolve(import.meta.dirname, '..');
const original = 'F:/VisibleMedicine/staging/20261003-open3dmodel-plexus';
const reportPath = join(root, 'docs/open3dmodel-plexus-context-audit.json');
const sha = value => createHash('sha256').update(value).digest('hex');
const normalized = bytes => bytes.toString().replaceAll('\r\n', '\n');
async function fileSha(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}
const bounds = vertices => ({
  min: [0, 1, 2].map(axis => Math.min(...vertices.map(point => point[axis]))),
  max: [0, 1, 2].map(axis => Math.max(...vertices.map(point => point[axis]))),
});

export function auditObject(object, inventoryRow) {
  assert(NAMES.includes(object.name), `Unexpected object ${object.name}`);
  assert.equal(inventoryRow?.name, object.name, `Original label mismatch: ${object.name}`);
  assert.equal(object.startLine, inventoryRow.startLine, `Start line mismatch: ${object.name}`);
  assert.equal(object.vertices.length, inventoryRow.vertices, `Vertex count mismatch: ${object.name}`);
  assert.equal(object.faces.length, inventoryRow.faces, `Face count mismatch: ${object.name}`);
  assert.deepEqual(bounds(object.vertices), {min: inventoryRow.min, max: inventoryRow.max}, `Coordinates/bounds mismatch: ${object.name}`);
  const faceSizes = {};
  for (const face of object.faces) faceSizes[face.length] = (faceSizes[face.length] ?? 0) + 1;
  assert.deepEqual(faceSizes, inventoryRow.faceSizes, `Polygon counts mismatch: ${object.name}`);
  assert.equal(inventoryRow.crossObjectReferences, 0);
  const sourceGeometrySha256 = sha(JSON.stringify({vertices: object.vertices, faces: object.faces}));
  const converted = triangulateSourceObject(object);
  const record = {
    sourceName: object.name, sourceNamedRight: true, startLine: object.startLine,
    sourceVertices: object.vertices.length, sourceFaces: object.faces.length,
    sourceFaceSizes: faceSizes, sourceBounds: bounds(object.vertices),
    sourceGeometrySha256, failedFaces: converted.failures,
    nonplanarQuads: converted.nonplanarQuads,
    maxPlaneDistanceFraction: converted.maxPlaneDistanceFraction,
    nGons: converted.nGons.map(({sourceFace, polygonVertices, maxPlaneDistanceSourceUnits, planeDistanceFraction}) =>
      ({sourceFace, polygonVertices, maxPlaneDistanceSourceUnits, planeDistanceFraction})),
  };
  if (converted.failures.length) {
    return {...record, disposition: 'held-entire-source-object', triangles: null,
      derivedGeometrySha256: null, polygonMapSha256: null, topology: null};
  }
  const shape = prepareShape(object.vertices, converted.triangles);
  // The shared diagnostic uses an mm cutoff; here only exact zero is meaningful.
  for (const triangle of shape.triangles) triangle.degenerate = triangle.triangle.getArea() === 0;
  const topology = sourceTopology(shape);
  for (const component of topology.components) {
    component.areaSourceUnitsSquared = component.areaMm2;
    component.algebraicVolumeSourceUnitsCubed = component.algebraicVolumeMm3;
    delete component.areaMm2;
    delete component.algebraicVolumeMm3;
  }
  return {...record, disposition: 'offline-context-candidate', triangles: converted.triangles.length,
    derivedGeometrySha256: sha(JSON.stringify({vertices: object.vertices, faces: converted.triangles})),
    polygonMapSha256: sha(JSON.stringify(converted.polygonRanges)), topology,
    maxFloat32PositionDifferenceSourceUnits: Math.max(...object.vertices.flatMap(point => point.map(value => Math.abs(value - Math.fround(value)))))};
}

export async function buildAudit({sourceDir = original, metadataPath = join(root, 'docs/open3dmodel-plexus-source-inventory.json')} = {}) {
  const metadataText = normalized(await readFile(metadataPath));
  assert.equal(sha(metadataText), '2dfd9f51ffb03e54c14b90ff1f0338db866f7d03801312272ce7550f32bb123a', 'Metadata pin changed');
  const metadata = JSON.parse(metadataText);
  const fullInventoryPath = join(sourceDir, 'source-inventory.json');
  assert.equal(await fileSha(fullInventoryPath), metadata.fullOfflineInventorySha256, 'Full original inventory pin changed');
  const full = JSON.parse(await readFile(fullInventoryPath, 'utf8'));
  assert.equal(full.obj.sha256, metadata.obj.sha256);
  assert.equal(await fileSha(join(sourceDir, 'upper-limb.obj')), metadata.obj.sha256, 'Original OBJ pin changed');
  const rows = new Map(full.objectInventory.map(row => [row.name, row]));
  assert.equal(rows.size, metadata.obj.objects, 'Original inventory has duplicate/missing labels');
  for (const name of NAMES) assert(rows.has(name), `Exact original label missing: ${name}`);
  const parsed = await readNamedObjObjects(join(sourceDir, 'upper-limb.obj'), {selectName: name => NAMES.includes(name)});
  assert.equal(parsed.inventory.length, metadata.obj.objects);
  assert.equal(parsed.totalVertices, metadata.obj.vertices);
  assert.equal(parsed.totalFaces, metadata.obj.faces);
  assert.deepEqual(parsed.materialLibraries, metadata.obj.materialLibraries);
  assert.deepEqual(parsed.inventory, full.objectInventory.map(({name, startLine, vertices, faces, faceSizes, crossObjectReferences}) =>
    ({name, startLine, vertices, faces, faceSizes, crossObjectReferences})), 'Full original object inventory mismatch');
  assert.equal(parsed.objects.length, NAMES.length, 'Required source object missing');
  const objects = NAMES.map(name => auditObject(parsed.objects.find(object => object.name === name), rows.get(name)));
  const dependencies = await Promise.all(['open3dmodel-obj-source.mjs', 'open3dmodel-triangulation.mjs',
    'source-topology.mjs', 'vessel-shape-math.mjs', 'audit-open3dmodel-plexus-context.mjs'].map(async name =>
    ({name, sha256: sha(normalized(await readFile(join(root, 'scripts', name))))})));
  return {
    schemaVersion: 1, purpose: 'open3dmodel-plexus-original-frame-bone-context-audit',
    source: full.source, sourceObjSha256: metadata.obj.sha256,
    sourceInventorySha256: sha(metadataText), fullOfflineInventorySha256: metadata.fullOfflineInventorySha256,
    dependencies, threeVersion: JSON.parse(await readFile(join(root, 'node_modules/three/package.json'))).version,
    coordinateFrame: 'unaltered-source-OBJ', units: 'unknown-source-units', sourceCoordinatesChanged: false,
    mirrored: false, registered: false, admitted: false, clinicalApproved: false,
    sourceObjects: parsed.inventory.length, auditedObjects: objects.length,
    eligibleOfflineContextObjects: objects.filter(row => row.disposition === 'offline-context-candidate').length,
    heldObjects: objects.filter(row => row.disposition === 'held-entire-source-object').length,
    objects, limitations: [
      'Exact original object labels identify source objects; they do not independently establish anatomical boundaries or laterality.',
      'Deterministic projected tessellation is a display derivative; nonplanar quads have no unique implied source surface.',
      'Unknown units; topology and source-frame proximity do not prove anatomical accuracy, branch continuity, registration or clinical suitability.',
      'No source object, polygon or failed face is repaired or omitted for admission.'
    ],
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const report = await buildAudit();
  const text = JSON.stringify(report, null, 2) + '\n';
  if (process.argv.includes('--check')) {
    assert.equal(normalized(await readFile(reportPath)), text, 'Saved context audit stale');
  } else {
    await writeFile(reportPath, text);
  }
  console.log(JSON.stringify({passed: true, eligible: report.eligibleOfflineContextObjects,
    held: report.heldObjects, reportSha256: sha(text)}));
}
