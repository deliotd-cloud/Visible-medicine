import {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));

test('Twenty-eight hand arterial selections share exact learner and protected Review questions',async()=>{
 const base='public/atlas-runtime/head-neck/';
 const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 assert.equal(learner.sourceCommit,CURRENT_ATLAS_REVISION);
 assert.equal(review.revision,learner.sourceCommit);
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
 for(const path of ['content/hand-arterial-quiz.ts','content/hand-arterial-quiz-pins.json','lib/hand-arterial-quiz.ts']){
  const source=inputs.find((f:{path:string})=>f.path===path),imported=review.files.find((f:{path:string})=>f.path===path);
  assert(source&&imported,path);assert.equal(imported.sourceSha256,source.sha256);
  assert.equal(sha(readFileSync('atlas-review/'+path)),source.sha256);
 }
 const pins=JSON.parse(readFileSync('atlas-review/content/hand-arterial-quiz-pins.json','utf8'));
 assert.equal(sha(JSON.stringify(pins)),'9d4efbdb297035ead2133332024cdc850be00ebc582c7cbc1a13f05682665c11');
 const compiled=await build({stdin:{contents:"export {bodyLesson} from './atlas-review/app/body-content';export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';export {handArterialQuizLesson} from './atlas-review/lib/hand-arterial-quiz';export {handArterialQuizQuestions} from './atlas-review/content/hand-arterial-quiz';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const learnerJs=learner.files.filter((f:{path:string})=>f.path.endsWith('.js')).map((f:{path:string;sha256:string})=>{const b=readFileSync(base+f.path);assert.equal(sha(b),f.sha256);return new TextDecoder().decode(b);}).join('\n');
 assert.equal(pins.entries.length,28);
 assert.deepEqual(pins.entries.map((e:{identity:{fmaId:string}})=>e.identity.fmaId).sort(),["FMA22777","FMA22778","FMA22835","FMA22837","FMA22839","FMA22840","FMA22856","FMA22858","FMA22860","FMA22864","FMA22865","FMA22905","FMA22907","FMA23050","FMA23051","FMA23052","FMA23054","FMA23055","FMA85112","FMA85115","FMA85116","FMA85118","FMA85119","FMA85120","FMA85121","FMA85122","FMA85123","FMA85124"]);
 assert.equal(new Set(pins.entries.map((e:{group:string})=>e.group)).size,7);
 for(const entry of pins.entries){
  assert.equal(pins.entries.filter((e:{group:string})=>e.group===entry.group).length,entry.group==='properDigital'?10:entry.group==='commonDigital'?8:2);
  const id=entry.identity.id,lesson=api.bodyLesson(entry.identity,'quiz'),packet=await api.bodyReviewMaterial(id);
  assert.equal(lesson.readiness,'draft');assert.equal(lesson.bullets.length,4);
  assert.equal(lesson.bullets.filter((answer:string)=>answer===lesson.correctAnswer).length,1);
  assert.deepEqual(lesson,api.handArterialQuizLesson(entry.identity,'quiz'));
  const q=api.handArterialQuizQuestions[entry.group];
  assert.equal(lesson.body,q.body);assert.deepEqual(lesson.bullets,[...q.choices]);
  assert.equal(lesson.correctAnswer,q.correctAnswer);assert.equal(lesson.explanation,q.explanation);
  assert(learnerJs.includes(lesson.body));assert(learnerJs.includes(lesson.explanation));
  for(const choice of lesson.bullets)assert(learnerJs.includes(choice));
  assert.deepEqual(packet.source.structure,entry.identity);assert.equal(packet.approval,false);
  assert.equal(packet.status,'worksheet-not-submitted');
  assert.deepEqual(packet.topics.find((t:{tab:string})=>t.tab==='quiz'),{tab:'quiz',...lesson});
  assert.deepEqual(await api.parseBodyReviewResponse(wire(packet),id),wire(packet));
  for(const change of ['prior','question','answer','source']){
   const altered=wire(packet),index=altered.topics.findIndex((t:{tab:string})=>t.tab==='quiz');
   if(change==='prior')altered.topics[index]={tab:'quiz',...entry.previous};
   if(change==='question')altered.topics[index].body='Stale question';
   if(change==='answer')altered.topics[index].correctAnswer='Foreign answer';
   if(change==='source')altered.source.structure.sources.at(-1).sha256='0'.repeat(64);
   assert.equal(await api.parseBodyReviewResponse(altered,id),null,change);
  }
 }
});
