import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

test('learner and Clinical Review retain 28 exact source-bound drafts without new models or approval',async()=>{
 const json=(p:string)=>JSON.parse(readFileSync(p,'utf8')),review=json('atlas-review/manifest.json');
 assert.equal(review.revision,'bc03ed3f7324819f4bfa3e7cd0afb7203cc8e3b8');
 const inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
 for(const name of ['head-neck','shoulder'])assert.equal(json('public/atlas-runtime/'+name+'/manifest.json').sourceCommit,review.revision);
 const prior=JSON.parse(execFileSync('git',['show','5cdb5c6c:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,prior.models);
 for(const kind of ['foot-sesamoid-teaching','cerebellar-mca-imaging'])for(const path of ['lib/'+kind+'.ts','content/'+kind+'.ts','content/'+kind+'-pins.json']){
  const file=review.files.find((f:any)=>f.path===path);assert(file,path);
  assert.equal(file.sourceSha256,inputs.find((f:any)=>f.path===path)?.sha256,path);
  assert.equal(file.importedSha256,createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'));
 }
 const r=await build({stdin:{contents:"export * from './atlas-review/app/body-content';export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-response';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));let count=0;
 for(const kind of ['foot-sesamoid-teaching','cerebellar-mca-imaging'])for(const entry of json('atlas-review/content/'+kind+'-pins.json').entries){
  const packet=await api.bodyReviewMaterial(entry.identity.id);assert.equal(packet.approval,false);assert((await api.parseBodyReviewResponse(packet,entry.identity.id)));
  for(const tab of entry.topics){
   const lesson=api.bodyLesson(entry.identity,tab),topic=packet.topics.find((t:any)=>t.tab===tab);const {tab:_tab,...shown}=topic;
   assert.equal(lesson.readiness,'draft');assert.deepEqual(shown,lesson);assert.match(lesson.note,/independent/);count++;
   const changed=structuredClone(packet);changed.approval=true;assert.equal((await api.parseBodyReviewResponse(changed,entry.identity.id)),null);
  }
 }
 assert.equal(count,28);assert.equal(json('public/atlas-review-viewer/manifest.json').personalRecordsIncluded,false);
});
