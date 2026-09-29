import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

test('inferior-collicular teaching is exact across learner and review, never acquired-image approval',async()=>{
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const inputs=JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json','utf8'));
 assert.equal(review.revision,'c55db3aba23f5f260ef09955b470650a8485800a');
 for(const path of ['content/collicular-brachia-teaching.ts','content/nested-teaching-bindings.v1.json','lib/nested-teaching.ts']){
  const file=review.files.find((f:any)=>f.path===path);assert(file);
  assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,file.sourceSha256);
  assert.equal(createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'),file.importedSha256);
 }
 const result=await build({stdin:{contents:`export * from './atlas-review/lib/nested-review-material';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
 const group=api.nestedReviewRows.find((g:any)=>g.study==='brainstem');assert(group);
 const targets=group.surfaces.filter((s:any)=>s.id.endsWith('inferior-colliculus'));assert.equal(targets.length,2);
 assert.deepEqual(targets.map((s:any)=>s.laterality).sort(),['left','right']);
 let placements=0;
 for(const target of targets){
  const packet=await api.nestedReviewMaterial(group.key,target.id);assert(packet);
  assert.equal(packet.context.revisions.imaging,null);assert(packet.context.blockers.imaging.length);
  for(const [topic,pmid] of Object.entries({clinical:'7750451',pathology:'23349608',mri:'35392412'})){
   const lesson=packet.teaching.topics.find((t:any)=>t.tab===topic);assert.equal(lesson.readiness,'draft');
   assert.deepEqual(lesson.references,[`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`]);
   assert(lesson.body.length>100);placements++;
  }
  assert.match(packet.teaching.concept.sections.clinical.body,/combined lesion/);
  assert.match(packet.teaching.concept.sections.pathology.body,/not a typical-disease template/);
  assert.match(packet.teaching.concept.imaging.mri.body,/research streamlines are not routine/);
  for(const topic of ['ct','xray','ultrasound'])assert.equal(packet.teaching.topics.find((t:any)=>t.tab===topic).readiness,'pending');
  assert.equal(await api.nestedReviewSelection(group.key,target.id,'0'.repeat(64)),null);
 }
 assert.equal(placements,6);
});
