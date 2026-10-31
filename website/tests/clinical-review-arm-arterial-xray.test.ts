import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {build} from 'esbuild';

const atlas=currentAtlasDeliveryRoot();
const baseline='89a22c1b71e1904dedb4f161398b07cec64d8624';
const completedEpoch='325fc6aa50c4221691a1ee87de0d0ca91264ff04';
const playbackEpoch='c978ecee3bdddfeaf2995ecbf62d5178e719c4fb';
const liveCommit=CURRENT_ATLAS_REVISION;
const pinsPaths=['content/shoulder-arm-artery-quiz-pins.json','content/elbow-arterial-ct-pins.json'];
const topicsPath='content/arm-arterial-xray.ts';
const helperPath='lib/arm-arterial-xray.ts';
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const sourcePaths=[...pinsPaths,topicsPath,helperPath,'app/body-content.ts',
 'content/regional-teaching/shoulder-arm.json'];
// Independent source identities and families; do not derive expected values from production helpers.
const expected=new Map<string,[string,string,string,string,string]>([
 ['FMA22655',['axillary','right','right-axillary-artery','shoulder-arm-vessels-recovery','FJ2268']],
 ['FMA22656',['axillary','left','left-axillary-artery','shoulder-arm-vessels-recovery','FJ2216']],
 ['FMA22691',['brachial','right','right-brachial-artery','shoulder-arm-vessels-recovery','FJ2271']],
 ['FMA22692',['brachial','left','left-brachial-artery','shoulder-arm-vessels-recovery','FJ2219']],
 ['FMA22696',['deepBrachial','right','right-deep-brachial-artery','shoulder-arm-vessels-recovery','FJ2277']],
 ['FMA22697',['deepBrachial','left','left-deep-brachial-artery','shoulder-arm-vessels-recovery','FJ2225']],
 ['FMA22707',['superiorUlnarCollateral','right','right-superior-ulnar-collateral-artery','elbow-arteries','FJ2373']],
 ['FMA22708',['superiorUlnarCollateral','left','left-superior-ulnar-collateral-artery','elbow-arteries','FJ2374']],
 ['FMA22712',['inferiorUlnarCollateral','right','right-inferior-ulnar-collateral-artery','elbow-arteries','FJ2267']],
 ['FMA22713',['inferiorUlnarCollateral','left','left-inferior-ulnar-collateral-artery','elbow-arteries','FJ2215']],
 ['FMA23126',['radialCollateral','right','radial-collateral-branch-of-right-deep-brachial-artery','elbow-arteries','FJ2262']],
 ['FMA23127',['radialCollateral','left','radial-collateral-branch-of-left-deep-brachial-artery','elbow-arteries','FJ2261']],
 ['FMA23124',['middleCollateral','right','middle-collateral-branch-of-right-deep-brachial-artery','elbow-arteries','FJ2362']],
 ['FMA23125',['middleCollateral','left','middle-collateral-branch-of-left-deep-brachial-artery','elbow-arteries','FJ2331']],
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
  "export {armArterialXrayLesson} from './atlas-review/lib/arm-arterial-xray';",
  "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
  "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
  "export {structures} from './atlas-review/app/anatomy-data';",
  "export {dissectionProfiles} from './atlas-review/app/dissection-data';",
  "export {regionalTours} from './atlas-review/lib/regional-tours';",
  "export {regionalTeachingImports} from './atlas-review/lib/regional-teaching-imports';",
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
 const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
 const regionalPath='content/regional-teaching/shoulder-arm.json';
 const cached=await api.regionalTeachingImports['shoulder-arm']();
 assert.deepEqual(cached.default,json('atlas-review/'+regionalPath),
  'Actual regional loader returns the imported shoulder-arm cache');
 assert.deepEqual(cached.default,JSON.parse(committed(liveCommit,regionalPath).toString()),
  'Actual regional loader returns the exact committed shoulder-arm cache');
 return api;
}

test('fourteen exact arm arterial X-ray drafts reach both learner modules and protected Review',
 {timeout:180000},async()=>{
 const admission=validateCurrentAtlasDelivery();
 assert.equal(admission.source,liveCommit);
 assert.equal(git(['rev-parse','HEAD']).toString().trim(),liveCommit);
 assert.equal(git(['merge-base',baseline,completedEpoch]).toString().trim(),baseline);
 assert.equal(git(['merge-base',completedEpoch,liveCommit]).toString().trim(),completedEpoch);
 for(const path of [topicsPath,helperPath])assert.deepEqual(committed(liveCommit,path),committed(completedEpoch,path));
 for(const path of [...pinsPaths,catalogPath])
  assert.deepEqual(committed(liveCommit,path),committed(baseline,path),`${path}: immutable source`);
 const changed=git(['diff','--name-only',baseline,completedEpoch]).toString().trim().split(/\r?\n/);
 assert.deepEqual(new Set(changed),new Set([
  'LICENSES/THIRD_PARTY_NOTICES.md','app/body-content.ts','content/body-renderer-revision.json',
  'content/body-review-display-pins.json',topicsPath,'content/regional-teaching/shoulder-arm.json',
  'docs/ARM_ARTERIAL_XRAY.md',helperPath,'package.json','scripts/test-arm-arterial-xray.mjs',
 ]));
 const priorNotices=committed(baseline,'LICENSES/THIRD_PARTY_NOTICES.md').toString();
 const currentNotices=committed(liveCommit,'LICENSES/THIRD_PARTY_NOTICES.md').toString();
 const milestoneNotices=committed(completedEpoch,'LICENSES/THIRD_PARTY_NOTICES.md').toString();
 assert(milestoneNotices.endsWith(priorNotices.slice(priorNotices.indexOf('## '))),
  'Original milestone retained the exact preceding licence obligations');
 assert(currentNotices.includes(milestoneNotices.slice(milestoneNotices.indexOf('## '))),
  'Complete original milestone notices remain exact; later notices may prepend or append');
 const review=json('atlas-review/manifest.json');assert.equal(review.revision,liveCommit);
 const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
 assert.equal(viewer.sourceCommit,liveCommit);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 assert.equal(viewer.personalRecordsIncluded,false);
 const learners=['head-neck','shoulder','lower-limb','female-pelvis'].map(name=>({
  name,base:`public/atlas-runtime/${name}/`,manifest:json(`public/atlas-runtime/${name}/manifest.json`),
 }));
 for(const {name,manifest} of learners){
  assert.equal(manifest.sourceCommit,admission.runtimeSources[name],name);
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
   if(name==='head-neck'||name==='shoulder')
    assert.equal(input?.sha256,sha(committed(admission.runtimeSources[name],path)),`${name}: ${path}`);
   else assert.equal(input,undefined,`${name}: independent closure`);
  }
  for(const base of ['public/atlas-review/',viewerBase,...learners.map(item=>item.base)])
   assert.equal(existsSync(base+path),false,`${base+path}: raw source exposed`);
 }
 for(const {name,base,manifest} of learners.filter(item=>
  item.name==='lower-limb'||item.name==='female-pelvis')){
  // Retain the immutable introduction and its later playback policy, while
  // validating current shared specimen players against their exact live source.
  const playbackPaths=['lib/guided-playback.ts','lib/ventricular-guide.ts'];
  const inputs=json(base+'source-inputs.json');
  for(const path of playbackPaths)assert(inputs.some((input:{path:string})=>input.path===path));
  assert.equal(git(['merge-base',playbackEpoch,liveCommit]).toString().trim(),playbackEpoch);
  assert.match(committed(playbackEpoch,'lib/guided-playback.ts').toString(),
   /export function guidedPlaybackEvidence\(steps:/,'immutable continuous-playback policy');
  assert.match(committed(playbackEpoch,'lib/ventricular-guide.ts').toString(),
   /continuousPlayback: guidedPlaybackEvidence\(steps\)/,'immutable ventricular playback binding');
  for(const input of inputs)
   assert.equal(input.sha256,sha(committed(admission.runtimeSources[name],input.path)),
    `${name}: admitted family exact source ${input.path}`);
  for(const file of manifest.files.filter((item:{path:string})=>item.path.startsWith('models/'))){
   assert.equal(file.sha256,sha(readFileSync(base+file.path)),`${name}: delivered model`);
   assert.equal(file.sha256,sha(committed(baseline,'public/'+file.path)),`${name}: original model`);
  }
 }
 const pinFiles=pinsPaths.map(path=>json('atlas-review/'+path));
 const pins=pinFiles.flatMap(pin=>pin.entries);
 assert.equal(new Set([...expected.values()].map(([group])=>group)).size,7);
 assert.deepEqual(new Set(pins.filter((entry:any)=>expected.has(entry.identity.fmaId))
  .map((entry:any)=>entry.identity.fmaId)),new Set(expected.keys()));
 for(const pin of pinFiles)for(const descriptor of pin.bundles??[]){
  if(![...expected.values()].some(([, , ,bundle])=>bundle===descriptor.id))continue;
  const path='public'+descriptor.url.split('?')[0];
  assert.deepEqual(readFileSync(atlas+'/'+path),committed(baseline,path),
   `${descriptor.id}: selected source geometry retained`);
 }
 const api=await importedApi(),catalog=api.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
 assert.equal(catalog.structures.length,1104);
 const emitted=learners.filter(item=>item.name==='head-neck'||item.name==='shoulder')
  .map(item=>emittedTeaching(item.base,item.manifest.files,true));
 const selected=new Set<string>();
 for(const [fma,[group,side,slug,bundle,file]] of expected){
  const matches=pins.filter((entry:any)=>entry.identity.fmaId===fma);
  assert.equal(matches.length,1,`${fma}: exact unique pin`);
  assert.equal(matches[0].group,group);
  const identity=matches[0].identity;assert(identity,fma);
  selected.add(identity.id);
  assert.equal(identity.id,`vm:anatomy:body:shoulder-arm:${side}:vessel:${slug}`);
  assert.equal(identity.laterality,side);assert.equal(identity.region,'shoulder-arm');
  assert.equal(identity.system,'vessels');assert.equal(identity.category,'vessel');
  assert.equal(identity.bundle,bundle);assert.equal(identity.sourceTree,'isa');
  assert.equal(identity.nodeName,fma);
  assert.deepEqual(identity.sources.map((source:{file:string})=>source.file),[file]);
  assert.equal(identity.validation.status,'unvalidated');
  assert.equal(identity.validation.anatomicalReview,false);
  assert.deepEqual(catalog.structures.find((s:{id:string})=>s.id===identity.id),identity);
  const lesson=api.armArterialXrayLesson(identity,'xray');assert(lesson);
  assert.deepEqual(api.bodyLesson(identity,'xray'),lesson);
  const {readiness,...content}=lesson;
  assert.equal(readiness,'draft');assert.deepEqual(api.bodyContent(identity,'xray'),content);
  assert(lesson.citations.length>0 && lesson.citations.every((url:string)=>/^https:\/\//.test(url)));
  assert.equal(new Set(lesson.citations).size,lesson.citations.length);
  const prose=[lesson.body,...lesson.bullets,lesson.note].join(' ');
  for(const phrase of [/digital subtraction \(DSA\)/,/routine unenhanced plain radiography/,
   /CTA, MRA and ultrasound are separate examinations/,
   /source label is not an acquired side marker/,
   /no acquired angiogram, connected lumen, patency, flow, perfusion/i,
   /revision-bound radiologist review/,
   /Atlas, imaging-case and paid-lecture access remain independent/])assert.match(prose,phrase);
  assert.doesNotMatch(prose,/approved for clinical use|registered to a patient/i);
  for(const code of emitted)for(const value of [lesson.body,...lesson.citations,lesson.note,
   ...lesson.bullets.filter((bullet:string)=>!bullet.startsWith('The '+side+' source label'))])
   assert(visible(code,value),`${identity.id}: emitted teaching`);
  const clean=wire(lesson);lesson.bullets.push('foreign');lesson.citations.push('https://foreign.example');
  assert.deepEqual(api.armArterialXrayLesson(identity,'xray'),clean,'Fresh detached lesson');
  for(const path of pathsWhere(identity,value=>value===null||typeof value!=='object')){
   const bad=wire(identity),parent=at(bad,path.slice(0,-1)),key=path.at(-1)!;
   const original=parent[key];parent[key]=typeof original==='string'?original+'-foreign'
    :typeof original==='number'?original+0.01:original===null?'foreign':!original;
   assert.equal(api.armArterialXrayLesson(bad,'xray'),undefined,`${identity.id}:${path.join('.')}`);
  }
  for(const path of pathsWhere(identity,Array.isArray)){
   const bad=wire(identity);at(bad,path).push('foreign');
   assert.equal(api.armArterialXrayLesson(bad,'xray'),undefined,`${identity.id}:${path.join('.')}`);
  }
  for(const path of pathsWhere(identity,value=>value&&typeof value==='object'&&!Array.isArray(value))){
   const bad=wire(identity);at(bad,path).unexpected=true;
   assert.equal(api.armArterialXrayLesson(bad,'xray'),undefined,`${identity.id}:${path.join('.')}`);
   for(const key of Object.keys(at(identity,path))){
    const omitted=wire(identity);delete at(omitted,path)[key];
    assert.equal(api.armArterialXrayLesson(omitted,'xray'),undefined,
     `${identity.id}:${[...path,key].join('.')} omitted`);
   }
  }
  for(const path of pathsWhere(identity,value=>Array.isArray(value)&&value.length>1)){
   const original=at(identity,path);
   const other=original.findIndex((item:any,index:number)=>index>0&&
    JSON.stringify(item)!==JSON.stringify(original[0]));
   if(other<0)continue;
   const bad=wire(identity),array=at(bad,path);
   [array[0],array[other]]=[array[other],array[0]];
   assert.equal(api.armArterialXrayLesson(bad,'xray'),undefined,
    `${identity.id}:${path.join('.')} reordered`);
  }
  assert.equal(api.armArterialXrayLesson({id:identity.id},'xray'),undefined);
 }
 assert.equal(selected.size,14);
 for(const structure of catalog.structures)if(!selected.has(structure.id))
  assert.equal(api.armArterialXrayLesson(structure,'xray'),undefined);
});

test('immutable 9,936 lessons and 1,104 packets retain their milestone and current forged decisions refuse',
 {timeout:300000},async()=>{
 const current=await importedApi(),live=await boundLiveAtlasHistory(liveCommit);
 const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
 const old=await exactSourceHistoryApi(baseline,'review-security');
 const feature=await exactSourceHistoryApi(completedEpoch,'review-security');
 const catalog=current.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
 assert.deepEqual(catalog,live.bodyDisplayCatalog(json('atlas-review/'+catalogPath)));
 assert.deepEqual(catalog,old.bodyDisplayCatalog(JSON.parse(committed(baseline,catalogPath).toString())));
 assert.deepEqual(current.structures,live.structures);assert.deepEqual(feature.structures,old.structures,'historical structure catalogue retained');
 assert.deepEqual(current.dissectionProfiles,live.dissectionProfiles);
 assert.deepEqual(feature.dissectionProfiles,old.dissectionProfiles,'historical dissection catalogue retained');
 assert.deepEqual(current.regionalTours,live.regionalTours);
 assert.deepEqual(feature.regionalTours,old.regionalTours,'historical tour catalogue retained');
 assert.deepEqual(current.contentTabs,live.contentTabs);assert.deepEqual(live.contentTabs,old.contentTabs);
 assert.equal(current.contentTabs.length,9);
 const ids=new Set<string>();
 for(const path of pinsPaths)for(const entry of json('atlas-review/'+path).entries)
  if(expected.has(entry.identity.fmaId))ids.add(entry.identity.id);
 assert.equal(ids.size,14);
 let placements=0,changed=0,packets=0,changedPackets=0,storageCalls=0;
 let malformedPackets=0,staleRefusals=0,forgedSaves=0,forgedApprovals=0;
 const storage={prepare(){storageCalls++;throw Error('Rejected request reached synthetic storage');}};
 const request=(value:any)=>new Request('https://review.test/api/body-decisions',{
  method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
   'oai-authenticated-user-id':'SYNTHETIC_ARM_ARTERIAL_XRAY_REVIEWER'},body:JSON.stringify(value),
 });
 for(const structure of catalog.structures){
  for(const tab of current.contentTabs){
   const before=old.bodyLesson(structure,tab),historical=feature.bodyLesson(structure,tab);
   const after=live.bodyLesson(structure,tab),imported=current.bodyLesson(structure,tab);
   assert.deepEqual(imported,after,`${structure.id}:${tab}: imported versus exact current source`);
   placements++;
   if(!ids.has(structure.id)||tab!=='xray'){
    assert.deepEqual(historical,before,`${structure.id}:${tab}: immutable lesson preserved`);
    assert.equal(current.armArterialXrayLesson(structure,tab),undefined);
   }else{
    changed++;assert.equal(before.readiness,'pending');assert.equal(historical.readiness,'draft');
    assert.deepEqual(after,historical,`${structure.id}:${tab}: selected lesson retained`);
    assert.deepEqual(after,current.armArterialXrayLesson(structure,tab));
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
  assert.deepEqual(await feature.parseBodyReviewResponse(historical,structure.id),historical);
  assert.equal(await feature.parseBodyReviewResponse(before,structure.id),null);
  assert.deepEqual(after.topics.find((row:any)=>row.tab==='xray'),
   historical.topics.find((row:any)=>row.tab==='xray'),`${structure.id}: selected X-ray topic retained`);
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
  assert.equal(after.fingerprints.source,before.fingerprints.source);
  assert.notEqual(after.fingerprints.teaching,before.fingerprints.teaching);
  assert.notEqual(after.materialHash,before.materialHash);
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
   malformedPackets++;
  }
  const previousContext=await old.bodyReviewContext(structure.id);
  const context=await live.bodyReviewContext(structure.id);
  const historicalContext=await feature.bodyReviewContext(structure.id);
  assert.equal(historicalContext.sourceHash,previousContext.sourceHash,
   `${structure.id}: historical source context retained`);
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
   {materialHash:previousContext.materialHash,revisionHash:previousContext.revisions.teaching}]){
   assert.equal((await current.postBodyDecision(request({...decision,...patch}),storage)).status,409);
   staleRefusals++;
  }
  const forged=wire(decision);forged.draft.checks.foreign=true;
  assert.equal((await current.postBodyDecision(request(forged),storage)).status,422);
  forgedSaves++;
  const approval=wire(decision);approval.draft.status='approved';
  assert.equal((await current.postBodyDecision(request(approval),storage)).status,422);
  forgedApprovals++;
 }
 assert.deepEqual({placements,changed,preserved:placements-changed,packets,changedPackets,
  preservedPackets:packets-changedPackets,storageCalls},
  {placements:9936,changed:14,preserved:9922,packets:1104,changedPackets:14,
   preservedPackets:1090,storageCalls:0});
 assert.deepEqual({malformedPackets,staleRefusals,forgedSaves,forgedApprovals,storageCalls},
  {malformedPackets:56,staleRefusals:42,forgedSaves:14,forgedApprovals:14,storageCalls:0});
});


