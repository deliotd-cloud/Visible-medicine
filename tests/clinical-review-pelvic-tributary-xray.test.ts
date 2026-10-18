import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {build} from 'esbuild';

const atlas=currentAtlasDeliveryRoot();
const baseline='af90b4afc38d4f18e0ab1d9ac9ef16277761b355';
const completedEpoch='9d0ca3557f2b9447055d37557dab1bfdf1a30639';
const liveCommit=CURRENT_ATLAS_REVISION;
const pinsPath='content/pelvic-venous-tour-pins.json';
const topicsPath='content/pelvic-tributary-xray.ts';
const helperPath='lib/pelvic-tributary-xray.ts';
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const sourcePaths=[pinsPath,topicsPath,helperPath,'app/body-content.ts'];
const expected=new Map<string,[string,string,string]>([
 ['FMA18904',['left','iliolumbar','FJ3510']],
 ['FMA18913',['left','inferior-gluteal','FJ3513']],
 ['FMA18916',['left','obturator','FJ3527']],
 ['FMA18910',['left','superior-gluteal','FJ3531']],
 ['FMA18903',['right','iliolumbar','FJ3603']],
 ['FMA18912',['right','inferior-gluteal','FJ3606']],
 ['FMA18918',['right','internal-pudendal','FJ3610']],
 ['FMA18906',['right','lateral-sacral','FJ3611']],
 ['FMA18915',['right','obturator','FJ3612']],
 ['FMA18909',['right','superior-gluteal','FJ3616']],
]);
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const git=(args:string[])=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:64e6,
 env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const committed=(revision:string,path:string)=>git(['show',`${revision}:${path}`]);
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));
const pathsWhere=(value:any,predicate:(part:any)=>boolean,path:(string|number)[]=[]):
 (string|number)[][]=>[
 ...(predicate(value)?[path]:[]),
 ...(value&&typeof value==='object'?Object.entries(value).flatMap(([key,child])=>
  pathsWhere(child,predicate,[...path,key])):[]),
];
const at=(value:any,path:(string|number)[])=>path.reduce((part,key)=>part[key],value);

