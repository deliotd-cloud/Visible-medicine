import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {checkedAtlasSourceRepo} from './atlas-source-repo.mjs';
import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';
import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const authoredRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const revision='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const baseline='97ae6cea1b580c88d8de9ae9d0270400acac1dac';
// SHA-256 of the three clean Atlas source files at revision.
const sourceHashes:Record<string,string>={
 'content/thoracoacromial-ultrasound-pins.json':'a3d09629a50539830f6291378bb4830e19cfaf5dab43963a948ea3d36c8eec36',
 'content/thoracoacromial-ultrasound.ts':'37217ae7f4739120c965f67c6ce1871ba24a5225d5a1ac6a022902e79c397344',
 'lib/thoracoacromial-ultrasound.ts':'dfdfb9e9ab81e8c40faf54ab7cba15ac452a87a2890dcc6ead3a8a9655347018',
};
const expected=[
 ['trunk','right','FMA66563','FJ2304','b82a47ccca2bb3affd63d8d1f86ad7c79a5a725bcbeb60a25711f1cd3275494e'],
 ['trunk','left','FMA66564','FJ2252','2ff1924941e505e62ac394bc8e8087f6903c7dba58826d87dd21cbc254e511c7'],
 ['acromial','right','FMA23068','FJ2263','d794a35d47638639cd793d357a99312850d6f7b27531cdc10b4b00817f35e170'],
 ['acromial','left','FMA23069','FJ2211','bd760839d0c3565e6d2bfe9d40e111116f7965e636053f213b0800b1ccb27537'],
 ['deltoid','right','FMA23072','FJ2282','c5d3cd8addb5e3355d853cd416a599e3a90e6c450adbe08c6aad1d28136dc761'],
 ['deltoid','left','FMA23073','FJ2230','cf6ccdb1b2c827dd096a04457aee6f55d2c95a3400f4dc6254c42fbfbd6bfcd1'],
] as const;
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
type Entry={family:string;identity:{id:string;fmaId:string;name:string;laterality:string;region:string;category:string;
 bundle:string;nodeName:string;sources:{file:string;sha256:string}[];bounds:{min:number[]};
 validation:{anatomicalReview:boolean}};previous:{readiness:string;body:string}};

