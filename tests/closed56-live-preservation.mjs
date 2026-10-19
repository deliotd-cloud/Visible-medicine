// Test-only projection of an exact reviewed evolution, not current delivery admission.
// The original assertion labels/bodies remain unchanged. Real current admission is
// still executed separately by current-atlas-delivery.test.mjs against emitted bytes.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const sha=value=>createHash('sha256').update(value).digest('hex');
const readDefault=path=>readFileSync(new URL('./'+path,import.meta.url));
const reviewBefore="assert.equal(pin.reviewIntegration,'b4db62ff56037c1ca251e32256afd470f6e155ca3f563d1d1db86b6ec9c6d916');";
const reviewAfter="assert.equal(pin.reviewIntegration,sha(JSON.stringify(JSON.parse(read('atlas-review/integration-inputs.json')).inputs)));";
function replaceOnce(text,before,after){
 assert.equal(text.split(before).length,2,'Expected one exact historical seam: '+before);
 return text.replace(before,after);
}
function checked(read,path,digest){
 const bytes=read(path);assert.equal(sha(bytes),digest,'Frozen preservation evidence changed: '+path);
 return bytes.toString('utf8');
}

export function readClosed56LiveCopy(name,{read=readDefault}={}){
 assert(['current-atlas-delivery.test.mjs','shoulder-us-renderer-migration.test.mjs'].includes(name),'Only declared original live-copy reads');
 if(name==='shoulder-us-renderer-migration.test.mjs')return read(name).toString('utf8');
 const original=checked(read,'fixtures/closed56-original-tests/current-atlas-delivery.test.mjs.txt','b27deaa67d4ea9aa6908abb5a3324efb43bcc2f8344e01c9a4d3ed9424ef0d41');
 const f509=checked(read,'fixtures/current-atlas-delivery-f5097af8.txt','a7ce97681413483667399d7d8388231c842082dd87a2eb8648d13751cf30aafa');
 let intermediate=original;
 for(const [before,after]of [
  ["assert.equal(CURRENT_ATLAS_REVISION,'46c43ed8cf121aa046ef5bbaf6c7e67c08ae50cd');","assert.equal(CURRENT_ATLAS_REVISION,'f5097af8493701d64a8e2a2b5797df380f3b348a');"],
  ["assert.equal(pin.sourceTree,'83720d136f899876bd947323e6552c4d3e171210');","assert.equal(pin.sourceTree,'fba69dff6f83e7f092ccdab4c9a37f05c090c98b');"],
  [reviewBefore,reviewAfter],
  ['assert.equal(sourceFiles,1531);','assert.equal(sourceFiles,1541);'],
 ])intermediate=replaceOnce(intermediate,before,after);
 assert.equal(intermediate,f509,'Every original assertion must survive the four observed 46c-to-f509 seams');
 let prefix=f509;
 for(const [before,after]of [
  ["assert.equal(CURRENT_ATLAS_REVISION,'f5097af8493701d64a8e2a2b5797df380f3b348a');","assert.equal(CURRENT_ATLAS_REVISION,'bd5465ee3b94c66c3d5701e7749099d07e8f40d3');"],
  ["assert.equal(pin.sourceTree,'fba69dff6f83e7f092ccdab4c9a37f05c090c98b');","assert.equal(pin.sourceTree,'44ca83bf391164c09f43f4169d25dcacf4b2559d');"],
  ['assert.equal(sourceFiles,1541);','assert.equal(sourceFiles,1543);'],
 ])prefix=replaceOnce(prefix,before,after);
 const recorded=checked(read,'fixtures/closed56-live-bd5465.mjs.raw','f90a64376bddb25461d92542aeb2bdc7f836c258b17b4e89490c7f7a6ac14bee');
 assert.equal(recorded.slice(0,prefix.length),prefix,'Complete original contract must survive current source/tree/count seams');
 assert(recorded.slice(prefix.length).startsWith("\ntest('complete f509 source and whole original contracts remain frozen outside explicit current-admission seams',()=>{"),'Only the frozen later whole-original proof may follow');
 assert.equal(read(name).toString('utf8'),recorded,'Live body, negatives and appended proofs must match the reviewed current epoch exactly');
 return replaceOnce(original,reviewBefore,reviewAfter);
}
