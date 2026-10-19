import {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));

test('Twelve iliac vessel selections share exact learner and protected Review questions',async()=>{
 const base='public/atlas-runtime/head-neck/';
 const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 assert.equal(learner.sourceCommit,CURRENT_ATLAS_REVISION);
 assert.equal(review.revision,learner.sourceCommit);
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
 for(const path of ['content/iliac-vessel-quiz.ts','content/iliac-vessel-quiz-pins.json','lib/iliac-vessel-quiz.ts']){
  const source=inputs.find((f:{path:string})=>f.path===path),imported=review.files.find((f:{path:string})=>f.path===path);
  assert(source&&imported,path);assert.equal(imported.sourceSha256,source.sha256);
  assert.equal(sha(readFileSync('atlas-review/'+path)),source.sha256);
 }
 const pins=JSON.parse(readFileSync('atlas-review/content/iliac-vessel-quiz-pins.json','utf8'));
 assert.equal(sha(JSON.stringify(pins)),'4afbcd1b3171a791ead0a37f143eae1f8ade01a7c7a1c6f448260e520ac9bbe3');
 const compiled=await build({stdin:{contents:"export {bodyLesson} from './atlas-review/app/body-content';export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';export {iliacVesselQuizLesson} from './atlas-review/lib/iliac-vessel-quiz';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const learnerJs=learner.files.filter((f:{path:string})=>f.path.endsWith('.js')).map((f:{path:string;sha256:string})=>{const b=readFileSync(base+f.path);assert.equal(sha(b),f.sha256);return new TextDecoder().decode(b);}).join('\n');
 assert.equal(pins.entries.length,12);
 assert.deepEqual(pins.entries.map((e:{identity:{fmaId:string}})=>e.identity.fmaId).sort(),['FMA14765','FMA14766','FMA18806','FMA18807','FMA18809','FMA18810','FMA18885','FMA18886','FMA18887','FMA18888','FMA21387','FMA21388']);
 assert.equal(new Set(pins.entries.map((e:{group:string})=>e.group)).size,6);
 for(const entry of pins.entries){
  assert.equal(pins.entries.filter((e:{group:string})=>e.group===entry.group).length,2);
  const id=entry.identity.id,lesson=api.bodyLesson(entry.identity,'quiz'),packet=await api.bodyReviewMaterial(id);
  assert.equal(lesson.readiness,'draft');assert.equal(lesson.bullets.length,4);
  assert.equal(lesson.bullets.filter((answer:string)=>answer===lesson.correctAnswer).length,1);
  assert.deepEqual(lesson,api.iliacVesselQuizLesson(entry.identity,'quiz'));
  assert(learnerJs.includes(lesson.body));assert(learnerJs.includes(lesson.explanation));
  assert.deepEqual(packet.source.structure,entry.identity);assert.equal(packet.approval,false);
  assert.equal(packet.status,'worksheet-not-submitted');
  assert.deepEqual(packet.topics.find((t:{tab:string})=>t.tab==='quiz'),{tab:'quiz',...lesson});
  assert.deepEqual(await api.parseBodyReviewResponse(wire(packet),id),wire(packet));
  for(const change of ['prior','answer','source']){
   const altered=wire(packet),index=altered.topics.findIndex((t:{tab:string})=>t.tab==='quiz');
   if(change==='prior')altered.topics[index]={tab:'quiz',...entry.previous};
   if(change==='answer')altered.topics[index].correctAnswer='Foreign answer';
   if(change==='source')altered.source.structure.sources.at(-1).sha256='0'.repeat(64);
   assert.equal(await api.parseBodyReviewResponse(altered,id),null,change);
  }
 }
});
