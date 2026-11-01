import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {viewerContract} from './plan.mjs';
import {budgets,currentContract,safeChild,expectedSourceSha256,expectedReviewBinding,reviewCount,bindingCount,nativeHead,nativeTree,requiredSourceChecks,deliveryPhases,validateFinalSourceEvidence} from './plan.mjs';
const site='G:/VisibleMedicine-temp/staging/20261101-focus-website/website';
test('current Review count update is exact and preserves all historical checks',()=>{
 const previous=fs.readFileSync(site+'/tests/current-atlas-delivery.mjs','utf8');
 const changed=viewerContract(previous);assert.equal(changed.text.replace(changed.to,changed.from),previous);
 assert.throws(()=>viewerContract(changed.text));assert.throws(()=>viewerContract(previous.replace('pin.viewerFiles,62','pin.viewerFiles,61')));
});
test('sealed source identities and memory reserve remain exact',()=>{
 assert.equal(expectedSourceSha256,'5b92c78d38b32e1f2549cd46ef45966b04259945f0289cffdf4a5d212e5742e4');
 assert.equal(expectedReviewBinding,'b19cc36239128192dc21bd32857bec87e03131c4c9f50a89ccecf51fac17420c');
 assert.equal(nativeHead,'7d3ab00f500a738d4f2d261ca6cd768e7f6ce1bc');
 assert.equal(nativeTree,'2e742b31600a6da39af99558d07ff6986fec6b9e');
 assert.equal(reviewCount,1675);assert.equal(bindingCount,1908);
 for(const b of Object.values(budgets))assert(b.minimum>=b.aggregate+2048);
 assert.deepEqual(budgets.nativeTypes,budgets.types);
});
test('all delivery phases including full native types are present and ordered',()=>{
 assert.deepEqual(deliveryPhases,['native-types','native-build','assemble','review-build','focused-checks','full-types','full-build']);
 const run=fs.readFileSync(new URL('./run.mjs',import.meta.url),'utf8');
 for(const name of deliveryPhases)assert(run.includes("['"+name+"'"),name);
 assert.match(run,/assert\.deepEqual\(jobs\.map\(row=>row\[0\]\),deliveryPhases/);
 assert.match(run,/node_modules\/typescript\/bin\/tsc --noEmit --incremental false --pretty false/);
});
test('attempt paths reject traversal, absolute paths and alternate drives',()=>{
 const root='G:/VisibleMedicine-temp/staging/20261101-focus-delivery/attempt-1';
 assert.equal(safeChild(root,'website'),root+'/website','Process-boundary paths must be canonical on Windows');
 assert.equal(safeChild(root.replaceAll('/','\\'),'website'),root+'/website','Equivalent Windows input yields the same process-boundary path');
 assert(safeChild(root,'website/lib/source.ts').replaceAll('\\','/').endsWith('/attempt-1/website/lib/source.ts'));
 for(const bad of ['../outside','/absolute','C:/elsewhere','website/../outside','website\\elsewhere','website//file',''])assert.throws(()=>safeChild(root,bad));
});
test('historical delivery contract is reversible and exact',()=>{
 const prior=fs.readFileSync(site+'/tests/current-atlas-delivery.test.mjs','utf8');
 const result=currentContract(prior);assert.equal(result.changes.length,4);
 let restored=result.text;for(const[from,to]of [...result.changes].reverse())restored=restored.replace(to,from);
 assert.equal(restored,prior);assert.throws(()=>currentContract(result.text));
 assert.throws(()=>currentContract(prior.replace('assert.equal(sourceFiles,1657)','assert.equal(sourceFiles,1)')));
});
test('source evidence rejects missing phases, wrong identity and incomplete terminal',()=>{
 const proof={sourceRevision:nativeHead,sourceTree:nativeTree,imported:reviewCount,bound:bindingCount,reviewBinding:expectedReviewBinding,installed:false,clinicalApproval:false,patientRegistration:false,
  added:['app/study-return-focus.ts','content/renal-venous-xray.ts'],removed:[],changed:['app/prostate-zones.tsx','app/study-surface.tsx','content/body-renderer-revision.json','content/prostate-zones-revision.json','content/renal-teaching.ts'],checks:requiredSourceChecks.map(name=>({name,logSha256:'a'.repeat(64)}))};
 const terminal={passing:true,supervisor:{code:0},process:{terminalObserved:true,exitCode:0,interrupted:false}};
 assert.doesNotThrow(()=>validateFinalSourceEvidence(proof,terminal));
 for(const altered of [{...proof,sourceRevision:'0'.repeat(40)},{...proof,reviewBinding:'0'.repeat(64)},{...proof,checks:proof.checks.slice(1)},{...proof,checks:[...proof.checks,proof.checks[0]]},{...proof,patientRegistration:true}])assert.throws(()=>validateFinalSourceEvidence(altered,terminal));
 for(const altered of [{...terminal,passing:false},{...terminal,process:{...terminal.process,exitCode:1}},{...terminal,process:{...terminal.process,interrupted:true}}])assert.throws(()=>validateFinalSourceEvidence(proof,altered));
});
