import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {build} from 'esbuild';

const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const base='public/atlas-runtime/head-neck/';
const historicalRuntimeRevision='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const historicalRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const parent='cbda5345d2aaa730b0361e7e374e356478f6222d';
const pinsHash='ac14b21fdbdd1d5d1671bdd410932e8d87c0ac6bd56226c2e9273ac7f0053e0b';
const expected=new Map([
 ['FMA23707',['interosseous','right','forearm','connective','ligament','forearm-connective-gaps','vm:anatomy:body:forearm:right:ligament:interosseous-membrane-of-right-forearm']],
 ['FMA23708',['interosseous','left','forearm','connective','ligament','forearm-connective-gaps','vm:anatomy:body:forearm:left:ligament:interosseous-membrane-of-left-forearm']],
 ['FMA13330',['axillary','right','shoulder-arm','vessels','vessel','shoulder-arm-vessels-inventory','vm:anatomy:body:shoulder-arm:right:vessel:right-axillary-vein']],
 ['FMA13331',['axillary','left','shoulder-arm','vessels','vessel','shoulder-arm-vessels-inventory','vm:anatomy:body:shoulder-arm:left:vessel:left-axillary-vein']],
 ['FMA50859',['suprascapular','right','shoulder-arm','vessels','vessel','shoulder-arm-vessels-inventory','vm:anatomy:body:shoulder-arm:right:vessel:right-suprascapular-vein']],
 ['FMA50860',['suprascapular','left','shoulder-arm','vessels','vessel','shoulder-arm-vessels-inventory','vm:anatomy:body:shoulder-arm:left:vessel:left-suprascapular-vein']],
 ['FMA40120',['retinaculum','right','hand','connective','ligament','hand-connective-axial-detail','vm:anatomy:body:hand:right:ligament:flexor-retinaculum-of-right-wrist']],
 ['FMA40121',['retinaculum','left','hand','connective','ligament','hand-connective-axial-detail','vm:anatomy:body:hand:left:ligament:flexor-retinaculum-of-left-wrist']],
 ['FMA22935',['brachial','right','shoulder-arm','vessels','vessel','brachial-veins','vm:anatomy:body:shoulder-arm:right:vessel:right-medial-brachial-vein']],
 ['FMA22936',['brachial','left','shoulder-arm','vessels','vessel','brachial-veins','vm:anatomy:body:shoulder-arm:left:vessel:left-medial-brachial-vein']],
]);
const references={
 interosseous:['https://anatomy.ttuhscep.edu/musculoskeletal_system/forearm_tables.html'],
 retinaculum:['https://anatomy.ttuhscep.edu/musculoskeletal_system/hand_tables.html','https://www.elsevier.com/resources/anatomy/connective-tissue/fasciae/flexor-retinaculum-of-wrist/16608'],
 axillary:['https://anatomy.ttuhscep.edu/musculoskeletal_system/axilla_ans.html'],
 suprascapular:['https://pubmed.ncbi.nlm.nih.gov/24633009/'],
 brachial:['https://anatomy.ttuhscep.edu/musculoskeletal_system/axilla_ans.html'],
};
const expectedQuestions={
 interosseous:['Which two bones are connected by the forearm interosseous membrane?', ['Humerus and radius','Scapula and clavicle','Radius and ulna','Ulna and humerus'],'Radius and ulna'],
 retinaculum:['Which structure forms the roof of the carpal tunnel?', ['Flexor retinaculum','Extensor retinaculum','Palmar aponeurosis','Interosseous membrane'],'Flexor retinaculum'],
 axillary:['At the lateral border of the first rib, the axillary vein continues as which vein?', ['Basilic vein','Cephalic vein','Brachial vein','Subclavian vein'],'Subclavian vein'],
 suprascapular:['How may the suprascapular vein pass relative to the superior transverse scapular ligament?', ['Always below it','Above or below it','Always through bone','Always above it'],'Above or below it'],
 brachial:['Which artery is accompanied by the brachial veins in the arm?', ['Axillary artery','Radial artery','Brachial artery','Subclavian artery'],'Brachial artery'],
};

