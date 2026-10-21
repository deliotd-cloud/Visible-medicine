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
const parent='e7608c0719fbf77b0f1a350d648dd695be23be6b';
const pinsHash='8ce87e14430874ecf7ccb44545770f9da18545fcb7f31f649d03f47c239ba567';
const expected=new Map([
 ['FMA46444',['coccygeus','left','pelvis','pelvis-muscles','vm:anatomy:body:pelvis:left:muscle:left-coccygeus']],
 ['FMA46310',['longus','left','spine','spine-muscles','vm:anatomy:body:spine:left:muscle:left-longus-capitis']],
 ['FMA46314',['anterior','left','spine','spine-muscles','vm:anatomy:body:spine:left:muscle:left-rectus-capitis-anterior']],
 ['FMA46318',['lateralis','left','spine','spine-muscles','vm:anatomy:body:spine:left:muscle:left-rectus-capitis-lateralis']],
 ['FMA46309',['longus','right','spine','spine-muscles','vm:anatomy:body:spine:right:muscle:right-longus-capitis']],
 ['FMA46313',['anterior','right','spine','spine-muscles','vm:anatomy:body:spine:right:muscle:right-rectus-capitis-anterior']],
 ['FMA46317',['lateralis','right','spine','spine-muscles','vm:anatomy:body:spine:right:muscle:right-rectus-capitis-lateralis']],
 ['FMA46443',['coccygeus','right','pelvis','pelvis-muscles','vm:anatomy:body:pelvis:right:muscle:right-coccygeus']],
 ['FMA46018',['oblique','right','foot','foot-muscles-dissection','vm:anatomy:body:foot:right:muscle:oblique-head-of-right-adductor-hallucis']],
 ['FMA46019',['oblique','left','foot','foot-muscles-dissection','vm:anatomy:body:foot:left:muscle:oblique-head-of-left-adductor-hallucis']],
 ['FMA46020',['transverse','right','foot','foot-muscles-dissection','vm:anatomy:body:foot:right:muscle:transverse-head-of-right-adductor-hallucis']],
 ['FMA46021',['transverse','left','foot','foot-muscles-dissection','vm:anatomy:body:foot:left:muscle:transverse-head-of-left-adductor-hallucis']],
]);
const references={
 longus:['https://anatomy.ttuhscep.edu/anatomytables/muscles_head_neck.html'],
 anterior:['https://anatomy.ttuhscep.edu/anatomytables/muscles_head_neck.html'],
 lateralis:['https://anatomy.ttuhscep.edu/anatomytables/muscles_head_neck.html'],
 coccygeus:['https://anatomy.ttuhscep.edu/reproductive_system/pelvicwall_tables.html'],
 oblique:['https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html'],
 transverse:['https://www.elsevier.com/resources/anatomy/muscular-system/muscles-of-lower-limb/transverse-head-of-adductor-hallucis/22943'],
};
const expectedQuestions={
 longus:['Where on the skull does longus capitis attach?', ['Basilar occipital bone','Mastoid process','Zygomatic arch','Mandibular ramus'],'Basilar occipital bone'],
 anterior:['Which head movement is associated with rectus capitis anterior?', ['Head extension','Head flexion','Head rotation','Jaw elevation'],'Head flexion'],
 lateralis:['Which head movement is associated with rectus capitis lateralis?', ['Head extension','Head rotation','Lateral bending of the head','Jaw elevation'],'Lateral bending of the head'],
 coccygeus:['Coccygeus and levator ani together form which muscular floor?', ['Thoracic diaphragm','Urogenital diaphragm','Oral diaphragm','Pelvic diaphragm'],'Pelvic diaphragm'],
 oblique:['The oblique head of adductor hallucis arises chiefly from which bones?', ['Bases of metatarsals 2–4','Heads of metatarsals 3–5','Calcaneal tuberosity','Distal phalanges 2–4'],'Bases of metatarsals 2–4'],
 transverse:['Which soft tissue provides an origin for the transverse head of adductor hallucis?', ['Calcaneal tendon','Plantar ligaments of lateral metatarsophalangeal joints','Flexor retinaculum','Plantar aponeurosis at the heel'],'Plantar ligaments of lateral metatarsophalangeal joints'],
};
const leftCoccygeusSources=[
 {file:'FJ1449M',sha256:'9ef81d97ab697662e5701385dd7a92a3528612f7a98ef042bbaafde2f1426d24'},
 {file:'FJ2542',sha256:'c2599aa898ecec192abe6441c4764e04cd25642255175ac4f676424be2fe5846'},
];