async function importedApi(){
 const built=await build({stdin:{contents:[
  "export {pelvicTributaryXrayLesson} from './atlas-review/lib/pelvic-tributary-xray';",
  "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
  "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
  "export {structures} from './atlas-review/app/anatomy-data';",
  "export {dissectionProfiles} from './atlas-review/app/dissection-data';",
  "export {regionalTours} from './atlas-review/lib/regional-tours';",
  "export {contentTabs} from './atlas-review/lib/content-types';",
  "export * from './atlas-review/lib/body-review-material';",
  "export * from './atlas-review/lib/body-review-context';",
  "export * from './atlas-review/lib/body-review-response';",
  "export * from './atlas-review/lib/body-review-api';",
  "export * from './atlas-review/lib/body-review-decisions';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,
  platform:'node',format:'esm',metafile:true});
 for(const path of sourcePaths)assert(Object.keys(built.metafile.inputs).some(input=>
  input.replaceAll('\\','/').endsWith(path)),`Imported closure omits ${path}`);
 return import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
}

test('ten exact pelvic tributary X-ray drafts reach both learner modules and protected Review',
 {timeout:180000},async()=>{
 assert.equal(git(['rev-parse','HEAD']).toString().trim(),liveCommit);
 assert.equal(git(['merge-base',baseline,completedEpoch]).toString().trim(),baseline);
 assert.equal(git(['merge-base',completedEpoch,liveCommit]).toString().trim(),completedEpoch);
 for(const path of [topicsPath,helperPath])assert.deepEqual(committed(liveCommit,path),committed(completedEpoch,path),
  `${path}: exact authored bytes retained`);
 assert.deepEqual(committed(liveCommit,pinsPath),committed(baseline,pinsPath),'Canonical tour pins unchanged');
 assert.deepEqual(committed(liveCommit,catalogPath),committed(baseline,catalogPath),'Geometry catalogue unchanged');
 const review=json('atlas-review/manifest.json');assert.equal(review.revision,liveCommit);
 const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
 assert.equal(viewer.sourceCommit,liveCommit);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 assert.equal(viewer.personalRecordsIncluded,false);
 const learners=['head-neck','shoulder','lower-limb','female-pelvis'].map(name=>({
  name,base:`public/atlas-runtime/${name}/`,manifest:json(`public/atlas-runtime/${name}/manifest.json`),
 }));
 for(const {name,manifest} of learners){
  assert.equal(manifest.sourceCommit,liveCommit,name);
  assert.equal(manifest.patientDataIncluded,false,name);
  assert.equal(manifest.clinicalApproved,false,name);
 }
 for(const path of sourcePaths){
  const digest=sha(committed(liveCommit,path));
  const record=review.files.find((file:{path:string})=>file.path===path);assert(record,path);
  assert.equal(record.sourceSha256,digest,path);
  assert.equal(record.importedSha256,digest,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),digest,path);
  assert.equal(sha(readFileSync(atlas+'/'+path)),digest,path);
  for(const {name,base} of learners){
   const input=json(base+'source-inputs.json').find((file:{path:string})=>file.path===path);
   if(name==='head-neck'||name==='shoulder')assert.equal(input?.sha256,digest,`${name}: ${path}`);
   else assert.equal(input,undefined,`${name}: independent closure`);
  }
  for(const base of ['public/atlas-review/',viewerBase,...learners.map(item=>item.base)])
   assert.equal(existsSync(base+path),false,`${base+path}: raw source exposed`);
 }
 for(const {name,base,manifest} of learners.filter(item=>
  item.name==='lower-limb'||item.name==='female-pelvis')){
  for(const input of json(base+'source-inputs.json'))
   assert.equal(input.sha256,sha(committed(liveCommit,input.path)),`${name}: current clean source ${input.path}`);
  for(const file of manifest.files.filter((item:{path:string})=>item.path.startsWith('models/'))){
   assert.equal(file.sha256,sha(readFileSync(base+file.path)),`${name}: delivered model`);
   assert.equal(file.sha256,sha(committed(baseline,'public/'+file.path)),`${name}: original model`);
  }
 }
 const pins=json('atlas-review/'+pinsPath);
 assert.equal(pins.baseline,'b3a9ff28f407437a85b9c56278bd31944ba4033e');
 assert.equal(pins.tourRevision,'pelvic-venous-tour-20261010-r1');
 assert.equal(pins.entries.length,10,'Ten direct pins, without identity wrappers');
 assert.deepEqual(new Set(pins.entries.map((entry:any)=>entry.fmaId)),new Set(expected.keys()));
 const api=await importedApi(),catalog=api.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
 assert.equal(catalog.structures.length,1104);
 assert(!catalog.structures.some((s:{fmaId:string})=>['FMA18919','FMA18907'].includes(s.fmaId)));
 const emitted=learners.filter(item=>item.name==='head-neck'||item.name==='shoulder')
  .map(item=>emittedTeaching(item.base,item.manifest.files,true));
 const selected=new Set<string>();
 for(const identity of pins.entries){
  const [side,group,file]=expected.get(identity.fmaId)!;selected.add(identity.id);
  assert.equal(identity.id,`vm:anatomy:body:pelvis:${side}:vessel:${side}-${group}-vein`);
  assert.equal(identity.laterality,side);assert.equal(identity.region,'pelvis');
  assert.equal(identity.system,'vessels');assert.equal(identity.category,'vessel');
  assert.equal(identity.bundle,'pelvic-veins');assert.equal(identity.sourceTree,'isa');
  assert.deepEqual(identity.sources.map((source:{file:string})=>source.file),[file]);
  assert.equal(identity.validation.status,'unvalidated');
  assert.equal(identity.validation.anatomicalReview,false);
  assert.deepEqual(catalog.structures.find((s:{id:string})=>s.id===identity.id),identity);
  const lesson=api.pelvicTributaryXrayLesson(identity,'xray');assert(lesson);
  assert.deepEqual(api.bodyLesson(identity,'xray'),lesson);
  const {readiness,...content}=lesson;
  assert.equal(readiness,'draft');assert.deepEqual(api.bodyContent(identity,'xray'),content);
  assert(lesson.citations.length>0 && lesson.citations.every((url:string)=>/^https:\/\//.test(url)));
  assert.equal(new Set(lesson.citations).size,lesson.citations.length);
  const text=[lesson.body,...lesson.bullets,lesson.note].join(' ');
  for(const phrase of [/contrast X-ray venography/,/routine plain pelvic radiograph/,
   /CT venography \(CTV\), MR venography \(MRV\).*IVUS/,
   /actual examination side and projection/,/projected crossing does not establish a venous junction/,
   /No acquired venogram, complete connected lumen/,/exact source and teaching revision/,
   /Atlas, imaging-case and paid-lecture access remain independent/])assert.match(text,phrase);
  if(group==='superior-gluteal')assert.match(text,/short supplied superior gluteal surface/);
  if(group==='internal-pudendal'||group==='lateral-sacral')assert.match(text,/left-labelled candidate remains held/);
  assert.doesNotMatch(text,/approved for clinical use|registered to a patient/i);
  for(const code of emitted){
   for(const value of [lesson.body,...lesson.citations,lesson.note,
    ...lesson.bullets.filter((bullet:string)=>!bullet.startsWith('The '+side+' model label'))])
    assert(visible(code,value),`${identity.id}: emitted teaching`);
   assert(visible(code,' model label is not an acquired side marker.'),
    `${identity.id}: emitted side-marker instruction`);
  }
  const clean=wire(lesson);lesson.bullets.push('foreign');lesson.citations.push('https://foreign.example');
  assert.deepEqual(api.pelvicTributaryXrayLesson(identity,'xray'),clean,'Fresh detached lesson');
  for(const path of pathsWhere(identity,value=>value===null||typeof value!=='object')){
   const bad=wire(identity),parent=at(bad,path.slice(0,-1)),key=path.at(-1)!;
   const original=parent[key];parent[key]=typeof original==='string'?original+'-foreign'
    :typeof original==='number'?original+0.01:original===null?'foreign':!original;
   assert.equal(api.pelvicTributaryXrayLesson(bad,'xray'),undefined,`${identity.id}:${path.join('.')}`);
  }
  for(const path of pathsWhere(identity,Array.isArray)){
   const bad=wire(identity);at(bad,path).push('foreign');
   assert.equal(api.pelvicTributaryXrayLesson(bad,'xray'),undefined,`${identity.id}:${path.join('.')}`);
  }
  for(const path of pathsWhere(identity,value=>value&&typeof value==='object'&&!Array.isArray(value))){
   const bad=wire(identity);at(bad,path).unexpected=true;
   assert.equal(api.pelvicTributaryXrayLesson(bad,'xray'),undefined,`${identity.id}:${path.join('.')}`);
   for(const key of Object.keys(at(identity,path))){
    const omitted=wire(identity);delete at(omitted,path)[key];
    assert.equal(api.pelvicTributaryXrayLesson(omitted,'xray'),undefined,
     `${identity.id}:${[...path,key].join('.')} omitted`);
   }
  }
  assert.equal(api.pelvicTributaryXrayLesson({id:identity.id},'xray'),undefined);
 }
 assert.equal(selected.size,10);
 for(const structure of catalog.structures)if(!selected.has(structure.id))
  assert.equal(api.pelvicTributaryXrayLesson(structure,'xray'),undefined);
});

test('immutable 9,936 placement and 1,104 packet transition matches every current imported result',
 {timeout:300000},async()=>{
 const current=await importedApi(),live=await boundLiveAtlasHistory(liveCommit);
 const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
 const old=await exactSourceHistoryApi(baseline,'review-security');
 const feature=await exactSourceHistoryApi(completedEpoch,'review-security');
 const catalog=current.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
 assert.deepEqual(catalog,live.bodyDisplayCatalog(json('atlas-review/'+catalogPath)));
 assert.deepEqual(catalog,old.bodyDisplayCatalog(JSON.parse(committed(baseline,catalogPath).toString())));
 assert.deepEqual(current.structures,live.structures);assert.deepEqual(live.structures,old.structures);
 assert.deepEqual(current.dissectionProfiles,live.dissectionProfiles);
 assert.deepEqual(live.dissectionProfiles,old.dissectionProfiles);
 assert.deepEqual(current.regionalTours,live.regionalTours);
 assert.deepEqual(feature.regionalTours,old.regionalTours,'historical pelvic X-ray leaves tours unchanged');
 assert.deepEqual(current.contentTabs,live.contentTabs);assert.deepEqual(live.contentTabs,old.contentTabs);
 assert.equal(current.contentTabs.length,9);
 const ids=new Set<string>(json('atlas-review/'+pinsPath).entries.map((entry:any)=>entry.id));
 assert.equal(ids.size,10);
 let placements=0,changed=0,packets=0,changedPackets=0,storageCalls=0;
 const storage={prepare(){storageCalls++;throw Error('Rejected request reached synthetic storage');}};
 const request=(value:any)=>new Request('https://review.test/api/body-decisions',{
  method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
   'oai-authenticated-user-id':'SYNTHETIC_PELVIC_TRIBUTARY_REVIEWER'},body:JSON.stringify(value),
 });
 for(const structure of catalog.structures){
  for(const tab of current.contentTabs){
   const before=old.bodyLesson(structure,tab),historical=feature.bodyLesson(structure,tab);
   const after=live.bodyLesson(structure,tab),imported=current.bodyLesson(structure,tab);
   assert.deepEqual(imported,after,`${structure.id}:${tab}: imported versus exact current source`);
   placements++;
   if(!ids.has(structure.id)||tab!=='xray'){
    assert.deepEqual(historical,before,`${structure.id}:${tab}: immutable placement preserved`);
    assert.equal(current.pelvicTributaryXrayLesson(structure,tab),undefined);
   }else{
    changed++;assert.equal(before.readiness,'pending');assert.equal(historical.readiness,'draft');
    assert.deepEqual(after,historical,`${structure.id}:${tab}: selected teaching retained`);
    assert.deepEqual(after,current.pelvicTributaryXrayLesson(structure,tab));
   }
  }
  const before=wire(await old.bodyReviewMaterial(structure.id));
  const historical=wire(await feature.bodyReviewMaterial(structure.id));
  const after=wire(await live.bodyReviewMaterial(structure.id));
  assert(before&&historical&&after,structure.id);packets++;
  assert.deepEqual(wire(await current.bodyReviewMaterial(structure.id)),after,
   `${structure.id}: complete imported/source Review packet`);
  assert.equal(after.approval,false);assert.equal(after.status,'worksheet-not-submitted');
  if(!ids.has(structure.id)){
   assert.deepEqual(historical,before,`${structure.id}: immutable packet preserved`);
   continue;
  }
  changedPackets++;
  assert.deepEqual(after.topics.find((row:any)=>row.tab==='xray'),historical.topics.find((row:any)=>row.tab==='xray'),`${structure.id}: selected teaching retained`);
  assert.deepEqual(await current.parseBodyReviewResponse(after,structure.id),after);
  assert.equal(await current.parseBodyReviewResponse(before,structure.id),null);
  for(const key of ['source','reasoning','guidedTours','checklist','atlasLink','limits'])
   assert.deepEqual(historical[key],before[key],`${structure.id}: historical ${key}`);
  assert.deepEqual(historical.topics.filter((row:any)=>row.tab!=='xray'),
   before.topics.filter((row:any)=>row.tab!=='xray'));
  assert.deepEqual(after.topics.find((row:any)=>row.tab==='xray'),
   {tab:'xray',...live.bodyLesson(structure,'xray')});
  assert.equal(historical.fingerprints.source,before.fingerprints.source);
  assert.notEqual(historical.fingerprints.teaching,before.fingerprints.teaching);
  assert.notEqual(historical.materialHash,before.materialHash);
  assert.deepEqual(await live.parseBodyReviewResponse(after,structure.id),after);
  assert.equal(await live.parseBodyReviewResponse(before,structure.id),null);
  for(const mutate of [
   (bad:any)=>{bad.topics.find((row:any)=>row.tab==='xray').body+=' forged';},
   (bad:any)=>{bad.topics.find((row:any)=>row.tab==='xray').citations[0]='https://forged.example';},
   (bad:any)=>{bad.topics.find((row:any)=>row.tab==='xray').readiness='approved';},
   (bad:any)=>{bad.source.structure.sources[0].sha256='0'.repeat(64);},
  ]){const forged=wire(after);mutate(forged);
   assert.equal(await current.parseBodyReviewResponse(forged,structure.id),null);
   assert.equal(await live.parseBodyReviewResponse(forged,structure.id),null);
  }
  const previousContext=await old.bodyReviewContext(structure.id);
  const context=await live.bodyReviewContext(structure.id);
  const historicalContext=await feature.bodyReviewContext(structure.id);
  assert.equal(historicalContext.sourceHash,previousContext.sourceHash);
  assert.notEqual(historicalContext.revisions.teaching,previousContext.revisions.teaching);
  assert.equal(context.rendererHash,json('atlas-review/content/body-renderer-revision.json').sha256);
  assert.equal(context.revisions.geometry,sha(JSON.stringify({catalogScope:context.catalogScope,
   structureId:structure.id,checklistVersion:context.checklistVersion,source:context.sourceHash,
   renderer:context.rendererHash,checks:context.checklists.geometry})));
  assert.deepEqual(await current.bodyReviewContext(structure.id),context);
  assert.equal(context.sourceHash,previousContext.sourceHash);
  assert.notEqual(context.revisions.teaching,previousContext.revisions.teaching);
  assert.equal(context.revisions.imaging,null);
  assert(context.teachingTabs.includes('xray'));
  assert.equal(current.bodyReviewStale({catalogScope:context.catalogScope,
   structureId:structure.id,checklistVersion:context.checklistVersion,
   revisionHash:previousContext.revisions.teaching,track:'teaching'},context),true);
  const decision={catalogScope:context.catalogScope,structureId:structure.id,
   track:'teaching',expectedVersion:0,materialHash:context.materialHash,
   revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
   draft:current.blankBodyReview(context,'teaching')};
  for(const patch of [{materialHash:previousContext.materialHash},
   {revisionHash:previousContext.revisions.teaching},
   {materialHash:previousContext.materialHash,revisionHash:previousContext.revisions.teaching}])
   assert.equal((await current.postBodyDecision(request({...decision,...patch}),storage)).status,409);
  const forged=wire(decision);forged.draft.checks.foreign=true;
  assert.equal((await current.postBodyDecision(request(forged),storage)).status,422);
  const approval=wire(decision);approval.draft.status='approved';
  assert.equal((await current.postBodyDecision(request(approval),storage)).status,422);
 }
 assert.deepEqual({placements,changed,preserved:placements-changed,packets,changedPackets,
  preservedPackets:packets-changedPackets,storageCalls},
  {placements:9936,changed:10,preserved:9926,packets:1104,changedPackets:10,
   preservedPackets:1094,storageCalls:0});
});
