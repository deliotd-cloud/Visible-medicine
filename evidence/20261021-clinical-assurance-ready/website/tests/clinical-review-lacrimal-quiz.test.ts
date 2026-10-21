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
const parent='66f11bf5aab91e056035e8ab9e5df11e4307775b';
const pinsHash='84a2854e8f1669882353f944c6425ba3474bf78544209fd585c28339944864d3';
const sourceHashes=new Map([
 ['content/lacrimal-quiz.ts','fad88434bceee3d7e9ed09e85bb77db912e7dfecf829540d6a8def61f7c50eea'],
 ['content/lacrimal-quiz-pins.json','c7bc925a31e43281a0fd1a35658193d920b922ec08f934cece9ab7785fdd5b0e'],
 ['lib/lacrimal-quiz.ts','ada6f5f847a52b1bab6899f5b14c1dc83afc255d2e969ad714616b1fc5f10ab8'],
]);
const gaps='head-neck-organs-gaps',ocular='head-neck-organs-ocular-detail';
const expected=new Map<string,[string,string,string,string,string]>([
 ['FMA59102',['gland','right','right-lacrimal-gland',gaps,'FJ1350:ff108bfd00a1a4dc0eebfa62c8553b1ca94d7003d18437e7d637566db433f604']],
 ['FMA59103',['gland','left','left-lacrimal-gland',gaps,'FJ1299:4249d4bed4b176bb504a756ebffca8ea5b96268e6f57b000206c81ead66674d8']],
 ['FMA59582',['canaliculus','right','right-lacrimal-canaliculus',ocular,'FJ1349:ff8401d7470c86141e144f82eea17a1081f076dbf3d068d48f26832c742ebbf3']],
 ['FMA59583',['canaliculus','left','left-lacrimal-canaliculus',ocular,'FJ1298:98ec4fcd5a6c260a179480702c2d4690624207aeeb76160c6be4667bd66e11a5']],
 ['FMA59555',['duct','right','right-nasolacrimal-duct',ocular,'FJ1353:c54be1e1906335236559e5ca8bf69e95cbbdac0fef62d90efa9e36aa2ac164e8']],
 ['FMA59556',['duct','left','left-nasolacrimal-duct',ocular,'FJ1302:a8a4bcc60e752d4f4b79a60ec6e9539809aa4293be59d6623bb0ac008ad6606f']],
 ['FMA59545',['sac','right','right-lacrimal-sac',ocular,'FJ1360:192020e5353d1f78e5867a7a2f09e4f114ab31a7cdc2865056c734a5f1bbc02e']],
 ['FMA59546',['sac','left','left-lacrimal-sac',ocular,'FJ1309:d62bdc3bfc8e3b2d5c0fea85973e68e4f066c253f6a18be5fe2c72e791a4ff21']],
]);
const texas='https://anatomy.ttuhscep.edu/nervous_system/eye_tables.html';
const arkansas='https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/viscera-tables/visceral-structures-of-the-head-and-neck/';
const questions={
 gland:['What does the lacrimal gland produce?',['Tears','Aqueous humour','Nasal mucus','Saliva'],'Tears','The lacrimal gland is the tear-producing gland of the orbit.',[texas,arkansas]],
 canaliculus:['What enters a lacrimal canaliculus through a lacrimal punctum?',['Blood from the eyelid','Tears from the eyelid margin','Air from the nose','Fluid from the lacrimal sac'],'Tears from the eyelid margin','The puncta admit tears into the canaliculi, which lead toward the lacrimal sac.',[texas,arkansas]],
 sac:['Where do tears pass after the lacrimal sac?',['Conjunctival sac','Frontal sinus','Nasolacrimal duct','Optic canal'],'Nasolacrimal duct','The sac receives the canaliculi and drains into the nasolacrimal duct.',[texas,arkansas]],
 duct:['Where does the nasolacrimal duct empty?',['Middle nasal meatus','Oral cavity','Superior nasal meatus','Inferior nasal meatus'],'Inferior nasal meatus','The duct carries tears from the lacrimal sac into the inferior meatus of the nasal cavity.',[arkansas]],
} as const;

