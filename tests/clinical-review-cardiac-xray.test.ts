import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

test('all four cardiac X-ray drafts reach exact review selections from the learner source without imaging approval',async()=>{
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const inputs=JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json','utf8'));
 assert.equal(review.revision,'31a6ae7d0a823374b97c21cd7e810070e056d352');
 for(const path of ['content/cardiac-xray-teaching.ts','content/nested-teaching.ts','content/nested-teaching-bindings.v1.json','lib/nested-teaching.ts']){
  const file=review.files.find((f:any)=>f.path===path);assert(file);
  assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,file.sourceSha256);
  assert.equal(createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'),file.importedSha256);
 }
 const result=await build({stdin:{contents:`export * from './atlas-review/lib/nested-review-material';export * from './atlas-review/content/cardiac-xray-teaching';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
 const group=api.nestedReviewRows.find((g:any)=>g.study==='cardiac');assert(group);
 const expected:Record<string,string>={FMA11359:'right-atrium',FMA9465:'left-atrium',FMA9291:'right-ventricle',FMA9466:'left-ventricle'};
 const packets=await Promise.all(group.surfaces.map((s:any)=>api.nestedReviewMaterial(group.key,s.id)));
 const targets=packets.filter((p:any)=>expected[p?.source.structure.fmaId]);assert.equal(targets.length,4);
 for(const packet of targets){
  const target=packet.source.structure;
  const lesson=packet.teaching.topics.find((t:any)=>t.tab==='xray');
  const draft=api.cardiacXrayTeaching[expected[target.fmaId]];
  assert.equal(lesson.readiness,'draft');assert.equal(lesson.body,draft.body);
  assert.deepEqual(lesson.references,draft.references.map((key:string)=>api.cardiacXrayReferences[key].url));
  assert.equal(packet.context.revisions.imaging,null);assert(packet.context.blockers.imaging.length);
  assert.equal(await api.nestedReviewSelection(group.key,target.id,'0'.repeat(64)),null);
 }
});
