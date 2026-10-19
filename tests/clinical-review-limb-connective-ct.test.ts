import {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));

test('6 limb connective CT drafts share exact learner and protected Review revisions',async()=>{
 const base='public/atlas-runtime/head-neck/';
 const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 assert.equal(learner.sourceCommit,CURRENT_ATLAS_REVISION);
 assert.equal(review.revision,learner.sourceCommit);
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
 for(const path of ['content/limb-connective-ct.ts','content/limb-connective-ct-pins.json','lib/limb-connective-ct.ts']){
  const source=inputs.find((f:{path:string})=>f.path===path),imported=review.files.find((f:{path:string})=>f.path===path);
  assert(source&&imported,path);assert.equal(imported.sourceSha256,source.sha256);
  assert.equal(sha(readFileSync('atlas-review/'+path)),source.sha256);
 }
 const pins=JSON.parse(readFileSync('atlas-review/content/limb-connective-ct-pins.json','utf8'));
 assert.equal(sha(JSON.stringify(pins)),'31d171c3ac7152610d82fc1bba26a5f1d4954e4e8b10b75817a58457ffa1e7a8');
 const compiled=await build({stdin:{contents:"export {bodyLesson} from './atlas-review/app/body-content';export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';export {limbConnectiveCtLesson} from './atlas-review/lib/limb-connective-ct';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const learnerJs=learner.files.filter((f:{path:string})=>f.path.endsWith('.js')).map((f:{path:string;sha256:string})=>{const b=readFileSync(base+f.path);assert.equal(sha(b),f.sha256);return new TextDecoder().decode(b);}).join('\n');
 assert.equal(pins.entries.length,6);
 let placements=0;
 for(const entry of pins.entries){
  const id=entry.identity.id,packet=await api.bodyReviewMaterial(id);
  assert.deepEqual(packet.source.structure,entry.identity);assert.equal(packet.approval,false);
  assert.equal(packet.status,'worksheet-not-submitted');
  assert.deepEqual(await api.parseBodyReviewResponse(wire(packet),id),wire(packet));
  for(const tab of ['ct']){
   const lesson=api.bodyLesson(entry.identity,tab);
   assert.equal(lesson.readiness,'draft');assert.equal(entry.previous.readiness,'pending');
   assert.deepEqual(lesson,api.limbConnectiveCtLesson(entry.identity,tab));
   for(const text of [lesson.body,...lesson.bullets])assert(learnerJs.includes(text));
   assert.deepEqual(packet.topics.find((t:{tab:string})=>t.tab===tab),{tab,...lesson});
   for(const change of ['prior','body','source']){
    const altered=wire(packet),index=altered.topics.findIndex((t:{tab:string})=>t.tab===tab);
    if(change==='prior')altered.topics[index]={tab,...entry.previous};
    if(change==='body')altered.topics[index].body='Foreign teaching';
    if(change==='source')altered.source.structure.sources[0].sha256='0'.repeat(64);
    assert.equal(await api.parseBodyReviewResponse(altered,id),null,change);
   }
   const otherSide=wire(entry.identity);otherSide.laterality='foreign';
   assert.equal(api.limbConnectiveCtLesson(otherSide,tab),undefined);
   placements++;
  }
  if(['ct'].length===1){
   assert.deepEqual(['ct'],['ct']);
   assert.equal(api.limbConnectiveCtLesson(entry.identity,'mri'),undefined);
   assert.equal(api.bodyLesson(entry.identity,'mri').readiness,'draft');
  }
 }
 assert.equal(placements,6);
});
