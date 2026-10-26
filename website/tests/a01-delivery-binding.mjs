import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

export const A01=Object.freeze({
 source:'a01ea4a00740dee0905204a33893761b8ae1ff1e',
 sourceTree:'362941c8dd6348d985622c4a21686bbf14c135f7',
 reviewIntegration:'59fea9e7b630c31b092d1a00f1e59c493e1960a909256266188fc57c860af03b',
 reviewSourceFiles:1614,
});
const modules=['head-neck','shoulder','lower-limb','female-pelvis'];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export function assertA01Binding(pin,validate){
 assert.equal(pin.source,A01.source,'Exact a01 source');
 assert.equal(pin.sourceTree,A01.sourceTree,'Exact a01 tree');
 assert.equal(pin.reviewIntegration,A01.reviewIntegration,'Exact a01 Review binding');
 assert.equal(pin.reviewSourceFiles,A01.reviewSourceFiles,'Exact a01 imported source count');
 assert.deepEqual(pin.runtimeSources,Object.fromEntries(modules.map(name=>[name,A01.source])),'Four exact a01 runtimes');
 assert.deepEqual(validate({pin}),pin,'Whole current delivery documents admit exact pin');
 return pin;
}
export function assertA01NegativeControls(pin,validate){
 const edits={
  source: p=>{p.source='727ed5b451ae940a01e56272c8fbc703ea3b0095'},
  sourceTree: p=>{p.sourceTree='6940282a3ae0462961b9b99a690c70f282ab8ce7'},
  reviewIntegration: p=>{p.reviewIntegration='c535c60256f6f09d348369e7c24cfa4e04663406c392c4b245465138dc2d7a68'},
  runtimeFamily: p=>{p.runtimeSources.shoulder='190a63238eadcf906abe89dcbb6a67c88afe70b9'},
  inputCount: p=>{p.reviewSourceFiles=1605},
 };
 for(const [name,edit] of Object.entries(edits)){
  const foreign=structuredClone(pin);edit(foreign);
  assert.throws(()=>assertA01Binding(foreign,validate),`Refuse altered a01 ${name}`);
 }
 return Object.keys(edits);
}
export function assertFrozenOriginal(file,expected){
 assert.equal(sha(readFileSync(file)),expected,'Whole unchanged 727 original source');
}