test('eight bilateral lacrimal selections share exact learner and protected Review draft questions',async()=>{
 const currentRevision=admitPreservedClinicalReview({revision:historicalFeature,sourceHashes:Object.fromEntries(sourceHashes),learnerModules:['head-neck','shoulder']});
 for(const module of ['shoulder','head-neck','lower-limb','female-pelvis']){
  const manifest=JSON.parse(readFileSync(`public/atlas-runtime/${module}/manifest.json`,'utf8'));
  assert.equal(manifest.sourceCommit,currentRevision,module);
 }
 const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 assert.equal(review.revision,currentRevision);
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
 for(const [path,hash] of sourceHashes){
  const source=inputs.find((f:{path:string})=>f.path===path),imported=review.files.find((f:{path:string})=>f.path===path);
  assert(source&&imported,path);assert.equal(source.sha256,hash,path);
  assert.equal(imported.sourceSha256,hash,path);assert.equal(sha(readFileSync('atlas-review/'+path)),hash,path);
 }
 const pins=JSON.parse(readFileSync('atlas-review/content/lacrimal-quiz-pins.json','utf8'));
 assert.equal(pins.parentCommit,parent);assert.equal(sha(JSON.stringify(pins)),pinsHash);
 assert.equal(pins.entries.length,8);
 assert.deepEqual(pins.entries.map((e:{identity:{fmaId:string}})=>e.identity.fmaId).sort(),[...expected.keys()].sort());
 assert.deepEqual([...new Set(pins.entries.map((e:{group:string})=>e.group))].sort(),Object.keys(questions).sort());
 assert.deepEqual(pins.bundles.map((b:{id:string})=>b.id),[gaps,ocular]);
 const bundleHashes=new Map([[gaps,'4d05d792dd062b49d22f8740e4f0a0c4785249cbcac61a47ac7a48d06b5a6ab1'],[ocular,'2f0b7535025dfd415ef448ae4fef66e351303e1fad2e7da128fa7122bac9929b']]);
 for(const bundle of pins.bundles){
  assert.equal(bundle.sha256,bundleHashes.get(bundle.id));
  const path=bundle.url.slice(1).split('?')[0],record=learner.files.find((f:{path:string})=>f.path===path);
  assert(record,path);assert.equal(record.sha256,bundle.sha256);assert.equal(record.bytes,bundle.bytes);
  const bytes=readFileSync(base+path);assert.equal(bytes.byteLength,bundle.bytes);assert.equal(sha(bytes),bundle.sha256);
 }
 const compiled=await build({stdin:{contents:"export {bodyLesson} from './atlas-review/app/body-content';export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';export {lacrimalQuizLesson} from './atlas-review/lib/lacrimal-quiz';export {lacrimalQuizQuestions} from './atlas-review/content/lacrimal-quiz';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const learnerJs=learner.files.filter((f:{path:string})=>f.path.endsWith('.js')).map((f:{path:string;sha256:string})=>{const bytes=readFileSync(base+f.path);assert.equal(sha(bytes),f.sha256);return new TextDecoder().decode(bytes);}).join('\n');
 for(const entry of pins.entries){
  const [group,side,slug,bundle,source]=expected.get(entry.identity.fmaId)!;
  const identity=entry.identity,id=identity.id;
  assert.equal(entry.group,group);assert.equal(identity.laterality,side);
  assert.equal(identity.region,'head-neck');assert.deepEqual(identity.regions,['head-neck']);
  assert.equal(identity.system,'organs');assert.equal(identity.category,'organ');
  assert.equal(identity.bundle,bundle);assert.equal(identity.id,`vm:anatomy:body:head-neck:${side}:organ:${slug}`);
  assert.equal(identity.nodeName,identity.fmaId);
  assert.deepEqual(identity.sources.map((s:{file:string;sha256:string})=>`${s.file}:${s.sha256}`),[source]);
  assert.equal(identity.validation.status,'unvalidated');assert.equal(identity.validation.anatomicalReview,false);
  assert.equal(entry.previous.readiness,'generated-identification');assert.equal(entry.previous.correctAnswer,undefined);
  assert.equal(pins.entries.filter((e:{group:string})=>e.group===group).length,2);
  const q=api.lacrimalQuizQuestions[group];
  assert.deepEqual([q.body,[...q.choices],q.correctAnswer,q.explanation,[...q.references]],questions[group as keyof typeof questions]);
  const lesson=api.bodyLesson(identity,'quiz'),packet=await api.bodyReviewMaterial(id);
  assert.equal(lesson.readiness,'draft');assert.equal(lesson.bullets.length,4);
  assert.equal(lesson.bullets.filter((answer:string)=>answer===lesson.correctAnswer).length,1);
  assert.deepEqual(lesson,api.lacrimalQuizLesson(identity,'quiz'));
  assert.equal(api.lacrimalQuizLesson(identity,'anatomy'),undefined);
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
   assert.equal(api.lacrimalQuizLesson(altered,'quiz'),undefined,change);
  }
 }
});
