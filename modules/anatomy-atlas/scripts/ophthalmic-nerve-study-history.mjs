// Offline exact replay of the V1 recipe addition. Runtime retains both views.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const beforeHash = '548809597e83d01b279b6f176a4f1b76da3ed2268796ea467e93a7ab64950187';
const afterHash = '030db64126ecf16abbf3ca7334eafe17024b320dc91d50dd249ab10b12f14398';
const additionHash = '9566f3823d451ecb7451a27cfa372827df82a8220d65cbcdb235e73c3d06053a';
const ids = ['v1-frontal-lacrimal-subset', 'v1-nasociliary-subset'];
const references = [
  'https://anatomy.ttuhscep.edu/nervous_system/eye_tables.html',
  'https://anatomy.ttuhscep.edu/nervous_system/eye.html',
];
const regions = ['head-neck', 'whole-body'];

export function preOphthalmicNerveProfiles(profiles) {
  if (hash(profiles) === beforeHash) return structuredClone(profiles);
  assert.equal(hash(profiles), afterHash, 'Unrecorded V1 recipe edit');
  const previous = structuredClone(profiles);
  const addition = Object.fromEntries(regions.map((region) => [region, {
    focuses: previous[region].focuses.filter((focus) => ids.includes(focus.id)),
    references: previous[region].references.filter((reference) => references.includes(reference)),
  }]));
  for (const region of regions) {
    assert.deepEqual(addition[region].focuses.map((focus) => focus.id), ids,
      'Exactly two ordered V1 views per scope');
    assert.deepEqual(addition[region].references, references,
      'Exactly two V1 references per scope');
  }
  assert.equal(hash(addition), additionHash, 'Exact source-bound V1 recipes');
  for (const region of regions) {
    previous[region].focuses = previous[region].focuses.filter((focus) => !ids.includes(focus.id));
    previous[region].references = previous[region].references.filter((reference) => !references.includes(reference));
  }
  assert.equal(hash(previous), beforeHash, 'Every prior recipe retained');
  return previous;
}
