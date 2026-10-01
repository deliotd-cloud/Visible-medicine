import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

test('cricothyroid draft CT/MRI import preserves models and binds each part to its review material',async()=>{
 const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
 const prior=(p:string)=>JSON.parse(execFileSync('git',['show','a0841f3:'+p],{encoding:'utf8',maxBuffer:32e6}));
 const manifest=json('atlas-review/manifest.json');
 const learner=json('public/atlas-runtime/head-neck/manifest.json');
 assert.equal(manifest.revision,'7d3010368fc53e3433e8df4f9e9d4ddb67e786e8');
 assert.equal(learner.sourceCommit,manifest.revision);
 const before=prior('atlas-review/manifest.json');
 const saved=JSON.parse(execFileSync('git',['show','6302b12:atlas-review/manifest.json'],{encoding:'utf8'}));
 assert.deepEqual(saved.files.filter((f:any)=>before.files.find((p:any)=>p.path===f.path)?.sourceSha256!==f.sourceSha256).map((f:any)=>f.path).sort(),[
  'LICENSES/THIRD_PARTY_NOTICES.md','content/body-renderer-revision.json','content/cricothyroid-teaching.ts',
 ]);
 const path='content/cricothyroid-teaching.ts',f=manifest.files.find((f:any)=>f.path===path);
 assert.equal(f.sourceSha256,json('public/atlas-runtime/head-neck/source-inputs.json').find((f:any)=>f.path===path).sha256);
 assert.equal(f.importedSha256,createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'));
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,prior('lib/atlas-model-inventory.json').models);
 for(const p of ['content/nested-review-bindings.json','content/nested-teaching-bindings.v1.json'])assert.deepEqual(json('atlas-review/'+p),prior('atlas-review/'+p));
 for(const flag of ['patientDataIncluded','clinicalApproved','imagingConnection','standaloneReviewConnection'])assert.equal(learner[flag],false);
 const built=await build({stdin:{contents:"export {nestedReviewRows,nestedReviewMaterial,nestedReviewSelection} from './atlas-review/lib/nested-review-material';export {nestedApprovalProblems,blankNestedReview} from './atlas-review/lib/nested-review';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
 const groups=api.nestedReviewRows.filter((g:any)=>g.study==='cricothyroid');assert.equal(groups.length,1);
 const group=groups[0];
 const catalog=json('atlas-review/public/models/bodyparts3d/cricothyroid/catalog.json');
 let count=0;
 for(const structure of catalog.structures){
  const packet=await api.nestedReviewMaterial(group.key,structure.id);assert(packet);count++;
  for(const [topic,url,scope] of [['ct','10971539',/29 patients/],['mri','21816571',/one excised postmortem/]] as const){
   const lesson=packet.teaching.topics.find((t:any)=>t.tab===topic);
   assert.equal(lesson.readiness,'draft');assert.match(lesson.body,scope);
   assert(lesson.references.includes('https://pubmed.ncbi.nlm.nih.gov/'+url+'/'));
  }
  for(const topic of ['xray','ultrasound'])assert.equal(packet.teaching.topics.find((t:any)=>t.tab===topic).readiness,'pending');
  assert.equal(packet.context.revisions.imaging,null);assert(packet.context.blockers.imaging.length);
  for(const track of ['geometry','teaching','imaging'])assert(api.nestedApprovalProblems(api.blankNestedReview(packet.context,track),packet.context,track).length);
  assert.equal(await api.nestedReviewSelection(group.key,structure.id,'0'.repeat(64)),null);
 }
 assert.equal(count,4);
});
