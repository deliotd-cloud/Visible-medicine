import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const base='public/atlas-runtime/head-neck/';
const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const parent='a8500d445240bd025900ff1fafc63287839ad72a';
const pinsHash='15fca0ce9daee3ccf360949b80348ef22a01f1dbf3fa59bbc3cbc30dba23e168';
const expected=new Map<string,[string,string,string,string[]]>([
 ['FMA46581',['lateral','left','left-lateral-crico-arytenoid',['FJ2778:15d694d60ddab28b19aa0ca2017c86ac82ccc3fda58d257a240f56c363d4271a']]],
 ['FMA46580',['lateral','right','right-lateral-crico-arytenoid',['FJ2796:d0a4730aeb6f0bafdf53eced4954a0ccfaf31ba8f3d08aa90e0c18d9c8928cb3']]],
 ['FMA46578',['posterior','left','left-posterior-crico-arytenoid',['FJ2782:eb100ad68f9201832f5fa15c7e802c175fb813302c8983f13b6f3d3dfdb3d4ef']]],
 ['FMA46577',['posterior','right','right-posterior-crico-arytenoid',['FJ2800:917fb9e8667c4d179c0f86ec06c27dc2d0537e4f81d1319aa21fe5a0e237d891']]],
 ['FMA46585',['oblique','left','left-oblique-arytenoid',['FJ2780:9ad13a6a95301607fa5968e68ae47efc458ebc67f9582f6fc0861672b7b4de17']]],
 ['FMA46584',['oblique','right','right-oblique-arytenoid',['FJ2798:706e265f99131c2bde1b61c4bc2cdfab7ae384ed2c84f10c8cbff91a295ca22c']]],
 ['FMA46590',['thyroarytenoid','left','left-thyro-arytenoid',['FJ2784:6b0698f8b6a6cb877d3610dc959abe0b9c4691bb6e746fd85c8e523fcebc74a9','FJ2785:a785608978d62c2c14f2057cfe2606fe183523dbf92fc587801234bc0be41e2a']]],
 ['FMA46589',['thyroarytenoid','right','right-thyro-arytenoid',['FJ2802:68d5990536538ba707bd1b1b967b7ab14266ed74e5f0d1e33230a5922181c322','FJ2803:fd38f2f5befd554ba19bd4fbab0d0a4ae137a59bb24d3dd0852eb5caa910d3e2']]],
 ['FMA46593',['vocalis','left','left-vocalis',['FJ2788:dd26f669e127e5c5fae7ff796da0f516887f8c3834bbde1f2881d3a222cc2375']]],
 ['FMA46592',['vocalis','right','right-vocalis',['FJ2806:f4b83790f1c6364785f6ec6a8428443e7f20cfe48ed9a14234bb8aff1d80f2a9']]],
 ['FMA46582',['transverse','midline','transverse-arytenoid',['FJ2809:1ece0839b43392b090d5e4b5bf96448a10935f1d3637487cd526d0fff8251f32']]],
]);
const texas='https://anatomy.ttuhscep.edu/schemes/larynx_tables.html';
const arkansas='https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/muscle-tables/muscles-of-the-head-and-neck/';
const questions={
 lateral:['Which action is associated with the lateral crico-arytenoid?',['Adduction of the vocal folds','Abduction of the vocal folds','Elevation of the hyoid','Depression of the epiglottis'],'Adduction of the vocal folds',texas],
 posterior:['Where does the posterior crico-arytenoid attach on the arytenoid cartilage?',['Vocal process','Muscular process','Apex','Posterior surface near the apex'],'Muscular process',texas],
 oblique:['The oblique arytenoid runs from one arytenoid muscular process toward which site?',['Cricoid arch','Thyroid lamina','Opposite arytenoid posterior surface near its apex','Ipsilateral vocal ligament'],'Opposite arytenoid posterior surface near its apex',arkansas],
 thyroarytenoid:['What happens to the vocal folds when the thyro-arytenoid draws the arytenoid forward?',['They abduct and lengthen','They elevate the hyoid','They tense without adducting','They relax and adduct'],'They relax and adduct',arkansas],
 vocalis:['Which structure receives the insertion of vocalis fibres?',['Vocal ligament','Cricoid arch','Hyoid body','Epiglottic cartilage'],'Vocal ligament',arkansas],
 transverse:['Which nerve supplies the transverse arytenoid?',['External branch of superior laryngeal nerve','Inferior laryngeal nerve from the recurrent laryngeal nerve','Glossopharyngeal nerve','Hypoglossal nerve'],'Inferior laryngeal nerve from the recurrent laryngeal nerve',texas],
} as const;

