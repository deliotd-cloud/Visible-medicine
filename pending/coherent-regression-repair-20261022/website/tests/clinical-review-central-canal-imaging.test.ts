import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';
import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const parent='54afec873f51042f93df97dce6f8a35ab28b8ebe';
const id='vm:anatomy:body:spine:midline:space:central-canal-of-spinal-cord';
const sourceHashes:Record<string,string>={
 'content/central-canal-imaging.ts':'8ab8ab2d152962c4d18b8da4717f66ac81a24df437d0b5a9c90fdebb8a77992c',
 'content/central-canal-imaging-pins.json':'7a09e0d063aa41705236470a77767d8075962cc2a5ae9619c93e6ad1adc89fb8',
 'lib/central-canal-imaging.ts':'27674250c49916a39e4a5762eac5828e0640f4a68ce1905c07bfe9f521eb34c3',
};

test('central canal CT/MRI/ultrasound drafts retain exact source, learner and protected Review evidence',async()=>{
 const review=json('atlas-review/manifest.json');
 const deliveryPin=validateCurrentAtlasDelivery(),sourceRoot=currentAtlasDeliveryRoot();
 assert.equal(review.revision,deliveryPin.source,'Review remains bound to current Atlas source');
 const pins=json('atlas-review/content/central-canal-imaging-pins.json');
 assert.match(review.revision,/^[a-f0-9]{40}$/);
 assert.notEqual(review.revision,parent);
 assert.equal(pins.parentCommit,parent);
 assert.equal(pins.sourceVersion,'4.0');
 assert.equal(pins.license,'CC-BY-4.0');
 assert.equal(pins.previousAllLessonsAndRecipesHash,'471e884a3af19fed9be3226e0bd57249b0b5b5b30603d3572aacfe3a670181f1');
 assert.deepEqual(pins.bundles.map((bundle:{id:string;bytes:number;sha256:string})=>[bundle.id,bundle.bytes,bundle.sha256]),[
  ['spine-nerves',14420,'e88d03a126729c550c2aa9524eb3c466dc222cf874a327ec2d97432e97c8814d'],
 ]);
 assert.equal(pins.entries.length,1);
 const {identity,topics,previous}=pins.entries[0];
 assert.equal(identity.id,id);
 assert.equal(identity.fmaId,'FMA78497');
 assert.equal(identity.bundle,'spine-nerves');
 assert.equal(identity.region,'spine');
 assert.equal(identity.laterality,'midline');
 assert.deepEqual(identity.sources,[{file:'FJ1737',sha256:'11380059bd0dd04099465800f850d5520c0f6ed911c97cd00262840e20f3825b'}]);
 assert.equal(identity.validation.status,'unvalidated');
 assert.equal(identity.validation.anatomicalReview,false);
 assert.deepEqual(topics,['ct','mri','ultrasound']);
 for(const tab of topics)assert.equal(previous[tab].readiness,'pending',tab);

 for(const [path,expected] of Object.entries(sourceHashes)){
  const record=review.files.find((file:{path:string})=>file.path===path);
  assert(record,`Review missing ${path}`);
  assert.equal(record.sourceSha256,expected,path);
  assert.equal(record.importedSha256,expected,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),expected,path);
 }
 const regionalModules=new Set(['head-neck','shoulder']);
 const learnerBundles:string[]=[];
 for(const module of ['head-neck','female-pelvis','lower-limb','shoulder']){
  const base=`public/atlas-runtime/${module}/`;
  const manifest=json(base+'manifest.json');
  const inputs=json(base+'source-inputs.json');
  assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[module],module);
  assert.equal(manifest.patientDataIncluded,false,module);
  assert.equal(manifest.clinicalApproved,false,module);
  for(const [path,expected] of Object.entries(sourceHashes)){
   const input=inputs.find((file:{path:string})=>file.path===path);
   if(regionalModules.has(module)){
    const familyBytes=execFileSync('git',['--no-replace-objects','-C',sourceRoot,'show',
     `${deliveryPin.runtimeSources[module]}:${path}`],{windowsHide:true,maxBuffer:32e6});
    assert.equal(sha(familyBytes),expected,`${module}: exact committed family source ${path}`);
    assert.equal(input?.sha256,expected,`${module}: ${path}`);
   }
   else assert.equal(input,undefined,`${module}: unexpected ${path}`);
  }
  if(!regionalModules.has(module))continue;
  if(module==='head-neck')assert(manifest.regionalScopes.some((scope:{region:string;regionalIds:string[]})=>scope.region==='spine'&&scope.regionalIds.includes(id)));
  learnerBundles.push(manifest.files.filter((file:{path:string})=>file.path.endsWith('.js')).map((file:{path:string;sha256:string})=>{
   const bytes=readFileSync(base+file.path);
   assert.equal(sha(bytes),file.sha256,`${module}: ${file.path}`);
   return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  }).join('\n'));
 }

 const compiled=await build({stdin:{contents:[
  "export {bodyLesson} from './atlas-review/app/body-content';",
  "export {centralCanalImagingLesson} from './atlas-review/lib/central-canal-imaging';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const packet=wire(await api.bodyReviewMaterial(id));
 assert(packet);
 assert.equal(packet.approval,false);
 assert.equal(packet.status,'worksheet-not-submitted');
 assert.deepEqual(packet.source.structure,identity);
 const context=await api.bodyReviewContext(id);
 assert(context);
 assert.equal(context.structureId,id);
 assert.equal(context.sourceHash,packet.fingerprints.source);
 assert.equal(context.teachingHash,packet.fingerprints.teaching);
 assert.equal(context.revisions.imaging,null);
 assert.deepEqual(await api.parseBodyReviewResponse(packet,id),packet);

 for(const tab of topics){
  const lesson=api.centralCanalImagingLesson(identity,tab);
  assert(lesson,tab);
  assert.equal(lesson.readiness,'draft',tab);
  assert.deepEqual(api.bodyLesson(identity,tab),lesson,tab);
  assert.deepEqual(packet.topics.find((topic:{tab:string})=>topic.tab===tab),{tab,...lesson},tab);
  assert.match(lesson.note,/radiologist review pending/i);
  assert.match(lesson.note,/No images or publisher text imported/i);
  assert.match(lesson.note,/No measured flow, patient registration, diagnostic threshold or clinical approval/i);
  for(const bundle of learnerBundles)for(const value of [lesson.body,...lesson.bullets,...lesson.citations])
   assert(bundle.includes(value),`${tab}: missing learner text ${value}`);
  for(const change of ['pending','body','bullet','citation','source','identity']){
   const altered=wire(packet);
   const topic=altered.topics.find((item:{tab:string})=>item.tab===tab);
   if(change==='pending')topic.readiness='pending';
   if(change==='body')topic.body='Foreign teaching';
   if(change==='bullet')topic.bullets[0]='Foreign claim';
   if(change==='citation')topic.citations[0]='https://foreign.example/';
   if(change==='source')altered.source.structure.sources[0].sha256='0'.repeat(64);
   if(change==='identity')altered.source.structure.fmaId='FMA0';
   assert.equal(await api.parseBodyReviewResponse(altered,id),null,`${tab}: ${change}`);
  }
  for(const change of [{id:id+'-foreign'},{fmaId:'FMA0'},{bundle:'foreign'},{laterality:'left'},
   {sources:[{file:'FJ1737',sha256:'0'.repeat(64)}]}])
   assert.equal(api.centralCanalImagingLesson({...identity,...change},tab),undefined,`${tab}: foreign identity`);
 }
 for(const tab of ['xray','clinical','pathology'])assert.equal(api.centralCanalImagingLesson(identity,tab),undefined,tab);
});
