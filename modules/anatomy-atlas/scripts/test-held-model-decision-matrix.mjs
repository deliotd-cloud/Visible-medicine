import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { createHeldModelDecisionMatrix } from './held-model-decision-matrix.mjs';

const sha = value => createHash('sha256').update(value).digest('hex');
const fullSha = 'a'.repeat(40);
const trees = {
  isa: ['https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip', '40665852c49f218326590e204db91064a1ecfc3c6f8cbd7bbbcaac62c7cd409e', 142903898, 'edde15c7c5f34b2b9743935fb3c1873cce3a9789164427ddf8343c879bcde96b', '"8848a5a-4dd48ec9df000"', 'Wed, 22 May 2013 06:46:24 GMT', 184],
  partof: ['https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/partof_BP3D_4.0_obj_99.zip', '9fbc713fffeee924a5a657d9813d84d7eb957bded63adb854931dd5e3eb61c97', 64888505, '699958b22b8facffc7a939ddfd650737694e8887ef4df9f1c57bc9c221d16ad5', '"3de1eb9-4dd48e9fe8d00"', 'Wed, 22 May 2013 06:45:40 GMT', 67],
};
const credit = 'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International';

function fixture() {
  const bundles = [], structures = [], derivedBundles = [], selectedSources = [];
  for (let i = 0; i < 19; i++) {
    const id = `synthetic-${String(i).padStart(2, '0')}-recovery`;
    const file = `FJ${1000 + i}`;
    const tree = i % 2 ? 'partof' : 'isa';
    const sourceHash = sha(`source ${i}`);
    const bundleHash = sha(`bundle ${i}`);
    bundles.push({ id, url: `/models/bodyparts3d/full-body/${id}.glb`, sha256: bundleHash, bytes: 100 + i, structures: 1 });
    structures.push({ id: `synthetic-structure-${i}`, bundle: id, sourceTree: tree, sources: [{ file, sha256: sourceHash }], provenance: { method: 'licensed-source-mesh', license: 'CC-BY-4.0', sourceVersion: '4.0', recovered: true } });
    derivedBundles.push({ id, path: `public/models/bodyparts3d/full-body/${id}.glb`, sha256: bundleHash, bytes: 100 + i });
    selectedSources.push({ key: `${tree}/${file}`, archiveEntry: `${tree}_BP3D_4.0_obj_99/${file}.obj`, sha256: sourceHash, bytes: 200 + i, crc32: 'abcdef12' });
  }
  // The production function intentionally requires the current 159/251 scope.
  // Synthetic members extend each structure without reading production assets.
  for (let i = 19; i < 159; i++) {
    const bundleIndex = i % 19;
    const tree = i % 2 ? 'partof' : 'isa';
    const file = `FJ${1000 + i}`;
    const sourceHash = sha(`source ${i}`);
    const id = bundles[bundleIndex].id;
    structures.push({ id: `synthetic-structure-${i}`, bundle: id, sourceTree: tree, sources: [{ file, sha256: sourceHash }], provenance: { method: 'licensed-source-mesh', license: 'CC-BY-4.0', sourceVersion: '4.0', recovered: true } });
    bundles[bundleIndex].structures++;
    selectedSources.push({ key: `${tree}/${file}`, archiveEntry: `${tree}_BP3D_4.0_obj_99/${file}.obj`, sha256: sourceHash, bytes: 200 + i, crc32: 'abcdef12' });
  }
  for (let i = 159; i < 251; i++) {
    const structure = structures[i % 159];
    const tree = structure.sourceTree;
    const file = `FJ${1000 + i}`;
    const sourceHash = sha(`source ${i}`);
    structure.sources.push({ file, sha256: sourceHash });
    selectedSources.push({ key: `${tree}/${file}`, archiveEntry: `${tree}_BP3D_4.0_obj_99/${file}.obj`, sha256: sourceHash, bytes: 200 + i, crc32: 'abcdef12' });
  }
  const catalog = { version: 2, sourceVersion: '4.0', license: 'CC-BY-4.0', credit, sources: Object.fromEntries(Object.entries(trees).map(([key, v]) => [key, v[0]])), bundles, structures };
  const witness = {
    schema: 'vm-bodyparts-source-reverification/1', recordedAt: 'synthetic', sourceVersion: '4.0', license: 'CC-BY-4.0', credit,
    officialLicence: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
    catalogSha256: '', scope: 'Only the 19 live recovery-named version-4 bundles; not all Atlas assets or source release paths.',
    structures: 159,
    archives: Object.fromEntries(Object.entries(trees).map(([key, [url, sha256, bytes, centralDirectorySha256, etag, lastModified, selectedLocalHeadersChecked]]) => [key, { url, sha256, bytes, centralDirectorySha256, etag, lastModified, selectedLocalHeadersChecked, retainedArchive: false }])),
    derivedBundles, selectedSources, evidence: {},
    verification: { selectedSourceHashesMatch: true, conditionalWholeArchiveStreams: true, rawArchivesRetained: false, sourceAdmission: false, privacyClearance: false, clinicalApproval: false, deliveredNoticeVerified: false }, limits: [],
  };
  return { catalog, witness };
}
function run({ catalog, witness }) {
  const catalogBytes = Buffer.from(JSON.stringify(catalog));
  witness.catalogSha256 = sha(catalogBytes);
  const witnessBytes = Buffer.from(JSON.stringify(witness));
  return createHeldModelDecisionMatrix({ sourceCommit: fullSha, witnessBytes, catalogBytes });
}
function rejects(change, pattern) {
  const data = fixture(); change(data);
  assert.throws(() => run(data), pattern);
}

