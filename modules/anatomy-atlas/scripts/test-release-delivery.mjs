import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { checkReleaseDelivery } from './check-release-delivery.mjs';

function fixture() {
  const milestone = JSON.parse(readFileSync(new URL('../content/first-release-milestone.json', import.meta.url)));
  const publication = JSON.parse(readFileSync(new URL('../content/release-delivery/specimen-reassembly-20260925.json', import.meta.url)));
  const hash = bytes => createHash('sha256').update(bytes).digest('hex');
  const manifestBytes = Buffer.from(JSON.stringify({ sourceCommit: milestone.candidate.atlasRevision }));
  const manifestSha256 = hash(manifestBytes);
  const inventoryBytes = Buffer.from(JSON.stringify({
    sources: [{ module: 'head-neck', sourceCommit: milestone.candidate.atlasRevision, manifestSha256 }],
    models: [{ paths: ['/synthetic-one.glb', '/synthetic-alias.glb'] }],
  }));
  Object.assign(milestone.candidate.delivery.sharedViewer, {
    manifestSha256, inventorySha256: hash(inventoryBytes), modelCount: 1, pathCount: 2,
  });
  return { milestone, publication, manifestBytes, inventoryBytes, websiteRevision: milestone.candidate.websiteRevision };
}

test('consistent evidence does not approve any gate or mutate input', () => {
  const input = fixture();
  const before = JSON.stringify(input);
  assert.deepEqual(checkReleaseDelivery(input), { matched: true, releaseReady: false });
  assert.equal(JSON.stringify(input), before);
  assert(input.milestone.gates.every(gate => gate.status === 'pending' && gate.attestation === null));
});

for (const [name, mutate, expected] of [
  ['stale checkout', x => { x.websiteRevision = 'a'.repeat(40); }, /checkout differs/],
  ['wrong version source', x => { x.publication.version.source.commit_sha = 'b'.repeat(40); }, /version source differs/],
  ['wrong version number', x => { x.publication.version.version_number++; }, /version number differs/],
  ['wrong version ID', x => { x.publication.version.id += '-wrong'; }, /version ID differs/],
  ['wrong deployment', x => { x.publication.deployment.id += '-wrong'; }, /Deployment ID differs/],
  ['wrong version deployment', x => { x.publication.version.deployment_id += '-wrong'; }, /Version deployment differs/],
  ['wrong deployment version', x => { x.publication.deployment.version_id += '-wrong'; }, /Deployment version differs/],
  ['other project', x => { x.publication.deployment.project_id += '-wrong'; }, /Sites project differs/],
  ['missing project', x => { delete x.publication.deployment.project_id; delete x.publication.version.project_id; }, /Sites project must be present/],
  ['failed deployment', x => { x.publication.deployment.status = 'failed'; }, /did not succeed/],
  ['manifest tamper', x => { x.manifestBytes = Buffer.from('{}'); }, /manifest bytes differ/],
  ['inventory tamper', x => { x.inventoryBytes = Buffer.from('{}'); }, /inventory bytes differ/],
  ['wrong model count', x => { x.milestone.candidate.delivery.sharedViewer.modelCount++; }, /Model count differs/],
  ['wrong path count', x => { x.milestone.candidate.delivery.sharedViewer.pathCount++; }, /path count differs/],
  ['stale clinical approval', x => { x.milestone.candidate.delivery.clinicalApproval = {
    status: 'revision-bound-recorded', records: [{ atlasRevision: 'd'.repeat(40) }],
  }; }, /does not match/],
]) test(`rejects ${name}`, () => {
  const input = fixture(); mutate(input);
  assert.throws(() => checkReleaseDelivery(input), expected);
});

function replaceInventory(input, mutate) {
  const inventory = JSON.parse(input.inventoryBytes);
  mutate(inventory);
  input.inventoryBytes = Buffer.from(JSON.stringify(inventory));
  input.milestone.candidate.delivery.sharedViewer.inventorySha256 = createHash('sha256').update(input.inventoryBytes).digest('hex');
}

test('even newly fingerprinted inventory cannot hide wrong source or duplicate paths', () => {
  const input = fixture();
  replaceInventory(input, inventory => { inventory.sources[0].sourceCommit = 'f'.repeat(40); });
  assert.throws(() => checkReleaseDelivery(input), /Inventory Atlas source differs/);
  const duplicate = fixture();
  replaceInventory(duplicate, inventory => { inventory.models[0].paths[1] = inventory.models[0].paths[0]; });
  assert.throws(() => checkReleaseDelivery(duplicate), /Duplicate protected model paths/);
});
