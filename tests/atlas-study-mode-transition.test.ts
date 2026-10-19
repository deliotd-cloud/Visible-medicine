import assert from 'node:assert/strict';
import test from 'node:test';
import {currentBindings,delivery,pins} from './atlas-spinal-study-specimen-fixture.ts';

const old={
  'app/atlas-workspace.tsx':'fb0b89748213755782a9eeb4522193425e912da976020249eaa80ecb56ef653d',
  'app/workspace-session.ts':'7a2a73775b9eebebc50df257cc520f2f33499ebb7130f496a4b2cdfb46fc379a',
};
const oldExplorer={'app/body-explorer.tsx':'2dad1c22dfec424db6a4cdf578cb4f9cafe6a0e3295f95ed7d3318976aa62dc0'};
test('verified Search/session transition retains its immutable source and access boundaries',()=>{
  const {inputs,inventory}=delivery('transition');
  pins(inputs,old,'transition');
  const prior=delivery('transitionExplorer');
  pins(prior.inputs,oldExplorer,'transitionExplorer');
  assert(!inputs.some(i=>/test-study-mode|study-history|\.transition\.json|\.local\//.test(i.path)));
  assert.equal(inventory.models.length,137);
  assert.equal(inventory.models.flatMap((m:{paths:string[]})=>m.paths).length,144);
});
test('current Search/session delivery binds committed source, Review and runtime',()=>{
  const {inputs,inventory,runtime}=delivery('current');
  currentBindings(inputs,[...Object.keys(old),...Object.keys(oldExplorer)]);
  assert(!inputs.some(i=>/test-study-mode|study-history|\.transition\.json|\.local\//.test(i.path)));
  assert.equal(inventory.models.length,137);
  assert.equal(inventory.models.flatMap((m:{paths:string[]})=>m.paths).length,144);
  const emitted=runtime();
  for(const marker of ['Search','session'])assert.ok(emitted.includes(marker),marker);
});
