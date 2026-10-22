import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery,historicalAtlasGitRoot} from './historical-current-atlas-delivery-56.mjs';
import {reconstructFamilyPrior} from './clinical-family-prior-current-inverse.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const originalBytes=readFileSync(new URL('./fixtures/clinical-review-femoral-venous-original.ts.txt',import.meta.url));
assert.equal(sha(originalBytes),'9674e14c29f262f0f3ca622ec2f2d78e324f9731a2ccf93ec43c5a4a4c9fe071');
const original=originalBytes.toString('utf8');
const admittedBytes=readFileSync(new URL('./clinical-review-femoral-venous-xray.test.ts',import.meta.url));
const priorBytes=readFileSync(new URL('./fixtures/clinical-review-femoral-venous-xray.test.ts.prior-current.raw',import.meta.url));
const candidate=reconstructFamilyPrior('venous',admittedBytes,priorBytes).toString('utf8');
const oldImport="import {emittedTeaching} from './atlas-emitted-teaching.ts';";
const newImport=oldImport+"\nimport {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';";
const oldPin="const liveCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';";
const newPin='const liveCommit=CURRENT_ATLAS_REVISION;';
const oldRoot="const atlas='F:/VisibleMedicine/atlas';";
const newRoot='const atlas=currentAtlasDeliveryRoot();';
const exact=original.replace(oldImport,newImport).replace(oldPin,newPin).replace(oldRoot,newRoot);

test('every original venous assertion survives the exact current pin and source-root seams',()=>{
 assert.equal(original.split(oldImport).length,2);
 assert.equal(original.split(oldPin).length,2);
 assert.equal(original.split(oldRoot).length,2);
 assert.equal(candidate,exact);
 const root=historicalAtlasGitRoot();
 assert.equal(execFileSync('git',['rev-parse','9fba9a1e24b6669aafd48e945d55fc0939d50ab2^{commit}'],{cwd:root,encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim(),'9fba9a1e24b6669aafd48e945d55fc0939d50ab2');
});

test('venous current admission is exact 46c source and b4db Review; stale or forged pins fail',()=>{
 const pin=validateCurrentAtlasDelivery();
 assert.equal(CURRENT_ATLAS_REVISION,'46c43ed8cf121aa046ef5bbaf6c7e67c08ae50cd');
 assert.equal(pin.sourceTree,'83720d136f899876bd947323e6552c4d3e171210');
 assert.equal(pin.reviewIntegration,'b4db62ff56037c1ca251e32256afd470f6e155ca3f563d1d1db86b6ec9c6d916');
 assert.equal(pin.reviewSourceFiles,1531);
 assert(historicalAtlasGitRoot());
 assert.notEqual(pin.source,'9fba9a1e24b6669aafd48e945d55fc0939d50ab2');
 assert.throws(()=>validateCurrentAtlasDelivery({pin:{...pin,source:'9fba9a1e24b6669aafd48e945d55fc0939d50ab2'}}));
 assert.throws(()=>validateCurrentAtlasDelivery({pin:{...pin,reviewIntegration:'0'.repeat(64)}}));
});

test('mutated historical assertions or an extra read cannot pass the exact current migration',()=>{
 for(const text of [candidate+'\n',candidate.replace(newPin,oldPin),candidate.replace(newRoot,oldRoot),candidate.replace(newImport,newImport+'\n// foreign'),candidate.replace('assert.equal(entries.length,6)','assert.equal(entries.length,5)')])assert.notEqual(text,exact);
});
test('venous family admission refuses changed runtime scope or disabled source',()=>{
 const text=admittedBytes.toString('utf8');
 for(const [from,to] of [
  ['manifest.sourceCommit,admission.runtimeSources[name]','manifest.sourceCommit,revision'],
  ['assert.equal(entries.length,6)','assert.equal(entries.length,5)'],
 ]){
  assert.equal(text.split(from).length,2);
  assert.throws(()=>reconstructFamilyPrior('venous',Buffer.from(text.replace(from,to)),priorBytes));
 }
 assert.throws(()=>reconstructFamilyPrior('venous',Buffer.from('if(false){\n'+text+'\n}'),priorBytes));
});
