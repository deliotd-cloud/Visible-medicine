import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';

const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
// Independently measured from `git show d944f63:<path>` in the clean Atlas source.
const sourceHashes:Record<string,string>={
 'content/longus-colli-quiz.ts':'62da8e806aae6846f78b3ade3f3385b6db661a8a578fcd0d225545fb7726836d',
 'lib/longus-colli.ts':'1983d9be0bbdcf897ec1cf466e2f93f9307cd1bda7393bd0f33776edf0eb848f',
};
const expected:Record<string,{answer:string;anatomy:string}>={
 FMA46284:{answer:'C1 anterior tubercle',anatomy:'The superior oblique part classically ascends from anterior transverse-process tubercles at C3–C5 towards the anterior atlas tubercle.'},
 FMA46286:{answer:'C2–C4',anatomy:'The vertical part classically spans the front of the lower cervical and upper thoracic vertebral bodies (C5–T3) towards C2–C4.'},
 FMA46288:{answer:'C5–C6 anterior transverse tubercles',anatomy:'The inferior oblique part classically ascends from the T1–T3 vertebral bodies towards the anterior transverse-process tubercles at C5–C6.'},
};
const priorFunction='Longus colli contributes to cervical flexion and unilateral lateral bending. These are actions of the muscle group, not measured motion of this isolated source part.';
type Identity={id:string;fmaId:string;name:string;laterality:string;category:string;bundle:string;sources:{file:string;sha256:string}[];bounds:{min:number[]}};

test('three supplied left longus colli attachment quizzes bind learner runtimes and protected Review',async()=>{
 const review=json('atlas-review/manifest.json');
 const source=json('atlas-review/public/models/bodyparts3d/longus-colli/catalog.json');
 assert.equal(review.revision,revision);
 const identities:Identity[]=source.structures;
 assert.equal(identities.length,3);
 assert.deepEqual(identities.map(identity=>identity.fmaId).sort(),Object.keys(expected).sort());
 assert.equal(new Set(identities.map(identity=>identity.id)).size,3);
 for(const identity of identities){
  assert.equal(identity.laterality,'left',identity.id);
  assert.equal(identity.category,'muscle',identity.id);
  assert.equal(identity.bundle,'longus-colli',identity.id);
  assert.match(identity.id,/head-neck:left:muscle:/);
 }
 for(const [path,hash] of Object.entries(sourceHashes)){
  const file=review.files.find((item:{path:string})=>item.path===path);
  assert(file,`Review missing ${path}`);
  assert.equal(file.sourceSha256,hash,path);
  assert.equal(file.importedSha256,hash,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),hash,path);
 }

 const learnerBundles:string[]=[];
 for(const module of ['head-neck','female-pelvis','lower-limb','shoulder']){
  const base=`public/atlas-runtime/${module}/`;
  const manifest=json(base+'manifest.json');
  const inputs=json(base+'source-inputs.json');
  assert.equal(manifest.sourceCommit,revision,module);
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
  "export {longusColliQuizLesson,longusColliLesson} from './atlas-review/lib/longus-colli';",
  "export {longusColliQuizQuestions} from './atlas-review/content/longus-colli-quiz';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 assert.deepEqual(Object.keys(api.longusColliQuizQuestions).sort(),Object.keys(expected).sort());
 for(const identity of identities){
  const id=identity.id;
  const question=api.longusColliQuizQuestions[identity.fmaId];
  assert.equal(question.choices.length,4,id);
  assert.equal(new Set(question.choices).size,4,id);
  assert.equal(question.choices.filter((choice:string)=>choice===question.correctAnswer).length,1,id);
  assert.equal(question.correctAnswer,expected[identity.fmaId].answer,id);
  assert(question.references.some((url:string)=>url.includes('luc.edu')),id);
  const lesson=api.longusColliQuizLesson(identity,'quiz');
  assert(lesson,id);
  assert.equal(lesson.readiness,'draft',id);
  assert.deepEqual(api.bodyLesson(identity,'quiz'),lesson,id);
  assert.equal(lesson.body,question.body,id);
  assert.deepEqual(lesson.bullets,question.choices,id);
  assert.equal(lesson.correctAnswer,expected[identity.fmaId].answer,id);
  assert.equal(lesson.explanation,question.explanation,id);
  assert.deepEqual(lesson.citations,question.references,id);
  assert.match(lesson.note,/review pending/i);
  assert.match(lesson.note,/no mirrored anatomy or patient registration/i);
  assert.equal(api.bodyLesson(identity,'anatomy').body,expected[identity.fmaId].anatomy,id);
  assert.equal(api.bodyLesson(identity,'function').body,priorFunction,id);
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
  for(const change of ['question','answer','explanation','choice','source']){
   const altered=wire(packet);
   const topic=altered.topics.find((item:{tab:string})=>item.tab==='quiz');
   if(change==='question')topic.body+=' foreign';
   if(change==='answer')topic.correctAnswer+=' foreign';
   if(change==='explanation')topic.explanation+=' foreign';
   if(change==='choice')topic.bullets[0]+=' foreign';
   if(change==='source')altered.source.structure.sources[0].sha256='0'.repeat(64);
   assert.equal(await api.parseBodyReviewResponse(altered,id),null,`${id}: forged ${change}`);
  }
  for(const change of [{id:id+'-foreign'},{fmaId:'FMA0'},{laterality:'right'},
   {sources:[{file:'FJ0',sha256:'0'.repeat(64)}]},{bounds:{...identity.bounds,min:[0,0,0]}}])
   assert.equal(api.longusColliQuizLesson({...identity,...change},'quiz'),undefined,`${id}: foreign identity`);
  for(const tab of ['anatomy','function','ct','mri','xray','clinical'])
   assert.equal(api.longusColliQuizLesson(identity,tab),undefined,`${id}: ${tab}`);
 }
});