test('six thoracoacromial ultrasound drafts bind exact learner and protected Review revisions',async()=>{
 const pin=validateCurrentAtlasDelivery();
 assert.equal(pin.source,CURRENT_ATLAS_REVISION);assert.equal(pin.runtimeSources.shoulder,revision);
 const sourceRoot=checkedAtlasSourceRepo(pin.source);
 const {exactSourceHistoryApi}=await import(pathToFileURL(sourceRoot+'/scripts/exact-source-history-api.mjs').href);
 const authored=await exactSourceHistoryApi(authoredRevision,'review-security'),bound=await boundLiveAtlasHistory(pin.source);
 const review=json('atlas-review/manifest.json');
 const pins=json('atlas-review/content/thoracoacromial-ultrasound-pins.json');
 const earlier=json('atlas-review/content/thoracoacromial-quiz-pins.json');
 const catalog=json('atlas-review/public/models/bodyparts3d/full-body/catalog.json');
 assert.equal(review.revision,pin.source);
 assert.equal(pins.baseline,baseline);
 assert.equal(pins.entries.length,6);
 assert.deepEqual(pins.bundles,earlier.bundles,'source bundle and geometry remain pinned');
 const entries:Entry[]=pins.entries;
 assert.deepEqual(entries.map(entry=>[
  entry.family,entry.identity.laterality,entry.identity.fmaId,
  entry.identity.sources[0]?.file,entry.identity.sources[0]?.sha256,
 ]),expected);
 assert.equal(new Set(entries.map(entry=>entry.identity.id)).size,6);
 for(const entry of entries){
  const {identity}=entry;
  assert.equal(identity.id,`vm:anatomy:body:shoulder-arm:${identity.laterality}:vessel:${entry.family==='trunk'?'trunk':entry.family+'-branch'}-of-${identity.laterality}-thoraco-acromial-artery`);
  assert.equal(identity.region,'shoulder-arm');
  assert.equal(identity.category,'vessel');
  assert.equal(identity.bundle,'shoulder-arm-vessels-inventory');
  assert.equal(identity.nodeName,identity.fmaId);
  assert.equal(identity.validation.anatomicalReview,false);
  assert.equal(entry.previous.readiness,'pending');
  assert.match(entry.previous.body,/No imaging study or validated modality-specific teaching material/);
  assert.deepEqual(identity,earlier.entries.find((old:{identity:{id:string}})=>old.identity.id===identity.id)?.identity,
   `${identity.id}: source identity or geometry differs from prior quiz pin`);
  assert.deepEqual(catalog.structures.filter((item:{id:string})=>item.id===identity.id),[identity]);
 }
 for(const [path,digest] of Object.entries(sourceHashes)){
  assert.equal(sha(execFileSync('git',['show',authoredRevision+':'+path],{cwd:sourceRoot,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}})),digest,'Exact authored source '+path);
  const imported=review.files.find((file:{path:string})=>file.path===path);
  assert(imported,path);
  assert.equal(imported.sourceSha256,digest,path);
  assert.equal(imported.importedSha256,digest,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),digest,path);
 }

 const learnerBundles:string[]=[];
 for(const module of ['head-neck','female-pelvis','lower-limb','shoulder']){
  const base=`public/atlas-runtime/${module}/`;
  const manifest=json(base+'manifest.json'),inputs=json(base+'source-inputs.json');
  assert.equal(manifest.sourceCommit,pin.runtimeSources[module],module);
  assert.equal(manifest.patientDataIncluded,false,module);
  assert.equal(manifest.clinicalApproved,false,module);
  for(const [path,digest] of Object.entries(sourceHashes)){
   const input=inputs.find((file:{path:string})=>file.path===path);
   if(module==='head-neck'||module==='shoulder')assert.equal(input?.sha256,digest,`${module}: ${path}`);
   else assert.equal(input,undefined,`${module}: unexpected ${path}`);
  }
  if(module!=='head-neck'&&module!=='shoulder')continue;
  if(module==='head-neck')assert(manifest.regionalScopes.some((scope:{region:string;regionalIds:string[]})=>
   scope.region==='shoulder-arm'&&entries.every(entry=>scope.regionalIds.includes(entry.identity.id))));
  learnerBundles.push(manifest.files.filter((file:{path:string})=>file.path.endsWith('.js')).map((file:{path:string;sha256:string})=>{
   const bytes=readFileSync(base+file.path);
   assert.equal(sha(bytes),file.sha256,`${module}: ${file.path}`);
   return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  }).join('\n'));
 }

 const compiled=await build({stdin:{contents:[
  "export {bodyLesson} from './atlas-review/app/body-content';",
  "export {thoracoacromialUltrasoundLesson} from './atlas-review/lib/thoracoacromial-ultrasound';",
  "export {thoracoacromialUltrasoundFacts,thoracoacromialUltrasoundLimitations,thoracoacromialUltrasoundReferences} from './atlas-review/content/thoracoacromial-ultrasound';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 assert.deepEqual(Object.keys(api.thoracoacromialUltrasoundFacts),['trunk','acromial','deltoid']);
 assert.deepEqual(api.thoracoacromialUltrasoundReferences,[
  'https://pmc.ncbi.nlm.nih.gov/articles/PMC9649491/',
  'https://pubmed.ncbi.nlm.nih.gov/9706673/',
  'https://pubmed.ncbi.nlm.nih.gov/15622236/',
  'https://pubmed.ncbi.nlm.nih.gov/24613440/',
 ]);
 for(const {identity,family,previous} of entries){
  const id=identity.id,lesson=api.thoracoacromialUltrasoundLesson(identity,'ultrasound');
  assert(lesson,id);
  assert.deepEqual(api.bodyLesson(identity,'ultrasound'),lesson,id);
  assert.equal(lesson.readiness,'draft');
  assert.equal(lesson.title,`${identity.name} · Ultrasound orientation · draft`);
  assert.equal(lesson.body,api.thoracoacromialUltrasoundFacts[family].body);
  assert.deepEqual(lesson.bullets,[api.thoracoacromialUltrasoundFacts[family].distinction,
   ...api.thoracoacromialUltrasoundLimitations]);
  assert.deepEqual(lesson.citations,api.thoracoacromialUltrasoundReferences);
  assert.match(lesson.note,/Revision-bound radiologist review pending/);
  assert.match(lesson.note,/No acquired scan, patient registration or clinical approval/);
  assert.match(lesson.note,/Atlas, imaging-case and lecture access remain independent/);
  assert.notEqual(lesson.body,previous.body);
  assert.match(lesson.bullets[1],/Routine live-ultrasound visibility.*not established/);
  assert.match(lesson.bullets[1],/pectoral-branch Doppler study cannot be extended/);
  assert.match(lesson.bullets[2],/static source anatomy, not an acquired ultrasound image/);
  for(const bundle of learnerBundles)for(const value of [lesson.body,...lesson.bullets,...lesson.citations,lesson.note])
   assert(bundle.includes(value),`${id}: learner missing ${value}`);

  const packet=wire(await api.bodyReviewMaterial(id));
  const context=await api.bodyReviewContext(id);
  assert(packet&&context,id);
  assert.equal(packet.approval,false);
  assert.equal(packet.status,'worksheet-not-submitted');
  assert.deepEqual(packet.source.structure,identity);
  assert.equal(packet.source.bundle.sha256,pins.bundles[0].sha256);
  assert.deepEqual(packet.topics.find((topic:{tab:string})=>topic.tab==='ultrasound'),{tab:'ultrasound',...lesson});
  const authoredPacket=wire(await authored.bodyReviewMaterial(id));assert.equal(authoredPacket.approval,false);assert.equal(authoredPacket.status,'worksheet-not-submitted');
  assert.deepEqual(authoredPacket.topics.find((topic:{tab:string})=>topic.tab==='ultrasound'),{tab:'ultrasound',...lesson},'Exact authored ultrasound topic');
  assert.deepEqual(packet,wire(await bound.bodyReviewMaterial(id)),'Whole current packet equals independent renderer-bound Atlas replay');
  for(const topic of packet.topics.filter((topic:{tab:string})=>topic.tab!=='ultrasound'))
   assert.deepEqual(topic,{tab:topic.tab,...api.bodyLesson(identity,topic.tab)},`${id}: unrelated ${topic.tab}`);
  assert.equal(context.structureId,id);
  assert.equal(context.materialHash,packet.materialHash);
  assert.equal(context.sourceHash,packet.fingerprints.source);
  assert.equal(context.teachingHash,packet.fingerprints.teaching);
  assert.equal(context.revisions.imaging,null);
  assert(context.blockers.imaging.some((blocker:string)=>/No validated acquired-image series or spatial registration/.test(blocker)),id);
  assert.deepEqual(await api.parseBodyReviewResponse(packet,id),packet);
  for(const change of ['prior','readiness','body','bullet','citation','source']){
   const bad=wire(packet),topic=bad.topics.find((item:{tab:string})=>item.tab==='ultrasound');
   if(change==='prior')bad.topics[bad.topics.indexOf(topic)]={tab:'ultrasound',...previous};
   if(change==='readiness')topic.readiness='pending';
   if(change==='body')topic.body+=' foreign';
   if(change==='bullet')topic.bullets[0]+=' foreign';
   if(change==='citation')topic.citations[0]+='?foreign=1';
   if(change==='source')bad.source.structure.sources[0].sha256='0'.repeat(64);
   assert.equal(await api.parseBodyReviewResponse(bad,id),null,`${id}: altered ${change}`);
  }
  for(const claim of ['materialHash','revisionHash'] as const){
   const input={catalogScope:context.catalogScope,structureId:id,track:'teaching',expectedVersion:0,
    materialHash:context.materialHash,revisionHash:context.revisions.teaching,
    checklistVersion:context.checklistVersion,draft:{}};
   input[claim]='0'.repeat(64);
   const response=await api.postBodyDecision(new Request('https://review.test/api/body-review',{
    method:'POST',headers:{'oai-authenticated-user-id':'test-reviewer','origin':'https://review.test',
     'content-type':'application/json'},body:JSON.stringify(input)}),undefined);
   assert.equal(response.status,409,`${id}: stale ${claim}`);
  }
  for(const patch of [{fmaId:'FMA0'},{name:'Foreign'},{sources:[...identity.sources,...identity.sources]},
   {bounds:{...identity.bounds,min:[0,0,0]}}])
   assert.equal(api.thoracoacromialUltrasoundLesson({...identity,...patch},'ultrasound'),undefined,id);
  for(const tab of ['ct','mri','xray','clinical','pathology','quiz'])
   assert.equal(api.thoracoacromialUltrasoundLesson(identity,tab),undefined,`${id}: ${tab}`);
 }
 for(const entry of earlier.entries.filter((entry:{identity:{id:string}})=>
  !entries.some(target=>target.identity.id===entry.identity.id)))
  assert.equal(api.thoracoacromialUltrasoundLesson(entry.identity,'ultrasound'),undefined,entry.identity.id);
});
