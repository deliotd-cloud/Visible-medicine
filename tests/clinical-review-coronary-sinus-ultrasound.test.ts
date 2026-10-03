import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

test('coronary sinus echo draft is source-bound in learner and review while small vein and imaging approval remain pending',async()=>{
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const inputs=JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json','utf8'));
 assert.equal(review.revision,'946700cc8c5162076cd5e5d9f79a00ba72c6fda1');
 for(const path of ['content/coronary-venous-teaching.ts','content/nested-teaching.ts','content/nested-teaching-bindings.v1.json','lib/nested-teaching.ts']){
  const file=review.files.find((f:any)=>f.path===path);assert(file);
  assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,file.sourceSha256);
  assert.equal(createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'),file.importedSha256);
 }
 const result=await build({stdin:{contents:`export * from './atlas-review/lib/nested-review-material';export * from './atlas-review/content/coronary-venous-teaching';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
 const group=api.nestedReviewRows.find((g:any)=>g.study==='coronary-venous');assert.equal(group.surfaces.length,2);
 for(const selection of group.surfaces){
  const packet=await api.nestedReviewMaterial(group.key,selection.id);
  const topic=packet.teaching.topics.find((t:any)=>t.tab==='ultrasound');
  if(packet.source.structure.fmaId==='FMA4706'){
   const lesson=api.coronaryVenousConcepts.find((c:any)=>c.id==='coronary-sinus').imaging.ultrasound;
   assert.equal(topic.body,lesson.body);assert.equal(topic.readiness,'draft');
   assert.deepEqual(topic.references,['https://pmc.ncbi.nlm.nih.gov/articles/PMC1860876/','https://pubmed.ncbi.nlm.nih.gov/21827538/']);
  }else{assert.equal(packet.source.structure.fmaId,'FMA4714');assert.equal(topic.readiness,'pending');}
  assert.equal(packet.context.revisions.imaging,null);assert(packet.context.blockers.imaging.length);
  assert.equal(await api.nestedReviewSelection(group.key,selection.id,'0'.repeat(64)),null);
 }
});
