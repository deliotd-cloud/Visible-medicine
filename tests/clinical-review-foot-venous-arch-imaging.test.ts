import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';

const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const parent='408ba96866e3409d096b6153ccda81eaf162b02d';
const ids=[
 'vm:anatomy:body:foot:right:vessel:dorsal-venous-arch-of-right-foot',
 'vm:anatomy:body:foot:left:vessel:dorsal-venous-arch-of-left-foot',
];
const tabs=['ct','mri','ultrasound'];
const sourceHashes:Record<string,string>={
 'content/foot-venous-arch-imaging.ts':'986ae7e33081d36abcd5ad3dd3d846c9076c2d70202513e5b0d0318e6132c38b',
 'content/foot-venous-arch-imaging-pins.json':'0ece2e1bf4156a9440b494a62ec9b7a65a2ab02c035b1df86cd83faf449ee3e9',
 'lib/foot-venous-arch-imaging.ts':'8b5690d3d11095ada0ff1574697f7a2c7fdcc87cbec57497b4f58cfcefb24ce1',
};

test('both foot venous arches retain exact CT/MRI/ultrasound source, learner and protected Review evidence',async()=>{
 const review=json('atlas-review/manifest.json');
 const pins=json('atlas-review/content/foot-venous-arch-imaging-pins.json');
 assert.equal(review.revision,revision);
 assert.equal(pins.parentCommit,parent);
 assert.equal(pins.sourceVersion,'4.0');
 assert.equal(pins.license,'CC-BY-4.0');
 assert.equal(pins.previousAllLessonsAndRecipesHash,'6f58764de485672ba278a60473174b5d750378dd0f7f92d7c3df6e08fe981717');
 assert.deepEqual(pins.bundles.map((bundle:{id:string;bytes:number;sha256:string})=>[bundle.id,bundle.bytes,bundle.sha256]),[
  ['foot-vessels-foot-vascular',192916,'9e6d01cc92726aa2db728febcf52e0adfa0e6b9db9f58705f49b0653c8311881'],
 ]);
 assert.deepEqual(pins.entries.map((entry:{identity:{id:string;fmaId:string;laterality:string}})=>
  [entry.identity.id,entry.identity.fmaId,entry.identity.laterality]),[
  [ids[0],'FMA44881','right'],[ids[1],'FMA44882','left'],
 ]);
 for(const entry of pins.entries){
  const {identity,topics,previous}=entry;
  assert.equal(identity.bundle,'foot-vessels-foot-vascular');
  assert.equal(identity.region,'foot');
  assert.equal(identity.category,'vessel');
  assert.equal(identity.nodeName,identity.fmaId);
  assert.equal(identity.validation.status,'unvalidated');
  assert.equal(identity.validation.anatomicalReview,false);
  assert.deepEqual(topics,tabs);
  for(const tab of tabs)assert.equal(previous[tab].readiness,'pending',`${identity.id}: ${tab}`);
 }

 for(const [path,expected] of Object.entries(sourceHashes)){
  const record=review.files.find((file:{path:string})=>file.path===path);
  assert(record,`Review missing ${path}`);
  assert.equal(record.sourceSha256,expected,path);
  assert.equal(record.importedSha256,expected,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),expected,path);
 }
 const sourceModules=new Set(['head-neck','shoulder']);
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
   if(sourceModules.has(module))assert.equal(input?.sha256,expected,`${module}: ${path}`);
   else assert.equal(input,undefined,`${module}: unexpected ${path}`);
  }
  if(!sourceModules.has(module))continue;
  if(module==='head-neck')assert(manifest.regionalScopes.some((scope:{region:string;regionalIds:string[]})=>
   scope.region==='foot'&&ids.every(id=>scope.regionalIds.includes(id))));
  learnerBundles.push(manifest.files.filter((file:{path:string})=>file.path.endsWith('.js')).map((file:{path:string;sha256:string})=>{
   const bytes=readFileSync(base+file.path);
   assert.equal(sha(bytes),file.sha256,`${module}: ${file.path}`);
   return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  }).join('\n'));
 }

 const compiled=await build({stdin:{contents:[
  "export {bodyLesson} from './atlas-review/app/body-content';",
  "export {footVenousArchImagingLesson} from './atlas-review/lib/foot-venous-arch-imaging';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 for(const {identity} of pins.entries){
  const id=identity.id;
  const packet=wire(await api.bodyReviewMaterial(id));
  assert(packet,id);
  assert.equal(packet.approval,false,id);
  assert.equal(packet.status,'worksheet-not-submitted',id);
  assert.deepEqual(packet.source.structure,identity,id);
  assert.equal(packet.source.bundle.sha256,pins.bundles[0].sha256,id);
  const context=await api.bodyReviewContext(id);
  assert(context,id);
  assert.equal(context.structureId,id);
  assert.equal(context.sourceHash,packet.fingerprints.source);
  assert.equal(context.teachingHash,packet.fingerprints.teaching);
  assert.equal(context.materialHash,packet.materialHash);
  assert.equal(context.revisions.imaging,null);
  assert.deepEqual(await api.parseBodyReviewResponse(packet,id),packet);
  // The worksheet parser pins displayed fields. Save-time revision claims are
  // compared with a fresh server context by postBodyDecision before storage.
  for(const [change,claim] of [['material','materialHash'],['revision','revisionHash']] as const){
   const input={catalogScope:context.catalogScope,structureId:id,track:'teaching',
    expectedVersion:0,materialHash:context.materialHash,revisionHash:context.revisions.teaching,
    checklistVersion:context.checklistVersion,draft:{}};
   input[claim]='0'.repeat(64);
   const response=await api.postBodyDecision(new Request('https://review.test/api/body-review',{
    method:'POST',headers:{'oai-authenticated-user-id':'test-reviewer','origin':'https://review.test',
     'content-type':'application/json'},body:JSON.stringify(input)}),undefined);
   assert.equal(response.status,409,`${id}: changed ${change} claim`);
   assert.match((await response.json()).error,/material or checklist changed/i);
  }
  for(const tab of tabs){
   const lesson=api.footVenousArchImagingLesson(identity,tab);
   assert(lesson,`${id}: ${tab}`);
   assert.equal(lesson.readiness,'draft',`${id}: ${tab}`);
   assert.deepEqual(api.bodyLesson(identity,tab),lesson,`${id}: ${tab}`);
   assert.deepEqual(packet.topics.find((topic:{tab:string})=>topic.tab===tab),{tab,...lesson},`${id}: ${tab}`);
   assert.match(lesson.note,/radiologist review pending/i);
   assert.match(lesson.note,/No images or publisher text imported/i);
   assert.match(lesson.note,/No measured flow, normal calibre, diagnostic threshold, patient registration or clinical approval/i);
   for(const bundle of learnerBundles)for(const value of [lesson.body,...lesson.bullets,...lesson.citations])
    assert(bundle.includes(value),`${id}: ${tab}: missing learner text ${value}`);
   for(const change of ['pending','body','bullet','citation','source','identity']){
    const altered=wire(packet);
    const topic=altered.topics.find((item:{tab:string})=>item.tab===tab);
    if(change==='pending')topic.readiness='pending';
    if(change==='body')topic.body='Foreign teaching';
    if(change==='bullet')topic.bullets[0]='Foreign claim';
    if(change==='citation')topic.citations[0]='https://foreign.example/';
    if(change==='source')altered.source.structure.sources[0].sha256='0'.repeat(64);
    if(change==='identity')altered.source.structure.fmaId='FMA0';
    assert.equal(await api.parseBodyReviewResponse(altered,id),null,`${id}: ${tab}: ${change}`);
   }
  }
  for(const change of [{id:id+'-foreign'},{fmaId:'FMA0'},{bundle:'foreign'},
   {laterality:identity.laterality==='right'?'left':'right'},
   {sources:[{file:'FJ0',sha256:'0'.repeat(64)}]},
   {bounds:{...identity.bounds,min:[0,0,0]}}])
   for(const tab of tabs)assert.equal(api.footVenousArchImagingLesson({...identity,...change},tab),undefined,`${id}: ${tab}: foreign identity`);
  for(const tab of ['xray','clinical','pathology'])assert.equal(api.footVenousArchImagingLesson(identity,tab),undefined,`${id}: ${tab}`);
 }
});
