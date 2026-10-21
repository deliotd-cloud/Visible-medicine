import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {admitPreservedClinicalReview} from './clinical-review-current-admission.mjs';

const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const base='public/atlas-runtime/head-neck/';
const historicalFeature='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const sourceHashes={
 'content/scapular-muscle-quiz.ts':'9d1288e2611816528b49404ac1abe1f2eef5e58f371206e59d60d63c6984139e',
 'content/scapular-muscle-quiz-pins.json':'43102b2839f14317a63d714ea17f6bd8673ba0437a163d8ae8a00dabead09e78',
 'lib/scapular-muscle-quiz.ts':'0938996ac8d1acc5b581c69a83151bdcf49b2933f8d964fd7510536afcfe3736',
};
const parent='f2e1a56027bbe0efe9eef1720ccc699ae7da90fe';
const pinsHash='279a1f624474b997e1329d12f72c99329b45096559b085a6f5f1278221d95ee3';
const expected=new Map([
 ['FMA13412',['subclavius','right','head-neck','head-neck-muscles','vm:anatomy:body:head-neck:right:muscle:right-subclavius']],
 ['FMA13411',['subclavius','left','head-neck','head-neck-muscles','vm:anatomy:body:head-neck:left:muscle:left-subclavius']],
 ['FMA33581',['ascending','right','spine','spine-muscles-dissection','vm:anatomy:body:spine:right:muscle:ascending-part-of-right-trapezius']],
 ['FMA33583',['ascending','left','spine','spine-muscles-dissection','vm:anatomy:body:spine:left:muscle:ascending-part-of-left-trapezius']],
 ['FMA33584',['transverse','right','spine','spine-muscles-dissection','vm:anatomy:body:spine:right:muscle:transverse-part-of-right-trapezius']],
 ['FMA33585',['transverse','left','spine','spine-muscles-dissection','vm:anatomy:body:spine:left:muscle:transverse-part-of-left-trapezius']],
 ['FMA33586',['descending','right','spine','spine-muscles-dissection','vm:anatomy:body:spine:right:muscle:descending-part-of-right-trapezius']],
 ['FMA33587',['descending','left','spine','spine-muscles-dissection','vm:anatomy:body:spine:left:muscle:descending-part-of-left-trapezius']],
]);
const references={
 subclavius:['https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html'],
 ascending:['https://anatomy.ttuhscep.edu/modules/upper_limb_module/upper_limb_03.html','https://learning.medicine.wsu.edu/cohort-2029/dissector/lab-2-station-6/'],
 transverse:['https://rad.uw.edu/muscle-atlas/trapezius'],
 descending:['https://anatomy.ttuhscep.edu/modules/upper_limb_module/upper_limb_03.html','https://learning.medicine.wsu.edu/cohort-2029/dissector/lab-2-station-6/'],
};

test('eight scapular muscle selections share exact learner and protected Review questions',async()=>{
 const currentRevision=admitPreservedClinicalReview({revision:historicalFeature,sourceHashes,learnerModules:['head-neck','shoulder']});
 const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 assert.equal(learner.sourceCommit,currentRevision);
 assert.equal(review.revision,currentRevision);
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
 for(const path of ['content/scapular-muscle-quiz.ts','content/scapular-muscle-quiz-pins.json','lib/scapular-muscle-quiz.ts']){
  const source=inputs.find((f:{path:string})=>f.path===path),imported=review.files.find((f:{path:string})=>f.path===path);
  assert(source&&imported,path);assert.equal(imported.sourceSha256,source.sha256);
  assert.equal(sha(readFileSync('atlas-review/'+path)),source.sha256);
 }
 const pins=JSON.parse(readFileSync('atlas-review/content/scapular-muscle-quiz-pins.json','utf8'));
 assert.equal(pins.parentCommit,parent);assert.equal(sha(JSON.stringify(pins)),pinsHash);
 assert.equal(pins.entries.length,8);
 assert.deepEqual(pins.entries.map((e:{identity:{fmaId:string}})=>e.identity.fmaId).sort(),[...expected.keys()].sort());
 assert.deepEqual([...new Set(pins.entries.map((e:{group:string})=>e.group))].sort(),Object.keys(references).sort());
 assert.deepEqual(pins.bundles.map((b:{id:string})=>b.id).sort(),['head-neck-muscles','spine-muscles-dissection']);
 for(const bundle of pins.bundles){
  const path=bundle.url.slice(1).split('?')[0],record=learner.files.find((f:{path:string})=>f.path===path);
  assert(record,path);assert.equal(record.sha256,bundle.sha256);assert.equal(record.bytes,bundle.bytes);
  const bytes=readFileSync(base+path);assert.equal(bytes.byteLength,bundle.bytes);assert.equal(sha(bytes),bundle.sha256);
 }
 const compiled=await build({stdin:{contents:"export {bodyLesson} from './atlas-review/app/body-content';export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';export {scapularMuscleQuizLesson} from './atlas-review/lib/scapular-muscle-quiz';export {scapularMuscleQuizQuestions} from './atlas-review/content/scapular-muscle-quiz';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const learnerJs=learner.files.filter((f:{path:string})=>f.path.endsWith('.js')).map((f:{path:string;sha256:string})=>{const bytes=readFileSync(base+f.path);assert.equal(sha(bytes),f.sha256);return new TextDecoder().decode(bytes);}).join('\n');
 for(const entry of pins.entries){
  const [group,side,region,bundle,id]=expected.get(entry.identity.fmaId)!;
  assert.equal(entry.group,group);assert.equal(entry.identity.laterality,side);
  assert.equal(entry.identity.region,region);assert.equal(entry.identity.bundle,bundle);
  assert.equal(entry.identity.id,id);assert.equal(entry.identity.nodeName,entry.identity.fmaId);
  assert.equal(entry.identity.validation.status,'unvalidated');assert.equal(entry.identity.validation.anatomicalReview,false);
  assert.equal(pins.entries.filter((e:{group:string})=>e.group===group).length,2);
  assert.equal(entry.previous.readiness,'generated-identification');assert.equal(entry.previous.correctAnswer,undefined);
  const lesson=api.bodyLesson(entry.identity,'quiz'),packet=await api.bodyReviewMaterial(id);
  const q=api.scapularMuscleQuizQuestions[group];
  assert.deepEqual(q.references,references[group as keyof typeof references]);
  assert.equal(lesson.readiness,'draft');assert.equal(lesson.bullets.length,4);
  assert.equal(lesson.bullets.filter((answer:string)=>answer===lesson.correctAnswer).length,1);
  assert.deepEqual(lesson,api.scapularMuscleQuizLesson(entry.identity,'quiz'));
  assert.equal(api.scapularMuscleQuizLesson(entry.identity,'anatomy'),undefined);
  assert.equal(lesson.body,q.body);assert.deepEqual(lesson.bullets,[...q.choices]);
  assert.equal(lesson.correctAnswer,q.correctAnswer);assert.equal(lesson.explanation,q.explanation);
  assert.deepEqual(lesson.citations,[...q.references]);
  assert.match(lesson.note,/revision-bound radiologist review pending/i);
  assert.match(lesson.note,/source surface does not validate complete anatomy/i);
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
  for(const change of ['source','bundle','id']){
   const altered=wire(entry.identity);
   if(change==='source')altered.sources[0].sha256='0'.repeat(64);
   if(change==='bundle')altered.bundle='other-bundle';
   if(change==='id')altered.id+='-copy';
   assert.equal(api.scapularMuscleQuizLesson(altered,'quiz'),undefined,change);
  }
 }
});
