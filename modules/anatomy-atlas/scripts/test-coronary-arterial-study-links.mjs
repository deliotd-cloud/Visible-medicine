import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from './workspace-test-build.mjs';
const built=await build({stdin:{contents:"export * from './lib/study-links'; export {bodyDisplayCatalog} from './lib/body-display-catalog'; export * from './lib/coronary-arterial-study';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const catalog=api.bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')));
const study=api.coronaryArterialStudyFor(catalog);assert(study);
let accepted=0,refused=0;
for(const region of ['thorax','whole-body'])for(const target of study.targets){
 const link=api.makeStudyLink(catalog,region,target.id,'both',api.coronaryArterialStudyId);assert(link);
 const parsed=api.parseStudyLink(Object.fromEntries(new URL(link,'https://atlas.invalid').searchParams));
 const resolved=api.resolveStudyLink(catalog,region,parsed);assert.equal(resolved.status,'ready');
 assert.equal(resolved.selected.id,target.id);assert.equal(resolved.focusId,api.coronaryArterialStudyId);
 assert.deepEqual(resolved.visibleIds.slice().sort(),[...study.targets,...study.context].map(s=>s.id).sort());accepted++;
 for(const side of ['left','right']){assert.equal(api.makeStudyLink(catalog,region,target.id,side,api.coronaryArterialStudyId),null);refused++;}
 for(const mutation of [
   c=>{c.coordinateSystem.unitsPerMillimetre=2;},c=>{c.license+=' changed';},c=>{c.credit+=' changed';},
   c=>{c.structures.find(s=>s.fmaId==='FMA7088').bounds.min[0]+=0.01;},
   c=>{c.structures.find(s=>s.fmaId==='FMA3862').sources.pop();},
   c=>{c.bundles.find(b=>b.id===study.context[0].bundle).sha256='0'.repeat(64);},
   c=>{c.structures.push(structuredClone(study.targets[0]));},
 ]){
   const changed=structuredClone(catalog);mutation(changed);
   assert.equal(api.resolveStudyLink(changed,region,parsed).status,'rejected');
   assert.equal(api.makeStudyLink(changed,region,target.id,'both',api.coronaryArterialStudyId),null);refused++;
 }
 const wrong=api.resolveStudyLink(catalog,'abdomen',parsed);assert.equal(wrong.status,'rejected');refused++;
}
console.log(JSON.stringify({passed:true,accepted,refused,localLinksOnly:true,clinicalApproval:false}));