test('twelve regional muscle selections share exact learner and protected Review draft questions',async()=>{
 for(const module of ['shoulder','head-neck','lower-limb','female-pelvis']){
  const manifest=JSON.parse(readFileSync(`public/atlas-runtime/${module}/manifest.json`,'utf8'));
  assert.equal(manifest.sourceCommit,revision,module);
 }
 const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 assert.equal(review.revision,revision);
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
 for(const path of ['content/regional-muscle-completion-quiz.ts','content/regional-muscle-completion-quiz-pins.json','lib/regional-muscle-completion-quiz.ts']){
  const source=inputs.find((f:{path:string})=>f.path===path),imported=review.files.find((f:{path:string})=>f.path===path);
  assert(source&&imported,path);assert.equal(imported.sourceSha256,source.sha256);
  assert.equal(sha(readFileSync('atlas-review/'+path)),source.sha256);
  const git=(revision:string)=>execFileSync('git',['-C',currentAtlasDeliveryRoot(),'show',revision+':'+path],
    {windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  assert.deepEqual(git(revision),git(historicalRevision),path+' retains exact 9f quiz source bytes');
  assert.equal(source.sha256,sha(git(revision)));
 }
 const pins=JSON.parse(readFileSync('atlas-review/content/regional-muscle-completion-quiz-pins.json','utf8'));
 assert.equal(pins.parentCommit,parent);assert.equal(sha(JSON.stringify(pins)),pinsHash);
 assert.equal(pins.entries.length,12);
 assert.deepEqual(pins.entries.map((e:{identity:{fmaId:string}})=>e.identity.fmaId).sort(),[...expected.keys()].sort());
 assert.deepEqual([...new Set(pins.entries.map((e:{group:string})=>e.group))].sort(),Object.keys(references).sort());
 assert.deepEqual(pins.bundles.map((b:{id:string})=>b.id).sort(),['spine-muscles','pelvis-muscles','foot-muscles-dissection'].sort());
 assert.deepEqual(pins.entries.find((e:{identity:{fmaId:string}})=>e.identity.fmaId==='FMA46444').identity.sources,leftCoccygeusSources);
 for(const bundle of pins.bundles){
  const path=bundle.url.slice(1).split('?')[0],record=learner.files.find((f:{path:string})=>f.path===path);
  assert(record,path);assert.equal(record.sha256,bundle.sha256);assert.equal(record.bytes,bundle.bytes);
  const bytes=readFileSync(base+path);assert.equal(bytes.byteLength,bundle.bytes);assert.equal(sha(bytes),bundle.sha256);
 }
 const compiled=await build({stdin:{contents:"export {bodyLesson} from './atlas-review/app/body-content';export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';export {regionalMuscleCompletionQuizLesson} from './atlas-review/lib/regional-muscle-completion-quiz';export {regionalMuscleCompletionQuizQuestions} from './atlas-review/content/regional-muscle-completion-quiz';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const learnerJs=learner.files.filter((f:{path:string})=>f.path.endsWith('.js')).map((f:{path:string;sha256:string})=>{const bytes=readFileSync(base+f.path);assert.equal(sha(bytes),f.sha256);return new TextDecoder().decode(bytes);}).join('\n');
 let placements=0;
 for(const entry of pins.entries){
  const [group,side,region,bundle,id]=expected.get(entry.identity.fmaId)!;
  assert.equal(entry.group,group);assert.equal(entry.identity.laterality,side);
  assert.equal(entry.identity.region,region);assert.equal(entry.identity.system,'muscles');
  assert.equal(entry.identity.category,'muscle');assert.equal(entry.identity.bundle,bundle);
  assert.equal(entry.identity.id,id);assert.equal(entry.identity.nodeName,entry.identity.fmaId);
  assert.equal(entry.identity.validation.status,'unvalidated');assert.equal(entry.identity.validation.anatomicalReview,false);
  assert.equal(pins.entries.filter((e:{group:string})=>e.group===group).length,2);
  assert.equal(entry.previous.readiness,'generated-identification');assert.equal(entry.previous.correctAnswer,undefined);
  if(entry.identity.fmaId!=='FMA46444')assert.equal(entry.identity.sources.length,1);
  const lesson=api.bodyLesson(entry.identity,'quiz'),packet=await api.bodyReviewMaterial(id);
  const q=api.regionalMuscleCompletionQuizQuestions[group];
  assert.deepEqual([q.body,[...q.choices],q.correctAnswer],expectedQuestions[group as keyof typeof expectedQuestions]);
  assert.deepEqual(q.references,references[group as keyof typeof references]);
  assert.equal(lesson.readiness,'draft');assert.equal(lesson.bullets.length,4);
  assert.equal(lesson.bullets.filter((answer:string)=>answer===lesson.correctAnswer).length,1);
  assert.deepEqual(lesson,api.regionalMuscleCompletionQuizLesson(entry.identity,'quiz'));
  assert.equal(api.regionalMuscleCompletionQuizLesson(entry.identity,'anatomy'),undefined);
  assert.equal(lesson.body,q.body);assert.deepEqual(lesson.bullets,[...q.choices]);
  assert.equal(lesson.correctAnswer,q.correctAnswer);assert.equal(lesson.explanation,q.explanation);
  assert.deepEqual(lesson.citations,[...q.references]);
  assert.match(lesson.note,/revision-bound radiologist review pending/i);
  assert.match(lesson.note,/source geometry does not validate complete anatomy/i);
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
  for(const change of ['source','bundle','id','fma','side','region','system','category','node','review']){
   const altered=wire(entry.identity);
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
   assert.equal(api.regionalMuscleCompletionQuizLesson(altered,'quiz'),undefined,change);
  }
  if(entry.identity.fmaId==='FMA46444'){
   for(const change of ['second-source','source-order']){
    const altered=wire(entry.identity);
    if(change==='second-source')altered.sources[1].sha256='0'.repeat(64);
    else altered.sources.reverse();
    assert.equal(api.regionalMuscleCompletionQuizLesson(altered,'quiz'),undefined,change);
    const alteredPacket=wire(packet);
    alteredPacket.source.structure.sources=altered.sources;
    assert.equal(await api.parseBodyReviewResponse(alteredPacket,id),null,change);
   }
  }
  placements++;
 }
 assert.equal(placements,12);
});
