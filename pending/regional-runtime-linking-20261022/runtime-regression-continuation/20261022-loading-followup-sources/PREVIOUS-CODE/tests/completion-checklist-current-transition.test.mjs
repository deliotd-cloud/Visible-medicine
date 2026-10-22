import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateChecklist} from '../scripts/refresh-completion-checklist.mjs';
import {validateCurrentAtlasDelivery as validateStrictCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {validateHistoricalAtlasDelivery as validateCurrentAtlasDelivery} from './historical-atlas-delivery-register47.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fixture=(name,expected)=>{
 const bytes=readFileSync(new URL('./fixtures/'+name,import.meta.url));
 assert.equal(sha(bytes),expected,name+' is the exact frozen revision47 fixture');
 return JSON.parse(bytes);
};
const prior=fixture('completion-checklist-47.json','a3e61503ea5f3b16fe26eec2c738dc010256e5a65af06a9a269fbabbc3e256c2');
const priorPin=fixture('current-atlas-delivery-7b3e678a.json','1a9a62e5ec6998ccc0f68c083dcd50ef03c6f89bc8cc46a7036e6c3ba39466cf');
const priorInputs=fixture('integration-inputs-7b3e678a.json','37ee961401e8d18bf6e595a7edf58acd49faeec8a47201fdc91747697b637104');
const current=validateChecklist(fixture('completion-checklist-48-before-head-client.json','43f95364c4063151cbf9266c8e94e24fdc76f9b309f2603780bb085ca4d06117'));
const revision48Pin=fixture('current-atlas-delivery-48-before-head-client.json','68c4008ad83a0bbb5be53db16d715453ee9b71a9ed6e4f5a27c3fd32bd99a539');
const revision48Inputs=fixture('integration-inputs-48-before-head-client.json','747debf661f679d52c165035969a16b00bc126eda77fb5e2d1bd47322d5ba241');

test('original revision47 checklist test remains byte-for-byte reconstructable',()=>{
 const raw=readFileSync(new URL('./fixtures/completion-checklist.test.mjs.raw',import.meta.url));
 assert.equal(sha(raw),'a6c088c5f19c1df50dabb65c3107c7b1e39392aaa4cc5b67a08de9931e5a322d');
 const post=readFileSync(new URL('./completion-checklist.test.mjs',import.meta.url));
 const before="const data=JSON.parse(readFileSync(new URL('../docs/completion-checklist.json',import.meta.url)));";
 const after="const revision47Bytes=readFileSync(new URL('./fixtures/completion-checklist-47.json',import.meta.url));\n"+
  "assert.equal(createHash('sha256').update(revision47Bytes).digest('hex'),'a3e61503ea5f3b16fe26eec2c738dc010256e5a65af06a9a269fbabbc3e256c2');\n"+
  'const data=JSON.parse(revision47Bytes);';
 const text=post.toString('utf8');
 assert.equal(text.split(after).length,2,'Only the declared historical data binding changes');
 assert.deepEqual(Buffer.from(text.replace(after,before),'utf8'),raw,'Every historical assertion and byte is preserved');
});

test('revision48 changes only the closed Review binding and preserves all 71 requirements',()=>{
 const pin=revision48Pin;
 assert.equal(current.revision,48);
 assert.equal(prior.revision,47);
 assert.equal(current.items.length,71);
 assert.equal(current.items.filter(item=>item.scope==='optional').length,8);
 assert.deepEqual(current.items,prior.items,'Status, scope, owner, acceptance, evidence and every requirement remain exact');
 assert.deepEqual(current.statusDefinitions,prior.statusDefinitions);
 assert.deepEqual(current.rules,prior.rules);
 assert.deepEqual(current.roots,prior.roots);
 assert.deepEqual(current.pendingAtlasSource,prior.pendingAtlasSource,'Atlas source and no clinical approval change');
 assert.deepEqual(current.changeLog.slice(1),prior.changeLog);
 assert.equal(current.changeLog[0].revision,48);
 const {reviewIntegration:oldReview,...oldBaseline}=prior.baseline;
 const {reviewIntegration:newReview,...newBaseline}=current.baseline;
 assert.deepEqual(newBaseline,oldBaseline,'Atlas source/tree, counts and private-state limits remain unchanged');
 assert.equal(oldReview,priorPin.reviewIntegration);
 assert.notEqual(newReview,oldReview);
 assert.equal(newReview,pin.reviewIntegration,'Register binds the closed current-delivery fixture');
 assert.equal(pin.source,priorPin.source);
 assert.equal(pin.sourceTree,priorPin.sourceTree);
 assert.equal(pin.reviewSourceFiles,priorPin.reviewSourceFiles);
 assert.equal(pin.viewerFiles,priorPin.viewerFiles);
 assert.equal(pin.viewerPackages,priorPin.viewerPackages);
 assert.equal(pin.source,'7b3e678ae4b8059aadb84459048ebd05f7abe7b9');
 assert.equal(pin.sourceTree,'de883b9d6bccb3b4403256e42fabc7471e0ea8c9');
 for(const path of Object.keys(priorPin.documents)){
  if(['atlas-review/manifest.json','atlas-review/integration-inputs.json','public/atlas-review-viewer/manifest.json'].includes(path))continue;
  assert.equal(pin.documents[path],priorPin.documents[path],path+' remains byte-identical');
 }
 assert.equal(pin.documents['lib/atlas-model-inventory.json'],priorPin.documents['lib/atlas-model-inventory.json']);
 assert.equal(current.baseline.privateClinicalDecisionCounts,null);
 assert.equal(current.baseline.publicReleaseApproval,null);
});

test('normal Review closure changes exactly one of 1,649 existing input hashes',()=>{
 const pin=revision48Pin;
 const next=revision48Inputs;
 assert.equal(next.sourceCommit,priorInputs.sourceCommit);
 assert.equal(next.sourceCommit,pin.source);
 assert.equal(next.sha256,pin.reviewIntegration);
 assert.equal(priorInputs.inputs.length,1649);
 assert.equal(next.inputs.length,1649);
 assert.deepEqual(next.inputs.map(row=>row.path),priorInputs.inputs.map(row=>row.path),'No Review input added, removed or reordered');
 const changed=next.inputs.flatMap((row,i)=>row.sha256===priorInputs.inputs[i].sha256?[]:[row.path]);
 assert.deepEqual(changed,['lib/head-local-source.ts']);
 const old=priorInputs.inputs.find(row=>row.path===changed[0]);
 const now=next.inputs.find(row=>row.path===changed[0]);
 assert.equal(old.sha256,'8741b3b0c83ef963c98ef8e6f042691b1e9c0aa7e39e78b08ca20547d8265849');
 assert.notEqual(now.sha256,old.sha256);
 assert.equal(sha(readFileSync(new URL('../lib/head-local-source.ts',import.meta.url))),now.sha256);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:priorPin}),/Current delivery changed:/,'Revision47 binding must reject the new normal build');
});

test('current schema-2 admission refuses the exact closed revision47 schema-1 packet',()=>{
 assert.equal(priorPin.schema,'vm-current-atlas-test-delivery-1');
 assert.throws(()=>validateStrictCurrentAtlasDelivery({pin:priorPin}),{
  code:'ERR_ASSERTION',actual:'vm-current-atlas-test-delivery-1',expected:'vm-current-atlas-test-delivery-2',
 });
});
