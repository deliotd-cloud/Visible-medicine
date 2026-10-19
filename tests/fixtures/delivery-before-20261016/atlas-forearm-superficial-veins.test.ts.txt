import assert from 'node:assert/strict';
import test from 'node:test';
import {ATLAS_DELIVERY_POLICY} from '../lib/atlas-delivery-policy.ts';
import {delivery,pins} from './atlas-forearm-delivery-fixture.ts';

const expected={
  'content/forearm-superficial-vein-runtime-pins.json':'cb864bdb2d08c8585091a9c7a0cad37392d8b7aff374910d16ea01478a0916e6',
  'content/forearm-superficial-vein-study.ts':'6ad60f58f4131df71d35580d086729b27c39cd4d2f0819a5464df43293960053',
  'lib/forearm-superficial-veins.ts':'07dde747d85a1a4fff95b1f19e62f4f1bc6a17c7696b91d60a842d9b6e499105',
  'lib/limb-vascular-studies.ts':'c11a2af74ae392407af1663c955c3b318b1de9ebbcb8dff23bd5fb96c9ad3e3c',
};

for(const epoch of ['old','current'] as const)test(`${epoch} regional export presents source-bound superficial forearm veins without clinical or imaging approval`,()=>{
  const {inputs,runtime}=delivery(epoch);
  pins(inputs,expected,epoch);
  assert.ok(!inputs.some(row=>/native-mr|local-mr-study|\.vmmr/i.test(row.path)),'private native MRI checker excluded');
  for(const phrase of [
    'Superficial forearm veins',
    'Choose Left or Right to simplify the view',
    'Their proximity does not establish a joined lumen',
    'this is not a venepuncture guide or patient registration',
    'Anatomical review is pending',
    'FMA13325','FMA13326','FMA22909','FMA22910',
    'FMA22964','FMA22965','FMA22968','FMA22969',
  ])assert.ok(runtime.includes(phrase),phrase);
  assert.equal(ATLAS_DELIVERY_POLICY.audience,'administrator-review');
  assert.equal('approvedRevision' in ATLAS_DELIVERY_POLICY,false);
});
