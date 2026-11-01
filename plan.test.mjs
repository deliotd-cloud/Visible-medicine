import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {budgets,currentContract,safeChild,expectedSourceSha256,expectedReviewBinding,reviewCount,bindingCount,nativeHead,nativeTree,validateFinalSourceEvidence,finalSourceEvidence} from './plan.mjs';
const site='G:/VisibleMedicine-temp/staging/20261101-hepatic-website/website';
test('recipe retains unchanged memory reserve and full-check budgets',()=>{
 assert.deepEqual(budgets.types,{heap:3072,aggregate:3584,minimum:5632});
 assert.deepEqual(budgets.native,{heap:2304,aggregate:3072,minimum:5120});
 for(const b of Object.values(budgets))assert(b.minimum>=b.aggregate+2048);
});
test('recipe pins the sealed hepatic source and review binding',()=>{
 assert.equal(expectedSourceSha256,'9412dcb2aa53e4732138b622a74a8fe6f14fa0e9a90a03f05ab773cf41829bf7');
 assert.equal(expectedReviewBinding,'5cf7e8819d832c86f1ebfd813c567dd7514265b7103c0dae8ad3cd25cc0741f8');
 assert.equal(nativeHead,'b688ddd0c1fb6392ba8e8d7890142d750c8100f1');
 assert.equal(nativeTree,'5570ea23bad79e6dbbd842518ff53298faee5a66');
 assert.equal(reviewCount,1673);assert.equal(bindingCount,1906);
});
test('attempt paths cannot escape their absolute root',()=>{
 const root='G:/VisibleMedicine-temp/staging/20261101-hepatic-delivery/attempt-1';
 assert(safeChild(root,'website/lib/source.ts').replaceAll('\\','/').endsWith('/attempt-1/website/lib/source.ts'));
 for(const bad of ['../outside','/absolute','C:/elsewhere','website/../outside','website\\elsewhere','website//file',''])assert.throws(()=>safeChild(root,bad));
});
test('current delivery substitution preserves every prior assertion and rejects unexpected inputs',()=>{
 const prior=fs.readFileSync(site+'/tests/current-atlas-delivery.test.mjs','utf8');
 const result=currentContract(prior);assert.equal(result.changes.length,4);
 let restored=result.text;for(const[from,to]of [...result.changes].reverse())restored=restored.replace(to,from);
 assert.equal(restored,prior);
 assert.throws(()=>currentContract(result.text));
 assert.throws(()=>currentContract(prior.replace('assert.equal(sourceFiles,1657)','assert.equal(sourceFiles,1)')));
 assert.throws(()=>currentContract(prior+'\n'+result.changes[0][0]));
 assert.throws(()=>currentContract(prior,'not-a-revision'));
});

test('pending completion evidence cannot admit delivery; complete evidence remains source-bound',()=>{
 const state=finalSourceEvidence();
 if(!state.ready)assert.throws(()=>finalSourceEvidence({required:true}),/Finish the two hepatic coverage tests/);
 else assert.deepEqual(finalSourceEvidence({required:true}),state);
});

test('final evidence requires both complete tests, a terminal pass and an unchanged binding',()=>{
 const proof={sourceRevision:nativeHead,sourceTree:nativeTree,imported:reviewCount,bound:bindingCount,reviewBinding:expectedReviewBinding,installed:false,clinicalApproval:false,patientRegistration:false,checks:['hepatic-coverage-binding-fixed','binding-deterministic'].map(name=>({name,logSha256:'a'.repeat(64)}))};
 const terminal={passing:true,supervisor:{code:0},process:{terminalObserved:true,exitCode:0,interrupted:false}};
 const tap='# tests 2\n# pass 2\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n',binder=JSON.stringify({integrationHash:expectedReviewBinding});
 assert.doesNotThrow(()=>validateFinalSourceEvidence(proof,terminal,tap,binder));
 for(const changed of [tap.replace('# pass 2','# pass 1'),tap.replace('# cancelled 0','# cancelled 1'),tap.replace('# skipped 0','# skipped 1'),tap.replace('# todo 0','# todo 1')])assert.throws(()=>validateFinalSourceEvidence(proof,terminal,changed,binder));
 for(const changed of [{...terminal,passing:false},{...terminal,process:{...terminal.process,terminalObserved:false}},{...terminal,process:{...terminal.process,exitCode:1}},{...terminal,process:{...terminal.process,interrupted:true}}])assert.throws(()=>validateFinalSourceEvidence(proof,changed,tap,binder));
 for(const changed of [{...proof,sourceRevision:'0'.repeat(40)},{...proof,clinicalApproval:true},{...proof,checks:proof.checks.slice(0,1)},{...proof,checks:[...proof.checks,proof.checks[0]]}])assert.throws(()=>validateFinalSourceEvidence(changed,terminal,tap,binder));
 assert.throws(()=>validateFinalSourceEvidence(proof,terminal,tap,JSON.stringify({integrationHash:'0'.repeat(64)})));
});
