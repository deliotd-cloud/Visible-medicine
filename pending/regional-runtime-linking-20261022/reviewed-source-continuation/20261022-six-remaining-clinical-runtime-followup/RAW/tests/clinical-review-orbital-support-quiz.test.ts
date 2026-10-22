import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';
import {admitPreservedClinicalReview} from './clinical-review-current-admission.mjs';

const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
// Independently measured from `git show 29770743:<path>` in the clean Atlas source.
const sourceHashes:Record<string,string>={
 'content/orbital-support-quiz.ts':'62ff3e0483c4aa9f14f2307448e08d26b0df158d235c03d124375ca77b099442',
 'lib/orbital-support-quiz.ts':'24dbf690b712afb654aa79cf49b95e3aefd44c9e25aeaf0eb51b6533a92b1647',
 'content/orbital-support-quiz-pins.json':'d2f2e730f86ecc9f9bafeed9dcd92cba7cce1d6da1c0334892e1de985d9a749a',
};
const expected:Record<string,{group:'trochlea'|'ring';side:'left'|'right';category:'cartilage'|'tendon'}>={
 FMA49067:{group:'trochlea',side:'right',category:'cartilage'},
 FMA49068:{group:'trochlea',side:'left',category:'cartilage'},
 FMA49072:{group:'ring',side:'right',category:'tendon'},
 FMA49073:{group:'ring',side:'left',category:'tendon'},
};
const questions={
 trochlea:{
  body:'Which tendon turns through the orbital trochlea?',
  choices:['Inferior oblique','Superior rectus','Superior oblique','Lateral rectus'],
  correctAnswer:'Superior oblique',
  explanation:'The trochlea redirects the superior oblique tendon; it is not the origin shared by the rectus muscles.',
  references:['https://anatomy.ttuhscep.edu/nervous_system/eye_tables.html'],
 },
 ring:{
  body:'Which muscle group shares the common tendinous ring as its usual origin?',
  choices:['The four rectus muscles','Both oblique muscles','The eyelid-closing muscles','The muscles within the iris'],
  correctAnswer:'The four rectus muscles',
  explanation:'The recti arise at the orbital apex. The superior oblique tendon instead uses the trochlea as a pulley.',
  references:['https://anatomy.ttuhscep.edu/nervous_system/eye_tables.html'],
 },
};
type Identity={id:string;fmaId:string;name:string;laterality:string;category:string;bundle:string;sources:{file:string;sha256:string}[];bounds:{min:number[]}};
type Entry={identity:Identity;group:'trochlea'|'ring';previous:{readiness:string;body:string}};

