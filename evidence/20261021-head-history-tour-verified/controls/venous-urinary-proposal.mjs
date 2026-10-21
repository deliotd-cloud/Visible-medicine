// Test-only authored/current role separation; emit an exact staged proposal.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const site='F:/VisibleMedicine/website',root='F:/VisibleMedicine/staging/20261021-venous-urinary-role-proposal-v3';
assert(!existsSync(root));
const sha=b=>createHash('sha256').update(b).digest('hex');
const old='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const current='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const imports=`import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
const authoredRevision='${old}',currentRevision=CURRENT_ATLAS_REVISION;
assert.equal(currentRevision,'${current}');
const sourceRoot=currentAtlasDeliveryRoot();
const {exactSourceHistoryApi}=await import(pathToFileURL(sourceRoot+'/scripts/exact-source-history-api.mjs').href);
const exactSource=(revision:string,path:string)=>execFileSync('git',['show',revision+':'+path],{cwd:sourceRoot,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});`;
const specs=[
 {name:'clinical-review-upper-venous-tour',refusal:"assert.equal(await api.parseBodyReviewResponse(altered,entry.id),null,change);",seams:[
  ["import {build} from 'esbuild';",imports],
  [`assert.equal(learner.sourceCommit,'${old}');`,`assert.equal(learner.sourceCommit,currentRevision);`],
  [" const tour=api.upperVenousTour;assert.equal(tour.status,'draft');",` const authored=await exactSourceHistoryApi(authoredRevision,'regional-tour-security');
 const bound=await boundLiveAtlasHistory(currentRevision);
 for(const path of ['lib/upper-venous-tour.ts','content/upper-venous-tour-pins.json'])assert.deepEqual(readFileSync('atlas-review/'+path),exactSource(authoredRevision,path),'Exact authored tour source '+path);
 const tour=api.upperVenousTour;assert.deepEqual(wire(tour),wire(authored.upperVenousTour),'Complete authored tour remains unchanged');assert.equal(tour.status,'draft');`],
  ["  const evidence=packet.guidedTours.find",`  assert.deepEqual(packet,wire(await bound.bodyReviewMaterial(entry.id)),'Complete Website-renderer-bound current packet');
  const evidence=packet.guidedTours.find`],
 ]},
 {name:'clinical-review-urinary-tract-tour',refusal:"assert.equal(await api.parseBodyReviewResponse(altered,entry.id),null,`${entry.id}: ${change}`);",seams:[
  ["import {build} from 'esbuild';",imports],
  [`const revision='${old}';`,'const revision=currentRevision;'],
  ["};\nconst bundleHashes={",`};
for(const [path,digest]of Object.entries(sourcePaths))assert.equal(createHash('sha256').update(exactSource(authoredRevision,path)).digest('hex'),digest,'Exact authored source '+path);
const bundleHashes={`],
  [" const tour=api.urinaryTractTour;",` const authored=await exactSourceHistoryApi(authoredRevision,'regional-tour-security');
 const bound=await boundLiveAtlasHistory(currentRevision);
 for(const path of ['lib/urinary-tract-tour.ts','content/urinary-tract-tour-pins.json'])assert.deepEqual(readFileSync('atlas-review/'+path),exactSource(authoredRevision,path),'Exact authored tour source '+path);
 const tour=api.urinaryTractTour;
 assert.deepEqual(wire(tour),wire(authored.urinaryTractTour),'Complete authored tour remains unchanged');`],
  ["  const index=packet.guidedTours.findIndex",`  assert.deepEqual(packet,wire(await bound.bodyReviewMaterial(entry.id)),'Complete Website-renderer-bound current packet');
  const index=packet.guidedTours.findIndex`],
 ]},
];
const values=[],guards=[];
for(const spec of specs){
 const path='tests/'+spec.name+'.test.ts',original=readFileSync(site+'/'+path);
 let candidate=original.toString();for(const [before,after]of spec.seams){assert.equal(candidate.split(before).length,2,spec.name+': declared seam');candidate=candidate.replace(before,after);}
 const raw='tests/fixtures/'+spec.name+'-before-role-20261021.test.ts.raw';
 values.push({path,b:Buffer.from(candidate)},{path:raw,b:original});
 guards.push({path,raw,digest:sha(original),seams:spec.seams,refusal:spec.refusal});
}
const guard=`import assert from 'node:assert/strict';import test from 'node:test';import{readFileSync}from'node:fs';import{createHash}from'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const cases=${JSON.stringify(guards)};
for(const spec of cases)test('complete original authored/current tour contract: '+spec.path,()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url));const original=read(spec.raw);assert.equal(sha(original),spec.digest);
 const actual=read(spec.path).toString();let expected=original.toString();
 for(const [before,after]of spec.seams){assert.equal(expected.split(before).length,2);expected=expected.replace(before,after);}assert.equal(actual,expected);
 let inverse=actual;for(const [before,after]of spec.seams.toReversed()){assert.equal(inverse.split(after).length,2);inverse=inverse.replace(after,before);}assert.equal(sha(Buffer.from(inverse)),spec.digest);
 assert(actual.includes(spec.refusal));assert.throws(()=>assert.equal(actual.replace(spec.refusal,''),expected));
 assert.throws(()=>assert.equal(actual+'\\nconst unknown=true;\\n',expected));
});
`;
values.push({path:'tests/venous-urinary-role-preservation-20261021.test.mjs',b:Buffer.from(guard)});
const proposal={schema:'visible-medicine.main-venous-urinary-role-proposal/1',websiteHeadAtObservation:'b953ff3f5f1891599cb6e91cb91311d9d6006270',source:current,review:'34c11463b3ae1ff1d603f3cf48dd86fa3f29f3bd34663d7200612d2fccb4e78f',proposedPaths:values.map(({path,b})=>({path,preimageSha256:existsSync(site+'/'+path)?sha(readFileSync(site+'/'+path)):null,candidateSha256:sha(b),candidateBytes:b.length})),diagnosis:'Original upper-venous/urinary tests compare moving current manifests to immutable9f. Keep every original stop, frame, source hash, licence-scope and altered-packet assertion; authenticate complete authored tour source/API independently, and current complete packets against verified Website-renderer-bound190 replay. Exact old9f-to190 Git diff across both tours, pins and regional-tour aggregator is empty, so all original urinary source hashes remain unchanged rather than being dynamically replaced. Main corrected the initial staged historical API reader to the actual Atlas Git replay and discarded an unnecessary dynamic hash map before canonical admission.',limits:'Staged test-only proposal. Native affected roots not run yet. No product, source teaching, model, private, review decision, permissions or deployment change.'};
const patch=['*** Begin Patch'];for(const {path,b}of [...values,{path:'PROPOSAL.json',b:Buffer.from(JSON.stringify(proposal,null,2)+'\n')}])patch.push('*** Add File: '+root+'/'+path,...b.toString().trimEnd().split('\n').map(line=>'+'+line));patch.push('*** End Patch');console.log(patch.join('\n'));
