import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));

test('eight constrictor CT/MRI drafts reach learner and protected Review at one exact source revision',async()=>{
 const base='public/atlas-runtime/head-neck/';
const historicalBytes=readFileSync('tests/fixtures/historical-cardiac-chest-head-neck-manifest.json');
 assert.equal(sha(historicalBytes),'09189d13a033c9c251de2a21672b3d34fbc32fc743cdaf439bffa450e47ef34b');
 const historicalLearner=JSON.parse(historicalBytes.toString());
 assert.equal(historicalLearner.sourceCommit,'9fba9a1e24b6669aafd48e945d55fc0939d50ab2');
 const currentDelivery=validateCurrentAtlasDelivery();
 const bytes=readFileSync(base+'manifest.json');
 assert.equal(sha(bytes),currentDelivery.documents[base+'manifest.json']);
 const learner=JSON.parse(bytes.toString()),review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 assert.equal(learner.sourceCommit,CURRENT_ATLAS_REVISION);
 assert.equal(review.revision,learner.sourceCommit);
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
 for(const path of ['content/pharyngeal-constrictor-imaging.ts','content/pharyngeal-muscle-teaching-pins.json','lib/pharyngeal-constrictor-imaging.ts']){
  const source=inputs.find((f:{path:string})=>f.path===path),imported=review.files.find((f:{path:string})=>f.path===path);
  assert(source&&imported,path);assert.equal(imported.sourceSha256,source.sha256);
  assert.equal(sha(readFileSync('atlas-review/'+path)),source.sha256,'Original teaching unchanged');
 }
 const pins=JSON.parse(readFileSync('atlas-review/content/pharyngeal-muscle-teaching-pins.json','utf8'));
 const entries=pins.entries.filter((e:{family:string})=>['superior','inferior'].includes(e.family));
 assert.equal(entries.length,4);
 const compiled=await build({stdin:{contents:"export {bodyLesson} from './atlas-review/app/body-content';export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';export {pharyngealConstrictorImagingLesson as lesson} from './atlas-review/lib/pharyngeal-constrictor-imaging';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const learnerJs=learner.files.filter((f:{path:string})=>f.path.endsWith('.js')).map((f:{path:string;sha256:string})=>{const b=readFileSync(base+f.path);assert.equal(sha(b),f.sha256);return new TextDecoder().decode(b);}).join('\n');
 let checked=0;
 for(const {identity} of entries){
  const packet=await api.bodyReviewMaterial(identity.id);
  assert.deepEqual(packet.source.structure,identity);assert.equal(packet.approval,false);
  assert.equal(packet.status,'worksheet-not-submitted');
  assert.deepEqual(await api.parseBodyReviewResponse(wire(packet),identity.id),wire(packet));
  for(const tab of ['ct','mri']){
   const lesson=api.bodyLesson(identity,tab);assert.equal(lesson.readiness,'draft');
   assert.deepEqual(lesson,api.lesson(identity,tab));assert(learnerJs.includes(lesson.body));
   for(const bullet of lesson.bullets)assert(learnerJs.includes(bullet));
   for(const ref of lesson.citations)assert(learnerJs.includes(ref));
   assert.deepEqual(packet.topics.find((t:{tab:string})=>t.tab===tab),{tab,...lesson});
   for(const change of ['pending','text','source']){
    const altered=wire(packet),topic=altered.topics.find((t:{tab:string})=>t.tab===tab);
    if(change==='pending')topic.readiness='pending';
    if(change==='text')topic.body='Foreign teaching';
    if(change==='source')altered.source.structure.sources[0].sha256='0'.repeat(64);
    assert.equal(await api.parseBodyReviewResponse(altered,identity.id),null,change);
   }
   checked++;
  }
 }
 assert.equal(checked,8);
});
