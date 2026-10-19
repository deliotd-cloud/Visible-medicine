import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

/** Configuration consistency only; never authorizes a user or supplies approval. */
export function verifyPrivateAtlasDeliveryPolicy(inventory, policy) {
  assert(inventory && typeof inventory === 'object' && !Array.isArray(inventory), 'Atlas inventory is unavailable');
  assert.equal(inventory.purpose, 'licensed-atlas-model-staging-only', 'Unexpected Atlas inventory purpose');
  assert(Array.isArray(inventory.models) && inventory.models.length > 0, 'Atlas inventory has no models');
  assert(policy && typeof policy === 'object' && !Array.isArray(policy), 'Atlas delivery policy is unavailable');
  assert.deepEqual(Object.keys(policy).sort(), ['audience', 'manifestRevision'], 'Private review policy cannot carry approval or unknown fields');
  assert.equal(policy.audience, 'administrator-review', 'This private-candidate preflight cannot enable learner delivery');
  assert.match(policy.manifestRevision, /^[a-f0-9]{64}$/, 'Exact Atlas inventory revision required');
  // This is the identical serialization used by the protected delivery route.
  // Checkout line endings must not change the route's inventory identity.
  const revision = createHash('sha256').update(JSON.stringify(inventory, null, 2) + '\n').digest('hex');
  assert.equal(policy.manifestRevision, revision, 'Atlas delivery policy is stale for this inventory; review and rebind the private candidate');
  return {audience: policy.audience, manifestRevision: revision, models: inventory.models.length,
    userAuthorized: false, clinicalApprovalAsserted: false, publicDeploymentAuthorized: false};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert.equal(process.argv.length, 2, 'Read-only project preflight accepts no overrides');
  const root = fileURLToPath(new URL('../', import.meta.url));
  const inventory = JSON.parse(readFileSync(resolve(root, 'lib/atlas-model-inventory.json'), 'utf8'));
  const {ATLAS_DELIVERY_POLICY: policy} = await import(pathToFileURL(resolve(root, 'lib/atlas-delivery-policy.ts')).href);
  console.log(JSON.stringify({verdict: 'pass', ...verifyPrivateAtlasDeliveryPolicy(inventory, policy),
    limitation: 'Checks private-candidate configuration only, not model storage, source rights, clinical sign-off or user authorization.'}));
}
