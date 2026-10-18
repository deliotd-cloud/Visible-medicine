import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import {projectCoverageView,coverageRegionQuery,COVERAGE_SOURCE_REVISION,COVERAGE_SNAPSHOT_REVISION} from '../lib/anatomy-coverage-view.ts';
const snapshot=JSON.parse(readFileSync('docs/anatomy-coverage/index.json','utf8')),manifest=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
test('only the exact source-bound snapshot projects distinct counts and documented targets',async()=>{
 const view=await projectCoverageView(snapshot,manifest);assert(view);assert.equal(view.inventoryRevision,COVERAGE_SNAPSHOT_REVISION);
 assert.equal(view.sourceRevision,COVERAGE_SOURCE_REVISION);
 assert.equal(snapshot.sourceRevision,CURRENT_ATLAS_REVISION);
 const atlasRoot=currentAtlasDeliveryRoot();
 const packageBytes=execFileSync('git',['-C',atlasRoot,'show',`${CURRENT_ATLAS_REVISION}:package.json`],{maxBuffer:32e6});
 assert.equal(snapshot.evidence.sourceInputs['package.json'],createHash('sha256').update(packageBytes).digest('hex'));
 assert(!manifest.files.some((f:any)=>f.path==='package.json'));
 const imported=Object.keys(snapshot.evidence.sourceInputs).filter(path=>manifest.files.some((f:any)=>f.path===path));
 assert.equal(imported.length,142);assert.equal(Object.keys(snapshot.evidence.sourceInputs).length-imported.length,26);
 assert.deepEqual(view.counts,{root:1104,nested:108,specimenViews:9,specimenMemberships:356,specimenSelections:267,shoulder:9});
 assert.equal(view.targets.length,7);assert.deepEqual(view.reference,{files:2234,differences:441,nested:24,corrected:1,held:57,unsupported:359});
 assert(!JSON.stringify(view).includes('sourceInputs'));assert(!JSON.stringify(view).includes('F:/'));assert(!Object.hasOwn(view,'approval'));assert(!Object.hasOwn(view,'percentage'));
 view.targets[0].regions.push('spine');assert(!snapshot.documentedRootTargetGroups[0].regions.includes('spine'));
});
test('changed snapshot, mixed source epoch and forged imported dependency fail closed',async()=>{
 const s=structuredClone(snapshot);s.scopedCounts.root.rootRepresentations++;assert.equal(await projectCoverageView(s,manifest),null);
 const old=structuredClone(manifest);old.revision='a'.repeat(40);assert.equal(await projectCoverageView(snapshot,old),null);
 const forged=structuredClone(manifest),path=Object.keys(snapshot.evidence.sourceInputs).find(p=>forged.files.some((f:any)=>f.path===p))!;
 forged.files.find((f:any)=>f.path===path).sourceSha256='0'.repeat(64);assert.equal(await projectCoverageView(snapshot,forged),null);
 const forgedImport=structuredClone(manifest);forgedImport.files.find((f:any)=>f.path===path).importedSha256='0'.repeat(64);assert.equal(await projectCoverageView(snapshot,forgedImport),null);
 const misclassified=structuredClone(manifest);misclassified.files.push({path:'package.json',sourceSha256:snapshot.evidence.sourceInputs['package.json'],importedSha256:'0'.repeat(64)});
 assert.equal(await projectCoverageView(snapshot,misclassified),null);
});
test('missing imported input, duplicate manifest path and malformed values are unavailable',async()=>{
 const m=structuredClone(manifest);m.files=m.files.filter((f:any)=>f.path!=='lib/body-display-catalog.ts');assert.equal(await projectCoverageView(snapshot,m),null);
 const d=structuredClone(manifest);d.files.push(d.files[0]);assert.equal(await projectCoverageView(snapshot,d),null);
 for(const value of [null,{},[],undefined]){assert.equal(await projectCoverageView(value,manifest),null);assert.equal(await projectCoverageView(snapshot,value),null);}
});
test('region query accepts only one actual region and no unrelated parameters',()=>{
 assert.equal(coverageRegionQuery({}),null);assert.equal(coverageRegionQuery({region:''}),null);assert.equal(coverageRegionQuery({region:'hand'}),'hand');
 for(const p of [{region:['hand','spine']},{region:'__proto__'},{region:'whole-body'},{region:'unknown'},{region:'hand',approval:'true'}])assert.throws(()=>coverageRegionQuery(p));
});
