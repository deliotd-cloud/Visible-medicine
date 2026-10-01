import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

test('superior temporal MRI orientation reaches all four exact learner/review bindings without acquired imaging approval',async()=>{
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const inputs=JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json','utf8'));
 assert.equal(review.revision,'e8a7ceca9fe7c82c744345f1854bafb6055853af');
 for(const path of ['content/superior-temporal-mri.ts','content/cerebral-teaching.ts','content/nested-teaching.ts','content/nested-teaching-bindings.v1.json','lib/nested-teaching.ts']){
  const file=review.files.find((f:any)=>f.path===path);assert(file);
  assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,file.sourceSha256);
  assert.equal(createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'),file.importedSha256);
 }
 const result=await build({stdin:{contents:`export * from './atlas-review/lib/nested-review-material';export * from './atlas-review/content/superior-temporal-mri';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
 const group=api.nestedReviewRows.find((g:any)=>g.study==='cerebral');let count=0;
 for(const selection of group.surfaces){
  const packet=await api.nestedReviewMaterial(group.key,selection.id),fma=packet.source.structure.fmaId;
  const side=['FMA72801','FMA72800'].includes(fma)?'anterior':['FMA72805','FMA72804'].includes(fma)?'posterior':null;
  if(!side)continue;count++;
  const topic=packet.teaching.topics.find((t:any)=>t.tab==='mri');
  assert.equal(topic.body,api.superiorTemporalMRI[side].body);assert.equal(topic.readiness,'draft');
  assert(topic.references.includes(api.superiorTemporalMRIReferences.superiorTemporalLandmarks.url));
  for(const tab of ['ct','xray','ultrasound'])assert.equal(packet.teaching.topics.find((t:any)=>t.tab===tab).readiness,'pending');
  assert.equal(packet.context.revisions.imaging,null);assert(packet.context.blockers.imaging.length);
  assert.equal(await api.nestedReviewSelection(group.key,selection.id,'0'.repeat(64)),null);
 }
 assert.equal(count,4);
});
