import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadActual, verifyInventory } from './verify-inventory.mjs';

const root = process.env.ATLAS_SOURCE_ROOT || process.env.VM_ATLAS_SOURCE_REPO;
assert(root, 'Explicit unchanged source root required');
const actual = loadActual(root, fileURLToPath(new URL('../worker/inventory.json', import.meta.url)));
test('actual clean source Git bytes independently join all 22 selected metadata records', () => {
  const report = verifyInventory(actual);
  assert.deepEqual(report.countsBySource, [10, 10, 2]);
  assert.equal(report.regions.length, 6);
  assert.equal(report.clinicalApproval, false);
  assert.equal(report.geometryDecoded, false);
  assert.equal(report.spatialRegistration, false);
});
const mutations = [
  ['wrong source revision', x => { x.head = '0'.repeat(40); }],
  ['inventory from another revision', x => { x.inventory.sourceHead = '0'.repeat(40); }],
  ['changed raw catalogue', x => { x.blobs[0] = Buffer.concat([x.blobs[0], Buffer.from('\n')]); }],
  ['duplicated selected ID', x => { x.inventory.members[1] = x.inventory.members[0]; }],
  ['fabricated name', x => { x.inventory.members[0].name = 'Invented complete elbow capsule'; }],
  ['edited source filename', x => { x.inventory.members.at(-1).sourceFile = 'Segmentation_Tendon_Achilles.stl'; }],
  ['foreign FMA mapping', x => { x.inventory.members[0].fmaId = 'FMA0'; }],
  ['splitting a grouped meniscus name', x => { x.inventory.members.find(s => s.id.endsWith('meniscus-group')).name = 'Medial meniscus'; }],
  ['unknown prose-only mesh', x => { x.inventory.regionalEvidence.knee.namedEntries[0] = 'vm:invented:knee:bursa'; }],
  ['missing selected entry', x => { x.inventory.members.pop(); }],
  ['frame conflation', x => { const c = JSON.parse(x.blobs[1]); c.specimenId = 'bodyparts3d:4.0:common-source'; x.blobs[1] = Buffer.from(JSON.stringify(c)); }],
  ['unearned shoulder indexed coverage', x => { x.inventory.dedicatedShoulder.namedJointSoftTissueEntries = 1; }],
];
for (const [name, mutate] of mutations) test(`refuses ${name}`, () => {
  const x = { ...actual, blobs: actual.blobs.map(b => Buffer.from(b)), inventory: structuredClone(actual.inventory) };
  mutate(x);
  assert.throws(() => verifyInventory(x));
});
