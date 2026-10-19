import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';

const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const baseline='4897aacb28b4d99d34b893493b8706ede54db970';
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
// Independently measured from `git show c4aa4ed6:<path>` in the clean Atlas source.
const sourceHashes:Record<string,string>={
 'content/elbow-arterial-ultrasound-pins.json':'2fefaad96bfca4a5dbcf404fc4e13f85e5f910e7f5935df245acec36883308b7',
 'content/elbow-arterial-ultrasound.ts':'0976d99d390b8b66cbe85f707a490b614bb097f2831520c5c131597bcedecf40',
 'lib/elbow-arterial-ultrasound.ts':'82db0a79f1c66be75795935bdc04606ac2f64806c43cd9abd86214067fad02e9',
};
const families={
 superiorUlnarCollateral:['FMA22707','FMA22708'],
 inferiorUlnarCollateral:['FMA22712','FMA22713'],
 posteriorUlnarRecurrent:['FMA22804','FMA22805'],
 radialRecurrent:['FMA22764','FMA22766'],
};
type Pin={family:string;identity:{id:string;fmaId:string;name:string;region:string;laterality:string;bundle:string;category:string;validation:{anatomicalReview:boolean};sources:{file:string;sha256:string}[];bounds:{min:number[]}};previous:{readiness:string;body:string}};
const priorBody='Structure-specific imaging teaching has not yet been authored and reviewed for this source selection. Clinical and Pathology notes are separate educational drafts, not validated modality lessons.';

