import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import {build} from 'esbuild';

const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const base='public/atlas-runtime/head-neck/';
const revision='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const historicalRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const parent='fa74cf70009f5ad8e21087ab12e4589547ebf741';
const pinsHash='4fb745d06a9ee8ec2d920c7472672f5c160439507fcf6fbf6fa82d975f2bdca9';
const expected=new Map([
 ['FMA3992',['right','thyrocervical','right-thyrocervical-trunk']],
 ['FMA4084',['left','thyrocervical','left-thyrocervical-trunk']],
 ['FMA5039',['right','costocervical','right-costocervical-trunk']],
 ['FMA4086',['left','costocervical','left-costocervical-trunk']],
 ['FMA4057',['right','dorsalScapular','right-dorsal-scapular-artery']],
 ['FMA10552',['left','dorsalScapular','left-dorsal-scapular-artery']],
 ['FMA10698',['right','suprascapular','right-suprascapular-artery']],
 ['FMA10681',['left','suprascapular','left-suprascapular-artery']],
]);
const references={
 thyrocervical:'https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html',
 costocervical:'https://www.ncbi.nlm.nih.gov/books/NBK556020/',
 dorsalScapular:'https://pubmed.ncbi.nlm.nih.gov/26920558/',
 suprascapular:'https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html',
};

test('eight shoulder-girdle arterial selections share exact learner and protected Review questions',async()=>{
 const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 assert.equal(learner.sourceCommit,revision);
 assert.equal(review.revision,revision);
 const sourceRoot=currentAtlasDeliveryRoot();
 const committed=(revision:string,path:string)=>execFileSync('git',['-C',sourceRoot,'show',revision+':'+path],
  {windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
 for(const path of ['content/shoulder-girdle-artery-quiz.ts','content/shoulder-girdle-artery-quiz-pins.json','lib/shoulder-girdle-artery-quiz.ts']){
  const source=inputs.find((f:{path:string})=>f.path===path),imported=review.files.find((f:{path:string})=>f.path===path);
  assert(source&&imported,path);assert.equal(imported.sourceSha256,source.sha256);
  assert.equal(sha(readFileSync('atlas-review/'+path)),source.sha256);
  const current=committed(revision,path);
  assert.deepEqual(current,committed(historicalRevision,path),path+' exact 9f quiz source');
  assert.equal(source.sha256,sha(current),path+' committed source');
 }
 const dispatch=review.files.find((file:{path:string})=>file.path==='app/body-content.ts');assert(dispatch);
 assert.equal(sha(committed(historicalRevision,'app/body-content.ts')),'92add5e49675680abd55f687c08e7d4bbcfcb0ab34e1e0f611cc3da74c3fef9f');
 const currentDispatch=sha(committed(revision,'app/body-content.ts'));
 assert.equal(currentDispatch,'3deda6b748ed897afcd980ff24256aa20b165f8c1615fdc1e2f887211d69c1d2');
 assert.equal(dispatch.sourceSha256,currentDispatch);
 assert.equal(dispatch.importedSha256,sha(readFileSync('atlas-review/app/body-content.ts')));
 assert.equal(inputs.find((file:{path:string})=>file.path==='app/body-content.ts')?.sha256,currentDispatch);
 const pins=JSON.parse(readFileSync('atlas-review/content/shoulder-girdle-artery-quiz-pins.json','utf8'));
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
 const compiled=await build({stdin:{contents:"export {bodyLesson} from './atlas-review/app/body-content';export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';export {shoulderGirdleArteryQuizLesson} from './atlas-review/lib/shoulder-girdle-artery-quiz';export {shoulderGirdleArteryQuizQuestions} from './atlas-review/content/shoulder-girdle-artery-quiz';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const learnerJs=learner.files.filter((f:{path:string})=>f.path.endsWith('.js')).map((f:{path:string;sha256:string})=>{const bytes=readFileSync(base+f.path);assert.equal(sha(bytes),f.sha256);return new TextDecoder().decode(bytes);}).join('\n');
 for(const entry of pins.entries){
  const [side,group,name]=expected.get(entry.identity.fmaId)!;
  assert.equal(entry.group,group);assert.equal(entry.identity.laterality,side);
  assert.equal(entry.identity.id,`vm:anatomy:body:shoulder-arm:${side}:vessel:${name}`);
  assert.equal(entry.identity.nodeName,entry.identity.fmaId);
  assert.equal(entry.identity.validation.status,'unvalidated');assert.equal(entry.identity.validation.anatomicalReview,false);
  assert.equal(pins.entries.filter((e:{group:string})=>e.group===group).length,2);
  assert.equal(entry.previous.readiness,'generated-identification');assert.equal(entry.previous.correctAnswer,undefined);
  const id=entry.identity.id,lesson=api.bodyLesson(entry.identity,'quiz'),packet=await api.bodyReviewMaterial(id);
  const q=api.shoulderGirdleArteryQuizQuestions[group];
  assert.deepEqual(q.references,[references[group as keyof typeof references]]);
  assert.equal(lesson.readiness,'draft');assert.equal(lesson.bullets.length,4);
  assert.equal(lesson.bullets.filter((answer:string)=>answer===lesson.correctAnswer).length,1);
  assert.deepEqual(lesson,api.shoulderGirdleArteryQuizLesson(entry.identity,'quiz'));
  assert.equal(lesson.body,q.body);assert.deepEqual(lesson.bullets,[...q.choices]);
  assert.equal(lesson.correctAnswer,q.correctAnswer);assert.equal(lesson.explanation,q.explanation);
  assert.deepEqual(lesson.citations,[...q.references]);
  assert.match(lesson.note,/revision-bound radiologist review pending/i);
  assert.match(lesson.note,/origin and branching may vary/i);
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
