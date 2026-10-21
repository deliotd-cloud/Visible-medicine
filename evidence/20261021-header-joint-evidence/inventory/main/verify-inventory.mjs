import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const sourceHead = '485df97c2530e8e81a8d39a5ee61073ce76d93db';
export const inputs = Object.freeze([
  ['public/models/bodyparts3d/full-body/catalog.json', '109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7', 1022, 10],
  ['public/models/um-knee/catalog.json', '946249f2b30bf29f4338e5c11cd324aec00b8616fcb02349376a258f93a6544e', 15, 10],
  ['public/models/um-limb/catalog.json', 'fc27b778fe8a0e13f773f272bd0bd9bdf9d22117029bd5a5b5d11f0dc39c83fb', 52, 2],
  ['app/anatomy-data.ts', '75a91a07a3bf268088f7b6e011e71ffd27bbc0366d2d01a3dbbd7f28da64a4cb'],
]);
export const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const regionCounts = { shoulder: 0, elbow: 2, wrist: 2, hip: 1, knee: 10, ankle: 7 };
const expectedFrames = ['bodyparts3d:4.0:common-source', 'um-5t6tz7-v1-2:knee', 'um-5t6tz7-v1-2:lower-limb'];

// This is an exact-revision metadata audit, not a mesh importer or clinical gate.
// It intentionally refuses a new revision until its scope is explicitly reviewed.
export function verifyInventory({ head, blobs, inventory }) {
  assert.equal(head, sourceHead, 'Exact source revision');
  assert.equal(inventory.sourceHead, sourceHead, 'Inventory source revision');
  assert.equal(blobs.length, inputs.length, 'Closed named input scope');
  for (const [i, row] of inputs.entries()) assert.equal(sha(blobs[i]), row[1], `Exact input ${row[0]}`);
  const catalogues = blobs.slice(0, 3).map(b => JSON.parse(b));
  assert.deepEqual(inventory.catalogues.map(c => [c.path, c.sha256, c.entryCount]), inputs.slice(0, 3).map(row => row.slice(0, 3)));
  assert.equal(catalogues[0].sourceVersion, '4.0');
  assert.equal(catalogues[0].license, 'CC-BY-4.0');
  assert.equal(catalogues[0].coordinateSystem.source, 'mm, X left / Y posterior / Z superior');
  for (const i of [1, 2]) {
    assert.equal(catalogues[i].specimenId, expectedFrames[i]);
    assert.equal(catalogues[i].source.license, 'CC0-1.0');
    assert.equal(catalogues[i].registeredToBodyParts3D, false);
    assert.equal(catalogues[i].imagingRegistration, null);
  }
  assert.notEqual(catalogues[1].specimenId, catalogues[2].specimenId, 'Shared archive is not a merged catalogue scope');
  assert.equal(catalogues[1].source.archiveSha256, catalogues[2].source.archiveSha256);
  assert.equal(catalogues[2].companionKneeCatalogSha256, inputs[1][1]);
  for (const [i, c] of catalogues.entries()) {
    assert.equal(c.structures.length, inputs[i][2]);
    assert.equal(new Set(c.structures.map(s => s.id)).size, c.structures.length);
  }
  const members = inventory.members;
  assert.equal(members.length, 22);
  assert.equal(new Set(members.map(m => m.id)).size, 22, 'No duplicated selected IDs');
  const selected = new Map();
  const counts = [0, 0, 0];
  for (const m of members) {
    const matches = catalogues.flatMap((c, i) => c.structures.filter(s => s.id === m.id).map(s => ({ s, i })));
    assert.equal(matches.length, 1, `One exact source catalogue record: ${m.id}`);
    const { s, i } = matches[0];
    assert.equal(m.name, s.name, `Unmodified name: ${m.id}`);
    assert.equal(s.sources.length, 1, 'No source-member consolidation');
    assert.equal(m.sourceFile, s.sources[0].file, 'Unmodified source filename, including spaces/typos');
    assert.equal(s.validation.status, 'unvalidated');
    assert.equal(s.validation.anatomicalReview, false);
    if (i === 0) {
      assert.equal(m.fmaId, s.fmaId);
      assert.equal(s.provenance.sourceVersion, '4.0');
    } else {
      assert.equal(m.sourceName, s.sourceName);
      assert.equal(s.fmaId, null, 'No invented FMA mapping into the whole-body model');
      assert.equal(s.validation.registeredToBodyParts3D, false);
    }
    selected.set(m.id, { id: m.id, name: s.name, catalogue: inputs[i][0], catalogueSha256: inputs[i][1],
      frameScope: expectedFrames[i], sourceMember: { ...s.sources[0] },
      sourceCredit: i === 0 ? catalogues[i].credit : catalogues[i].source.credit,
      sourceLicense: i === 0 ? catalogues[i].license : catalogues[i].source.license,
      evidenceRole: i === 0 ? 'regional context, not a complete joint surface set' : 'independent specimen record',
      anatomicalReview: false, patientSpaceRegistration: false });
    counts[i]++;
  }
  assert.deepEqual(counts, [10, 10, 2]);
  assert.deepEqual(Object.keys(inventory.regionalEvidence), Object.keys(regionCounts));
  const assigned = [];
  const regions = Object.entries(regionCounts).map(([region, count]) => {
    const ids = inventory.regionalEvidence[region].namedEntries;
    assert.equal(ids.length, count, `Bounded ${region} selection`);
    const records = ids.map(id => { assert(selected.has(id), 'No prose-only, synonym or unknown mesh claim'); assigned.push(id); return selected.get(id); });
    return { region, namedEvidence: records, analystFinding: inventory.regionalEvidence[region].finding,
      findingScope: 'Provisional named-metadata screen only; not biological absence or exhaustive anatomy coverage' };
  });
  assert.equal(new Set(assigned).size, 22, 'Every selected record assigned once');
  assert.deepEqual([...assigned].sort(), [...selected.keys()].sort());
  const shoulder = blobs[3].toString();
  const shoulderIds = [...shoulder.matchAll(/^    id: '(vm:anatomy:upper-limb:shoulder:[^']+)',$/gm)].map(m => m[1]);
  const shoulderCategories = [...shoulder.matchAll(/^    category: '(bone|muscle|tendon)',$/gm)].map(m => m[1]);
  assert.equal(shoulderIds.length, 9);
  assert.equal(shoulderCategories.length, 9);
  assert.deepEqual([...new Set(shoulderCategories)].sort(), ['bone', 'muscle']);
  assert.equal(inventory.dedicatedShoulder.entries, 9);
  assert.equal(inventory.dedicatedShoulder.namedJointSoftTissueEntries, 0);
  assert.equal(inventory.dedicatedShoulder.sha256, inputs[3][1]);
  return { schema: 'vm-joint-named-metadata-evidence/1', sourceHead,
    inputs: inputs.map(([path, sha256]) => ({ path, sha256 })), countsBySource: counts,
    countMeaning: 'Selected source records only, not unique anatomy, lessons or completion percentages',
    regions, dedicatedShoulderIds: shoulderIds,
    status: 'source-bound provisional inventory; no geometry inspection or admission',
    clinicalApproval: false, geometryDecoded: false, sourceAdmission: false, spatialRegistration: false,
    limits: [...inventory.limits] };
}

export function loadActual(root, inventoryPath) {
  const git = args => execFileSync('git', ['-C', root, ...args], { windowsHide: true, maxBuffer: 8e6 });
  const head = git(['rev-parse', 'HEAD']).toString().trim();
  assert.equal(git(['status', '--porcelain']).toString().trim(), '', 'Source checkout remains clean');
  const blobs = inputs.map(([p]) => {
    const bytes = fs.readFileSync(root + '/' + p);
    assert.deepEqual(bytes, git(['show', `${sourceHead}:${p}`]), 'Exact Git source bytes: ' + p);
    return bytes;
  });
  return { head, blobs, inventory: JSON.parse(fs.readFileSync(inventoryPath)) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [root, inventoryPath] = process.argv.slice(2);
  assert(root && inventoryPath, 'Usage: node verify-inventory.mjs SOURCE_ROOT INVENTORY_JSON');
  console.log(JSON.stringify(verifyInventory(loadActual(root, inventoryPath)), null, 2));
}