test('eight exact-source elbow arterial US drafts bind learner runtimes and protected Review',async()=>{
 const review=json('atlas-review/manifest.json');
 const pins=json('atlas-review/content/elbow-arterial-ultrasound-pins.json');
 assert.equal(review.revision,revision);
 assert.equal(pins.baseline,baseline);
 assert.equal(pins.entries.length,8);
 const entries:Pin[]=Object.entries(families).flatMap(([family,fmas])=>fmas.map(fma=>{
  const matches:Pin[]=pins.entries.filter((entry:Pin)=>entry.family===family&&entry.identity.fmaId===fma);
  assert.equal(matches.length,1,`${family}: ${fma}`);
  return matches[0];
 }));
 assert.equal(new Set(entries.map(entry=>entry.identity.id)).size,8);
 for(const [family,fmas] of Object.entries(families)){
  const pair=entries.filter(entry=>entry.family===family);
  assert.deepEqual(pair.map(entry=>entry.identity.fmaId),fmas);
  assert.deepEqual(new Set(pair.map(entry=>entry.identity.laterality)),new Set(['right','left']));
 }
 const priorCt=json('atlas-review/content/elbow-arterial-ct-pins.json');
 for(const {identity,previous} of entries){
  assert.equal(identity.category,'vessel',identity.id);
  assert.equal(identity.bundle,'elbow-arteries',identity.id);
  assert.equal(identity.validation.anatomicalReview,false,identity.id);
  assert.equal(previous.readiness,'pending',identity.id);
  assert.equal(previous.body,priorBody,identity.id);
  const matchingCt=priorCt.entries.find((entry:{identity:{id:string}})=>entry.identity.id===identity.id);
  assert(matchingCt,`${identity.id}: missing unchanged CT source pin`);
  assert.deepEqual(identity,matchingCt.identity,`${identity.id}: source geometry or identity changed`);
 }
 for(const [path,expected] of Object.entries(sourceHashes)){
  const record=review.files.find((file:{path:string})=>file.path===path);
  assert(record,`Review missing ${path}`);
  assert.equal(record.sourceSha256,expected,path);
  assert.equal(record.importedSha256,expected,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),expected,path);
 }

 const learnerBundles:string[]=[];
 for(const module of ['head-neck','female-pelvis','lower-limb','shoulder']){
  const base=`public/atlas-runtime/${module}/`;
  const manifest=json(base+'manifest.json');
  const inputs=json(base+'source-inputs.json');
  assert.equal(manifest.sourceCommit,revision,module);
  assert.equal(manifest.patientDataIncluded,false,module);
  assert.equal(manifest.clinicalApproved,false,module);
  for(const [path,expected] of Object.entries(sourceHashes)){
   const input=inputs.find((file:{path:string})=>file.path===path);
   if(module==='head-neck'||module==='shoulder')assert.equal(input?.sha256,expected,`${module}: ${path}`);
   else assert.equal(input,undefined,`${module}: unexpected ${path}`);
  }
  if(module!=='head-neck'&&module!=='shoulder')continue;
  if(module==='head-neck')for(const region of ['shoulder-arm','forearm'])
   assert(manifest.regionalScopes.some((scope:{region:string;regionalIds:string[]})=>
    scope.region===region&&entries.filter(entry=>entry.identity.region===region)
     .every(entry=>scope.regionalIds.includes(entry.identity.id))),region);
  learnerBundles.push(manifest.files.filter((file:{path:string})=>file.path.endsWith('.js')).map((file:{path:string;sha256:string})=>{
   const bytes=readFileSync(base+file.path);
   assert.equal(sha(bytes),file.sha256,`${module}: ${file.path}`);
   return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  }).join('\n'));
 }

 const compiled=await build({stdin:{contents:[
  "export {bodyLesson} from './atlas-review/app/body-content';",
  "export {elbowArterialUltrasoundLesson} from './atlas-review/lib/elbow-arterial-ultrasound';",
  "export {elbowArterialUltrasoundTeaching,elbowArterialUltrasoundReferences,elbowArterialUltrasoundNote} from './atlas-review/content/elbow-arterial-ultrasound';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 assert.deepEqual(Object.keys(api.elbowArterialUltrasoundTeaching),Object.keys(families));
 for(const {identity,family,previous} of entries){
  const id=identity.id;
  const lesson=api.elbowArterialUltrasoundLesson(identity,'ultrasound');
  assert(lesson,id);
  assert.equal(lesson.readiness,'draft',id);
  assert.deepEqual(api.bodyLesson(identity,'ultrasound'),lesson,id);
  assert.equal(lesson.body,api.elbowArterialUltrasoundTeaching[family].body,id);
  assert.deepEqual(lesson.bullets,api.elbowArterialUltrasoundTeaching[family].bullets,id);
  assert.deepEqual(lesson.citations,api.elbowArterialUltrasoundTeaching[family].citations.map((key:string)=>api.elbowArterialUltrasoundReferences[key]),id);
  assert.equal(lesson.note,api.elbowArterialUltrasoundNote,id);
  assert.match(lesson.note,/revision-bound radiologist sign-off pending/i);
  assert.match(lesson.note,/No ultrasound images, Doppler data or patient-to-atlas registration/i);
  assert.notEqual(lesson.body,previous.body,id);
  for(const bundle of learnerBundles)for(const value of [lesson.body,...lesson.bullets,...lesson.citations])
   assert(bundle.includes(value),`${id}: missing learner text ${value}`);

  const packet=wire(await api.bodyReviewMaterial(id));
  assert(packet,id);
  assert.equal(packet.approval,false,id);
  assert.equal(packet.status,'worksheet-not-submitted',id);
  assert.deepEqual(packet.source.structure,identity,id);
  assert.equal(packet.source.bundle.sha256,pins.bundles.find((bundle:{id:string})=>bundle.id===identity.bundle)?.sha256,id);
  assert.deepEqual(packet.topics.find((topic:{tab:string})=>topic.tab==='ultrasound'),{tab:'ultrasound',...lesson},id);
  const context=await api.bodyReviewContext(id);
  assert(context,id);
  assert.equal(context.sourceHash,packet.fingerprints.source);
  assert.equal(context.teachingHash,packet.fingerprints.teaching);
  assert.equal(context.materialHash,packet.materialHash);
  assert.equal(context.revisions.imaging,null);
  assert(context.blockers.imaging.some((blocker:string)=>/No validated acquired-image series or spatial registration/.test(blocker)),id);
  assert.deepEqual(await api.parseBodyReviewResponse(packet,id),packet);
  for(const change of ['prior','readiness','body','bullet','citation','source']){
   const altered=wire(packet);
   const index=altered.topics.findIndex((item:{tab:string})=>item.tab==='ultrasound');
   const topic=altered.topics[index];
   if(change==='prior')altered.topics[index]={tab:'ultrasound',...previous};
   if(change==='readiness')topic.readiness='pending';
   if(change==='body')topic.body+=' foreign';
   if(change==='bullet')topic.bullets[0]+=' foreign';
   if(change==='citation')topic.citations[0]='https://foreign.example/';
   if(change==='source')altered.source.structure.sources[0].sha256='0'.repeat(64);
   assert.equal(await api.parseBodyReviewResponse(altered,id),null,`${id}: altered ${change}`);
  }
  for(const claim of ['materialHash','revisionHash'] as const){
   const input={catalogScope:context.catalogScope,structureId:id,track:'teaching',expectedVersion:0,
    materialHash:context.materialHash,revisionHash:context.revisions.teaching,
    checklistVersion:context.checklistVersion,draft:{}};
   input[claim]='0'.repeat(64);
   const response=await api.postBodyDecision(new Request('https://review.test/api/body-review',{
    method:'POST',headers:{'oai-authenticated-user-id':'test-reviewer','origin':'https://review.test',
     'content-type':'application/json'},body:JSON.stringify(input)}),undefined);
   assert.equal(response.status,409,`${id}: altered ${claim}`);
  }
  for(const change of [{id:id+'-foreign'},{fmaId:'FMA0'},{bundle:'foreign'},
   {sources:[{file:'FJ0',sha256:'0'.repeat(64)}]},
   {bounds:{...identity.bounds,min:[0,0,0]}}])
   assert.equal(api.elbowArterialUltrasoundLesson({...identity,...change},'ultrasound'),undefined,`${id}: foreign identity`);
  for(const tab of ['ct','mri','xray','clinical','pathology'])
   assert.equal(api.elbowArterialUltrasoundLesson(identity,tab),undefined,`${id}: ${tab}`);
 }
 for(const entry of priorCt.entries.filter((entry:{identity:{id:string}})=>
  !entries.some(target=>target.identity.id===entry.identity.id)))
  assert.equal(api.elbowArterialUltrasoundLesson(entry.identity,'ultrasound'),undefined,entry.identity.id);
});
