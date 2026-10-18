import {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));

test('28 thoracic vessel selections share exact learner and protected Review question revisions',async()=>{
 const base='public/atlas-runtime/head-neck/';
 const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 assert.equal(learner.sourceCommit,CURRENT_ATLAS_REVISION);
 assert.equal(review.revision,learner.sourceCommit);
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
 for(const path of ['content/thoracic-vessel-quiz.ts','content/thoracic-vessel-quiz-pins.json','lib/thoracic-vessel-quiz.ts']){
  const source=inputs.find((f:{path:string})=>f.path===path),imported=review.files.find((f:{path:string})=>f.path===path);
  assert(source&&imported,path);assert.equal(imported.sourceSha256,source.sha256);
  assert.equal(sha(readFileSync('atlas-review/'+path)),source.sha256);
 }
 const pins=JSON.parse(readFileSync('atlas-review/content/thoracic-vessel-quiz-pins.json','utf8'));
 assert.equal(sha(JSON.stringify(pins)),'31471d9f6960c5402e715350d226c8621cc841896e0563320743f552c3c06eb7');
 const compiled=await build({stdin:{contents:"export {bodyLesson} from './atlas-review/app/body-content';export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';export {thoracicVesselQuizLesson} from './atlas-review/lib/thoracic-vessel-quiz';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const learnerJs=learner.files.filter((f:{path:string})=>f.path.endsWith('.js')).map((f:{path:string;sha256:string})=>{const b=readFileSync(base+f.path);assert.equal(sha(b),f.sha256);return new TextDecoder().decode(b);}).join('\n');
 assert.equal(pins.entries.length,28);
 const counts={ascendingAorta:1,aorticArch:1,descendingAorta:1,superiorVenaCava:1,azygos:1,hemiazygos:1,brachiocephalicArtery:1,rightSubclavianArtery:1,leftSubclavianArtery:1,brachiocephalicVein:2,subclavianVein:2,rightCoronary:1,leftCoronary:1,anteriorInterventricular:1,circumflex:1,greatCardiac:1,middleCardiac:1,internalThoracicArtery:2,superiorEpigastric:2,musculophrenicArtery:2,internalThoracicVein:1,musculophrenicVein:2};
 assert.equal(new Set(pins.entries.map((entry:{group:string})=>entry.group)).size,22);
 for(const [group,count]of Object.entries(counts))assert.equal(pins.entries.filter((entry:{group:string})=>entry.group===group).length,count);
 for(const entry of pins.entries){
  const id=entry.identity.id,lesson=api.bodyLesson(entry.identity,'quiz'),packet=await api.bodyReviewMaterial(id);
  assert.equal(lesson.readiness,'draft');assert.equal(lesson.bullets.length,4);
  assert.equal(lesson.bullets.filter((answer:string)=>answer===lesson.correctAnswer).length,1);
  assert.deepEqual(lesson,api.thoracicVesselQuizLesson(entry.identity,'quiz'));
  assert(learnerJs.includes(lesson.body));assert(learnerJs.includes(lesson.explanation));
  assert.deepEqual(packet.source.structure,entry.identity);assert.equal(packet.approval,false);
  assert.equal(packet.status,'worksheet-not-submitted');
  assert.deepEqual(packet.topics.find((t:{tab:string})=>t.tab==='quiz'),{tab:'quiz',...lesson});
  assert.deepEqual(await api.parseBodyReviewResponse(wire(packet),id),wire(packet));
  for(const change of ['prior','answer','source']){
   const altered=wire(packet),index=altered.topics.findIndex((t:{tab:string})=>t.tab==='quiz');
   if(change==='prior')altered.topics[index]={tab:'quiz',...entry.previous};
   if(change==='answer')altered.topics[index].correctAnswer='Foreign answer';
   if(change==='source')altered.source.structure.sources[0].sha256='0'.repeat(64);
   assert.equal(await api.parseBodyReviewResponse(altered,id),null,change);
  }
 }
});