test('deterministic exact join and all admission holds', () => {
  const data = fixture();
  const first = run(data);
  const second = run(fixture());
  assert.deepEqual(first, second);
  assert.equal(first.rowCount, 19);
  assert.equal(first.structureCount, 159);
  assert.equal(first.sourceObjCount, 251);
  assert.equal(first.rows.reduce((sum, row) => sum + row.sourceObjCount, 0), 251);
  for (const gates of [first.gates, ...first.rows.map(row => row.gates)]) {
    assert.ok(Object.values(gates).every(value => value === 'pending independent review'));
  }
  assert.equal(first.inputs.catalogSha256, sha(Buffer.from(JSON.stringify(data.catalog))));
  assert.equal(first.rows[0].path, 'public/models/bodyparts3d/full-body/synthetic-00-recovery.glb');
});
test('rejects scope, bundle hash, membership, source binding, paths and duplicates', () => {
  rejects(d => { d.witness.scope = 'all assets'; }, /scope/);
  rejects(d => { d.witness.derivedBundles[0].sha256 = sha('changed'); }, /hash or byte mismatch/);
  rejects(d => { d.witness.derivedBundles[0].path += '.extra'; }, /bundle path/);
  rejects(d => { d.witness.derivedBundles[1] = { ...d.witness.derivedBundles[0] }; }, /bundle path/);
  rejects(d => { d.witness.selectedSources.pop(); }, /source member missing/);
  rejects(d => { d.witness.selectedSources[1] = { ...d.witness.selectedSources[0] }; }, /duplicate selected source/);
  rejects(d => { d.catalog.structures[0].sources[0].sha256 = sha('changed'); }, /hash changed/);
  rejects(d => { d.witness.selectedSources[0].archiveEntry = 'other/FJ1000.obj'; }, /archive member identity/);
  rejects(d => { d.witness.archives.isa.sha256 = sha('changed'); }, /archive sha256 changed/);
  rejects(d => { d.witness.archives.isa.etag = 'changed'; }, /archive etag changed/);
  rejects(d => { d.catalog.sources.isa = 'other'; }, /catalog source URL/);
});
test('rejects catalog mismatch and forged approvals or unknown claims', () => {
  const data = fixture();
  const catalogBytes = Buffer.from(JSON.stringify(data.catalog));
  data.witness.catalogSha256 = sha('wrong');
  assert.throws(() => createHeldModelDecisionMatrix({ sourceCommit: fullSha, catalogBytes, witnessBytes: Buffer.from(JSON.stringify(data.witness)) }), /catalog hash mismatch/);
  rejects(d => { d.witness.verification.sourceAdmission = true; }, /approval flags/);
  rejects(d => { d.witness.verification.privacyClearance = true; }, /approval flags/);
  rejects(d => { d.witness.clinicalApproval = true; }, /unknown field/);
  rejects(d => { d.witness.derivedBundles[0].approved = true; }, /unknown field/);
  rejects(d => { d.witness.evidence.rightsApproval = true; }, /unknown field/);
  assert.throws(() => createHeldModelDecisionMatrix({ sourceCommit: 'short', witnessBytes: Buffer.from('{}'), catalogBytes: Buffer.from('{}') }), /full lowercase Git SHA/);
});

test('rejects model path traversal and ambiguous structure IDs outside the held subset', () => {
  rejects(d => {
    const prior = d.catalog.bundles[0].id;
    const id = '../' + prior;
    d.catalog.bundles[0].id = id;
    d.catalog.bundles[0].url = `/models/bodyparts3d/full-body/${id}.glb`;
    d.witness.derivedBundles[0].id = id;
    d.witness.derivedBundles[0].path = `public/models/bodyparts3d/full-body/${id}.glb`;
    for (const structure of d.catalog.structures) if (structure.bundle === prior) structure.bundle = id;
  }, /unsafe bundle identity/);
  rejects(d => { d.catalog.structures.push({ ...d.catalog.structures[0], bundle: 'outside-held-subset' }); }, /duplicate catalog structure/);
});

test('unknown caller approval options refuse and no output grants authority', () => {
  const data = fixture();
  const catalogBytes = Buffer.from(JSON.stringify(data.catalog));
  data.witness.catalogSha256 = sha(catalogBytes);
  const options = { sourceCommit: fullSha, witnessBytes: Buffer.from(JSON.stringify(data.witness)), catalogBytes };
  assert.throws(() => createHeldModelDecisionMatrix({ ...options, rightsAdmission: true }), /options/);
  for (const flag of ['sourceBackupAdmitted', 'rightsOrPrivacyGranted', 'clinicalApproval', 'assetBytesVerified', 'authenticatedEvidence', 'pathPolicyModified']) {
    assert.equal(createHeldModelDecisionMatrix(options)[flag], false, flag);
  }
});
