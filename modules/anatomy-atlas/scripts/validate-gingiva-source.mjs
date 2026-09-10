import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { sourceObjShape, sourceTriangleSet } from './source-surface-audit.mjs';
import { sourceTopology } from './source-topology.mjs';
import { gingivaCandidates } from './gingiva-candidates.mjs';
const hash = (b) => createHash('sha256').update(b).digest('hex');
let checks = 0;
const same = (a, b) => {
  checks++;
  assert.deepEqual(a, b);
};
const rootBytes = await readFile(
  'public/models/bodyparts3d/full-body/catalog.json',
);
same(
  hash(rootBytes),
  '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
);
const root = JSON.parse(rootBytes);
const auditBytes = await readFile('docs/gingiva-source-audit.json');
same(
  hash(auditBytes),
  '21aec7193cc0879dfc93f5ee62af065a79329757086912e9b5ad20b035637420',
);
const audit = JSON.parse(auditBytes),
  dir = 'content/prototypes/gingiva';
const p = JSON.parse(await readFile(`${dir}/catalog.json`));
same(p.auditSha256, hash(auditBytes));
same(p.evidence, audit.evidence);
same([p.prototypeOnly, p.admitted, p.clinicalApproval], [true, false, false]);
same(p.coordinateSystem, root.coordinateSystem);
same(p.license, 'CC-BY-4.0');
same(p.credit, root.credit);
same(audit.rootEnvelopeScreen.length, 1022);
same(new Set(audit.rootEnvelopeScreen.map((r) => r.id)).size, 1022);
for (const e of audit.rootEnvelopeScreen)
  same(
    e.recordSha256,
    hash(JSON.stringify(root.structures.find((s) => s.id === e.id))),
  );
same(audit.comparisons.length, 108);
same(
  audit.comparisons.some((c) => c.exactSharedTriangles !== 0),
  false,
);
same(
  audit.dentalContext.map((g) => g.fmaIds.length),
  [2, 1, 14, 14],
);
same(p.contextRecords.length, 31);
same(new Set(p.contextRecords.map((r) => r.id)).size, 31);
for (const c of p.contextRecords)
  same(
    c,
    root.structures.find((s) => s.id === c.id),
  );
same(p.contextBundles.length, 2);
for (const b of p.contextBundles)
  same(
    b,
    root.bundles.find((r) => r.id === b.id),
  );
same(
  p.structures.map((s) => s.fmaId),
  ['FMA59763', 'FMA59764'],
);
same(
  p.structures.map((s) => s.id),
  [
    'vm:anatomy:component:oral:unpaired:gingiva:upper',
    'vm:anatomy:component:oral:unpaired:gingiva:lower',
  ],
);
for (const c of gingivaCandidates) {
  const s = p.structures.find((r) => r.fmaId === c.id),
    a = audit.candidates.find((r) => r.id === c.id);
  const raw = await readFile(`${dir}/source/${c.file}.obj`),
    shape = sourceObjShape(raw);
  same(hash(raw), c.sha256);
  same(raw.length, a.bytes);
  same(a.definition.name, c.name);
  same(a.definition.files, [c.file]);
  same(a.definition.tree, 'isa');
  same(a.admitted, false);
  same(a.directOwners, []);
  same(a.sameFilenameOtherTree, []);
  same(a.exactInventoryMatches, []);
  same(a.topology, sourceTopology(shape));
  same(s.validation, { status: 'unvalidated', anatomicalReview: false });
  same(s.sources, [{ file: c.file, sha256: c.sha256 }]);
  same(s.removedSourceFaces, []);
  same(s.retainedSourceFaceCount, shape.faces.length);
  same(
    s.orderedSourceTrianglesSha256,
    hash(
      JSON.stringify(shape.faces.map((f) => f.map((i) => shape.vertices[i]))),
    ),
  );
  same(
    root.structures.some(
      (r) => r.fmaId === c.id || r.sources.some((f) => f.file === c.file),
    ),
    false,
  );
  same(sourceTriangleSet(shape).size, c.arch === 'upper' ? 1847 : 1918);
}
same(
  audit.candidates.map((c) => c.topology.components.map((g) => g.triangles)),
  [[1814, 16, 16, 2], [1918]],
);
same(
  audit.candidates.map((c) => c.topology.closedOrientedManifold),
  [false, true],
);
same(
  audit.candidates.map((c) => c.topology.duplicateFaces),
  [1, 0],
);
const raw = await readFile(`${dir}/${p.artifact.file}`);
same(
  hash(raw),
  '2fb2e2af77c3207cd0d83f301cefd7d795116baf6f521c5b1c8290266cf888d6',
);
same(hash(raw), p.artifact.sha256);
same(raw.length, 70732);
const loaded = await new GLTFLoader().parseAsync(
  raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.length),
  '',
);
const meshes = [];
loaded.scene.traverse((m) => {
  if (m.isMesh) meshes.push(m);
});
same(meshes.length, 2);
same(
  meshes.map((m) => m.geometry.index.count / 3),
  [1848, 1918],
);
for (const m of meshes) {
  same(m.userData.prototypeOnly, true);
  same(m.userData.anatomicalReview, false);
  same(m.userData.fmaId, m.name);
  same(m.material.map, null);
}
same(p.artifact.maxPositionErrorMm < 0.0001, true);
await assert.rejects(access('public/models/bodyparts3d/gingiva'), {
  code: 'ENOENT',
});
checks++;
console.log(
  JSON.stringify({
    checks,
    originalFiles: 2,
    prototypeMeshes: 2,
    retainedTriangles: 3766,
    contextRecords: 31,
    publicAdmission: false,
    clinicalApproval: false,
  }),
);