test('orbital support questions bind four exact source identities across learner runtimes and protected Review',async()=>{
 const currentRevision=admitPreservedClinicalReview({revision,sourceHashes,learnerModules:['head-neck','shoulder']});
 const review=json('atlas-review/manifest.json');
 const pins=json('atlas-review/content/orbital-support-quiz-pins.json');
 const catalog=json('atlas-review/public/models/bodyparts3d/full-body/catalog.json');
 assert.equal(review.revision,currentRevision);
 assert.equal(pins.entries.length,4);
 assert.deepEqual(pins.entries.map((entry:Entry)=>entry.identity.fmaId).sort(),Object.keys(expected).sort());
 assert.equal(new Set(pins.entries.map((entry:Entry)=>entry.identity.id)).size,4);
 for(const [path,hash] of Object.entries(sourceHashes)){
  const file=review.files.find((item:{path:string})=>item.path===path);
  assert(file,`Review missing ${path}`);
  assert.equal(file.sourceSha256,hash,path);
  assert.equal(file.importedSha256,hash,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),hash,path);
 }
 for(const entry of pins.entries as Entry[]){
  const {identity,group}=entry,match=expected[identity.fmaId];
  assert.equal(group,match.group,identity.id);
  assert.equal(identity.laterality,match.side,identity.id);
  assert.equal(identity.category,match.category,identity.id);
  assert.equal(identity.bundle,'head-neck-connective-head-detail',identity.id);
  assert.match(identity.id,new RegExp(`head-neck:${match.side}:${match.category}:`));
  assert.deepEqual(catalog.structures.find((item:Identity)=>item.id===identity.id),identity,identity.id);
  assert.equal(entry.previous.readiness,'generated-identification',identity.id);
 }

 const learnerBundles:string[]=[];
 for(const module of ['head-neck','female-pelvis','lower-limb','shoulder']){
  const base=`public/atlas-runtime/${module}/`;
  const manifest=json(base+'manifest.json');
  const inputs=json(base+'source-inputs.json');
  assert.equal(manifest.sourceCommit,currentRevision,module);
  assert.equal(manifest.patientDataIncluded,false,module);
  assert.equal(manifest.clinicalApproved,false,module);
  for(const [path,hash] of Object.entries(sourceHashes)){
   const input=inputs.find((file:{path:string})=>file.path===path);
   if(module==='head-neck'||module==='shoulder')assert.equal(input?.sha256,hash,`${module}: ${path}`);
   else assert.equal(input,undefined,`${module}: unexpected ${path}`);
  }
  if(module!=='head-neck'&&module!=='shoulder')continue;
  learnerBundles.push(manifest.files.filter((file:{path:string})=>file.path.endsWith('.js')).map((file:{path:string;sha256:string})=>{
   const bytes=readFileSync(base+file.path);
   assert.equal(sha(bytes),file.sha256,`${module}: ${file.path}`);
   return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  }).join('\n'));
 }

 const compiled=await build({stdin:{contents:[
  "export {bodyLesson} from './atlas-review/app/body-content';",
  "export {orbitalSupportQuizLesson} from './atlas-review/lib/orbital-support-quiz';",
  "export {orbitalSupportQuizQuestions} from './atlas-review/content/orbital-support-quiz';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 assert.deepEqual(wire(api.orbitalSupportQuizQuestions),questions);
 for(const entry of pins.entries as Entry[]){
  const {identity,group}=entry,id=identity.id,q=questions[group];
  const lesson=api.orbitalSupportQuizLesson(identity,'quiz');
  assert(lesson,id);
  assert.equal(lesson.readiness,'draft',id);
  assert.deepEqual(api.bodyLesson(identity,'quiz'),lesson,id);
  assert.equal(lesson.body,q.body,id);
  assert.deepEqual(lesson.bullets,q.choices,id);
  assert.equal(new Set(lesson.bullets).size,4,id);
  assert.equal(lesson.bullets.filter((choice:string)=>choice===lesson.correctAnswer).length,1,id);
  assert.equal(lesson.correctAnswer,q.correctAnswer,id);
  assert.equal(lesson.explanation,q.explanation,id);
  assert.deepEqual(lesson.citations,q.references,id);
  assert.match(lesson.note,/revision-bound radiologist review pending/i,id);
  assert.match(lesson.note,/no patient|patient-space registration/i,id);
  for(const bundle of learnerBundles)for(const value of [lesson.body,...lesson.bullets,lesson.correctAnswer,lesson.explanation,...lesson.citations])
   assert(bundle.includes(value),`${id}: missing learner quiz text ${value}`);

  const packet=wire(await api.bodyReviewMaterial(id));
  assert(packet,id);
  assert.equal(packet.approval,false,id);
  assert.equal(packet.status,'worksheet-not-submitted',id);
  assert.deepEqual(packet.source.structure,identity,id);
  assert.deepEqual(packet.topics.find((topic:{tab:string})=>topic.tab==='quiz'),{tab:'quiz',...lesson},id);
  const context=await api.bodyReviewContext(id);
  assert(context,id);
  assert.equal(context.sourceHash,packet.fingerprints.source,id);
  assert.equal(context.teachingHash,packet.fingerprints.teaching,id);
  assert.equal(context.materialHash,packet.materialHash,id);
  assert.deepEqual(await api.parseBodyReviewResponse(packet,id),packet,id);
  for(const change of ['prior','question','answer','explanation','choice','source']){
   const altered=wire(packet),topic=altered.topics.find((item:{tab:string})=>item.tab==='quiz');
   if(change==='prior')Object.assign(topic,{...entry.previous,correctAnswer:undefined,explanation:undefined});
   if(change==='question')topic.body+=' foreign';
   if(change==='answer')topic.correctAnswer+=' foreign';
   if(change==='explanation')topic.explanation+=' foreign';
   if(change==='choice')topic.bullets[0]+=' foreign';
   if(change==='source')altered.source.structure.sources[0].sha256='0'.repeat(64);
   assert.equal(await api.parseBodyReviewResponse(altered,id),null,`${id}: forged ${change}`);
  }
  for(const change of [{id:id+'-foreign'},{fmaId:'FMA0'},{laterality:identity.laterality==='left'?'right':'left'},
   {sources:[{file:'FJ0',sha256:'0'.repeat(64)}]},{bounds:{...identity.bounds,min:[0,0,0]}}])
   assert.equal(api.orbitalSupportQuizLesson({...identity,...change},'quiz'),undefined,`${id}: foreign identity`);
  for(const tab of ['anatomy','function','ct','mri','xray','clinical'])
   assert.equal(api.orbitalSupportQuizLesson(identity,tab),undefined,`${id}: ${tab}`);
 }
});
