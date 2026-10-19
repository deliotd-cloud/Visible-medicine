import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {verifyPrivateAtlasDeliveryPolicy} from '../scripts/verify-atlas-delivery-policy.mjs';
import {ATLAS_DELIVERY_POLICY} from '../lib/atlas-delivery-policy.ts';
const inventory = JSON.parse(readFileSync(new URL('../lib/atlas-model-inventory.json', import.meta.url), 'utf8'));
const root = fileURLToPath(new URL('../', import.meta.url));
const digest = value => createHash('sha256').update(JSON.stringify(value, null, 2) + '\n').digest('hex');

test('private Atlas candidate policy matches the actual registered inventory, without asserting approval', () => {
  const result = verifyPrivateAtlasDeliveryPolicy(inventory, ATLAS_DELIVERY_POLICY);
  assert.equal(result.manifestRevision, digest(inventory));
  assert.equal(result.models, inventory.models.length);
  assert.equal(result.audience, 'administrator-review');
  for (const key of ['userAuthorized', 'clinicalApprovalAsserted', 'publicDeploymentAuthorized']) assert.equal(result[key], false);
});

test('old pins and a changed inventory cannot pass the preflight', () => {
  assert.throws(() => verifyPrivateAtlasDeliveryPolicy(inventory, {...ATLAS_DELIVERY_POLICY, manifestRevision: '0'.repeat(64)}), /stale/);
  const changed = structuredClone(inventory); changed.models[0].bytes++;
  assert.throws(() => verifyPrivateAtlasDeliveryPolicy(changed, ATLAS_DELIVERY_POLICY), /stale/);
});

test('consistent-looking learner, approval and unknown policy fields cannot widen this private candidate', () => {
  const current = {audience: 'administrator-review', manifestRevision: digest(inventory)};
  for (const bad of [
    {...current, audience: 'reviewed-learner'}, {...current, approvedRevision: current.manifestRevision},
    {...current, approvedRevision: undefined}, {...current, allowAnonymous: true},
  ]) assert.throws(() => verifyPrivateAtlasDeliveryPolicy(inventory, bad));
  assert.throws(() => verifyPrivateAtlasDeliveryPolicy({...inventory, purpose: 'patient-data'}, current));
  assert.throws(() => verifyPrivateAtlasDeliveryPolicy({...inventory, models: []}, current));
});

test('verification uses the protected route serialization and does not mutate inputs', () => {
  const canonical = structuredClone(inventory), policy = {audience: 'administrator-review', manifestRevision: digest(canonical)};
  const beforeInventory = JSON.stringify(canonical), beforePolicy = JSON.stringify(policy);
  const crlfCheckout = JSON.parse((JSON.stringify(canonical, null, 2) + '\n').replaceAll('\n', '\r\n'));
  assert.deepEqual(verifyPrivateAtlasDeliveryPolicy(crlfCheckout, policy), verifyPrivateAtlasDeliveryPolicy(canonical, policy));
  assert.equal(JSON.stringify(canonical), beforeInventory); assert.equal(JSON.stringify(policy), beforePolicy);
});

test('the project CLI is read-only and refuses alternate source or apply options', () => {
  for (const flag of ['--apply', '--root', '--approve']) {
    const child = spawnSync(process.execPath, ['--experimental-strip-types', 'scripts/verify-atlas-delivery-policy.mjs', flag], {cwd: root, encoding: 'utf8'});
    assert.equal(child.status, 1); assert.match(child.stderr, /accepts no overrides/);
  }
});
