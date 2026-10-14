import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {nestedBeforeDuctXray} from './nested-duct-xray-history.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const compiled=await build({stdin:{contents:"export {nestedConcepts,nestedTeachingReferences} from './content/nested-teaching';",resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const current=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const prior=await exactSourceHistoryApi('f3d6966a040b69a375f6bbfa2a8c502b8c8492e4','nested-review-security');
const copy=value=>JSON.parse(JSON.stringify(value));
const api={nestedConcepts:copy(current.nestedConcepts),nestedTeachingReferences:copy(current.nestedTeachingReferences),sentinel:{untouched:true}};
const original=copy(api),before=nestedBeforeDuctXray(api);
assert.deepEqual(api,original,'No mutation');
assert.deepEqual(before.nestedConcepts,copy(prior.nestedConcepts),'Complete immutable historical teaching');
assert.deepEqual(before.nestedTeachingReferences,copy(prior.nestedTeachingReferences),'Complete immutable historical references');
assert.equal(before.sentinel,api.sentinel);assert.equal(nestedBeforeDuctXray(before),before,'Idempotent exact history');
const unrelated=copy(api);unrelated.nestedConcepts.find(c=>c.id!=='pancreatic-ductal-system'&&c.id!=='hepatic-biliary').modelLimit+=' unrelated future note';
const untouched=unrelated.nestedConcepts[0];assert.equal(nestedBeforeDuctXray(unrelated).nestedConcepts[0],untouched,'Never rewrites unrelated concepts');
let refused=0;
for(const edit of [
  v=>{delete v.nestedTeachingReferences.ductXrayPtc;},
  v=>{v.nestedTeachingReferences.ductXrayErcp.title+=' foreign';},
  v=>{v.nestedTeachingReferences.ductXrayErcp.scopedToConcept=false;},
  v=>{v.nestedConcepts.find(c=>c.id==='pancreatic-ductal-system').imaging.xray.body+=' foreign';},
  v=>{delete v.nestedConcepts.find(c=>c.id==='hepatic-biliary').imaging.xray;},
  v=>{v.nestedConcepts.find(c=>c.id==='hepatic-biliary').modelLimit+=' foreign';},
  v=>{v.nestedConcepts=v.nestedConcepts.filter(c=>c.id!=='hepatic-biliary');},
  v=>{v.nestedConcepts.push(copy(v.nestedConcepts.find(c=>c.id==='hepatic-biliary')));},
]){const changed=copy(api);edit(changed);assert.throws(()=>nestedBeforeDuctXray(changed));refused++;}
const mixed=copy(before);mixed.nestedTeachingReferences.ductXrayErcp=copy(api.nestedTeachingReferences.ductXrayErcp);assert.throws(()=>nestedBeforeDuctXray(mixed));refused++;
console.log(JSON.stringify({passed:true,immutableBefore:'f3d6966a040b69a375f6bbfa2a8c502b8c8492e4',exactProjection:true,idempotent:true,unrecordedStatesRejected:refused,runtimeOrApprovalMigration:false}));
