import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const base='public/atlas-runtime/head-neck/';
const parent='894c899f194b143c3ef6260f88e017296917649f';
const pinsHash='c19b618353c81b3c620f43ea7e527f059e6b30070b2cfb0ffed318c31d9396fd';
const expected=new Map([
 ['FMA66563',['right','trunk']],['FMA66564',['left','trunk']],
 ['FMA23063',['right','pectoral']],['FMA23064',['left','pectoral']],
 ['FMA23068',['right','acromial']],['FMA23069',['left','acromial']],
 ['FMA23072',['right','deltoid']],['FMA23073',['left','deltoid']],
]);
const references={
 trunk:'https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html',
 pectoral:'https://pubmed.ncbi.nlm.nih.gov/1746231/',
 acromial:'https://www.elsevier.com/resources/anatomy/cardiovascular-system/arteries/acromial-branch-of-thoracoacromial-artery/23364',
 deltoid:'https://pubmed.ncbi.nlm.nih.gov/9706673/',
};

test('eight thoraco-acromial selections share exact learner and protected Review questions',async()=>{
 const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 assert.match(learner.sourceCommit,/^[a-f0-9]{40}$/);
 assert.notEqual(learner.sourceCommit,parent,'the new quiz requires a later source commit');
 assert.equal(review.revision,learner.sourceCommit);
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
 for(const path of ['content/thoracoacromial-quiz.ts','content/thoracoacromial-quiz-pins.json','lib/thoracoacromial-quiz.ts']){
  const source=inputs.find((f:{path:string})=>f.path===path),imported=review.files.find((f:{path:string})=>f.path===path);
  assert(source&&imported,path);assert.equal(imported.sourceSha256,source.sha256);
  assert.equal(sha(readFileSync('atlas-review/'+path)),source.sha256);
 }
 const pins=JSON.parse(readFileSync('atlas-review/content/thoracoacromial-quiz-pins.json','utf8'));
 assert.equal(pins.parentCommit,parent);assert.equal(sha(JSON.stringify(pins)),pinsHash);
 assert.equal(pins.entries.length,8);
 assert.deepEqual(pins.entries.map((e:{identity:{fmaId:string}})=>e.identity.fmaId).sort(),[...expected.keys()].sort());
 assert.deepEqual([...new Set(pins.entries.map((e:{group:string})=>e.group))].sort(),Object.keys(references).sort());
 assert.equal(pins.bundles.length,1);
 for(const bundle of pins.bundles){
  const path=bundle.url.slice(1).split('?')[0],record=learner.files.find((f:{path:string})=>f.path===path);
  assert(record,path);assert.equal(record.sha256,bundle.sha256);assert.equal(record.bytes,bundle.bytes);
  const bytes=readFileSync(base+path);assert.equal(bytes.byteLength,bundle.bytes);assert.equal(sha(bytes),bundle.sha256);
 }
 const compiled=await build({stdin:{contents:"export {bodyLesson} from './atlas-review/app/body-content';export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';export {thoracoacromialQuizLesson} from './atlas-review/lib/thoracoacromial-quiz';export {thoracoacromialQuizQuestions} from './atlas-review/content/thoracoacromial-quiz';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const learnerJs=learner.files.filter((f:{path:string})=>f.path.endsWith('.js')).map((f:{path:string;sha256:string})=>{const bytes=readFileSync(base+f.path);assert.equal(sha(bytes),f.sha256);return new TextDecoder().decode(bytes);}).join('\n');
 for(const entry of pins.entries){
  const [side,group]=expected.get(entry.identity.fmaId)!;
  assert.equal(entry.group,group);assert.equal(entry.identity.laterality,side);
  assert.equal(entry.identity.id,`vm:anatomy:body:shoulder-arm:${side}:vessel:${group==='trunk'?'trunk':group+'-branch'}-of-${side}-thoraco-acromial-artery`);
  assert.equal(pins.entries.filter((e:{group:string})=>e.group===group).length,2);
  assert.equal(entry.previous.readiness,'generated-identification');assert.equal(entry.previous.correctAnswer,undefined);
  const id=entry.identity.id,lesson=api.bodyLesson(entry.identity,'quiz'),packet=await api.bodyReviewMaterial(id);
  const q=api.thoracoacromialQuizQuestions[group];
  assert.deepEqual(q.references,[references[group as keyof typeof references]]);
  assert.equal(lesson.readiness,'draft');assert.equal(lesson.bullets.length,4);
  assert.equal(lesson.bullets.filter((answer:string)=>answer===lesson.correctAnswer).length,1);
  assert.deepEqual(lesson,api.thoracoacromialQuizLesson(entry.identity,'quiz'));
  assert.equal(lesson.body,q.body);assert.deepEqual(lesson.bullets,[...q.choices]);
  assert.equal(lesson.correctAnswer,q.correctAnswer);assert.equal(lesson.explanation,q.explanation);
  assert.match(lesson.note,/revision-bound radiologist review pending/i);
  for(const text of [lesson.body,lesson.explanation,...lesson.bullets])assert(learnerJs.includes(text));
  assert.deepEqual(packet.source.structure,entry.identity);assert.equal(packet.approval,false);
  assert.equal(packet.status,'worksheet-not-submitted');
  assert.deepEqual(packet.topics.find((t:{tab:string})=>t.tab==='quiz'),{tab:'quiz',...lesson});
  for(const topic of packet.topics.filter((t:{tab:string})=>t.tab!=='quiz')){
   assert.deepEqual(topic,{tab:topic.tab,...api.bodyLesson(entry.identity,topic.tab)});
  }
  assert.deepEqual(await api.parseBodyReviewResponse(wire(packet),id),wire(packet));
  for(const change of ['prior','question','answer','source']){
   const altered=wire(packet),index=altered.topics.findIndex((t:{tab:string})=>t.tab==='quiz');
   if(change==='prior')altered.topics[index]={tab:'quiz',...entry.previous};
   if(change==='question')altered.topics[index].body='Stale question';
   if(change==='answer')altered.topics[index].correctAnswer='Foreign answer';
   if(change==='source')altered.source.structure.sources[0].sha256='0'.repeat(64);
   assert.equal(await api.parseBodyReviewResponse(altered,id),null,change);
  }
 }
});
