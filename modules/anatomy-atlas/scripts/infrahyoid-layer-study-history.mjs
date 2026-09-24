// Offline exact recipe replay. The authored focus remains in the runtime.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { preOphthalmicNerveProfiles } from './ophthalmic-nerve-study-history.mjs';

const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const beforeHash = '32d547014691a309b584843574b9df034ef3b3234a35a20bf52b70ba2ed33fb2';
const afterHash = '548809597e83d01b279b6f176a4f1b76da3ed2268796ea467e93a7ab64950187';
const additionHash = 'adf2bd39cbca94e5e6fa2a3497341dd5c649684b0968e30b3dcd8455dd6f25fc';
const ids = ['infrahyoid-superficial-pair', 'infrahyoid-deep-pair'];
const regions = ['head-neck', 'whole-body'];

export function preInfrahyoidLayerProfiles(profiles) {
  if (profiles['head-neck'].focuses.some((focus) => focus.id === 'v1-frontal-lacrimal-subset'))
    profiles = preOphthalmicNerveProfiles(profiles);
  if (hash(profiles) === beforeHash) return structuredClone(profiles);
  assert.equal(hash(profiles), afterHash, 'Unrecorded infrahyoid recipe edit');
  const previous = structuredClone(profiles);
  const addition = Object.fromEntries(regions.map((region) => [
    region, previous[region].focuses.filter((focus) => ids.includes(focus.id)),
  ]));
  for (const region of regions) {
    assert.deepEqual(addition[region].map((focus) => focus.id), ids,
      'Exactly two ordered infrahyoid groups per scope');
  }
  assert.equal(hash(addition), additionHash, 'Exact infrahyoid source-bound recipes');
  for (const region of regions) {
    previous[region].focuses = previous[region].focuses.filter((focus) => !ids.includes(focus.id));
  }
  assert.equal(hash(previous), beforeHash, 'Every prior recipe retained');
  return previous;
}
