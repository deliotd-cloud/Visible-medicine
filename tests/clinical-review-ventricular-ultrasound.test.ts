import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

test('ventricular ultrasound drafts match learner source and exact review selections without image approval',async()=>{
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const inputs=JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json','utf8'));
 assert.equal(review.revision,'065062b5d5a9db1ee891dbd66fa890d7bb46b0fa');
 for(const path of ['content/ventricular-ultrasound-teaching.ts','content/nested-teaching.ts','content/nested-teaching-bindings.v1.json','lib/nested-teaching.ts']){
  const file=review.files.find((f:any)=>f.path===path);assert(file);
  assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,file.sourceSha256);
  assert.equal(createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'),file.importedSha256);
 }
 const result=await build({stdin:{contents:`export * from './atlas-review/lib/nested-review-material';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
 const group=api.nestedReviewRows.find((g:any)=>g.study==='ventricles');assert(group);
 const packets=await Promise.all(group.surfaces.map((s:any)=>api.nestedReviewMaterial(group.key,s.id)));
 const targets=packets.filter((p:any)=>['FMA78450','FMA78449','FMA78454','FMA78469'].includes(p?.source.structure.fmaId));
 assert.equal(targets.length,4);
 for(const packet of targets){
  const target=packet.source.structure;
  const lesson=packet.teaching.topics.find((t:any)=>t.tab==='ultrasound');
  assert.equal(lesson.readiness,'draft');assert.match(lesson.body,/Neonatal|neonatal/);assert.match(lesson.body,/adult/);
  assert(lesson.references.includes('https://gravitas.acr.org/PPTS/DownloadPreviewDocument?DocId=42'));
  if(target.fmaId==='FMA78469')assert(lesson.references.includes('https://pubmed.ncbi.nlm.nih.gov/25899415/'));
  assert.equal(packet.teaching.topics.find((t:any)=>t.tab==='xray').readiness,'pending');
  assert.equal(packet.context.revisions.imaging,null);assert(packet.context.blockers.imaging.length);
  assert.equal(await api.nestedReviewSelection(group.key,target.id,'0'.repeat(64)),null);
 }
});
