import assert from 'node:assert/strict';
import test from 'node:test';
import {delivery,pins,currentPins} from './atlas-forearm-delivery-fixture.ts';

const oldExpected={
  'app/body-content.ts':'4df58aeec6728cefb67332fd9578f9c4e66ec204ec92d10690b9bd9b75b019d8',
  'content/forearm-venous-imaging-pins.json':'81dd9bcdf0dae7cfcac45d099a960d69d5ff39598a815b8103798382e685c490',
  'content/forearm-venous-imaging.ts':'4b003f2e5d91186b05429989a28f9b4162e9364043736fa5e9d0199b59da0332',
  'lib/forearm-venous-imaging.ts':'2866e1bef3a871d47e8107c2ef3783661548e1a518018c3c03fb52ceadb978cb',
};

for(const epoch of ['old','current'] as const)test(`${epoch} regional export carries four source-bound forearm MR drafts without a model or access change`,()=>{
  const {inputs,runtime,teaching}=delivery(epoch);
  if(epoch==='old')pins(inputs,oldExpected,epoch);
  else{
    const {['app/body-content.ts']:historicalDispatch,...targeted}=oldExpected;
    pins(inputs,targeted,epoch);
    // The shared dispatch has evolved; verify its current committed identity independently.
    currentPins(inputs,['app/body-content.ts']);
  }
  for(const phrase of [
    'Dedicated upper-limb MR venography',
    'Basilic-vein visibility in upper-limb MR venography',
    'This does not establish visibility on a routine forearm MRI',
    'Source limit: This is one archived source selection',
  ])assert.ok(runtime.includes(phrase),phrase);
  assert.ok(teaching.includes('Source limit: This is one archived source selection'),'source limit in reachable teaching');
});