test('ten upper-limb selections share exact learner and protected Review draft questions',async()=>{
 const pin=validateCurrentAtlasDelivery(),currentSource=CURRENT_ATLAS_REVISION;
 assert.equal(pin.source,currentSource);
 for(const module of ['shoulder','head-neck','lower-limb','female-pelvis']){
  const manifest=JSON.parse(readFileSync(`public/atlas-runtime/${module}/manifest.json`,'utf8'));
  assert.equal(manifest.sourceCommit,pin.runtimeSources[module],module);
 }
 const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 assert.equal(review.revision,currentSource);
 const sourceRoot=currentAtlasDeliveryRoot();
 const committed=(revision:string,path:string)=>execFileSync('git',['-C',sourceRoot,'show',revision+':'+path],
  {windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
 for(const path of ['content/upper-limb-completion-quiz.ts','content/upper-limb-completion-quiz-pins.json','lib/upper-limb-completion-quiz.ts']){
  const source=inputs.find((f:{path:string})=>f.path===path),imported=review.files.find((f:{path:string})=>f.path===path);
  assert(source&&imported,path);assert.equal(imported.sourceSha256,source.sha256);
  assert.equal(sha(readFileSync('atlas-review/'+path)),source.sha256);
  const historicalRuntime=committed(historicalRuntimeRevision,path);
  assert.deepEqual(historicalRuntime,committed(historicalRevision,path),path+' exact 9f quiz source at 190a');
  const current=committed(currentSource,path);
  assert.deepEqual(current,historicalRuntime,path+' current quiz source retains exact historical bytes');
  assert.equal(source.sha256,sha(current),path+' committed source');
 }
 const dispatch=review.files.find((file:{path:string})=>file.path==='app/body-content.ts');assert(dispatch);
 assert.equal(sha(committed(historicalRevision,'app/body-content.ts')),'92add5e49675680abd55f687c08e7d4bbcfcb0ab34e1e0f611cc3da74c3fef9f');
 assert.equal(sha(committed(historicalRuntimeRevision,'app/body-content.ts')),'3deda6b748ed897afcd980ff24256aa20b165f8c1615fdc1e2f887211d69c1d2');
 const currentDispatch=sha(committed(currentSource,'app/body-content.ts'));
 assert.equal(currentDispatch,'26320b064b5648f4f5b6ca8c123806a02dedefb761b894935707559d530882fc');
 assert.equal(dispatch.sourceSha256,currentDispatch);
 assert.equal(dispatch.importedSha256,sha(readFileSync('atlas-review/app/body-content.ts')));
 assert.equal(inputs.find((file:{path:string})=>file.path==='app/body-content.ts')?.sha256,currentDispatch);
 const pins=JSON.parse(readFileSync('atlas-review/content/upper-limb-completion-quiz-pins.json','utf8'));
 assert.equal(pins.parentCommit,parent);assert.equal(sha(JSON.stringify(pins)),pinsHash);
 assert.equal(pins.entries.length,10);
 assert.deepEqual(pins.entries.map((e:{identity:{fmaId:string}})=>e.identity.fmaId).sort(),[...expected.keys()].sort());
 assert.deepEqual([...new Set(pins.entries.map((e:{group:string})=>e.group))].sort(),Object.keys(references).sort());
 assert.deepEqual(pins.bundles.map((b:{id:string})=>b.id).sort(),['forearm-connective-gaps','shoulder-arm-vessels-inventory','hand-connective-axial-detail','brachial-veins'].sort());
 for(const bundle of pins.bundles){
  const path=bundle.url.slice(1).split('?')[0],record=learner.files.find((f:{path:string})=>f.path===path);
  assert(record,path);assert.equal(record.sha256,bundle.sha256);assert.equal(record.bytes,bundle.bytes);
  const bytes=readFileSync(base+path);assert.equal(bytes.byteLength,bundle.bytes);assert.equal(sha(bytes),bundle.sha256);
 }
 const compiled=await build({stdin:{contents:"export {bodyLesson} from './atlas-review/app/body-content';export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';export {upperLimbCompletionQuizLesson} from './atlas-review/lib/upper-limb-completion-quiz';export {upperLimbCompletionQuizQuestions} from './atlas-review/content/upper-limb-completion-quiz';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const learnerJs=learner.files.filter((f:{path:string})=>f.path.endsWith('.js')).map((f:{path:string;sha256:string})=>{const bytes=readFileSync(base+f.path);assert.equal(sha(bytes),f.sha256);return new TextDecoder().decode(bytes);}).join('\n');
 let placements=0;
 for(const entry of pins.entries){
  const [group,side,region,system,category,bundle,id]=expected.get(entry.identity.fmaId)!;
  assert.equal(entry.group,group);assert.equal(entry.identity.laterality,side);
  assert.equal(entry.identity.region,region);assert.equal(entry.identity.system,system);
  assert.equal(entry.identity.category,category);assert.equal(entry.identity.bundle,bundle);
  assert.equal(entry.identity.id,id);assert.equal(entry.identity.nodeName,entry.identity.fmaId);
  assert.equal(entry.identity.validation.status,'unvalidated');assert.equal(entry.identity.validation.anatomicalReview,false);
  assert.equal(pins.entries.filter((e:{group:string})=>e.group===group).length,2);
  assert.equal(entry.previous.readiness,'generated-identification');assert.equal(entry.previous.correctAnswer,undefined);
  const lesson=api.bodyLesson(entry.identity,'quiz'),packet=await api.bodyReviewMaterial(id);
  const q=api.upperLimbCompletionQuizQuestions[group];
  assert.deepEqual([q.body,[...q.choices],q.correctAnswer],expectedQuestions[group as keyof typeof expectedQuestions]);
  assert.deepEqual(q.references,references[group as keyof typeof references]);
  assert.equal(lesson.readiness,'draft');assert.equal(lesson.bullets.length,4);
  assert.equal(lesson.bullets.filter((answer:string)=>answer===lesson.correctAnswer).length,1);
  assert.deepEqual(lesson,api.upperLimbCompletionQuizLesson(entry.identity,'quiz'));
  assert.equal(api.upperLimbCompletionQuizLesson(entry.identity,'anatomy'),undefined);
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
   assert.equal(api.upperLimbCompletionQuizLesson(altered,'quiz'),undefined,change);
  }
  placements++;
 }
 assert.equal(placements,10);
});