test('eleven laryngeal muscle selections share exact learner and protected Review draft questions',async()=>{
 for(const module of ['shoulder','head-neck','lower-limb','female-pelvis']){
  const manifest=JSON.parse(readFileSync(`public/atlas-runtime/${module}/manifest.json`,'utf8'));
  assert.equal(manifest.sourceCommit,revision,module);
 }
 const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 assert.equal(review.revision,revision);
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
 for(const path of ['content/laryngeal-muscle-quiz.ts','content/laryngeal-muscle-quiz-pins.json','lib/laryngeal-muscle-quiz.ts']){
  const source=inputs.find((f:{path:string})=>f.path===path),imported=review.files.find((f:{path:string})=>f.path===path);
  assert(source&&imported,path);assert.equal(imported.sourceSha256,source.sha256);
  assert.equal(sha(readFileSync('atlas-review/'+path)),source.sha256);
 }
 const pins=JSON.parse(readFileSync('atlas-review/content/laryngeal-muscle-quiz-pins.json','utf8'));
 assert.equal(pins.parentCommit,parent);assert.equal(sha(JSON.stringify(pins)),pinsHash);
 assert.equal(pins.entries.length,11);
 assert.deepEqual(pins.entries.map((e:{identity:{fmaId:string}})=>e.identity.fmaId).sort(),[...expected.keys()].sort());
 assert.deepEqual([...new Set(pins.entries.map((e:{group:string})=>e.group))].sort(),Object.keys(questions).sort());
 assert.deepEqual(pins.bundles.map((b:{id:string})=>b.id),['head-neck-muscles']);
 for(const bundle of pins.bundles){
  const path=bundle.url.slice(1).split('?')[0],record=learner.files.find((f:{path:string})=>f.path===path);
  assert(record,path);assert.equal(record.sha256,bundle.sha256);assert.equal(record.bytes,bundle.bytes);
  const bytes=readFileSync(base+path);assert.equal(bytes.byteLength,bundle.bytes);assert.equal(sha(bytes),bundle.sha256);
 }
 const compiled=await build({stdin:{contents:"export {bodyLesson} from './atlas-review/app/body-content';export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';export {laryngealMuscleQuizLesson} from './atlas-review/lib/laryngeal-muscle-quiz';export {laryngealMuscleQuizQuestions} from './atlas-review/content/laryngeal-muscle-quiz';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const learnerJs=learner.files.filter((f:{path:string})=>f.path.endsWith('.js')).map((f:{path:string;sha256:string})=>{const bytes=readFileSync(base+f.path);assert.equal(sha(bytes),f.sha256);return new TextDecoder().decode(bytes);}).join('\n');
 for(const entry of pins.entries){
  const [group,side,slug,sources]=expected.get(entry.identity.fmaId)!;
  const identity=entry.identity,id=identity.id;
  assert.equal(entry.group,group);assert.equal(identity.laterality,side);
  assert.equal(identity.region,'head-neck');assert.deepEqual(identity.regions,['head-neck']);
  assert.equal(identity.system,'muscles');assert.equal(identity.category,'muscle');
  assert.equal(identity.bundle,'head-neck-muscles');assert.equal(identity.id,`vm:anatomy:body:head-neck:${side}:muscle:${slug}`);
  assert.equal(identity.nodeName,identity.fmaId);
  assert.deepEqual(identity.sources.map((s:{file:string;sha256:string})=>`${s.file}:${s.sha256}`),sources);
  assert.equal(identity.validation.status,'unvalidated');assert.equal(identity.validation.anatomicalReview,false);
  assert.equal(entry.previous.readiness,'generated-identification');assert.equal(entry.previous.correctAnswer,undefined);
  assert.equal(pins.entries.filter((e:{group:string})=>e.group===group).length,group==='transverse'?1:2);
  const q=api.laryngealMuscleQuizQuestions[group];
  assert.deepEqual([q.body,[...q.choices],q.correctAnswer,q.references[0]],questions[group as keyof typeof questions]);
  assert.equal(q.references.length,1);
  const lesson=api.bodyLesson(identity,'quiz'),packet=await api.bodyReviewMaterial(id);
  assert.equal(lesson.readiness,'draft');assert.equal(lesson.bullets.length,4);
  assert.equal(lesson.bullets.filter((answer:string)=>answer===lesson.correctAnswer).length,1);
  assert.deepEqual(lesson,api.laryngealMuscleQuizLesson(identity,'quiz'));
  assert.equal(api.laryngealMuscleQuizLesson(identity,'anatomy'),undefined);
  assert.equal(lesson.body,q.body);assert.deepEqual(lesson.bullets,[...q.choices]);
  assert.equal(lesson.correctAnswer,q.correctAnswer);assert.equal(lesson.explanation,q.explanation);
  assert.deepEqual(lesson.citations,[...q.references]);
  assert.match(lesson.note,/revision-bound radiologist review pending/i);
  assert.match(lesson.note,/source geometry does not validate complete anatomy/i);
  for(const text of [lesson.body,lesson.explanation,...lesson.bullets])assert(learnerJs.includes(text));
  assert.deepEqual(packet.source.structure,identity);assert.equal(packet.approval,false);
  assert.equal(packet.status,'worksheet-not-submitted');
  assert.deepEqual(packet.topics.find((t:{tab:string})=>t.tab==='quiz'),{tab:'quiz',...lesson});
  for(const topic of packet.topics.filter((t:{tab:string})=>t.tab!=='quiz'))assert.deepEqual(topic,{tab:topic.tab,...api.bodyLesson(identity,topic.tab)});
  assert.deepEqual(await api.parseBodyReviewResponse(wire(packet),id),wire(packet));
  for(const change of ['prior','question','answer','source']){
   const altered=wire(packet),index=altered.topics.findIndex((t:{tab:string})=>t.tab==='quiz');
   if(change==='prior')altered.topics[index]={tab:'quiz',...entry.previous};
   if(change==='question')altered.topics[index].body='Stale question';
   if(change==='answer')altered.topics[index].correctAnswer='Foreign answer';
   if(change==='source')altered.source.structure.sources[0].sha256='0'.repeat(64);
   assert.equal(await api.parseBodyReviewResponse(altered,id),null,change);
  }
  for(const change of ['source','bundle','id','fma','side','region','system','category','node','review']){
   const altered=wire(identity);
   if(change==='source')altered.sources[0].sha256='0'.repeat(64);
   if(change==='bundle')altered.bundle='other-bundle';
   if(change==='id')altered.id+='-copy';
   if(change==='fma')altered.fmaId='FMA0';
   if(change==='side')altered.laterality='other';
   if(change==='region')altered.region='other';
   if(change==='system')altered.system='other';
   if(change==='category')altered.category='other';
   if(change==='node')altered.nodeName='other';
   if(change==='review')altered.validation.anatomicalReview=true;
   assert.equal(api.laryngealMuscleQuizLesson(altered,'quiz'),undefined,change);
  }
  if(sources.length===2)for(const change of ['second-source','source-order']){
   const altered=wire(identity);
   if(change==='second-source')altered.sources[1].sha256='0'.repeat(64);
   else altered.sources.reverse();
   assert.equal(api.laryngealMuscleQuizLesson(altered,'quiz'),undefined,change);
   const alteredPacket=wire(packet);alteredPacket.source.structure.sources=altered.sources;
   assert.equal(await api.parseBodyReviewResponse(alteredPacket,id),null,change);
  }
 }
});
