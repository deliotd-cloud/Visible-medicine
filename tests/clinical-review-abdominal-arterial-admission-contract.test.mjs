import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const raw=readFileSync(new URL('./fixtures/clinical-review-abdominal-arterial-xray.test.ts.raw',import.meta.url));
const candidate=readFileSync(new URL('./clinical-review-abdominal-arterial-xray.test.ts',import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const rawSha='6ccf9827e20b1f2b2230fae0e8515b0f5e0188cb8fe484c811b64a3de9391dac';
const currentImport="import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';";

function replaceOne(source,oldText,newText){
 assert.equal(source.split(oldText).length,2,`Expected exactly one declared seam: ${oldText}`);
 return source.replace(oldText,newText);
}

function reconstructCandidate(){
 assert.equal(sha(raw),rawSha,'Frozen original test changed');
 let result=raw.toString('utf8');
 result=replaceOne(result,
  "import {emittedTeaching} from './atlas-emitted-teaching.ts';\n",
  "import {emittedTeaching} from './atlas-emitted-teaching.ts';\n"+currentImport+"\n");
 result=replaceOne(result,
  "const atlas='F:/VisibleMedicine/atlas';",
  "const atlas=currentAtlasDeliveryRoot();");
 result=replaceOne(result,
  "test('four exact abdominal arterial X-ray drafts reach regional learner and protected Review',async()=>{\n",
  "test('four exact abdominal arterial X-ray drafts reach regional learner and protected Review',async()=>{\n"+
  " const admission=validateCurrentAtlasDelivery();\n"+
  " assert.equal(admission.source,CURRENT_ATLAS_REVISION);\n");
 for(const subject of ['review.revision','learner.sourceCommit','viewer.sourceCommit']){
  result=replaceOne(result,
   ` assert.equal(${subject},revision);`,
   ` assert.equal(${subject},CURRENT_ATLAS_REVISION);`);
 }
 result=replaceOne(result,
  " {cwd:atlas,windowsHide:true,maxBuffer:32e6});",
  " {cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});");
 return Buffer.from(result,'utf8');
}

function assertExactAdmission(bytes){
 assert.deepEqual(bytes,reconstructCandidate(),
  'Only the declared current-delivery admission seams may differ from the frozen original');
}

function mutateOne(oldText,newText){
 const text=candidate.toString('utf8');
 assert.equal(text.split(oldText).length,2,`Mutation target missing or repeated: ${oldText}`);
 return Buffer.from(text.replace(oldText,newText),'utf8');
}

test('candidate preserves every original assertion outside the declared admission seams',()=>{
 assertExactAdmission(candidate);
 assert(candidate.toString('utf8').includes("const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';"));
 assert(candidate.toString('utf8').includes("execFileSync('git',['show',`${revision}:${path}`]"));
 assert(candidate.toString('utf8').includes(currentImport));
});

test('admission contract refuses changes to sources, negatives, emitted evidence and approval',()=>{
 const mutations=[
  ["const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';",
   "const revision='3dcdf94a46db44202e72641be9fbcf1274ce5364';"],
  [" 'content/central-vessel-imaging-pins.json',",
   " 'content/another-pins.json',"],
  ["assert.equal(learner.clinicalApproved,false);",
   "assert.equal(learner.clinicalApproved,true);"],
  ["const emitted=[emittedTeaching(learnerBase,learner.files,true),",
   "const emitted=[emittedTeaching(learnerBase,learner.files,false),"],
  ["assert.equal(packet.approval,false);",
   "assert.equal(packet.approval,true);"],
  ["assert.equal(await api.parseBodyReviewResponse(bad,id),null);",
   "assert.equal(await api.parseBodyReviewResponse(bad,id),bad);"],
  ["const admission=validateCurrentAtlasDelivery();",
   "const admission=validateCurrentAtlasDelivery({pin:forged});"],
  ["GIT_NO_REPLACE_OBJECTS:'1'","GIT_NO_REPLACE_OBJECTS:'0'"],
 ];
 for(const [before,after] of mutations)
  assert.throws(()=>assertExactAdmission(mutateOne(before,after)),{name:'AssertionError'},before);
});
