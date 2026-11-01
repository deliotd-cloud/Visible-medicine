import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {budgets,currentContract,safeChild} from './plan.mjs';
const site='G:/VisibleMedicine-temp/staging/20261101-catalog-compiler/website';
test('recipe retains unchanged memory reserve and full-check budgets',()=>{
 assert.deepEqual(budgets.types,{heap:3072,aggregate:3584,minimum:5632});
 assert.deepEqual(budgets.native,{heap:2304,aggregate:3072,minimum:5120});
 for(const b of Object.values(budgets))assert(b.minimum>=b.aggregate+2048);
});
test('attempt paths cannot escape their absolute root',()=>{
 const root='G:/VisibleMedicine-temp/staging/20261101-catalog-delivery/attempt-1';
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
