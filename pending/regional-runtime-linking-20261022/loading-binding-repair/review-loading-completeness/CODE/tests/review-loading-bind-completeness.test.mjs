import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=relative=>readFileSync(root+'/'+relative);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const routeRoot='app/workspace/atlas-review';
const routes=readdirSync(root+'/'+routeRoot,{recursive:true})
 .filter(relative=>/\.(tsx|css)$/.test(relative))
 .map(relative=>routeRoot+'/'+relative.replaceAll('\\','/')).sort();
const loading=routeRoot+'/loading.tsx';

function exactRouteCoverage(inputs){
 assert.equal(new Set(inputs.map(row=>row.path)).size,inputs.length,'Unique source inputs');
 for(const relative of routes){
  const rows=inputs.filter(row=>row.path===relative);
  assert.equal(rows.length,1,'Missing native Review source: '+relative);
  assert.equal(rows[0].sha256,sha(read(relative)),'Changed native Review source: '+relative);
 }
}

test('every native Review route and loading fallback is source-bound',()=>{
 const pin=validateCurrentAtlasDelivery();
 const binding=JSON.parse(read('atlas-review/integration-inputs.json'));
 assert.equal(binding.sha256,pin.reviewIntegration);
 assert.equal(sha(JSON.stringify(binding.inputs)),binding.sha256);
 assert(routes.includes(loading),'A loading boundary exists in this delivery');
 exactRouteCoverage(binding.inputs);
});

test('Review completeness rejects an omitted, duplicated or changed loading source',()=>{
 const {inputs}=JSON.parse(read('atlas-review/integration-inputs.json'));
 const row=inputs.find(input=>input.path===loading);assert(row);
 assert.throws(()=>exactRouteCoverage(inputs.filter(input=>input.path!==loading)),/Missing native Review source/);
 assert.throws(()=>exactRouteCoverage([...inputs,row]),/Unique source inputs/);
 assert.throws(()=>exactRouteCoverage(inputs.map(input=>input.path===loading?{...input,sha256:'0'.repeat(64)}:input)),/Changed native Review source/);
});

test('the production Review viewer carries the exact native route binding',()=>{
 const pin=validateCurrentAtlasDelivery();
 const viewer=JSON.parse(read('public/atlas-review-viewer/manifest.json'));
 assert.equal(viewer.websiteIntegrationSha256,pin.reviewIntegration);
 assert.equal(viewer.mode,'production');
 assert.equal(viewer.personalRecordsIncluded,false);
 for(const row of viewer.files)assert.equal(sha(read('public/atlas-review-viewer/'+row.path)),row.sha256);
});
